import { GearQuickViewCard } from './GearQuickViewCard';
import { SystemInfoCard } from './SystemInfoCard';
import { highPriorityGear } from '../data/mock-dashboard';

export function HighPriorityGearPanel() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold dark:text-white tracking-tight mb-6">High-Priority Gear</h2>
                <div className="space-y-4">
                    {highPriorityGear.map((gear) => (
                        <GearQuickViewCard key={gear.id} gear={gear} />
                    ))}
                </div>
            </div>

            <SystemInfoCard />
        </div>
    );
}
