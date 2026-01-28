'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { user, loading: authLoading, login, register, error } = useAuth();
    const router = useRouter();
    const [isLoginMode, setIsLoginMode] = useState(true);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isLoginMode) {
            await login(email, password);
        } else {
            if (!name) {
                alert('Por favor, informe seu nome.');
                setIsLoading(false);
                return;
            }
            await register(name, email, password);
        }
        setIsLoading(false);
    };

    // If we have a user, show a redirecting screen (prevents flashing form while useEffect kicks in)
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-500 font-medium">Redirecionando para sua loja...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 transition-all">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isLoginMode ? 'Bem-vindo de volta!' : 'Criar sua conta'}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {isLoginMode ? 'Acesse sua loja para gerenciar vendas.' : 'Comece a organizar seu negócio hoje.'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setIsLoginMode(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLoginMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setIsLoginMode(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLoginMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLoginMode && (
                        <Input
                            label="Nome Completo"
                            type="text"
                            placeholder="Ex: João da Silva"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            required
                        />
                    )}

                    <Input
                        label="E-mail"
                        type="email"
                        placeholder="exemplo@loja.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" isLoading={isLoading} className="w-full py-3 text-lg shadow-lg shadow-indigo-200 mt-6">
                        {isLoginMode ? 'Entrar na Loja' : 'Criar Conta Grátis'}
                    </Button>
                </form>

                <p className="text-[10px] text-center text-slate-400 mt-8 uppercase font-bold tracking-widest">
                    Cloud Edition v2.1 • Sincronização em tempo real
                </p>
            </div>
        </div>
    );
}
