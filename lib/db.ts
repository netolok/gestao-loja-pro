import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db as firestore } from "./firebase";

export interface Item {
    id?: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
    image?: string;
    userEmail?: string;
    brandName?: string;
    lowStockThreshold?: number;
    type?: 'unit' | 'perfume'; // New: Product Type
    volumeML?: number; // New: Total volume per unit (e.g., 100ml)
    residualVolume?: number; // New: Volume remaining in open bottles
}

export interface Brand {
    id?: string;
    name: string;
    userEmail: string;
}

export interface CartItem extends Item {
    quantity: number;
    isDecant?: boolean; // New: Is this a decant sale?
    volumeSold?: number; // New: Amount of mL sold in this line item
    originalPrice?: number; // To track overrides
}

export interface Transaction {
    id?: string;
    date: any;
    total: number;
    profit: number;
    discount?: number;
    shipping?: number;
    items: CartItem[];
    userEmail?: string;
}

export interface UserAccount {
    email: string;
    name: string;
    password?: string;
}

// Firestore collection references
export const itemsCol = collection(firestore, "items");
export const transactionsCol = collection(firestore, "transactions");
export const brandsCol = collection(firestore, "brands");

// Database helper object to maintain some compatibility
export const db = {
    items: {
        add: (data: Item) => addDoc(itemsCol, { ...data, createdAt: serverTimestamp() }),
        update: (id: string, data: Partial<Item>) => updateDoc(doc(firestore, "items", id), data),
        delete: (id: string) => deleteDoc(doc(firestore, "items", id)),
    },
    transactions: {
        add: (data: Transaction) => addDoc(transactionsCol, {
            ...data,
            date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date
        }),
        delete: (id: string) => deleteDoc(doc(firestore, "transactions", id)),
    },
    brands: {
        add: (data: Brand) => addDoc(brandsCol, { ...data, createdAt: serverTimestamp() }),
        delete: (id: string) => deleteDoc(doc(firestore, "brands", id)),
    }
};
