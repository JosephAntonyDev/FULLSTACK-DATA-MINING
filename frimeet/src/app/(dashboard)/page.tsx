"use client";

import { CalendarRange, Users, Shield, Gauge } from "lucide-react";
import { KpiCard } from "@/features/analytics/components/KpiCard";
import { TrendChart } from "@/features/analytics/components/TrendChart";
import { TopClubsTable } from "@/features/analytics/components/TopClubsTable";
import { useEventosResumen, useClubsRanking, useTendencias } from "@/features/analytics/hooks/useOlap";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function DashboardPage() {
  const { data: kpi } = useEventosResumen();
  const { data: clubs } = useClubsRanking();
  const { data: trends } = useTendencias();

  return (
    <>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          icon={<CalendarRange size={22} />}
          label="Eventos Activos"
          value={kpi ? formatNumber(kpi.totalEventos) : "—"}
          trend={kpi?.eventosTrend ?? 0}
          accentColor="#FF6B1A"
        />
        <KpiCard
          icon={<Users size={22} />}
          label="Asistentes Totales"
          value={kpi ? formatNumber(kpi.totalAsistentes) : "—"}
          trend={kpi?.asistentesTrend ?? 0}
          accentColor="#FF2D87"
        />
        <KpiCard
          icon={<Shield size={22} />}
          label="Clubs Verificados"
          value={kpi ? formatNumber(kpi.clubsVerificados) : "—"}
          trend={kpi?.clubsTrend ?? 0}
          accentColor="#B8F02D"
        />
        <KpiCard
          icon={<Gauge size={22} />}
          label="Tasa Ocupación"
          value={kpi ? `${kpi.tasaOcupacion}%` : "—"}
          trend={kpi?.ocupacionTrend ?? 0}
          accentColor="#6E6E6E"
        />
      </div>

      {/* Gráfica de tendencias */}
      <section className="dash-section">
        <h2 className="dash-section__title">Tendencia anual</h2>
        {trends && <TrendChart data={trends} />}
      </section>

      {/* Top Clubs */}
      <section className="dash-section">
        <h2 className="dash-section__title">Top Clubs</h2>
        {clubs && <TopClubsTable clubs={clubs} />}
      </section>
    </>
  );
}
