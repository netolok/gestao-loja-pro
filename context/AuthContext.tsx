'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    User
} from 'firebase/auth';

interface UserAccount {
    name: string;
    email: string;
}

interface AuthContextType {
    user: UserAccount | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Safety timeout: If Firebase takes more than 3 seconds to resolve auth state,
        // we unblock the UI so the user can at least try to login manually.
        const authTimeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) console.warn("Auth check timed out - unblocking UI.");
                return false;
            });
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            clearTimeout(authTimeout);
            if (firebaseUser) {
                setUser({
                    name: firebaseUser.displayName || 'Usuário',
                    email: firebaseUser.email || ''
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        }, (err) => {
            clearTimeout(authTimeout);
            console.error("Auth state error:", err);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(authTimeout);
        };
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
            return true;
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-mail ou senha incorretos.');
            } else {
                setError('Erro ao tentar login.');
            }
            return false;
        }
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        setError(null);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with display name
            await updateProfile(credential.user, { displayName: name });

            // Explicitly set user to trigger UI update
            setUser({ name, email });

            router.push('/');
            return true;
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está cadastrado.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else {
                setError('Erro ao registrar conta.');
            }
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
