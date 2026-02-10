import { useState } from 'react';
import { UserProfile } from './data/mock-profile';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';

interface AccountSettingsFormProps {
    profile: UserProfile;
    onUpdate?: (data: any) => Promise<void>;
}

export function AccountSettingsForm({ profile, onUpdate }: AccountSettingsFormProps) {
    const [formData, setFormData] = useState({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            };

            // Only include password if user wants to change it
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await onUpdate?.(updateData);

            // Clear password fields after successful update
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">
                {/* Page Heading */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black text-white tracking-tight">Account Settings</h2>
                    <p className="text-slate-400 text-lg">Update your profile details and security protocols.</p>
                </div>

                {/* Personal Information Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">badge</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <TextField
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <TextField
                                label="Email Address"
                                type="email"
                                placeholder="work@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <TextField
                                label="Phone Number"
                                type="tel"
                                placeholder="+00 000 0000 000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-800/50"></div>

                {/* Password Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">lock_reset</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">Security & Password</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <PasswordField
                                    label="New Password"
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                                <p className="text-xs text-slate-500">Leave blank to keep current password</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <PasswordField
                                    label="Confirm New Password"
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Form Actions */}
                <div className="pt-8 flex items-center justify-between">
                    <p className="text-xs text-slate-500 italic">
                        Last modified on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-8 py-3 rounded-lg text-slate-400 font-semibold hover:text-white transition-colors"
                            disabled={isSubmitting}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3 bg-primary text-background-dark font-black rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
