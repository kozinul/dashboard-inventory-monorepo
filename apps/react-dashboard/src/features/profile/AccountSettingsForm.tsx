import { UserProfile } from './data/mock-profile';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';

interface AccountSettingsFormProps {
    profile: UserProfile;
}

export function AccountSettingsForm({ profile }: AccountSettingsFormProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
            <div className="max-w-3xl mx-auto space-y-12">
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
                                defaultValue={profile.name}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <TextField
                                label="Email Address"
                                type="email"
                                placeholder="work@email.com"
                                defaultValue={profile.email}
                            />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <TextField
                                label="Phone Number"
                                type="tel"
                                placeholder="+00 000 0000 000"
                                defaultValue={profile.phone}
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
                        <div className="flex flex-col gap-2">
                            <PasswordField
                                label="Current Password"
                                placeholder="••••••••"
                                defaultValue="password123"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <PasswordField
                                    label="New Password"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <PasswordField
                                    label="Confirm New Password"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Form Actions */}
                <div className="pt-8 flex items-center justify-between">
                    <p className="text-xs text-slate-500 italic">Last modified on October 12, 2023</p>
                    <div className="flex gap-4">
                        <button className="px-8 py-3 rounded-lg text-slate-400 font-semibold hover:text-white transition-colors">
                            Discard
                        </button>
                        <button className="px-10 py-3 bg-primary text-background-dark font-black rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 uppercase tracking-wider">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
