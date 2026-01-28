'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { transactionsCol } from '../../lib/db';

export function RankingCards() {
    const { user } = useAuth();

    const q = user ? query(transactionsCol, where('userEmail', '==', user.email)) : null;
    const [snapshot, loading] = useCollection(q);

    const data = React.useMemo(() => {
        if (!user || !snapshot) return null;

        const transactions = snapshot.docs.map(doc => {
            const txData = doc.data();
            return {
                ...txData,
                id: doc.id,
                items: (txData.items || []).map((item: any) => ({
                    name: String(item.name || 'Item'),
                    brandName: String(item.brandName || ''),
                    price: Number(item.price || 0),
                    cost: Number(item.cost || 0),
                    quantity: Number(item.quantity || 0)
                }))
            };
        });

        const brandStats: { [name: string]: number } = {};
        const productStats: { [name: string]: { profit: number, quantity: number } } = {};

        transactions.forEach(tx => {
            const items = tx.items || [];
            items.forEach((item: any) => {
                // Brand Ranking (by volume)
                const bName = item.brandName || 'Sem Marca';
                brandStats[bName] = (brandStats[bName] || 0) + (item.quantity || 0);

                // Product Ranking (by total net profit contribution)
                const itemProfit = ((item.price || 0) - (item.cost || 0)) * (item.quantity || 0);
                if (!productStats[item.name]) {
                    productStats[item.name] = { profit: 0, quantity: 0 };
                }
                productStats[item.name].profit += itemProfit;
                productStats[item.name].quantity += (item.quantity || 0);
            });
        });

        // Convert to arrays and sort
        const topBrands = Object.entries(brandStats)
            .map(([name, volume]) => ({ name, volume }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        const topProducts = Object.entries(productStats)
            .map(([name, stats]) => ({ name, profit: stats.profit, quantity: stats.quantity }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);

        return { topBrands, topProducts };
    }, [snapshot]);

    if (loading || !data) return null;

    const { topBrands, topProducts } = data;
    const maxBrandVolume = topBrands[0]?.volume || 1;
    const maxProductProfit = topProducts[0]?.profit || 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Brands Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-xl">📊</span> Top 5 Marcas (Volume)
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Vendidas</span>
                </div>

                <div className="space-y-5">
                    {topBrands.map((brand, idx) => (
                        <div key={brand.name} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-slate-700">
                                    <span className="text-indigo-400 mr-2">#{idx + 1}</span>
                                    {brand.name}
                                </span>
                                <span className="text-xs font-black text-slate-900">{brand.volume} un</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(brand.volume / maxBrandVolume) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {topBrands.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">Nenhuma venda registrada ainda.</p>
                    )}
                </div>
            </div>

            {/* Top Products Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-xl">💰</span> Top 5 Lucratividade
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Total Acumulado</span>
                </div>

                <div className="space-y-5">
                    {topProducts.map((product, idx) => (
                        <div key={product.name} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">
                                        <span className="text-emerald-500 mr-2">#{idx + 1}</span>
                                        {product.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-6">{product.quantity} unidades sold</span>
                                </div>
                                <span className="text-xs font-black text-emerald-600">$ {product.profit.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(product.profit / maxProductProfit) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {topProducts.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">Nenhuma venda registrada ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
