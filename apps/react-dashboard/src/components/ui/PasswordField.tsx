import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
    ({ label, className, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">
                    {label}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        ref={ref}
                        className={cn(
                            "w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-4 text-white transition-all outline-none",
                            "focus:border-primary focus:ring-1 focus:ring-primary",
                            "placeholder:text-slate-600",
                            "pr-10", // Space for the icon
                            error && "border-danger focus:border-danger focus:ring-danger",
                            className
                        )}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors outline-none"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                </div>
                {error && <span className="text-xs text-danger">{error}</span>}
            </div>
        );
    }
);

PasswordField.displayName = 'PasswordField';
