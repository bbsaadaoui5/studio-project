"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function AppDownload() {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = '/Almawed.png';
        link.download = 'Almawed.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
            <Image 
                src="/Almawed.png" 
                alt="Almawed App Icon" 
                width={48} 
                height={48}
                className="rounded-lg"
            />
            <div className="flex-1">
                <h3 className="font-semibold">Almawed App</h3>
                <p className="text-sm text-muted-foreground">Download the app icon</p>
            </div>
            <Button onClick={handleDownload} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
            </Button>
        </div>
    );
}