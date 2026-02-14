import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DisposalRecord } from '../services/disposalService';
import { ReasonBadge, WorkflowStatusIndicator } from './DisposalTableParts';

interface DisposalDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: DisposalRecord | null;
}

export function DisposalDetailModal({ isOpen, onClose, record }: DisposalDetailModalProps) {
    if (!record) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-200 dark:border-slate-800">
                                {/* Header */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                                            <span className="material-symbols-outlined text-xl">delete_forever</span>
                                        </div>
                                        <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 dark:text-white">
                                            Disposal Request Details
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-slate-400 hover:text-slate-500 transition-colors"
                                        onClick={onClose}
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-8">
                                    {/* Asset Information */}
                                    <section>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Asset Information</h4>
                                        <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Asset Name</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{record.asset.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Serial Number</p>
                                                <p className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">{record.asset.serial}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reason for Disposal</p>
                                                <div className="mt-1">
                                                    <ReasonBadge reason={record.reason} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current Status</p>
                                                <div className="mt-1">
                                                    <WorkflowStatusIndicator status={record.status} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Request Information */}
                                    <section>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Request Profile</h4>
                                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {record.requestedBy?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{record.requestedBy?.name}</p>
                                                <p className="text-xs text-slate-500">Requested on {new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Location</p>
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{record.location || 'Not specified'}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Approval Timeline */}
                                    <section>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Approval Timeline</h4>
                                        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                            {/* Manager Approval */}
                                            <div className="relative flex items-start gap-4 ml-2">
                                                <div className={`mt-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${record.managerApproval?.approvedBy ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-slate-300'}`}>
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {record.managerApproval?.approvedBy ? 'check' : 'pending'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Manager Approval</p>
                                                        {record.managerApproval?.approvedAt && (
                                                            <span className="text-[10px] text-slate-400">{new Date(record.managerApproval.approvedAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    {record.managerApproval?.approvedBy ? (
                                                        <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Approved by:</span>
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{record.managerApproval.approvedBy.name}</span>
                                                            </div>
                                                            {record.managerApproval.comment && (
                                                                <p className="text-xs text-slate-500 italic">"{record.managerApproval.comment}"</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">Waiting for manager decision...</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Auditor Approval */}
                                            <div className="relative flex items-start gap-4 ml-2">
                                                <div className={`mt-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${record.auditorApproval?.approvedBy ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-slate-300'}`}>
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {record.auditorApproval?.approvedBy ? 'verified' : 'pending'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Auditor Verification</p>
                                                        {record.auditorApproval?.approvedAt && (
                                                            <span className="text-[10px] text-slate-400">{new Date(record.auditorApproval.approvedAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    {record.auditorApproval?.approvedBy ? (
                                                        <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Verified by:</span>
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{record.auditorApproval.approvedBy.name}</span>
                                                            </div>
                                                            {record.auditorApproval.comment && (
                                                                <p className="text-xs text-slate-500 italic">"{record.auditorApproval.comment}"</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">Waiting for auditor verification...</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Footer */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        onClick={onClose}
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
