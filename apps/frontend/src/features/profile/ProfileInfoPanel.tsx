import { useRef, useState } from 'react';
import { UserProfile } from './data/mock-profile';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { showSuccessToast, showErrorToast } from '@/utils/swal';

interface ProfileInfoPanelProps {
    profile: UserProfile;
}

export function ProfileInfoPanel({ profile }: ProfileInfoPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user, setUser } = useAuthStore();

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            showErrorToast('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showErrorToast('File size should be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const { url } = await userService.uploadAvatar(file);

            // Update user profile in backend
            await userService.updateMe({ avatarUrl: url });

            // Update local state
            if (user) {
                setUser({ ...user, avatarUrl: url });
            }

            showSuccessToast('Avatar updated successfully');
        } catch (error: any) {
            console.error('Failed to upload avatar:', error);
            showErrorToast(error.response?.data?.message || 'Failed to update avatar');
        } finally {
            setIsUploading(false);
            // Reset input
            if (event.target) event.target.value = '';
        }
    };

    return (
        <div className="w-96 border-r border-slate-800/50 bg-slate-900/20 p-8 flex flex-col gap-8 h-full">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center gap-4">
                <div className="relative group">
                    <div className="size-40 rounded-full border-4 border-slate-800 p-1 bg-background-dark overflow-hidden">
                        {isUploading ? (
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-800 anim-pulse">
                                <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                            </div>
                        ) : (
                            <div
                                className="w-full h-full rounded-full bg-center bg-cover"
                                style={{ backgroundImage: `url('${user?.avatarUrl || profile.avatarUrl}')` }}
                            >
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                        className="absolute bottom-2 right-2 size-10 bg-primary rounded-full flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                    <p className="text-primary font-medium tracking-wide uppercase text-xs mt-1">
                        {profile.role}
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                        {profile.department}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                        {profile.staffId}
                    </span>
                </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            {/* Stats/Quick Info */}
            <div className="grid grid-cols-1 gap-4">
                <div className="glass-panel p-4 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">
                        Last Login
                    </p>
                    <p className="text-slate-200 text-sm font-medium">
                        {profile.lastLogin}
                    </p>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">
                        Equipment Managed
                    </p>
                    <p className="text-slate-200 text-sm font-medium">
                        {profile.equipmentManaged} Active Assets
                    </p>
                </div>
            </div>
        </div>
    );
}
