'use client';

import React, { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // Small delay to ensure the element is mounted before starting animation
            // This allows the browser to paint it with opacity-0 first
            const timer = setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden';
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setIsMounted(false);
                document.body.style.overflow = 'unset';
            }, 300); // Match this with your CSS duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content - SaaS Style */}
            <div
                className={`
                    relative w-full sm:max-w-4xl max-h-[96vh] sm:max-h-[90vh] flex flex-col
                    bg-white border border-slate-200
                    rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden
                    transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                    ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 sm:translate-y-4'}
                `}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-md hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-800"
                    >
                        ✕
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
}
