import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { StatusBadge } from "@/components/common/StatusBadge"
import { DepartmentBadge } from "./DepartmentBadge"
import { User } from "@dashboard/schemas"

import { useRoleStore } from "@/store/roleStore";

interface UserRowProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onView?: (user: User) => void;
    onCopyRole?: (user: User) => void;
}

export function UserRow({ user, onEdit, onDelete, onView, onCopyRole }: UserRowProps) {
    const getRoleBySlug = useRoleStore(state => state.getRoleBySlug);
    const role = getRoleBySlug(user.role);

    return (
        <tr
            onClick={() => onView && onView(user)}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-slate-100 dark:border-slate-800 cursor-pointer"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img
                        className="w-10 h-10 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                        src={user.avatarUrl || 'https://www.gravatar.com/avatar?d=mp'}
                        alt={`Portrait of ${user.name}`}
                    />
                    <span className="font-bold text-foreground">{user.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-muted-foreground font-medium">{user.email}</td>
            <td className="px-6 py-4">
                <DepartmentBadge department={user.department} />
            </td>
            <td className="px-6 py-4 font-medium italic text-muted-foreground">{user.designation}</td>
            <td className="px-6 py-4">
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${role?.color}20`,
                        color: role?.color || '#64748b'
                    }}
                >
                    {role?.name || user.role}
                </span>
            </td>
            <td className="px-6 py-4 text-center">
                <StatusBadge status={user.status as any} />
            </td>
            <td className="px-6 py-4 text-right relative">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(user);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                        title="Delete User"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <Menu.Button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 group-hover:text-primary">
                            <span className="material-symbols-outlined">more_vert</span>
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
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => onEdit(user)}
                                                className={`${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                                                    } block w-full px-4 py-2 text-sm text-left`}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </Menu.Item>
                                    {onCopyRole && (
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => onCopyRole(user)}
                                                    className={`${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                                                        } block w-full px-4 py-2 text-sm text-left`}
                                                >
                                                    Copy Role To...
                                                </button>
                                            )}
                                        </Menu.Item>
                                    )}
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => onDelete(user)}
                                                className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300' : 'text-red-700 dark:text-red-400'
                                                    } block w-full px-4 py-2 text-sm text-left`}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </td>
        </tr>
    )
}
