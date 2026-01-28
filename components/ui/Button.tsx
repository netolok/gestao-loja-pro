import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'danger';
    isLoading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    ...props
}: ButtonProps) {
    const baseClass = variant === 'danger'
        ? 'btn bg-red-500 text-white hover:bg-red-600' // Override for danger if not in globals, but globals has btn-primary. I'll stick to globals classes.
        : `btn btn-${variant}`;

    // Note: .btn-danger was defined in globals as using --danger var? 
    // checking globals.css: defined --danger but not .btn-danger class.
    // I should add proper inline styles or rely on utility classes if I had them. 
    // globals.css only has .btn-primary and .btn-ghost. 
    // I will add a style for danger dynamically or update globals later.
    // For now let's use a style object or utility class approach if I added variables.

    const variantStyles: Record<string, React.CSSProperties> = {
        danger: { background: 'var(--danger)', color: '#fff' } // Simple inline fallback
    };

    return (
        <button
            className={`btn btn-${variant === 'danger' ? 'primary' : variant} ${className}`}
            style={variant === 'danger' ? variantStyles.danger : undefined}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="animate-pulse">...</span> : children}
        </button>
    );
}
