'use client';

import React, { useState } from 'react';
import { db, Item, CartItem, itemsCol, brandsCol, transactionsCol } from '../../lib/db';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { query, where, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db as firestore } from '../../lib/firebase';

export function POS() {
    const { user } = useAuth();
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    // Filter items by user (Firestore)
    const itemsQuery = user ? query(itemsCol, where('userEmail', '==', user.email)) : null;
    const [itemsSnap, loadingItems] = useCollection(itemsQuery);

    const itemsRaw = itemsSnap ? itemsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as Item[] : [];

    // Fetch brands for filtering (Firestore)
    const brandsQuery = user ? query(brandsCol, where('userEmail', '==', user.email)) : null;
    const [brandsSnap, loadingBrands] = useCollection(brandsQuery);

    const brands = brandsSnap ? brandsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as any[] : [];

    const items = itemsRaw ? (selectedBrand ? itemsRaw.filter(i => i.brandName === selectedBrand) : itemsRaw) : [];

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [discount, setDiscount] = useState('');
    const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
    const [shippingCost, setShippingCost] = useState(''); // New state for shipping

    const addToCart = (item: Item) => {
        const stock = item.quantity || 0;
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            const currentQtyInCart = existing ? existing.quantity : 0;

            // Check stock limit
            if (currentQtyInCart + 1 > stock) {
                alert(`Estoque insuficiente! Apenas ${stock} unidades disponíveis.`);
                return prev;
            }

            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.id !== itemId);
        });
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Calculate Discount Value
    let discountValue = 0;
    const rawDiscount = parseFloat(discount) || 0;

    if (discountType === 'fixed') {
        discountValue = Math.min(rawDiscount, subtotal);
    } else {
        // Percentage logic
        const percent = Math.min(rawDiscount, 100); // Max 100%
        discountValue = subtotal * (percent / 100);
    }

    const total = subtotal - discountValue;
    const rawShipping = parseFloat(shippingCost) || 0;

    const handleCheckout = async () => {
        if (cart.length === 0 || !user) return;
        setIsCheckingOut(true);

        try {
            const grossProfit = cart.reduce((acc, item) => acc + ((item.price - item.cost) * item.quantity), 0);
            const netProfit = grossProfit - discountValue - rawShipping;

            await runTransaction(firestore, async (transaction) => {
                // 1. Update Stocks (Leituras devem vir antes das Escritas)
                for (const cartItem of cart) {
                    if (cartItem.id) {
                        const itemRef = doc(itemsCol, cartItem.id);
                        const itemDoc = await transaction.get(itemRef);
                        if (itemDoc.exists()) {
                            const currentStock = itemDoc.data().quantity || 0;
                            const newStock = Math.max(0, currentStock - cartItem.quantity);
                            transaction.update(itemRef, { quantity: newStock });
                        }
                    }
                }

                // 2. Create Transaction Record (Escrita final)
                const newTxRef = doc(transactionsCol);
                transaction.set(newTxRef, {
                    date: serverTimestamp(),
                    total,
                    profit: netProfit,
                    discount: discountValue,
                    shipping: rawShipping,
                    items: cart,
                    userEmail: user.email
                });
            });

            setCart([]);
            setDiscount('');
            setDiscountType('fixed');
            setShippingCost('');
            alert('Venda registrada com sucesso!');
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Erro ao registrar venda.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (loadingItems || loadingBrands) return <div>Carregando catálogo...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[60vh] relative">
            {/* Mobile View Cart Button */}
            {totalItems > 0 && (
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => {
                            const cartEl = document.getElementById('cart-section');
                            cartEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-bounce hover:animate-none active:scale-95 transition-all"
                    >
                        <span>🛒 Ver Carrinho</span>
                        <span className="bg-white/20 px-2 rounded-lg text-xs">{totalItems}</span>
                    </button>
                </div>
            )}

            {/* Item Grid */}
            <div className="flex-1 overflow-y-auto pb-20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Catálogo de {user?.name}</h2>
                </div>

                {/* Brand Filters */}
                {brands && brands.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setSelectedBrand(null)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${!selectedBrand ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            Tudo
                        </button>
                        {brands.map(brand => (
                            <button
                                key={brand.id}
                                onClick={() => setSelectedBrand(brand.name)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedBrand === brand.name ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                            >
                                {brand.name}
                            </button>
                        ))}
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-lg">
                        <p>Nenhum item encontrado{selectedBrand ? ` para a marca \"${selectedBrand}\"` : ''}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {items.map(item => {
                            const stock = item.quantity || 0;
                            const inCart = cart.find(c => c.id === item.id)?.quantity || 0;
                            const available = stock - inCart;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    disabled={available <= 0}
                                    className={`
                                        card p-3 flex flex-col items-center gap-2 transition-all text-left group relative
                                        ${available <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-indigo-500'}
                                    `}
                                >
                                    <div className="w-full aspect-square bg-slate-50 rounded-md overflow-hidden border border-slate-200 group-hover:border-indigo-200 transition-colors relative">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl bg-slate-100">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {/* Stock Badge Overlay */}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold py-1 text-center backdrop-blur-sm">
                                            {stock} em Estoque
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <div className="font-bold truncate text-slate-700">{item.name}</div>
                                        {item.brandName && (
                                            <div className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter mb-1">
                                                {item.brandName}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="text-indigo-600 font-bold">$ {item.price.toFixed(2)}</div>
                                            {available <= 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Esgotado</span>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Actions */}
            <div id="cart-section" className="lg:w-96 flex flex-col bg-white p-4 rounded-xl border border-slate-200 h-fit lg:h-full shadow-sm scroll-mt-6">
                <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center justify-between">
                    <span>Carrinho ({totalItems})</span>
                    {totalItems > 0 && (
                        <button
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="lg:hidden text-xs text-indigo-600 font-bold"
                        >
                            ↑ Voltar para itens
                        </button>
                    )}
                </h2>
                <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-60 lg:max-h-full scrollbar-thin scrollbar-thumb-slate-200">
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                            <span className="text-2xl mb-2">🛒</span>
                            <p>Carrinho vazio</p>
                        </div>
                    )}
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-700 truncate max-w-[120px]">{item.name}</span>
                                <span className="text-xs text-slate-500">$ {item.price.toFixed(2)} x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-700">$ {(item.price * item.quantity).toFixed(2)}</span>
                                <button
                                    onClick={() => removeFromCart(item.id!)}
                                    className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    -
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Desconto</label>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                                    <button
                                        onClick={() => setDiscountType('fixed')}
                                        className={`flex-1 py-0.5 text-[10px] font-bold rounded ${discountType === 'fixed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        $
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('percent')}
                                        className={`flex-1 py-0.5 text-[10px] font-bold rounded ${discountType === 'percent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        %
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
                                    placeholder="0"
                                    className="h-9 text-right font-mono text-sm bg-slate-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Frete (Custo)</label>
                            <div className="flex flex-col gap-1.5">
                                <div className="h-[22px] flex items-center px-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-400 font-bold">
                                    DESPESA
                                </div>
                                <Input
                                    type="number"
                                    value={shippingCost}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingCost(e.target.value)}
                                    placeholder="0.00"
                                    className="h-9 text-right font-mono text-sm bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>$ {subtotal.toFixed(2)}</span>
                        </div>
                        {discountValue > 0 && (
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Desconto</span>
                                <span>- $ {discountValue.toFixed(2)}</span>
                            </div>
                        )}
                        {rawShipping > 0 && (
                            <div className="flex justify-between text-xs text-slate-400 italic">
                                <span>Depesa Frete (abate do lucro)</span>
                                <span>- $ {rawShipping.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-2xl font-black text-slate-800 pt-2 border-t border-slate-100">
                            <span>Total</span>
                            <span className="text-indigo-600">$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        isLoading={isCheckingOut}
                        className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all"
                    >
                        Finalizar Venda
                    </Button>
                </div>
            </div>
        </div>
    );
}
