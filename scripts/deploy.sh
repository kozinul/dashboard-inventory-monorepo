#!/usr/bin/env bash
#
# deploy.sh - Manual Deployment Script for Dashboard Inventory
#
# This script handles Docker-based deployment of the Dashboard Inventory
# application. It is designed to be run manually by an administrator,
# NOT by Cron. No Git operations are performed by this script.
#
# Usage:
#   ./deploy.sh              Normal deployment
#   ./deploy.sh --no-cache   Build without cache
#   ./deploy.sh --restart    Restart containers without rebuild
#   ./deploy.sh --status     Show container status
#   ./deploy.sh --logs       Show container logs
#   ./deploy.sh --clean      Remove dangling images and build cache
#   ./deploy.sh --help       Show help message
#

set -Eeuo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Auto-detect project root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

readonly SCRIPT_DIR
readonly PROJECT_DIR

readonly COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
readonly ENV_FILE="${PROJECT_DIR}/.env.production"

# Health check
readonly HEALTHCHECK_URL="http://localhost:3000/health"
readonly HEALTHCHECK_RETRIES=12
readonly HEALTHCHECK_INTERVAL=5

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------

readonly NC='\033[0m'
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------

DEPLOYMENT_START=""
DEPLOYMENT_END=""
HAS_ERROR=false

# ---------------------------------------------------------------------------
# Trap
# ---------------------------------------------------------------------------

_cleanup_exit() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script exited with code ${exit_code}"
    fi
    exit "$exit_code"
}
trap _cleanup_exit EXIT
trap 'log_error "Interrupted by user"; exit 1' INT TERM

# ---------------------------------------------------------------------------
# Logging Helpers
# ---------------------------------------------------------------------------

log_info() {
    printf "  ${CYAN}*${NC} %s\n" "$*"
}

log_success() {
    printf "  ${GREEN}✓${NC} %s\n" "$*"
}

log_warning() {
    printf "  ${YELLOW}⚠${NC} %s\n" "$*"
}

log_error() {
    printf "  ${RED}✗${NC} %s\n" "$*" >&2
}

# ---------------------------------------------------------------------------
# Header / Footer
# ---------------------------------------------------------------------------

print_header() {
    local label="$1"
    printf "\n"
    printf "  ${BOLD}====================================================${NC}\n"
    printf "  ${BOLD} %s${NC}\n" "$label"
    printf "  ${BOLD}====================================================${NC}\n"
    printf "\n"
}

print_footer() {
    printf "\n"
    printf "  ${BOLD}====================================================${NC}\n"
    printf "\n"
}

# ---------------------------------------------------------------------------
# Timer
# ---------------------------------------------------------------------------

start_timer() {
    DEPLOYMENT_START=$(date +%s)
}

stop_timer() {
    DEPLOYMENT_END=$(date +%s)
}

get_duration() {
    local elapsed=$(( DEPLOYMENT_END - DEPLOYMENT_START ))
    printf "%d seconds" "$elapsed"
}

get_timestamp() {
    printf "%s" "$(date '+%Y-%m-%d %H:%M:%S')"
}

# ---------------------------------------------------------------------------
# Dependency & Environment Checks
# ---------------------------------------------------------------------------

check_dependencies() {
    local deps=("docker" "curl")
    local missing=()
    local dep

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &>/dev/null; then
            missing+=("$dep")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing[*]}"
        return 1
    fi
}

check_environment() {
    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_error "Project directory not found: ${PROJECT_DIR}"
        return 1
    fi

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: ${COMPOSE_FILE}"
        return 1
    fi

    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: ${ENV_FILE}"
        return 1
    fi
}

load_environment() {
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
    log_success "Environment file loaded"
}

check_docker() {
    if ! docker info &>/dev/null; then
        log_error "Docker Engine is not running or not accessible"
        return 1
    fi
    log_success "Docker Engine is running"
}

check_compose() {
    if ! docker compose version &>/dev/null; then
        log_error "Docker Compose is not available"
        return 1
    fi
    log_success "Docker Compose is available"
}

# ---------------------------------------------------------------------------
# Docker Operations
# ---------------------------------------------------------------------------

build_images() {
    local no_cache="${1:-false}"

    log_info "Building Docker images ..."

    if [[ "$no_cache" == "true" ]]; then
        docker compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker compose -f "$COMPOSE_FILE" build
    fi

    log_success "Docker images built successfully"
}

restart_containers() {
    log_info "Starting containers ..."
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    log_success "Containers started"
}

health_check() {
    local url="$1"
    local retries="$2"
    local interval="$3"
    local attempt=1

    log_info "Waiting for service to become healthy ..."

    while [[ $attempt -le $retries ]]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            log_success "Service is healthy (attempt ${attempt}/${retries})"
            return 0
        fi
        log_info "Health check attempt ${attempt}/${retries} ..."
        sleep "$interval"
        attempt=$(( attempt + 1 ))
    done

    log_error "Service did not become healthy after ${retries} attempts"
    return 1
}

cleanup() {
    log_info "Removing dangling images ..."
    docker image prune -f >/dev/null 2>&1
    log_success "Dangling images removed"
}

# ---------------------------------------------------------------------------
# Command Handlers
# ---------------------------------------------------------------------------

show_container_status() {
    print_header "Container Status"
    docker compose -f "$COMPOSE_FILE" ps
    print_footer
}

show_container_logs() {
    docker compose -f "$COMPOSE_FILE" logs --tail=100
}

clean_docker() {
    print_header "Docker Cleanup"

    log_info "Removing dangling images ..."
    docker image prune -f

    log_info "Removing build cache ..."
    docker builder prune -f

    log_success "Cleanup completed"
    print_footer
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

show_summary() {
    printf "\n"
    printf "  ${BOLD}====================================================${NC}\n"
    if [[ "$HAS_ERROR" == false ]]; then
        printf "  ${GREEN}${BOLD}  Deployment Successful${NC}\n"
    else
        printf "  ${RED}${BOLD}  Deployment Completed with Errors${NC}\n"
    fi
    printf "  ${BOLD}====================================================${NC}\n"
    printf "\n"
    printf "  Timestamp : %s\n" "$(get_timestamp)"
    printf "  Duration  : %s\n" "$(get_duration)"
    printf "\n"
    printf "  ${BOLD}====================================================${NC}\n"
    printf "\n"
}

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

print_help() {
    cat <<EOF

  Usage: $(basename "$0") [OPTIONS]

  Manual deployment script for Dashboard Inventory.

  Options:
    --no-cache    Build Docker images without cache
    --restart     Restart containers without rebuilding
    --status      Show container status
    --logs        Show container logs
    --clean       Remove dangling images and build cache
    --help        Show this help message

  Examples:
    $(basename "$0")
    $(basename "$0") --no-cache
    $(basename "$0") --restart
    $(basename "$0") --status
    $(basename "$0") --logs
    $(basename "$0") --clean

EOF
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    local mode="deploy"
    local no_cache=false

    if [[ $# -gt 0 ]]; then
        case "$1" in
            --no-cache)
                no_cache=true
                ;;
            --restart)
                mode="restart"
                ;;
            --status)
                mode="status"
                ;;
            --logs)
                mode="logs"
                ;;
            --clean)
                mode="clean"
                ;;
            --help)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    fi

    # --status: quick status display
    if [[ "$mode" == "status" ]]; then
        show_container_status
        exit 0
    fi

    # --logs: tail container logs
    if [[ "$mode" == "logs" ]]; then
        show_container_logs
        exit 0
    fi

    # --clean: prune docker resources
    if [[ "$mode" == "clean" ]]; then
        clean_docker
        exit 0
    fi

    # --restart: restart without rebuild
    if [[ "$mode" == "restart" ]]; then
        start_timer
        print_header "Dashboard Inventory - Restart"

        check_docker || exit 1
        check_compose || exit 1

        log_info "Restarting containers ..."
        docker compose -f "$COMPOSE_FILE" restart
        log_success "Containers restarted"

        health_check "$HEALTHCHECK_URL" "$HEALTHCHECK_RETRIES" "$HEALTHCHECK_INTERVAL" || {
            HAS_ERROR=true
        }

        stop_timer
        show_summary

        [[ "$HAS_ERROR" == true ]] && exit 1
        exit 0
    fi

    # -- deploy (default)
    start_timer
    print_header "Dashboard Inventory - Deployment"

    log_info "[1/8] Checking dependencies ..."
    check_dependencies || exit 1
    log_success "All dependencies available"

    log_info "[2/8] Validating environment ..."
    check_environment || exit 1
    log_success "Environment validated"

    log_info "[3/8] Loading environment variables ..."
    load_environment

    log_info "[4/8] Checking Docker ..."
    check_docker || exit 1
    check_compose || exit 1

    log_info "[5/8] Building images ..."
    build_images "$no_cache"

    log_info "[6/8] Starting containers ..."
    restart_containers

    log_info "[7/8] Running health check ..."
    health_check "$HEALTHCHECK_URL" "$HEALTHCHECK_RETRIES" "$HEALTHCHECK_INTERVAL" || {
        HAS_ERROR=true
    }

    log_info "[8/8] Cleaning up ..."
    cleanup

    stop_timer
    show_summary

    [[ "$HAS_ERROR" == true ]] && exit 1
    exit 0
}

main "$@"
