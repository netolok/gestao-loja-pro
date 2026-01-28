'use client';

import React, { useState } from 'react';
import { ItemForm } from './ItemForm';
import { ItemList } from './ItemList';
import { BrandManager } from './BrandManager';
import { Item } from '../../lib/db';

export function CatalogManager() {
    const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'items' | 'brands'>('items');

    return (
        <div className="space-y-8">
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'items' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Produtos
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'brands' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Marcas
                </button>
            </div>

            {activeTab === 'items' ? (
                <>
                    <ItemForm
                        initialData={editingItem}
                        onCancel={() => setEditingItem(undefined)}
                        onComplete={() => setEditingItem(undefined)}
                    />

                    <div className="border-t border-slate-100 pt-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Catálogo de Produtos</h3>
                        <ItemList onEdit={(item) => setEditingItem(item)} />
                    </div>
                </>
            ) : (
                <BrandManager />
            )}
        </div>
    );
}
