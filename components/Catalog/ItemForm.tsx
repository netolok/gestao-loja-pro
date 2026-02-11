'use client';

import React, { useState, useEffect } from 'react';
import { db, Item, brandsCol, Brand } from '../../lib/db';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where } from 'firebase/firestore';

interface ItemFormProps {
    initialData?: Item;
    onComplete?: () => void;
    onCancel?: () => void;
}

export function ItemForm({ onComplete, initialData, onCancel }: ItemFormProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('');
    const [quantity, setQuantity] = useState('0'); // Stock
    const [brandName, setBrandName] = useState(''); // Brand
    const [image, setImage] = useState<string | null>(initialData?.image || null);
    const [lowStockThreshold, setLowStockThreshold] = useState<number | undefined>(initialData?.lowStockThreshold);

    // New Fields for Perfumes
    const [type, setType] = useState<'unit' | 'perfume'>(initialData?.type || 'unit');
    const [volumeML, setVolumeML] = useState(initialData?.volumeML?.toString() || '');

    const [loading, setLoading] = useState(false);

    // Fetch brands for selection (Firestore)
    const brandsQuery = user ? query(brandsCol, where('userEmail', '==', user.email)) : null;
    const [brandsSnap, loadingBrands] = useCollection(brandsQuery);

    const brands = brandsSnap ? brandsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as Brand[] : [];

    // Pre-fill form if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price.toString());
            setCost(initialData.cost.toString());
            setQuantity(initialData.quantity ? initialData.quantity.toString() : '0');
            setBrandName(initialData.brandName || '');
            setImage(initialData.image || null);
            setLowStockThreshold(initialData.lowStockThreshold);
            setType(initialData.type || 'unit');
            setVolumeML(initialData.volumeML?.toString() || '');
        } else {
            // Reset if switching to add mode
            setName('');
            setPrice('');
            setCost('');
            setQuantity('0');
            setBrandName('');
            setImage(null);
            setLowStockThreshold(undefined);
            setType('unit');
            setVolumeML('');
        }
    }, [initialData]);

    const resizeImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Reduce quality to 0.7 to save space
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target?.result as string;
                // Compress image before setting state
                const compressed = await resizeImage(base64);
                setImage(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const parsedPrice = parseFloat(price);
        const parsedCost = parseFloat(cost);

        if (isNaN(parsedPrice) || isNaN(parsedCost)) {
            alert('Preço e custo devem ser números válidos.');
            return;
        }

        setLoading(true);
        try {
            const itemData: any = {
                name: name.trim(),
                price: parsedPrice,
                cost: parsedCost,
                quantity: parseInt(quantity) || 0,
                brandName: brandName || undefined,
                image: image || undefined,
                lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
                type,
                userEmail: user.email
            };

            if (type === 'perfume') {
                itemData.volumeML = parseFloat(volumeML) || 0;
                // Initialize residualVolume if new item or not present
                if (!initialData || initialData.residualVolume === undefined) {
                    itemData.residualVolume = 0;
                } else {
                    itemData.residualVolume = initialData.residualVolume;
                }
            }

            if (initialData && initialData.id) {
                await db.items.update(initialData.id, itemData);
            } else {
                await db.items.add(itemData);
            }

            if (!initialData) {
                setName('');
                setPrice('');
                setCost('');
                setQuantity('0');
                setBrandName('');
                setImage(null);
                setLowStockThreshold(undefined);
                setType('unit');
                setVolumeML('');
            }

            if (onComplete) onComplete();
        } catch (error: any) {
            console.error('Failed to save item:', error);
            // Provide more detail to the user if possible
            const errorMsg = error.message?.includes('too large')
                ? 'A imagem é muito grande, mesmo comprimida. Tente uma imagem menor.'
                : `Erro ao salvar item: ${error.message || 'Erro desconhecido'}`;
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card space-y-4 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                    {initialData ? 'Editar Item' : 'Novo Item'}
                </h3>
                {initialData && onCancel && (
                    <button
                        type={"button" as "button"}
                        onClick={onCancel}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                        Cancelar Edição
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {image && (
                    <div className="relative w-full h-48 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            type={"button" as "button"}
                            onClick={() => setImage(null)}
                            className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-xs w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="input-group">
                    <label className="label">Foto do Item</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100 cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Nome do Item"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        required
                        placeholder="Ex: Camiseta Preta"
                    />

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-slate-700 mb-2">Marca</label>
                        <select
                            value={brandName}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBrandName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        >
                            <option value="">Sem Marca</option>
                            {brands?.map(b => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product Type Selector */}
                <div className="flex gap-4 mb-2">
                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors ${type === 'unit' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <input
                            type="radio"
                            name="type"
                            value="unit"
                            checked={type === 'unit'}
                            onChange={() => setType('unit')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="block font-medium text-slate-700">Produto Comum</span>
                            <span className="text-xs text-slate-500">Venda por unidade</span>
                        </div>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-colors ${type === 'perfume' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <input
                            type="radio"
                            name="type"
                            value="perfume"
                            checked={type === 'perfume'}
                            onChange={() => setType('perfume')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="block font-medium text-slate-700">Perfume / Decant</span>
                            <span className="text-xs text-slate-500">Venda frasco ou mL</span>
                        </div>
                    </label>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-amber-900">Alerta de Estoque Crítico</span>
                            <span className="text-[10px] text-amber-700">Avisa no dashboard quando o item estiver acabando</span>
                        </div>
                        <button
                            type={"button" as "button"}
                            onClick={() => setLowStockThreshold(lowStockThreshold === undefined ? 3 : undefined)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${lowStockThreshold !== undefined ? 'bg-amber-500' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${lowStockThreshold !== undefined ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {lowStockThreshold !== undefined && (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <Input
                                label="Avisar quando o estoque chegar em:"
                                type="number"
                                value={lowStockThreshold.toString()}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                className="bg-white"
                            />
                        </div>
                    )}
                </div>

                {type === 'perfume' && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            🧪 Configuração do Perfume
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Volume do Frasco (mL)"
                                type="number"
                                value={volumeML}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolumeML(e.target.value)}
                                placeholder="Ex: 100"
                                required={type === 'perfume'}
                            />
                            <div className="flex flex-col justify-end pb-2">
                                <span className="text-xs text-slate-500 font-medium uppercase mb-1">Custo por mL (Estimado)</span>
                                <div className="text-lg font-mono font-bold text-slate-700">
                                    {volumeML && cost ? `$ ${(parseFloat(cost) / parseFloat(volumeML)).toFixed(2)} / mL` : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={type === 'perfume' ? "Frascos em Estoque" : "Quantidade em Estoque"}
                        type="number"
                        value={quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
                        required
                        placeholder="0"
                    />
                    <Input
                        label="Preço de Custo Total ($)"
                        type="number"
                        step="0.01"
                        value={cost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCost(e.target.value)}
                        required
                        placeholder="0.00"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Preço de Venda ($)"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                        required
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="pt-4">
                <Button type="submit" isLoading={loading} className="w-full">
                    {initialData ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
                </Button>
            </div>
        </form>
    );
}
