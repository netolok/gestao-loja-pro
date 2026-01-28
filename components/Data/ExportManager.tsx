'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { itemsCol, transactionsCol } from '../../lib/db';
import { getDocs, query, where } from 'firebase/firestore';
import { Button } from '../ui/Button';

export function ExportManager() {
    const { user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportInventoryCSV = async () => {
        if (!user) return;
        setLoading('inventory');
        try {
            const q = query(itemsCol, where('userEmail', '==', user.email));
            const snap = await getDocs(q);
            const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Header
            let csv = 'ID,Nome,Preço Venda,Custo,Estoque,Lucro Estimado\n';

            // Rows
            items.forEach((item: any) => {
                const profit = (item.price || 0) - (item.cost || 0);
                csv += `${item.id},"${item.name}",${item.price},${item.cost},${item.quantity || 0},${profit.toFixed(2)}\n`;
            });

            downloadFile(csv, `estoque_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        } catch (err) {
            console.error(err);
            alert('Erro ao exportar estoque.');
        } finally {
            setLoading(null);
        }
    };

    const exportSalesCSV = async () => {
        if (!user) return;
        setLoading('sales');
        try {
            const q = query(transactionsCol, where('userEmail', '==', user.email));
            const snap = await getDocs(q);
            const txs = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
                };
            });

            // Header
            let csv = 'ID,Data,Total,Lucro,Desconto,Itens\n';

            // Rows
            txs.forEach((tx: any) => {
                const itemNames = (tx.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('; ');
                csv += `${tx.id},"${tx.date.toLocaleString()}",${tx.total},${tx.profit},${tx.discount || 0},"${itemNames}"\n`;
            });

            downloadFile(csv, `vendas_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        } catch (err) {
            console.error(err);
            alert('Erro ao exportar vendas.');
        } finally {
            setLoading(null);
        }
    };

    const backupJSON = async () => {
        if (!user) return;
        setLoading('backup');
        try {
            const qItems = query(itemsCol, where('userEmail', '==', user.email));
            const qTxs = query(transactionsCol, where('userEmail', '==', user.email));

            const [snapItems, snapTxs] = await Promise.all([getDocs(qItems), getDocs(qTxs)]);

            const backup = {
                user: { name: user.name, email: user.email },
                date: new Date().toISOString(),
                inventory: snapItems.docs.map(doc => ({ ...doc.data(), id: doc.id })),
                sales: snapTxs.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            };

            downloadFile(JSON.stringify(backup, null, 2), `backup_completo_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        } catch (err) {
            console.error(err);
            alert('Erro ao criar backup.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                <p className="font-bold mb-1">☁️ Nuvem Ativada</p>
                Seus dados agora estão sincronizados com segurança na nuvem! Você pode acessar de qualquer dispositivo. Os backups abaixo servem para segurança extra e análise no Excel.
            </div>

            <div className="grid gap-4">
                <div className="card border border-slate-200 p-4 flex justify-between items-center bg-white hover:border-indigo-200 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800">Relatório de Estoque</h3>
                        <p className="text-sm text-slate-500">Lista completa de produtos e quantidades em CSV (Excel).</p>
                    </div>
                    <Button onClick={exportInventoryCSV} isLoading={loading === 'inventory'} className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm">
                        Baixar .CSV
                    </Button>
                </div>

                <div className="card border border-slate-200 p-4 flex justify-between items-center bg-white hover:border-indigo-200 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800">Histórico de Vendas</h3>
                        <p className="text-sm text-slate-500">Todas as transações realizadas em CSV (Excel).</p>
                    </div>
                    <Button onClick={exportSalesCSV} isLoading={loading === 'sales'} className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm">
                        Baixar .CSV
                    </Button>
                </div>

                <div className="card border border-slate-200 p-4 flex justify-between items-center bg-slate-50 hover:border-slate-300 transition-colors">
                    <div>
                        <h3 className="font-bold text-slate-800">Backup Completo (Segurança)</h3>
                        <p className="text-sm text-slate-500">Arquivo JSON contendo TUDO. Guarde este arquivo em local seguro.</p>
                    </div>
                    <Button onClick={backupJSON} isLoading={loading === 'backup'} className="bg-slate-800 text-white hover:bg-slate-900 shadow-md">
                        Baixar Backup
                    </Button>
                </div>
            </div>
        </div>
    );
}
