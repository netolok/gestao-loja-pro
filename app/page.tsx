'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/db';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // Import Auth
import { Modal } from '../components/ui/Modal';
import { CatalogManager } from '../components/Catalog/CatalogManager';
import { POS } from '../components/Sales/POS';
import { SalesHistory } from '../components/Sales/SalesHistory';
import { Sidebar } from '../components/Layout/Sidebar';
import { SalesChart } from '../components/Analytics/SalesChart';
import { ExportManager } from '../components/Data/ExportManager';
import { RankingCards } from '../components/Analytics/RankingCards';
import { StockAlerts } from '../components/Analytics/StockAlerts';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';
import { transactionsCol, Transaction } from '../lib/db';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Filter transactions by user email (Firestore)
  const q = user ? query(transactionsCol, where('userEmail', '==', user.email)) : null;
  const [snapshot, loadingDocs] = useCollection(q);

  const transactions = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: (doc.data() as any).date?.toDate() || new Date()
    })) as Transaction[];
  }, [snapshot]);

  const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');
  const [activeModal, setActiveModal] = useState<'none' | 'catalog' | 'sales' | 'history' | 'settings'>('none');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stats = useMemo(() => {
    // 0. Filter by Period
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate Start of Week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filteredTransactions = transactions.filter((t: Transaction) => {
      if (periodFilter === 'all') return true;
      const tDate = new Date(t.date);
      if (periodFilter === 'daily') return tDate >= startOfToday;
      if (periodFilter === 'weekly') return tDate >= startOfWeek;
      if (periodFilter === 'monthly') return tDate >= startOfMonth;
      if (periodFilter === 'yearly') return tDate >= startOfYear;
      return true;
    });

    // 1. Calculate Totals
    const gross = filteredTransactions.reduce((acc: number, t: Transaction) => acc + t.total, 0);
    const profit = filteredTransactions.reduce((acc: number, t: Transaction) => acc + t.profit, 0);
    const margin = gross > 0 ? (profit / gross) * 100 : 0;

    return { gross, profit, margin };
  }, [transactions, periodFilter]);

  const { prediction, advice } = useMemo(() => {
    const now = new Date();
    let pNextMonth = 0;
    const totalProfit = transactions.reduce((acc: number, t: Transaction) => acc + t.profit, 0);

    if (transactions.length > 0) {
      const firstDate = transactions[0].date;
      const daysDiff = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)));
      const dailyAvg = totalProfit / daysDiff;
      pNextMonth = dailyAvg * 30;
    }

    const tips = [];
    if (transactions.length === 0) {
      tips.push("Comece adicionando itens ao catálogo e registrando vendas!");
    } else {
      if (stats.margin < 20) tips.push("⚠️ Sua margem de lucro está baixa (< 20%). Considere revisar preços de custo ou aumentar o valor de venda.");
      if (stats.margin > 50) tips.push("🌟 Ótima margem de lucro! Continue assim.");
      if (stats.profit > 1000 && stats.profit < 5000) tips.push("📈 Você está crescendo! Que tal investir em novos produtos?");
    }

    return {
      prediction: {
        nextMonth: pNextMonth,
        message: transactions.length < 5 ? 'Dados insuficientes para previsão precisa.' : 'Baseado na média diária atual.'
      },
      advice: tips
    };
  }, [transactions, stats]);

  // Protect Route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');

      // Hard fallback: if we are still here after 500ms, force redirect
      const fallback = setTimeout(() => {
        if (window.location.pathname === '/') {
          window.location.href = '/login';
        }
      }, 500);
      return () => clearTimeout(fallback);
    }
  }, [user, loading, router]);


  // Show loader while we are definitely waiting for something critical
  if (loading || (user && loadingDocs)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-sm text-slate-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show persistent redirecting state (eliminates white screen)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-bold text-slate-800">Redirecionando para o login...</p>
          <p className="text-xs text-slate-400">Acesso restrito para usuários logados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <Sidebar
        onOpenCatalog={() => setActiveModal('catalog')}
        onOpenSales={() => setActiveModal('sales')}
        onOpenHistory={() => setActiveModal('history')}
        onOpenSettings={() => setActiveModal('settings')}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
        <header className="flex justify-between items-center lg:items-end mb-8">
          <div>
            <div className="flex items-center gap-2 lg:block">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
              >
                {/* @ts-ignore */}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* @ts-ignore */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
            </div>
            <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">
              Olá, <span className="text-indigo-600">{user.name}</span> <span className="hidden sm:inline">• {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </p>
          </div>
        </header>

        <div className="space-y-6 max-w-5xl mx-auto">
          <StockAlerts />

          {/* Period Filter Selector */}
          <div className="flex justify-end">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {[
                { label: 'Hoje', value: 'daily' },
                { label: 'Semanal', value: 'weekly' },
                { label: 'Mensal', value: 'monthly' },
                { label: 'Anual', value: 'yearly' },
                { label: 'Tudo', value: 'all' }
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodFilter(p.value as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodFilter === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-white border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  {/* @ts-ignore */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {/* @ts-ignore */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Bruto</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">$ {stats.gross.toFixed(2)}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Atualizado agora</span>
                <button onClick={() => setActiveModal('history')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Ver Histórico &rarr;</button>
              </div>
            </div>

            <div className="card bg-white border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  {/* @ts-ignore */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {/* @ts-ignore */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lucro Líquido</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">$ {stats.profit.toFixed(2)}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.margin > 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {stats.margin.toFixed(0)}% Margem
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[500px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              {/* @ts-ignore */}
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                {/* @ts-ignore */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Visão Geral de Vendas
            </h3>
            <SalesChart />
          </div>

          <RankingCards />

          {/* Forecast & Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 card bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                {/* @ts-ignore */}
                <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {/* @ts-ignore */}
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Projeção (30d)</h3>
              <div className="text-4xl font-bold text-indigo-400 mb-2">$ {prediction?.nextMonth.toFixed(2)}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{prediction?.message}</p>
            </div>

            <div className="lg:col-span-2 card bg-white border border-slate-200 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Insights & Dicas</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{advice.length} Novos</span>
              </div>
              <div className="bg-white p-2">
                {advice.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">Nenhum insight disponível no momento.</p>}
                {advice.map((tip: string, idx: number) => (
                  <div key={idx} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={activeModal === 'catalog'} onClose={() => setActiveModal('none')} title="Gerenciar Catálogo">
        <CatalogManager />
      </Modal>

      <Modal isOpen={activeModal === 'sales'} onClose={() => setActiveModal('none')} title="Terminal de Vendas">
        <POS />
      </Modal>

      <Modal isOpen={activeModal === 'history'} onClose={() => setActiveModal('none')} title="Histórico de Transações">
        <SalesHistory />
      </Modal>

      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal('none')} title="Dados e Backup">
        <ExportManager />
      </Modal>
    </div>
  );
}
