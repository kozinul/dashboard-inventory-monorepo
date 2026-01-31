import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const routeNameMap: Record<string, string> = {
    'inventory': 'Inventory',
    'asset-details': 'Asset Details',
    'assignments': 'Assignments',
    'maintenance': 'Maintenance',
    'reports': 'Reports',
    'rental': 'Rental',
    'disposal': 'Disposal',
    'users': 'Users',
    'settings': 'Settings',
    'master-data': 'Master Data',
    'job-titles': 'Job Titles',
    'departments': 'Departments',
    'item-types': 'Item Types',
    'item-categories': 'Categories',
    'vendors': 'Vendors',
    'locations': 'Locations',
    'database': 'Database',
    'events': 'Events',
};

import { useBreadcrumb } from '../../context/BreadcrumbContext';

export function Breadcrumbs() {
    const { getBreadcrumb } = useBreadcrumb();
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
                <li>
                    <div>
                        <Link to="/" className="text-gray-400 hover:text-gray-500">
                            <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </div>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    // Handle dynamic IDs or unknown routes reasonably
                    // If it looks like an ID (long string with numbers/dashes), maybe shorten or show "Details"
                    // For now, check map or title case it
                    let name = routeNameMap[value];
                    const customLabel = getBreadcrumb(to);

                    if (customLabel) {
                        name = customLabel;
                    } else if (!name) {
                        // Simple fallback: capitalize or keep as is if it looks like an ID
                        // Check if valid Mongo ID or UUID (rough check)
                        if (value.length > 20 || /\d/.test(value)) {
                            name = "Details"; // or keep value if debugging
                        } else {
                            name = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
                        }
                    }

                    return (
                        <li key={to}>
                            <div className="flex items-center">
                                <ChevronRightIcon
                                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                                    aria-hidden="true"
                                />
                                {isLast ? (
                                    <span
                                        className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400"
                                        aria-current="page"
                                    >
                                        {name}
                                    </span>
                                ) : (
                                    <Link
                                        to={to}
                                        className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        {name}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
