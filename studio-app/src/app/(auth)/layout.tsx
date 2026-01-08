
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="fixed inset-0 w-full h-screen overflow-x-hidden overflow-y-auto flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            {children}
        </div>
    );
}
