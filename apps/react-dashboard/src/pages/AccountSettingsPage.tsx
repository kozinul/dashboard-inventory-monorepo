import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileInfoPanel } from '@/features/profile/ProfileInfoPanel';
import { AccountSettingsForm } from '@/features/profile/AccountSettingsForm';
import { mockProfile } from '@/features/profile/data/mock-profile';

export default function AccountSettingsPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <Sidebar />
            <main className="flex-1 flex overflow-hidden">
                <ProfileInfoPanel profile={mockProfile} />
                <AccountSettingsForm profile={mockProfile} />
            </main>
        </div>
    );
}
