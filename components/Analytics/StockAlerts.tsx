'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { itemsCol } from '../../lib/db';

export function StockAlerts() {
    const { user } = useAuth();

    const q = user ? query(itemsCol, where('userEmail', '==', user.email)) : null;
    const [snapshot, loading] = useCollection(q);

    const lowStockItems = React.useMemo(() => {
        if (!user || !snapshot) return [];

        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: String(data.name || 'Item'),
                quantity: Number(data.quantity || 0),
                lowStockThreshold: Number(data.lowStockThreshold || 0),
                cost: Number(data.cost || 0)
            };
        });

        // Filter items that have a threshold defined AND are below or at it
        return items.filter(item =>
            item.lowStockThreshold !== undefined &&
            item.quantity <= item.lowStockThreshold
        ).map(item => {
            // Calculate how much to replenish to reach threshold + 1
            const neededForMin = Math.max(0, (item.lowStockThreshold || 0) - item.quantity + 1);
            const replenishmentCost = neededForMin * item.cost;

            return {
                ...item,
                replenishmentCost
            };
        });
    }, [snapshot]);

    if (loading || !lowStockItems || lowStockItems.length === 0) return null;

    const totalReplenishmentNeeded = lowStockItems.reduce((acc, item) => acc + item.replenishmentCost, 0);

    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-amber-100 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                        <span className="text-2xl animate-pulse">⚠️</span> Painel de Atenção
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Estoque crítico detectado em {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'itens'}</p>
                </div>

                <div className="bg-amber-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-amber-200">
                    <div className="text-[10px] uppercase font-black opacity-80 tracking-widest text-center">Investimento Necessário</div>
                    <div className="text-lg font-black text-center">$ {totalReplenishmentNeeded.toFixed(2)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map(item => (
                    <div key={item.id} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-md">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-700 truncate max-w-[150px]">{item.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-black">
                                {item.quantity} un
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>Limite: {item.lowStockThreshold} un</span>
                            <span className="text-amber-600">Repos: +$ {item.replenishmentCost.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
