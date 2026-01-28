'use client';

import React, { useState, useEffect } from 'react';
import { ItemForm } from '@/components/Catalog/ItemForm';
import { ItemList } from '@/components/Catalog/ItemList';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);

    // Protect Route
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');

            // Hard fallback: if we are still here after 500ms, force redirect
            const fallback = setTimeout(() => {
                if (window.location.pathname.includes('/catalog')) {
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
                        {loading ? 'Carregando catálogo...' : 'Redirecionando...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Catálogo de Itens</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Novo Item'}
                </Button>
            </div>

            {showForm && (
                <div className="anim-fade-in">
                    <ItemForm onComplete={() => setShowForm(false)} />
                </div>
            )}

            <ItemList />
        </div>
    );
}
