'use client';

import React, { useState } from 'react';
import { IconTrash } from '../Icons';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { itemsCol, brandsCol, Item, Brand, db } from '../../lib/db';

interface ItemListProps {
    onEdit?: (item: Item) => void;
}

export function ItemList({ onEdit }: ItemListProps) {
    const { user } = useAuth();
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    // Filter items by current user (Firestore)
    const itemsQuery = user ? query(itemsCol, where('userEmail', '==', user.email)) : null;
    const [itemsSnap, loadingItems] = useCollection(itemsQuery);

    const itemsRaw = itemsSnap ? itemsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as Item[] : [];

    // Fetch brands for filtering (Firestore)
    const brandsQuery = user ? query(brandsCol, where('userEmail', '==', user.email)) : null;
    const [brandsSnap, loadingBrands] = useCollection(brandsQuery);

    const brands = brandsSnap ? brandsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as Brand[] : [];

    const items = itemsRaw ? (selectedBrand ? itemsRaw.filter(i => i.brandName === selectedBrand) : itemsRaw) : [];

    if (loadingItems || loadingBrands) return <div className="text-center p-4">Carregando catálogo...</div>;

    return (
        <div className="space-y-6">
            {/* Brand Filters */}
            {brands && brands.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                    <button
                        onClick={() => setSelectedBrand(null)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedBrand ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        Tudo
                    </button>
                    {brands.map(brand => (
                        <button
                            key={brand.id}
                            onClick={() => setSelectedBrand(brand.name)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedBrand === brand.name ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {brand.name}
                        </button>
                    ))}
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center p-8 text-[var(--text-secondary)] card border-dashed">
                    <p>Nenhum item encontrado{selectedBrand ? ` para a marca "${selectedBrand}"` : ''}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map(item => {
                        const profit = item.price - item.cost;
                        const margin = (profit / item.price) * 100;
                        const quantity = item.quantity || 0;
                        const isLowStock = quantity < 5;

                        return (
                            <div key={item.id} className="card flex flex-row gap-4 items-center group relative hover:border-indigo-300 transition-colors">
                                <div className="w-20 h-20 flex-shrink-0 bg-[var(--surface-highlight)] rounded-md overflow-hidden border border-[var(--border)] relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] font-bold text-2xl">
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isLowStock && (
                                        <div className="absolute inset-0 bg-red-500/20 flex items-end justify-center pb-1">
                                            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                                Baixo
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-lg truncate text-slate-800">{item.name}</h4>
                                        {item.brandName && (
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 -mt-1 block">
                                                {item.brandName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            Custo: <span className="text-red-500 font-medium">$ {item.cost.toFixed(2)}</span>
                                        </div>
                                        <div className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-slate-500'}`}>
                                            📦 {quantity}
                                        </div>
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        Venda: <span className="text-[var(--primary)] font-bold">$ {item.price.toFixed(2)}</span>
                                    </div>

                                    <div className="mt-2 text-xs font-medium px-2 py-1 bg-[var(--surface-highlight)] rounded-full inline-block border border-[var(--border)]">
                                        Lucro: <span className="text-[var(--success)]">$ {profit.toFixed(2)} ({margin.toFixed(0)}%)</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4 relative z-20">
                                    {onEdit && (
                                        <button
                                            type={"button" as "button"}
                                            onClick={(e: React.MouseEvent) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onEdit(item);
                                            }}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors shadow-sm border border-indigo-100"
                                            title="Editar Item"
                                        >
                                            {/* @ts-ignore */}
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                {/* @ts-ignore */}
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        type={"button" as "button"}
                                        onClick={(e: React.MouseEvent) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (window.confirm('Tem certeza que deseja excluir este item?')) {
                                                db.items.delete(item.id!);
                                            }
                                        }}
                                        className="p-2 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-sm border border-slate-200"
                                        title="Excluir Item"
                                    >
                                        <IconTrash className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
