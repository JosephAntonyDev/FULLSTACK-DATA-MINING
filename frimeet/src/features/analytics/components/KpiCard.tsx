"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  accentColor: string;
}

export const KpiCard = ({ icon, label, value, trend, accentColor }: KpiCardProps) => {
  const isPositive = trend >= 0;

  return (
    <div className="kpi-card">
      <div className="kpi-card__icon" style={{ background: accentColor }}>
        {icon}
      </div>
      <div className="kpi-card__body">
        <span className="kpi-card__value">{value}</span>
        <span className="kpi-card__label">{label}</span>
      </div>
      <div className={`kpi-card__trend ${isPositive ? "kpi-card__trend--up" : "kpi-card__trend--down"}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(trend)}%</span>
      </div>
    </div>
  );
};
