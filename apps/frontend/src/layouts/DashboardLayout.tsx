import { Fragment, useState, useEffect } from 'react'
import { Dialog, Disclosure, Menu, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
    ArchiveBoxIcon,
    WrenchScrewdriverIcon,
    ChartBarIcon,
    TrashIcon,
    Cog6ToothIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CubeIcon,
    TagIcon,
    CircleStackIcon,
    ArrowsRightLeftIcon,
    DocumentArrowUpIcon,
    ServerIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import axios from '@/lib/axios'
import { useDebounce } from '@/hooks/useDebounce'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Breadcrumbs } from '../components/breadcrumbs/Breadcrumbs'
import { BreadcrumbProvider } from '../context/BreadcrumbContext'
import { useAuthStore } from '@/store/authStore'

import { useAppStore } from '@/store/appStore'
import { useMaintenanceStore } from '@/store/maintenanceStore'
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

// Main app navigation
const mainNavigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
    { name: 'Supplies', href: '/inventory/supplies', icon: CubeIcon },
    { name: 'Panels', href: '/inventory/panels', icon: ServerIcon },
    { name: 'My Assets', href: '/my-assets', icon: BriefcaseIcon },
    { name: 'Assignments', href: '/assignments', icon: BriefcaseIcon },
    { name: 'My Tickets', href: '/my-tickets', icon: WrenchScrewdriverIcon },
    { name: 'Dept. Tickets', href: '/department-tickets', icon: WrenchScrewdriverIcon },
    { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
    { name: 'Services', href: '/services', icon: WrenchScrewdriverIcon },
    { name: 'Report', href: '/reports', icon: ChartBarIcon },
    { name: 'Transfers', href: '/transfer', icon: ArrowsRightLeftIcon },
    { name: 'Rental', href: '/rental', icon: BriefcaseIcon },
    { name: 'Disposal', href: '/disposal', icon: TrashIcon },
    { name: 'Data Management', href: '/data-management', icon: DocumentArrowUpIcon },
    { name: 'Activity Log', href: '/activity-log', icon: ClockIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

// Master data navigation
const masterDataNavigation = [
    { name: 'Units', href: '/master-data/units', icon: CircleStackIcon },
    { name: 'Categories', href: '/master-data/item-categories', icon: TagIcon },
    { name: 'Vendors', href: '/master-data/vendors', icon: BuildingOfficeIcon },
    { name: 'Locations', href: '/master-data/locations', icon: BuildingOfficeIcon },
    { name: 'Branches', href: '/master-data/branches', icon: BuildingOfficeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Database', href: '/master-data/database', icon: CircleStackIcon },
]

type NavigationItem = {
    name: string;
    href?: string;
    icon: any;
    children?: { name: string; href: string; icon: any }[];
    current?: boolean;
    badge?: number;
}

const navigation: NavigationItem[] = [
    ...mainNavigation,
    { name: 'Master Data', icon: CircleStackIcon, children: masterDataNavigation }
]

function classNames(...classes: string[]) {
    return twMerge(clsx(classes))
}



export default function DashboardLayoutWrapper() {
    return (
        <BreadcrumbProvider>
            <DashboardLayout />
        </BreadcrumbProvider>
    )
}

function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { user } = useAuthStore()
    const { activeBranchId, branches, setActiveBranch, isLoading: isBranchLoading, isSwitching } = useAppStore()
    const activeBranch = branches.find(b => b._id === activeBranchId);
    const { counts, startPolling } = useMaintenanceStore();
    const navigate = useNavigate();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearch.length < 2) {
                setSearchResults(null);
                return;
            }

            try {
                setIsSearching(true);
                const response = await axios.get(`/search?q=${debouncedSearch}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedSearch]);

    const handleResultClick = (type: string, id: string) => {
        setSearchQuery('');
        setSearchResults(null);

        switch (type) {
            case 'asset':
                navigate(`/inventory/asset-details/${id}`);
                break;
            case 'user':
                navigate(`/users/${id}`);
                break;
            case 'location':
                navigate(`/master-data/locations`);
                break;
            case 'supply':
                navigate(`/inventory/supplies/${id}`);
                break;
        }
    };

    useEffect(() => {
        if (user) {
            const stopPolling = startPolling();
            return stopPolling;
        }
    }, [user, startPolling]);

    // Helper to inject badges
    const getBadge = (name: string) => {
        if (!counts) return 0;

        // User Action Required (Pending tickets)
        if (name === 'My Tickets') return counts.myTickets?.actionable || 0;

        // Manager / Admin: Pending Department Tickets (Sent status)
        if (name === 'Dept. Tickets') return counts.deptTickets?.actionable || 0;

        // Admin/Superuser: Show new requests on main 'Maintenance' item
        if (name === 'Maintenance' && (user?.role === 'admin' || user?.role === 'superuser' || user?.role === 'system_admin')) {
            return counts.deptTickets?.actionable || 0;
        }

        // Technician: Assigned Jobs (Accepted status)
        if (name === 'Maintenance' && user?.role === 'technician') {
            return counts.assignedTickets?.actionable || 0;
        }

        if (name === 'Assigned Jobs') return counts.assignedTickets?.actionable || 0;

        return 0;
    };

    // Check if user has permission for a resource
    const hasPermission = (item: any) => {
        // Superuser still has global bypass for UI convenience
        if (user?.role === 'superuser') return true;

        const resourceMap: Record<string, string> = {
            'Dashboard': 'dashboard',
            'Inventory': 'inventory',
            'Supplies': 'inventory', // grouped
            'Panels': 'inventory',
            'Assignments': 'assignments',
            'My Tickets': 'my_tickets',
            'Assigned Jobs': 'assigned_tickets',
            'Dept. Tickets': 'dept_tickets',
            'Maintenance': 'maintenance',
            'Services': 'services',
            'Report': 'reports',
            'Transfers': 'transfer',
            'Rental': 'rental',
            'Events': 'events',
            'Disposal': 'disposal',
            'Users': 'users',
            'Settings': 'settings',
            'My Assets': 'my_assets',
            'Master Data': 'master_data',
            'Activity Log': 'audit_logs',
            // Master Data Children
            'Units': 'categories', // Map units to categories resource for now
            'Categories': 'categories',
            'Vendors': 'vendors',
            'Locations': 'locations',
            'Branches': 'branches',
            'Database': 'settings', // Map database to settings
            'Data Management': 'data_management'
        };

        const resource = resourceMap[item.name];

        // Audit Logs is always restricted to admin roles
        if (resource === 'audit_logs') {
            return user?.role === 'superuser' || user?.role === 'system_admin' || user?.role === 'admin';
        }

        // ============================================================
        // PRIMARY CHECK: Use backend permissions array (single source of truth)
        // This array is sent by getMergedPermissions() on login/getMe
        // It already includes role defaults + custom overrides
        // ============================================================
        if (user?.permissions && user.permissions.length > 0) {
            // Allow navigation groups (like "Master Data") to render if any child is visible
            if (item.children) return true;

            if (!resource) return false; // Unknown resource, deny

            const perm = user.permissions.find((p: any) => p.resource === resource);
            return perm?.actions?.view === true;
        }

        // ============================================================
        // FALLBACK: Only used when user.permissions array is missing
        // (backward compatibility for old sessions/data)
        // ============================================================

        // Dept Tickets restriction
        const isDeptTicket = resource === 'dept_tickets' || item.name?.toLowerCase().includes('dept') || item.href?.includes('department-tickets');
        if (isDeptTicket) {
            const allowedRoles = ['superuser', 'system_admin', 'admin', 'manager', 'dept_admin', 'supervisor', 'user'];
            return user?.role && allowedRoles.includes(user.role);
        }

        // Manager permissions
        if (user?.role === 'manager' || user?.role === 'dept_admin') {
            return ['dashboard', 'inventory', 'incoming', 'transfer', 'maintenance', 'services', 'history', 'reports', 'my_tickets', 'dept_tickets', 'assignments', 'users', 'settings', 'my_assets', 'rental', 'events', 'categories', 'locations', 'vendors', 'disposal'].includes(resource || '');
        }

        // Supervisor permissions
        if (user?.role === 'supervisor') {
            return ['dashboard', 'inventory', 'maintenance', 'my_tickets', 'dept_tickets', 'my_assets', 'reports', 'history', 'assignments', 'users'].includes(resource || '');
        }

        // Technician permissions
        if (user?.role === 'technician') {
            return ['dashboard', 'inventory', 'maintenance', 'my_tickets', 'assigned_tickets', 'my_assets', 'rental', 'disposal', 'assignments', 'reports', 'transfer', 'users'].includes(resource || '');
        }

        // Standard User permissions
        if (user?.role === 'user') {
            return ['dashboard', 'my_tickets', 'my_assets', 'history', 'data_management', 'dept_tickets'].includes(resource || '');
        }

        // Auditor permissions
        if (user?.role === 'auditor') {
            return ['dashboard', 'inventory', 'history', 'reports', 'disposal'].includes(resource || '');
        }

        // Fallback or explicit deny if no role matches above
        return false;
    };

    const filteredNavigation = navigation.map(item => {
        if (item.children) {
            const filteredChildren = item.children.filter(child => hasPermission(child));
            if (filteredChildren.length > 0) {
                return { ...item, children: filteredChildren };
            }
            return null;
        }
        return hasPermission(item) ? item : null;
    }).filter(Boolean) as NavigationItem[];

    // Redirect logic removed as technicians are now allowed to access maintenance page
    // to view their assigned tickets.

    return (
        <>
            {/* Loading overlay when switching branches */}
            {isSwitching && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-900 dark:text-white font-medium">Switching branch...</p>
                    </div>
                </div>
            )}
            <div>
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-900/80" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>
                                    {/* Sidebar component for mobile */}
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                                        <div className="flex h-16 shrink-0 items-center px-4">
                                            {user?.role === 'superuser' ? (
                                                <div className="w-full">
                                                    <Listbox value={activeBranchId} onChange={setActiveBranch} disabled={isBranchLoading || isSwitching}>
                                                        <div className="relative mt-1">
                                                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus:visible:border-indigo-500 focus:visible:ring-2 focus:visible:ring-white/75 focus:visible:ring-offset-2 focus:visible:ring-offset-orange-300 sm:text-sm">
                                                                <span className="block truncate text-white">
                                                                    {isSwitching ? 'Switching...' : (isBranchLoading ? 'Loading...' : (activeBranchId === 'ALL' ? 'All Branches' : activeBranch?.name || 'Unknown Branch'))}
                                                                </span>
                                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                                    <ChevronUpDownIcon
                                                                        className="h-5 w-5 text-gray-400"
                                                                        aria-hidden="true"
                                                                    />
                                                                </span>
                                                            </Listbox.Button>
                                                            <Transition
                                                                as={Fragment}
                                                                leave="transition ease-in duration-100"
                                                                leaveFrom="opacity-100"
                                                                leaveTo="opacity-0"
                                                            >
                                                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                                                                    <Listbox.Option
                                                                        key="ALL"
                                                                        className={({ active }) =>
                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                                            }`
                                                                        }
                                                                        value="ALL"
                                                                    >
                                                                        {({ selected }) => (
                                                                            <>
                                                                                <span
                                                                                    className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                                        }`}
                                                                                >
                                                                                    All Branches
                                                                                </span>
                                                                                {selected ? (
                                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                                    </span>
                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                    </Listbox.Option>
                                                                    {branches.map((branch) => (
                                                                        <Listbox.Option
                                                                            key={branch._id}
                                                                            className={({ active }) =>
                                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                                                }`
                                                                            }
                                                                            value={branch._id}
                                                                        >
                                                                            {({ selected }) => (
                                                                                <>
                                                                                    <span
                                                                                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                                            }`}
                                                                                    >
                                                                                        {branch.name} {branch.isHeadOffice ? '(HO)' : ''}
                                                                                    </span>
                                                                                    {selected ? (
                                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                                        </span>
                                                                                    ) : null}
                                                                                </>
                                                                            )}
                                                                        </Listbox.Option>
                                                                    ))}
                                                                </Listbox.Options>
                                                            </Transition>
                                                        </div>
                                                    </Listbox>
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    <h2 className="text-white text-lg font-semibold">
                                                        {(user as any)?.branchId?.name || 'Your Company'}
                                                    </h2>
                                                </div>
                                            )}
                                        </div>
                                        <nav className="flex flex-1 flex-col">
                                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                                <li>
                                                    <ul role="list" className="-mx-2 space-y-1">
                                                        {filteredNavigation.map((item) => (
                                                            <li key={item.name}>
                                                                {!item.children ? (
                                                                    <Link
                                                                        to={item.href!}
                                                                        className={classNames(
                                                                            location.pathname === item.href
                                                                                ? 'bg-gray-800 text-white'
                                                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                        )}
                                                                    >
                                                                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                                        {item.name}
                                                                        {getBadge(item.name) > 0 && (
                                                                            <span className="ml-auto w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                                                                                {getBadge(item.name)}
                                                                            </span>
                                                                        )}
                                                                    </Link>
                                                                ) : (
                                                                    <Disclosure as="div">
                                                                        {({ open }) => (
                                                                            <>
                                                                                <Disclosure.Button
                                                                                    className={classNames(
                                                                                        item.children?.some(child => child.href === location.pathname)
                                                                                            ? 'bg-gray-800 text-white'
                                                                                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                                        'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold'
                                                                                    )}
                                                                                >
                                                                                    <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                                                                                    {item.name}
                                                                                    <ChevronRightIcon
                                                                                        className={classNames(
                                                                                            open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                                                                            'ml-auto h-5 w-5 shrink-0 transition-transform duration-200'
                                                                                        )}
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </Disclosure.Button>
                                                                                <Disclosure.Panel as="ul" className="mt-1 px-2">
                                                                                    {item.children?.map((subItem) => (
                                                                                        <li key={subItem.name}>
                                                                                            <Disclosure.Button
                                                                                                as={Link}
                                                                                                to={subItem.href}
                                                                                                className={classNames(
                                                                                                    location.pathname === subItem.href
                                                                                                        ? 'bg-gray-800 text-white'
                                                                                                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                                                    'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 font-semibold'
                                                                                                )}
                                                                                            >
                                                                                                {subItem.name}
                                                                                            </Disclosure.Button>
                                                                                        </li>
                                                                                    ))}
                                                                                </Disclosure.Panel>
                                                                            </>
                                                                        )}
                                                                    </Disclosure>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
                        <div className="flex h-16 shrink-0 items-center px-4">
                            {user?.role === 'superuser' ? (
                                <div className="w-full">
                                    <Listbox value={activeBranchId} onChange={setActiveBranch} disabled={isBranchLoading || isSwitching}>
                                        <div className="relative mt-1">
                                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus:visible:border-indigo-500 focus:visible:ring-2 focus:visible:ring-white/75 focus:visible:ring-offset-2 focus:visible:ring-offset-orange-300 sm:text-sm">
                                                <span className="block truncate text-white">
                                                    {isSwitching ? 'Switching...' : (isBranchLoading ? 'Loading...' : (activeBranchId === 'ALL' ? 'All Branches' : activeBranch?.name || 'Unknown Branch'))}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon
                                                        className="h-5 w-5 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            </Listbox.Button>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                                                    <Listbox.Option
                                                        key="ALL"
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                            }`
                                                        }
                                                        value="ALL"
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                        }`}
                                                                >
                                                                    All Branches
                                                                </span>
                                                                {selected ? (
                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                    {branches.map((branch) => (
                                                        <Listbox.Option
                                                            key={branch._id}
                                                            className={({ active }) =>
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                                                }`
                                                            }
                                                            value={branch._id}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span
                                                                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                            }`}
                                                                    >
                                                                        {branch.name} {branch.isHeadOffice ? '(HO)' : ''}
                                                                    </span>
                                                                    {selected ? (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <h2 className="text-white text-lg font-semibold">
                                        {(user as any)?.branchId?.name || 'Your Company'}
                                    </h2>
                                </div>
                            )}
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {filteredNavigation.map((item) => (
                                            <li key={item.name}>
                                                {!item.children ? (
                                                    <Link
                                                        to={item.href!}
                                                        className={classNames(
                                                            location.pathname === item.href
                                                                ? 'bg-gray-800 text-white'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        )}
                                                    >
                                                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                        {item.name}
                                                        {getBadge(item.name) > 0 && (
                                                            <span className="ml-auto w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                                                                {getBadge(item.name)}
                                                            </span>
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <Disclosure as="div">
                                                        {({ open }) => (
                                                            <>
                                                                <Disclosure.Button
                                                                    className={classNames(
                                                                        item.children?.some(child => child.href === location.pathname)
                                                                            ? 'bg-gray-800 text-white'
                                                                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                        'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold'
                                                                    )}
                                                                >
                                                                    <item.icon className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
                                                                    {item.name}
                                                                    <ChevronRightIcon
                                                                        className={classNames(
                                                                            open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                                                            'ml-auto h-5 w-5 shrink-0 transition-transform duration-200'
                                                                        )}
                                                                        aria-hidden="true"
                                                                    />
                                                                </Disclosure.Button>
                                                                <Disclosure.Panel as="ul" className="mt-1 px-2">
                                                                    {item.children?.map((subItem) => (
                                                                        <li key={subItem.name}>
                                                                            <Disclosure.Button
                                                                                as={Link}
                                                                                to={subItem.href}
                                                                                className={classNames(
                                                                                    location.pathname === subItem.href
                                                                                        ? 'bg-gray-800 text-white'
                                                                                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                                    'block rounded-md py-2 pr-2 pl-9 text-sm leading-6 font-semibold'
                                                                                )}
                                                                            >
                                                                                {subItem.name}
                                                                            </Disclosure.Button>
                                                                        </li>
                                                                    ))}
                                                                </Disclosure.Panel>
                                                            </>
                                                        )}
                                                    </Disclosure>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="lg:pl-72">
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Separator */}
                        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="relative flex flex-1">
                                <label htmlFor="search-field" className="sr-only">
                                    Search
                                </label>
                                <MagnifyingGlassIcon
                                    className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    id="search-field"
                                    className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="Search anything (assets, users, locations)..."
                                    type="search"
                                    name="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onBlur={() => setTimeout(() => setSearchResults(null), 200)}
                                />

                                {/* Search Results Dropdown */}
                                {searchResults && (
                                    <div className="absolute top-full left-0 w-full max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-b-lg shadow-xl z-[100] mt-1 p-2">
                                        {isSearching && (
                                            <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined animate-spin">sync</span>
                                                Searching...
                                            </div>
                                        )}

                                        {!isSearching && (
                                            <>
                                                {searchResults.assets?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h3 className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Assets</h3>
                                                        {searchResults.assets.map((asset: any) => (
                                                            <button
                                                                key={asset._id}
                                                                onClick={() => handleResultClick('asset', asset._id)}
                                                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex flex-col group transition-colors"
                                                            >
                                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">{asset.name}</span>
                                                                <span className="text-xs text-gray-400">{asset.assetTag} | {asset.serialNumber}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {searchResults.users?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h3 className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Users</h3>
                                                        {searchResults.users.map((user: any) => (
                                                            <button
                                                                key={user._id}
                                                                onClick={() => handleResultClick('user', user._id)}
                                                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-3 group transition-colors"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                                    {user.avatarUrl ? (
                                                                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-slate-400">{user.name?.[0]}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">{user.name}</span>
                                                                    <span className="text-xs text-gray-400">@{user.username}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {searchResults.locations?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h3 className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Locations</h3>
                                                        {searchResults.locations.map((loc: any) => (
                                                            <button
                                                                key={loc._id}
                                                                onClick={() => handleResultClick('location', loc._id)}
                                                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex flex-col group transition-colors"
                                                            >
                                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">{loc.name}</span>
                                                                <span className="text-xs text-gray-400">{loc.type} | {loc.code}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {Object.values(searchResults).every((arr: any) => arr.length === 0) && (
                                                    <div className="p-4 text-center text-gray-500 italic">
                                                        No results found for "{searchQuery}"
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                                </button>

                                {/* Separator */}
                                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                                {/* Profile dropdown */}
                                <Menu as="div" className="relative">
                                    <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                        <span className="sr-only">Open user menu</span>
                                        <img
                                            className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                                            src={user?.avatarUrl || 'https://www.gravatar.com/avatar?d=mp'}
                                            alt={user?.name || 'User avatar'}
                                        />
                                        <span className="hidden lg:flex lg:items-center">
                                            <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                                {user?.name || 'User'}
                                            </span>
                                            <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to="/settings"
                                                        className={classNames(
                                                            active ? 'bg-gray-50' : '',
                                                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                                                        )}
                                                    >
                                                        Your Profile
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => useAuthStore.getState().logout()}
                                                        className={classNames(
                                                            active ? 'bg-gray-50' : '',
                                                            'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
                                                        )}
                                                    >
                                                        Sign out
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </div>

                    <main className="py-10">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="mb-6">
                                {!location.pathname.startsWith('/master-data/locations') && <Breadcrumbs />}
                            </div>
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
