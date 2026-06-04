"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/simulador-aforo": "Simulador de Aforo",
  "/calculadora-gasto": "Calculadora de Gasto",
};

export const Header = () => {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Frimeet";

  return (
    <header className="dash-header">
      <div className="dash-header__left">
        <h1 className="dash-header__title">{title}</h1>
      </div>
      <div className="dash-header__right">
        <button className="dash-header__icon-btn" aria-label="Notificaciones">
          <Bell size={20} />
        </button>
        <div className="dash-header__avatar">
          <span>U</span>
        </div>
      </div>
    </header>
  );
};
