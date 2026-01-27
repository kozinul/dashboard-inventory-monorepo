import { UserProfile } from './data/mock-profile';

interface ProfileInfoPanelProps {
    profile: UserProfile;
}

export function ProfileInfoPanel({ profile }: ProfileInfoPanelProps) {
    return (
        <div className="w-96 border-r border-slate-800/50 bg-slate-900/20 p-8 flex flex-col gap-8 h-full">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center gap-4">
                <div className="relative group">
                    <div className="size-40 rounded-full border-4 border-slate-800 p-1 bg-background-dark">
                        <div
                            className="w-full h-full rounded-full bg-center bg-cover"
                            style={{ backgroundImage: `url('${profile.avatarUrl}')` }}
                        >
                        </div>
                    </div>
                    <button className="absolute bottom-2 right-2 size-10 bg-primary rounded-full flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
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
