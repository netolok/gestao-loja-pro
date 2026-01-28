import { BottomNav } from "@/components/BottomNav";

export default function LayoutWithNav({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen pb-24 relative">
            <main className="container mx-auto p-4">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
