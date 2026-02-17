import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { UsersPage } from '../modules/master-data/users';
import { JobTitlesPage } from '../modules/master-data/job-titles';
import { DepartmentsPage } from '../modules/master-data/departments';
import { ItemTypesPage } from '../modules/master-data/item-types';

// Merged pages from react-dashboard
import DashboardPage from '../pages/dashboard-pages/DashboardPage';
import InventoryPage from '../pages/dashboard-pages/InventoryPage';
import AssetDetailsPage from '../pages/dashboard-pages/AssetDetailsPage';
import AssetAssignmentPage from '@/pages/dashboard-pages/AssetAssignmentPage';
import MaintenancePage from '../pages/dashboard-pages/MaintenancePage';
import MyMaintenanceTicketsPage from '../pages/dashboard-pages/MyMaintenanceTicketsPage';
import DepartmentTicketsPage from '../pages/dashboard-pages/DepartmentTicketsPage';
import MaintenanceDetailPage from '../pages/dashboard-pages/MaintenanceDetailPage';

import ServicePage from '../pages/dashboard-pages/ServicePage';
import ReportsPage from '../pages/dashboard-pages/ReportsPage';
import DisposalPage from '../pages/dashboard-pages/DisposalPage';
import UserManagementPage from '../pages/dashboard-pages/UserManagement';
import MyAssetsPage from '../pages/dashboard-pages/MyAssetsPage';
import AccountSettingsPage from '../pages/dashboard-pages/AccountSettingsPage';
import IncomingGoodsPage from '../pages/dashboard-pages/IncomingGoodsPage';
import TransferPage from '../pages/dashboard-pages/TransferPage';
import HistoryPage from '../pages/dashboard-pages/HistoryPage';
import RentalPage from '@/pages/dashboard-pages/RentalPage';
import AssignAssetPage from '@/pages/dashboard-pages/AssignAssetPage';
import PanelListPage from '@/pages/inventory/panels/PanelListPage';
import PanelDetailPage from '@/pages/inventory/panels/PanelDetailPage';
import { LocationsPage } from '../modules/master-data/locations/LocationsPage';
import { LocationTypesPage } from '../modules/master-data/locations/LocationTypesPage';
import DatabaseManagement from '../pages/master-data/DatabaseManagement';
import CategoryManagement from '../pages/master-data/CategoryManagement';
import AssetTemplatesPage from '../pages/master-data/AssetTemplatesPage';
import VendorManagementPage from '../pages/master-data/VendorManagementPage';
import UnitManagementPage from '../pages/master-data/UnitManagementPage';
import BranchManagementPage from '../pages/master-data/BranchManagementPage';

import SuppliesPage from '../features/inventory/pages/SuppliesPage';
import SupplyDetailsPage from '../features/inventory/pages/SupplyDetailsPage';
import EventDetailsPage from '../pages/dashboard-pages/EventDetailsPage';
import UserDetailsPage from '../features/users/pages/UserDetailsPage';
import DataManagementPage from '../pages/dashboard-pages/DataManagementPage';
import ErrorPage from '../pages/ErrorPage';

// Auth Imports
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AuthProvider from '../components/auth/AuthProvider';

// Wrap the entire app with AuthProvider
const AppWrapper = () => (
    <AuthProvider>
        <Outlet />
    </AuthProvider>
);

export const router = createBrowserRouter([
    {
        element: <AppWrapper />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                path: '/',
                element: <ProtectedRoute />,
                children: [
                    {
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
                                path: 'inventory/supplies',
                                element: <SuppliesPage />,
                            },
                            {
                                path: 'inventory/supplies/:id',
                                element: <SupplyDetailsPage />,
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
                                path: 'maintenance/:id',
                                element: <MaintenanceDetailPage />,
                            },
                            {
                                path: 'my-tickets',
                                element: <MyMaintenanceTicketsPage />,
                            },
                            {
                                path: 'department-tickets',
                                element: <DepartmentTicketsPage />,
                            },

                            {
                                path: 'my-assets',
                                element: <MyAssetsPage />,
                            },
                            {
                                path: 'services',
                                element: <ServicePage />,
                            },
                            {
                                path: 'assignments',
                                element: <AssetAssignmentPage />,
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
                                path: 'inventory/panels',
                                element: <PanelListPage />,
                            },
                            {
                                path: 'inventory/panels/:id',
                                element: <PanelDetailPage />,
                            },
                            {
                                path: 'events',
                                element: <Navigate to="/rental" replace />,
                            },
                            {
                                path: 'events/:id',
                                element: <EventDetailsPage />,
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
                                path: 'users/:id',
                                element: <UserDetailsPage />,
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
                                element: <CategoryManagement />,
                            },
                            {
                                path: 'master-data/asset-templates',
                                element: <AssetTemplatesPage />,
                            },
                            {
                                path: 'master-data/vendors',
                                element: <VendorManagementPage />,
                            },
                            {
                                path: 'master-data/units',
                                element: <UnitManagementPage />,
                            },
                            {
                                path: 'master-data/locations',
                                element: <LocationsPage />,
                            },
                            {
                                path: 'master-data/locations/types',
                                element: <LocationTypesPage />,
                            },
                            {
                                path: 'master-data/branches',
                                element: <BranchManagementPage />,
                            },
                            {
                                path: 'master-data/database',
                                element: <DatabaseManagement />,
                            },
                            {
                                path: 'data-management',
                                element: <DataManagementPage />,
                            },

                        ],
                    },
                ]
            }
        ]
    },
]);
