"use client";

import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
    collapsed?: boolean;
}

export default function LogoutButton({ collapsed = false }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            title={collapsed ? "Sair da Conta" : ""}
            className={`w-full flex items-center gap-3 py-3 text-red-400 hover:bg-red-900/10 rounded-lg transition-all ${
                collapsed ? "justify-center px-2" : "px-4"
            }`}
        >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? "hidden" : ""}`}>
                Sair da Conta
            </span>
        </button>
    );
}
