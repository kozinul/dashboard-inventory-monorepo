import { useState, useEffect } from 'react';
import { UAParser } from 'ua-parser-js';

export function SystemInfoCard() {
    const [ip, setIp] = useState<string>('Detecting...');
    const [deviceInfo, setDeviceInfo] = useState({ browser: 'Unknown', os: 'Unknown' });

    useEffect(() => {
        // Fetch IP
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIp(data.ip))
            .catch(() => setIp('Unable to fetch'));

        // Parse User Agent
        const parser = new UAParser();
        const browserStr = parser.getBrowser().name || 'Unknown Browser';
        const osStr = parser.getOS().name || 'Unknown OS';
        setDeviceInfo({ browser: browserStr, os: osStr });
    }, []);

    return (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary !text-[18px]">dns</span>
                Session & System Info
            </h4>
            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">public</span> IPv4 Address
                    </span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{ip}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">devices</span> OS Platform
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{deviceInfo.os}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">language</span> Browser
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{deviceInfo.browser}</span>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Health
                </span>
                <span className="text-[10px] text-muted-foreground">Local Session</span>
            </div>
        </div>
    );
}
