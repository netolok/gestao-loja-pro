'use client';

import React from 'react';
import { db, transactionsCol, Transaction } from '../../lib/db';
import { IconTrash } from '../Icons';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';

export function SalesHistory() {
    const { user } = useAuth();

    const q = user ? query(transactionsCol, where('userEmail', '==', user.email)) : null;
    const [snapshot, loading] = useCollection(q);

    const transactions = React.useMemo(() => {
        if (!snapshot) return [];
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: (data as any).date?.toDate() || new Date()
            } as Transaction;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [snapshot]);

    if (loading) return <div className="text-center p-4">Carregando histórico...</div>;
    if (transactions.length === 0) return (
        <div className="text-center p-8 text-[var(--text-secondary)] card border-dashed">
            <p>Nenhuma venda registrada para {user?.name}.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {transactions.map(tx => (
                <div key={tx.id} className="card flex justify-between items-center group bg-white/60">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm text-[var(--text-secondary)] font-medium">
                                {tx.date.toLocaleString('pt-BR')}
                            </span>
                            {tx.shipping && tx.shipping > 0 && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-slate-200">
                                    Frete: $ {tx.shipping.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="font-bold flex gap-2 items-center">
                            <span className="text-[var(--primary)]">$ {tx.total.toFixed(2)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                                Lucro: $ {tx.profit.toFixed(2)}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 max-w-[250px] truncate">
                            {tx.items.length} itens: {tx.items.map(i => i.name).join(', ')}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (window.confirm('Excluir esta venda? O valor será descontado do total.')) {
                                db.transactions.delete(tx.id!);
                            }
                        }}
                        className="p-3 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir Venda (Estorno)"
                    >
                        <IconTrash className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
