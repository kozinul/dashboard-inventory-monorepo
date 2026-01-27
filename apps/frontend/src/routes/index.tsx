import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { UsersPage } from '../modules/master-data/users';
import { JobTitlesPage } from '../modules/master-data/job-titles';
import { DepartmentsPage } from '../modules/master-data/departments';
import { ItemTypesPage } from '../modules/master-data/item-types';
import { ItemCategoriesPage } from '../modules/master-data/item-categories';

// Merged pages from react-dashboard
import DashboardPage from '../pages/dashboard-pages/DashboardPage';
import InventoryPage from '../pages/dashboard-pages/InventoryPage';
import AssetDetailsPage from '../pages/dashboard-pages/AssetDetailsPage';
import MaintenancePage from '../pages/dashboard-pages/MaintenancePage';
import ReportsPage from '../pages/dashboard-pages/ReportsPage';
import DisposalPage from '../pages/dashboard-pages/DisposalPage';
import UserManagementPage from '../pages/dashboard-pages/UserManagement';
import AccountSettingsPage from '../pages/dashboard-pages/AccountSettingsPage';
import IncomingGoodsPage from '../pages/dashboard-pages/IncomingGoodsPage';
import TransferPage from '../pages/dashboard-pages/TransferPage';
import HistoryPage from '../pages/dashboard-pages/HistoryPage';
import RentalPage from '../pages/dashboard-pages/RentalPage';
import AssignAssetPage from '../pages/dashboard-pages/AssignAssetPage';
import { LocationsPage } from '../modules/master-data/locations/LocationsPage';
import { LocationTypesPage } from '../modules/master-data/locations/LocationTypesPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            {
                path: 'inventory',
                element: <InventoryPage />,
            },
            {
                path: 'inventory/asset-details/:id',
                element: <AssetDetailsPage />,
            },
            {
                path: 'incoming',
                element: <IncomingGoodsPage />,
            },
            {
                path: 'transfer',
                element: <TransferPage />,
            },
            {
                path: 'maintenance',
                element: <MaintenancePage />,
            },
            {
                path: 'history',
                element: <HistoryPage />,
            },
            {
                path: 'reports',
                element: <ReportsPage />,
            },
            {
                path: 'rental',
                element: <RentalPage />,
            },
            {
                path: 'rental/assign',
                element: <AssignAssetPage />,
            },
            {
                path: 'disposal',
                element: <DisposalPage />,
            },
            {
                path: 'users',
                element: <UserManagementPage />,
            },
            {
                path: 'settings',
                element: <AccountSettingsPage />,
            },
            {
                path: 'master-data/users',
                element: <UsersPage />,
            },
            {
                path: 'master-data/job-titles',
                element: <JobTitlesPage />,
            },
            {
                path: 'master-data/departments',
                element: <DepartmentsPage />,
            },
            {
                path: 'master-data/item-types',
                element: <ItemTypesPage />,
            },
            {
                path: 'master-data/item-categories',
                element: <ItemCategoriesPage />,
            },
            {
                path: 'master-data/locations',
                element: <LocationsPage />,
            },
            {
                path: 'master-data/locations/types',
                element: <LocationTypesPage />,
            }
        ],
    },
]);

