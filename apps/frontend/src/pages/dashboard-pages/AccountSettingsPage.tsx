import { ProfileInfoPanel } from '@/features/profile/ProfileInfoPanel';
import { AccountSettingsForm } from '@/features/profile/AccountSettingsForm';
import { mockProfile } from '@/features/profile/data/mock-profile';

export default function AccountSettingsPage() {
    return (
        <div className="flex flex-1">
            <ProfileInfoPanel profile={mockProfile} />
            <AccountSettingsForm profile={mockProfile} />
        </div>
    );
}

