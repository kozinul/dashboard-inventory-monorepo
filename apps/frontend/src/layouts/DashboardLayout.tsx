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
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Breadcrumbs } from '../components/breadcrumbs/Breadcrumbs'
import { BreadcrumbProvider } from '../context/BreadcrumbContext'
import { useAuthStore } from '@/store/authStore'
import { maintenanceService } from '@/services/maintenanceService'
import { useAppStore } from '@/store/appStore'
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

// Main app navigation
const mainNavigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
    { name: 'Supplies', href: '/inventory/supplies', icon: CubeIcon },
    { name: 'My Assets', href: '/my-assets', icon: BriefcaseIcon },
    { name: 'Assignments', href: '/assignments', icon: BriefcaseIcon },
    { name: 'My Tickets', href: '/my-tickets', icon: WrenchScrewdriverIcon },
    { name: 'Dept. Tickets', href: '/department-tickets', icon: WrenchScrewdriverIcon },
    { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
    { name: 'Services', href: '/services', icon: WrenchScrewdriverIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Transfers', href: '/transfer', icon: ArrowsRightLeftIcon },
    { name: 'Rental', href: '/rental', icon: BriefcaseIcon },
    { name: 'Disposal', href: '/disposal', icon: TrashIcon },
    { name: 'Data Management', href: '/data-management', icon: DocumentArrowUpIcon },
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
    const { activeBranchId, branches, setActiveBranch, initialize, isLoading: isBranchLoading, isSwitching } = useAppStore()
    const [counts, setCounts] = useState({ dept: 0, assigned: 0, active: 0, userAction: 0 });

    useEffect(() => {
        if (user?.role === 'superuser' && branches.length === 0) {
            initialize();
        }
    }, [user, branches.length, initialize]);

    const activeBranch = branches.find(b => b._id === activeBranchId) || { name: 'All Branches', _id: 'ALL' };

    useEffect(() => {
        const fetchCounts = async () => {
            if (user) {
                try {
                    const data = await maintenanceService.getNavCounts();
                    setCounts({
                        dept: data.pendingDeptTickets || 0,
                        assigned: data.assignedTickets || 0,
                        active: data.activeTickets || 0,
                        userAction: data.pendingUserAction || 0
                    });
                } catch (error) {
                    console.error('Failed to fetch nav counts', error);
                }
            }
        };

        fetchCounts();
        // Poll every minute
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, [user, location.pathname]); // Re-fetch on navigation too

    // Helper to inject badges
    const getBadge = (name: string) => {
        // User Action Required (Pending tickets)
        if (name === 'My Tickets') return counts.userAction;

        // Manager / Admin: Pending Department Tickets (Sent status)
        if (name === 'Dept. Tickets') return counts.dept;

        // Admin/Superuser: Show new requests on main 'Maintenance' item
        if (name === 'Maintenance' && (user?.role === 'admin' || user?.role === 'superuser' || user?.role === 'system_admin')) {
            return counts.dept;
        }

        // Technician: Assigned Jobs (Accepted status)
        if (name === 'Maintenance' && user?.role === 'technician') {
            return counts.assigned;
        }

        if (name === 'Assigned Jobs') return counts.assigned; // Redundant if mapped to Maintenance, but safe to keep

        return 0;
    };

    // Check if user has permission for a resource
    const hasPermission = (item: any) => {
        // Superuser and admin have access to everything
        if (user?.role === 'superuser' || user?.role === 'system_admin' || user?.role === 'admin') return true;

        const resourceMap: Record<string, string> = {
            'Dashboard': 'dashboard',
            'Inventory': 'inventory',
            'Supplies': 'inventory', // grouped
            'Assignments': 'assignments',
            'My Tickets': 'my_tickets',
            'Assigned Jobs': 'assigned_tickets',
            'Dept. Tickets': 'dept_tickets',
            'Maintenance': 'maintenance',
            'Services': 'services',
            'Reports': 'reports',
            'Transfers': 'transfer',
            'Rental': 'rental',
            'Events': 'events',
            'Disposal': 'disposal',
            'Users': 'users',
            'Settings': 'settings',
            'My Assets': 'my_assets',
            'Master Data': 'master_data',
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

        if (resource === 'disposal') return true; // Force visibility for disposal menu
        if (resource === 'assignments' && user?.role === 'technician') return true; // Force assignments for technicians
        if (resource === 'transfer' && user?.role === 'technician') return true; // Ensure transfer remains visible

        // Check custom permissions if available
        if (user?.permissions && user.permissions.length > 0) {
            // Logic: IF specific permission exists for this resource, use it.
            // IF NOT, strict deny? Or fallback to role default?
            // "getMergedPermissions" in backend ALREADY merges default role perms + custom perms.
            // So if it's not in the array, it means NO access (or view: false).
            // We should trust the array if it exists.

            // Note: 'master_data' is a group. If children are visible, it should show.
            // But existing filtering logic handles groups by checking children.
            // So we only care about leaf nodes or specific group permission if intended.
            if (item.children) return true; // Allow groups to check their children

            if (!resource) return false; // Unknown resource, deny

            const perm = user.permissions.find((p: any) => p.resource === resource);
            return perm?.actions?.view === true;
        }

        // BACKWARD COMPATIBILITY / FALLBACK
        // (Only used if user.permissions is missing)

        // Manager permissions
        if (user?.role === 'manager') {
            return ['dashboard', 'inventory', 'incoming', 'transfer', 'maintenance', 'services', 'history', 'reports', 'my_tickets', 'dept_tickets', 'assignments', 'users', 'settings', 'my_assets', 'rental', 'events', 'categories', 'locations', 'vendors', 'disposal'].includes(resource || '');
        }

        // Technician permissions
        if (user?.role === 'technician') {
            return ['dashboard', 'inventory', 'maintenance', 'my_tickets', 'assigned_tickets', 'dept_tickets', 'my_assets', 'rental', 'disposal', 'assignments'].includes(resource || '');
        }

        // Standard User permissions
        if (user?.role === 'user') {
            return ['dashboard', 'inventory', 'my_tickets', 'maintenance', 'my_assets', 'history', 'data_management', 'disposal'].includes(resource || '');
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
                                                                    {isSwitching ? 'Switching...' : (isBranchLoading ? 'Loading...' : (activeBranchId === 'ALL' ? 'All Branches' : activeBranch.name))}
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
                                                    {isSwitching ? 'Switching...' : (isBranchLoading ? 'Loading...' : (activeBranchId === 'ALL' ? 'All Branches' : activeBranch.name))}
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
                            <form className="relative flex flex-1" action="#" method="GET">
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
                                    placeholder="Search..."
                                    type="search"
                                    name="search"
                                />
                            </form>
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
                                            className="h-8 w-8 rounded-full bg-gray-50"
                                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt=""
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
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </div>

                    <main className="py-10">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="mb-6">
                                <Breadcrumbs />
                            </div>
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
