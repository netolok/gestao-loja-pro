'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHome, IconCatalog, IconSales } from './Icons';

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Início', href: '/', icon: IconHome },
        { name: 'Catálogo', href: '/catalog', icon: IconCatalog },
        { name: 'Vendas', href: '/sales', icon: IconSales },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[var(--glass-border)] pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[var(--primary)] scale-110' : 'text-slate-400 hover:text-[var(--primary)]'}`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-bold">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
