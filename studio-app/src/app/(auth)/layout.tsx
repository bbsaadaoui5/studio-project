
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            {children}
        </div>
    );
}
