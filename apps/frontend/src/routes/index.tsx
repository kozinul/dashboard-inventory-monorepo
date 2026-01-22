import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { UsersPage } from '../modules/master-data/users';
import { JobTitlesPage } from '../modules/master-data/job-titles';
import { DepartmentsPage } from '../modules/master-data/departments';
import { ItemTypesPage } from '../modules/master-data/item-types';
import { ItemCategoriesPage } from '../modules/master-data/item-categories';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <div>Dashboard Home</div>,
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
            }
        ],
    },
]);
