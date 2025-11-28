import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StandardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: LucideIcon;
    variant?: 'default' | 'filled';
}

// Reusable input component with consistent styling and optional icon
// Variants: default (bordered) or filled (subtle background)
export const StandardInput: React.FC<StandardInputProps> = ({
    label,
    error,
    icon: Icon,
    variant = 'default',
    className = '',
    ...props
}) => {
    const baseStyles = "w-full p-3 rounded-lg text-solita-black transition-all focus:outline-none focus:ring-2 focus:ring-solita-ochre";
    const variants = {
        default: "bg-white border border-solita-light-grey focus:border-solita-ochre",
        filled: "bg-solita-light-grey/30 border border-transparent hover:border-solita-light-grey"
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-solita-mid-grey uppercase mb-1 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-solita-mid-grey">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    className={`${baseStyles} ${variants[variant]} ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
        </div>
    );
};
