'use client';

import React from 'react';
import { IconHome, IconCatalog, IconSales } from '../Icons';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    onOpenCatalog: () => void;
    onOpenSales: () => void;
    onOpenHistory: () => void;
    onOpenSettings: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ onOpenCatalog, onOpenSales, onOpenHistory, onOpenSettings, isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col h-full border-r border-[var(--border)] shrink-0 transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:z-auto
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand */}
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                            G
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white">Gestão Pro</h1>
                            <p className="text-xs text-slate-400 font-medium">SaaS Edition</p>
                        </div>
                    </div>

                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                        {/* @ts-ignore */}
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {/* @ts-ignore */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 mt-4">Principal</div>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700/50 hover:text-white transition-colors text-left group">
                        <IconHome className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-sm">Dashboard</span>
                    </button>

                    <button
                        onClick={() => { onOpenCatalog(); onClose?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700/50 hover:text-white transition-colors text-left group"
                    >
                        <IconCatalog className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-sm">Catálogo</span>
                    </button>

                    <button
                        onClick={() => { onOpenSales(); onClose?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700/50 hover:text-white transition-colors text-left group"
                    >
                        <IconSales className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-sm">Vendas</span>
                    </button>

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 mt-8">Analítico</div>

                    <button
                        onClick={() => { onOpenHistory(); onClose?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700/50 hover:text-white transition-colors text-left group"
                    >
                        {/* @ts-ignore */}
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {/* @ts-ignore */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-sm">Histórico</span>
                    </button>

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 mt-8">Sistema</div>

                    <button
                        onClick={() => { onOpenSettings(); onClose?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-700/50 hover:text-white transition-colors text-left group"
                    >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-sm">Dados e Backup</span>
                    </button>
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between gap-2 px-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {user?.name?.slice(0, 2) || 'JD'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'Visitante'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email || 'Sem conta'}</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                            title="Sair / Trocar Conta"
                        >
                            {/* @ts-ignore */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {/* @ts-ignore */}
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
