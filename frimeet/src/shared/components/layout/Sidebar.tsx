"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Calculator,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulador-aforo", label: "Simulador de Aforo", icon: Target },
  { href: "/calculadora-gasto", label: "Calculadora de Gasto", icon: Calculator },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón hamburger — solo móvil */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* Overlay oscuro — solo móvil cuando está abierto */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <Image
            src="/icons/icon_frimeet.svg"
            alt="Frimeet"
            width={40}
            height={40}
            className="sidebar__logo-img"
          />
          <span className="sidebar__brand">Frimeet</span>
          <button
            className="sidebar__close"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <Link href="/login" className="sidebar__link sidebar__link--logout">
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
