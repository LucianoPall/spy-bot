"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Settings, History as HistoryIcon, CreditCard, Shield } from "lucide-react";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Clonador de Anúncios",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/history",
    label: "Meus Clones",
    icon: HistoryIcon,
    exact: false,
  },
  {
    href: "/dashboard/settings",
    label: "Configurações",
    icon: Settings,
    exact: false,
  },
] as const;

const PRO_LINK = {
  href: "/dashboard/billing",
  label: "Assinatura PRO",
  icon: CreditCard,
};

interface DashboardNavProps {
  collapsed?: boolean;
  isAdmin?: boolean;
}

export default function DashboardNav({ collapsed = false, isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const isBillingActive = pathname.startsWith("/dashboard/billing");
  const isAdminActive = pathname.startsWith("/dashboard/admin");

  return (
    <nav className={`flex-1 mt-0 md:mt-6 space-y-0 md:space-y-2 flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-visible ${collapsed ? "md:px-2" : "md:px-4"} transition-all duration-300`}>
      {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            title={collapsed ? label : ""}
            className={`flex items-center gap-3 py-3 transition-all rounded-lg flex-shrink-0 ${
              collapsed ? "md:justify-center md:px-2" : "px-4"
            } ${
              active
                ? "bg-green-500/10 text-green-400 border-l-2 border-green-500 font-semibold"
                : "text-gray-400 hover:bg-[#151515] hover:text-gray-200"
            }`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? "md:hidden" : ""}`}>
              {label}
            </span>
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href="/dashboard/admin"
          prefetch={true}
          title={collapsed ? "Admin Panel" : ""}
          className={`flex items-center gap-3 py-3 transition-all rounded-lg flex-shrink-0 mt-0 md:mt-4 border ${
            collapsed ? "md:justify-center md:px-2 md:border-transparent" : "px-4"
          } ${
            isAdminActive
              ? "bg-red-500/15 text-red-400 border-red-500/40 font-semibold"
              : "text-red-400 hover:bg-red-500/10 border-red-500/20"
          }`}
        >
          <Shield size={20} className="flex-shrink-0" />
          <span className={`font-bold whitespace-nowrap transition-all duration-300 ${collapsed ? "md:hidden" : ""}`}>
            Admin Panel
          </span>
        </Link>
      )}

      <Link
        href={PRO_LINK.href}
        prefetch={true}
        title={collapsed ? PRO_LINK.label : ""}
        className={`flex items-center gap-3 py-3 transition-all rounded-lg flex-shrink-0 mt-0 md:mt-4 border ${
          collapsed ? "md:justify-center md:px-2 md:border-transparent" : "px-4"
        } ${
          isBillingActive
            ? "bg-green-500/15 text-green-400 border-green-500/40 font-semibold"
            : "text-green-500 hover:bg-green-500/10 border-green-500/20"
        }`}
      >
        <CreditCard size={20} className="flex-shrink-0" />
        <span className={`font-bold whitespace-nowrap transition-all duration-300 ${collapsed ? "md:hidden" : ""}`}>
          {PRO_LINK.label}
        </span>
      </Link>
    </nav>
  );
}
