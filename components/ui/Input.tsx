import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
    return (
        <div className="input-group">
            {label && <label htmlFor={id} className="label">{label}</label>}
            <input
                id={id}
                className={`input ${className}`}
                {...props}
            />
        </div>
    );
}
