import { useState, useEffect } from 'react';
import { ProfileInfoPanel } from '@/features/profile/ProfileInfoPanel';
import { AccountSettingsForm } from '@/features/profile/AccountSettingsForm';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { assignmentService } from '@/services/assignmentService';
import { showSuccessToast, showErrorToast } from '@/utils/swal';

export default function AccountSettingsPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [equipmentCount, setEquipmentCount] = useState(0);
    const [lastLogin, setLastLogin] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?._id) return;

            try {
                setIsLoading(true);
                // Fetch user's assigned assets count
                const assignments = await assignmentService.getUserAssignments(user._id);
                const activeAssignments = assignments.filter(a => a.status === 'assigned');
                setEquipmentCount(activeAssignments.length);

                // Format last login (you can update this based on actual user data)
                const now = new Date();
                setLastLogin(now.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const handleUpdateProfile = async (data: any) => {
        if (!user?._id) return;

        try {
            await userService.updateMe(data);
            showSuccessToast('Profile updated successfully');
            // Refresh user data in auth store if needed
            useAuthStore.getState().setUser({ ...user, ...data });
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to update profile');
        }
    };

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    const profile = {
        name: user.name,
        role: user.role?.toUpperCase() || 'USER',
        department: user.department || 'Not Assigned',
        staffId: `Staff #${user._id?.slice(-4)}`,
        avatarUrl: user.avatarUrl || 'https://www.gravatar.com/avatar?d=mp',
        lastLogin: lastLogin,
        equipmentManaged: equipmentCount,
        email: user.email,
        phone: user.phone || ''
    };

    return (
        <div className="flex flex-1">
            <ProfileInfoPanel profile={profile} />
            <AccountSettingsForm profile={profile} onUpdate={handleUpdateProfile} />
        </div>
    );
}

