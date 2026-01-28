'use client';

import React, { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { transactionsCol } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export function SalesChart() {
    const { user } = useAuth();

    const q = user ? query(transactionsCol, where('userEmail', '==', user.email)) : null;
    const [snapshot, loading] = useCollection(q);

    const data = useMemo(() => {
        if (!user || !snapshot) return [];

        const transactions = snapshot.docs.map(doc => {
            const rawData = doc.data();
            return {
                total: Number(rawData.total || 0),
                profit: Number(rawData.profit || 0),
                date: rawData.date?.toDate ? rawData.date.toDate() : new Date(rawData.date),
                id: doc.id
            };
        });

        if (transactions.length === 0) return [];

        // 1. Group by Date
        const grouped = transactions.reduce((acc, t) => {
            const dateStr = t.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!acc[dateStr]) {
                acc[dateStr] = { name: dateStr, sales: 0, profit: 0, count: 0 };
            }
            acc[dateStr].sales += t.total;
            acc[dateStr].profit += t.profit;
            acc[dateStr].count += 1;
            return acc;
        }, {} as Record<string, any>);

        // 2. Sort by Date
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const [d1, m1] = a.split('/').map(Number);
            const [d2, m2] = b.split('/').map(Number);
            return (m1 - m2) || (d1 - d2);
        });

        // 3. Take last 30 entries if many
        const finalKeys = sortedKeys.slice(-30);

        return finalKeys.map(key => ({
            ...grouped[key],
            sales: Number(grouped[key].sales.toFixed(2)),
            profit: Number(grouped[key].profit.toFixed(2))
        }));
    }, [snapshot, user]);

    if (loading || !user) {
        return (
            <div className="card h-64 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!snapshot || snapshot.empty) {
        return (
            <div className="card h-64 flex flex-col items-center justify-center text-slate-400 border-dashed">
                <p className="mb-2 text-lg">📉</p>
                <p>Sem dados de vendas para exibir no gráfico.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 tracking-tight">Evolução de Vendas</h3>
                    <p className="text-sm text-slate-500">Últimos 30 dias • Receita vs Lucro</p>
                </div>
                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Vendas
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Lucro
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
