# Fedora Server Setup Guide

Panduan lengkap untuk deploy **Dashboard Inventory** di server **Linux Fedora** dengan **Docker**.

## Prerequisites

- Server Linux Fedora (38/39/40)
- Akses root atau sudo
- Koneksi internet

---

## 1. Update System

```bash
sudo dnf update -y
sudo dnf upgrade -y
```

## 2. Install Docker

```bash
# Install required packages
sudo dnf -y install dnf-plugins-core

# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (logout required)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

> **Note:** Logout dan login kembali setelah menambahkan user ke docker group.

## 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow backend port (optional, jika perlu akses langsung)
sudo firewall-cmd --permanent --add-port=3000/tcp

# Reload firewall
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

## 4. Configure SELinux (if enabled)

```bash
# Check SELinux status
getenforce

# Allow HTTP network connections
sudo setsebool -P httpd_can_network_connect 1

# If having issues with Docker volumes
sudo setsebool -P container_manage_cgroup 1
```

## 5. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/dashboard-inventory
sudo chown $USER:$USER /opt/dashboard-inventory

# Clone repository
cd /opt/dashboard-inventory
git clone <your-repo-url> .

# Or copy files manually
# scp -r ./dashboard-inventory user@server:/opt/dashboard-inventory
```

## 6. Configure Environment

```bash
cd /opt/dashboard-inventory

# Copy example environment file
cp .env.production.example .env.production

# Edit environment variables
nano .env.production
```

**Penting:** Ubah nilai-nilai berikut:
- `JWT_SECRET` - Generate dengan: `openssl rand -base64 64`
- `FRONTEND_URL` - Domain atau IP server Anda

## 7. Deploy Application

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh

# Run deployment
./scripts/deploy.sh
```

## 8. Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl http://localhost
curl http://localhost:3000/api/health
```

---

## Maintenance Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f dashboard-backend
docker logs -f dashboard-frontend
docker logs -f dashboard-mongo
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Backup Database

```bash
./scripts/backup.sh
```

### Update Application

```bash
cd /opt/dashboard-inventory
git pull origin main
./scripts/deploy.sh
```

---

## Troubleshooting

### Port 80 Already in Use

```bash
# Check what's using port 80
sudo ss -tulpn | grep :80

# Stop conflicting service
sudo systemctl stop httpd  # or nginx
sudo systemctl disable httpd
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or run)
newgrp docker
```

### SELinux Blocking Access

```bash
# Check SELinux denials
sudo ausearch -m avc -ts recent

# Temporary disable (for testing only)
sudo setenforce 0

# Generate custom policy
sudo audit2allow -M mypol < /var/log/audit/audit.log
sudo semodule -i mypol.pp
```

### Container Health Check Failing

```bash
# Check container logs
docker logs dashboard-backend

# Exec into container
docker exec -it dashboard-backend sh

# Check MongoDB connection
docker exec -it dashboard-mongo mongosh
```

---

## Security Recommendations

1. **Gunakan SSL/HTTPS** - Setup Let's Encrypt dengan Certbot
2. **Firewall** - Hanya buka port yang diperlukan (80, 443)
3. **Regular Updates** - `sudo dnf update -y`
4. **Backup** - Setup cron job untuk backup otomatis
5. **Monitoring** - Install Portainer atau monitoring tools

### Setup Automatic Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/dashboard-inventory/scripts/backup.sh >> /var/log/dashboard-backup.log 2>&1
```
