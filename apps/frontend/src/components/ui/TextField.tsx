import React from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
    ({ label, className, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={cn(
                        "w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-4 text-white transition-all outline-none",
                        "focus:border-primary focus:ring-1 focus:ring-primary",
                        "placeholder:text-slate-600",
                        error && "border-danger focus:border-danger focus:ring-danger",
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-xs text-danger">{error}</span>}
            </div>
        );
    }
);

TextField.displayName = 'TextField';
