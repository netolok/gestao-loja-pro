'use client';

import { POS } from '@/components/Sales/POS';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SalesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Protect Route
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');

            // Hard fallback: if we are still here after 500ms, force redirect
            const fallback = setTimeout(() => {
                if (window.location.pathname.includes('/sales')) {
                    window.location.href = '/login';
                }
            }, 500);
            return () => clearTimeout(fallback);
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-500 font-medium">
                        {loading ? 'Carregando POS...' : 'Redirecionando...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <POS />
        </div>
    );
}
