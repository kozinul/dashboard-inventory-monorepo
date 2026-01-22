// Simple component loader
const root = document.getElementById('root');

async function loadComponent(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${path}`);
        return await response.text();
    } catch (error) {
        console.error('Component load failed:', error);
        return `<div class="p-4 border border-red-500 text-red-500 rounded">Failed to load component: ${path}</div>`;
    }
}

const routes = {
    '/': './src/pages/Dashboard.html',
    '/dashboard': './src/pages/Dashboard.html',
    '/login': './src/pages/Login.html',
    '/assets/:id': './src/pages/AssetDetail.html',
    '/incoming': './src/pages/IncomingAsset.html',
    '/transfer/step-2': './src/pages/TransferStep2.html',
    '/locations': './src/pages/Locations.html'
};

const router = {
    navigate: async (path) => {
        window.history.pushState({}, '', path);
        await router.handleRoute(path);
    },
    handleRoute: async (path) => {
        let pageUrl = routes['/dashboard']; // Default
        let isAssetDetail = false;
        let isIncoming = false;
        let isTransferWizard = false;
        let isAuth = false;
        let isLocations = false;

        if (path === '/login') {
            pageUrl = routes['/login'];
            isAuth = true;
        } else if (path.startsWith('/assets/')) {
            pageUrl = routes['/assets/:id'];
            isAssetDetail = true;
        } else if (path === '/incoming') {
            pageUrl = routes['/incoming'];
            isIncoming = true;
        } else if (path === '/transfer/step-2') {
            pageUrl = routes['/transfer/step-2'];
            isTransferWizard = true;
        } else if (path === '/locations') {
            pageUrl = routes['/locations'];
            isLocations = true;
        } else if (routes[path]) {
            pageUrl = routes[path];
        }

        // Logic for Layout switching
        const currentLayout = root.getAttribute('data-layout');
        const targetLayout = isAuth ? 'auth' : 'dashboard';

        if (currentLayout !== targetLayout || !document.getElementById('root').hasChildNodes()) {
            if (isAuth) {
                await initAuthLayout();
            } else {
                await initDashboardLayout();
            }
            root.setAttribute('data-layout', targetLayout);
        }

        // Inject Content
        // Auth Layout has #auth-content-slot
        // Dashboard Layout has #page-slot
        const contentSlotId = isAuth ? 'auth-content-slot' : 'page-slot';
        const contentSlot = document.getElementById(contentSlotId);

        if (contentSlot) {
            contentSlot.innerHTML = await loadComponent(pageUrl);

            // Invoke specific loaders
            if (isAuth) {
                await loadAuthComponents();
            } else if (isAssetDetail) {
                await loadAssetComponents();
            } else if (isIncoming) {
                await loadIncomingComponents();
            } else if (isTransferWizard) {
                await loadTransferWizardComponents();
            } else if (isLocations) {
                await loadLocationsComponents();
            }
        }
    }
};

async function initDashboardLayout() {
    // 1. Load the Dashboard Layout Shell
    const layoutHtml = await loadComponent('./src/layouts/DashboardLayout.html');
    root.innerHTML = layoutHtml;

    // 2. Inject Sidebar
    const sidebarHtml = await loadComponent('./src/components/sidebar/Sidebar.html');
    const sidebarSlot = document.getElementById('sidebar-slot');
    if (sidebarSlot) sidebarSlot.innerHTML = sidebarHtml;

    // 3. Inject Navbar (Global)
    const navbarHtml = await loadComponent('./src/components/navbar/TopNavbar.html');
    const navbarSlot = document.getElementById('navbar-slot');
    if (navbarSlot) navbarSlot.innerHTML = navbarHtml;
}

async function initAuthLayout() {
    const layoutHtml = await loadComponent('./src/layouts/AuthLayout.html');
    root.innerHTML = layoutHtml;
}

async function loadAuthComponents() {
    const headerSlot = document.getElementById('login-header-slot');
    if (headerSlot) headerSlot.innerHTML = await loadComponent('./src/components/auth/LoginHeader.html');

    const formSlot = document.getElementById('login-form-slot');
    if (formSlot) formSlot.innerHTML = await loadComponent('./src/components/auth/LoginForm.html');

    const footerSlot = document.getElementById('auth-footer-slot');
    if (footerSlot) footerSlot.innerHTML = await loadComponent('./src/components/branding/SecurityBadge.html');
}

async function loadLocationsComponents() {
    const buildingSlot = document.getElementById('building-list-slot');
    if (buildingSlot) buildingSlot.innerHTML = await loadComponent('./src/components/locations/BuildingListPanel.html');

    const roomSlot = document.getElementById('room-list-slot');
    if (roomSlot) roomSlot.innerHTML = await loadComponent('./src/components/rooms/RoomListPanel.html');

    const breadcrumbsSlot = document.getElementById('breadcrumbs-slot');
    if (breadcrumbsSlot) breadcrumbsSlot.innerHTML = await loadComponent('./src/components/breadcrumbs/LocationBreadcrumbs.html');

    const visualizationSlot = document.getElementById('visualization-card-slot');
    if (visualizationSlot) visualizationSlot.innerHTML = await loadComponent('./src/components/rooms/SpaceVisualizationCard.html');

    const statsSlot = document.getElementById('location-stats-slot');
    if (statsSlot) statsSlot.innerHTML = await loadComponent('./src/components/locations/LocationStatsCard.html');

    const tagsSlot = document.getElementById('space-tags-slot');
    if (tagsSlot) tagsSlot.innerHTML = await loadComponent('./src/components/rooms/SpaceTagsPanel.html');

    const gridSlot = document.getElementById('sublocation-grid-slot');
    if (gridSlot) gridSlot.innerHTML = await loadComponent('./src/components/rooms/SubLocationGrid.html');
}

// ... existing sub-component loaders (loadAssetComponents, loadIncomingComponents, loadTransferWizardComponents) ...
// (We will append them back or ensure they persist if outside the Replace block, but since we are replacing a large chunk, I must be careful to include them if they fall into the replaced range.
// The previous step showed the file ends at line 144, but my Replace call targets logic inside `router` and `initLayout`. 
// I should Replace the router object and initLayout, but KEEP the sub-component loaders below them intact or re-declare them if I overwrite them.)

// Let's refine the replacement to strictly cover the router and initLayout, and ADD initAuthLayout/loadAuthComponents.
// The previous code had `initLayout` ending at line 98. 
// Sub-component loaders started at line 100.
// I will rewrite from `const routes` down to `initLayout` closing brace, and ADD the new functions.
// Be careful not to overwrite `loadAssetComponents` etc. unless I include them.

async function loadAssetComponents() {
    // Inject sub-components for Asset Detail
    const heroSlot = document.getElementById('asset-hero-slot');
    if (heroSlot) heroSlot.innerHTML = await loadComponent('./src/components/cards/AssetHeroCard.html');

    const gallerySlot = document.getElementById('asset-gallery-slot');
    if (gallerySlot) gallerySlot.innerHTML = await loadComponent('./src/components/gallery/AssetGallery.html');

    const tabsSlot = document.getElementById('asset-tabs-slot');
    if (tabsSlot) tabsSlot.innerHTML = await loadComponent('./src/components/tabs/AssetTabs.html');
}

async function loadIncomingComponents() {
    // Inject sub-components for Incoming Asset
    const progressSlot = document.getElementById('progress-stepper-slot');
    if (progressSlot) progressSlot.innerHTML = await loadComponent('./src/components/progress/ProgressStepper.html');

    const uploaderSlot = document.getElementById('image-uploader-slot');
    if (uploaderSlot) uploaderSlot.innerHTML = await loadComponent('./src/components/upload/ImageUploader.html');

    const previewSlot = document.getElementById('image-preview-slot');
    if (previewSlot) previewSlot.innerHTML = await loadComponent('./src/components/upload/ImagePreviewGrid.html');

    const summarySlot = document.getElementById('entry-summary-slot');
    if (summarySlot) summarySlot.innerHTML = await loadComponent('./src/components/cards/EntrySummaryCard.html');

    const footerSlot = document.getElementById('footer-action-slot');
    if (footerSlot) footerSlot.innerHTML = await loadComponent('./src/components/forms/FooterActionBar.html');
}

async function loadTransferWizardComponents() {
    // Inject sub-components for Transfer Wizard
    const progressSlot = document.getElementById('wizard-progress-slot');
    if (progressSlot) progressSlot.innerHTML = await loadComponent('./src/components/wizard/WizardProgressBar.html');

    const uploaderSlot = document.getElementById('asset-photo-uploader-slot');
    if (uploaderSlot) uploaderSlot.innerHTML = await loadComponent('./src/components/upload/AssetPhotoUploader.html');

    const tipsSlot = document.getElementById('wizard-tips-slot');
    if (tipsSlot) tipsSlot.innerHTML = await loadComponent('./src/components/wizard/WizardTipsCard.html');

    const notesSlot = document.getElementById('condition-notes-slot');
    if (notesSlot) notesSlot.innerHTML = await loadComponent('./src/components/forms/ConditionNotesForm.html');

    const previewSlot = document.getElementById('image-preview-slot');
    if (previewSlot) previewSlot.innerHTML = await loadComponent('./src/components/upload/ImagePreviewStrip.html');

    const footerSlot = document.getElementById('wizard-footer-slot');
    if (footerSlot) footerSlot.innerHTML = await loadComponent('./src/components/wizard/WizardFooterNavigation.html');
}

// Handle browser back/forward
window.onpopstate = () => {
    router.handleRoute(window.location.pathname);
};

// Initial Load
// router.handleRoute(window.location.pathname);
// For verify simplicity without a real server rewrite rules, default to dashboard
// but expose router globally for testing
window.router = router;
initLayout().then(() => {
    // Load default dashboard
    router.handleRoute('/dashboard');
});
