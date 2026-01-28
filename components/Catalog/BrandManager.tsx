'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, brandsCol, Brand } from '../../lib/db';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where, getDocs, limit } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconTrash } from '../Icons';

export function BrandManager() {
    const { user } = useAuth();
    const [newBrandName, setNewBrandName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const brandsQuery = user ? query(brandsCol, where('userEmail', '==', user.email)) : null;
    const [snapshot, loadingBrands] = useCollection(brandsQuery);

    const brands = snapshot ? snapshot.docs.map(doc => {
        const data = doc.data() as Brand;
        return {
            ...data,
            id: doc.id
        };
    }) : [];

    const handleAddBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        const brandName = newBrandName.trim();
        if (!user || !brandName) return;

        setIsLoading(true);
        try {
            // Check if exists in Firestore
            const checkQuery = query(
                brandsCol,
                where('userEmail', '==', user.email),
                where('name', '==', brandName),
                limit(1)
            );
            const checkSnap = await getDocs(checkQuery);

            if (!checkSnap.empty) {
                alert('Esta marca já existe.');
                return;
            }

            await db.brands.add({
                name: brandName,
                userEmail: user.email
            });
            setNewBrandName('');
        } catch (err) {
            console.error('Failed to add brand:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBrand = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta marca? Produtos associados a ela não serão excluídos, mas perderão o vínculo.')) {
            try {
                await db.brands.delete(id);
            } catch (err) {
                console.error('Failed to delete brand:', err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleAddBrand} className="flex gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="Nome da nova marca (ex: Nike)"
                        value={newBrandName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBrandName(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" isLoading={isLoading} className="whitespace-nowrap">
                    Adicionar
                </Button>
            </form>

            <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Minhas Marcas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {loadingBrands ? (
                        <p className="text-sm text-slate-400 p-4 text-center col-span-full">Carregando marcas...</p>
                    ) : (
                        <>
                            {brands.map(brand => (
                                <div key={brand.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                                    <span className="font-medium text-slate-700">{brand.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteBrand(brand.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {brands.length === 0 && (
                                <p className="text-sm text-slate-400 p-4 text-center border-2 border-dashed rounded-lg col-span-full">
                                    Nenhuma marca cadastrada.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
