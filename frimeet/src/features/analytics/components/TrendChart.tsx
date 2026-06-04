"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrendPoint } from "../types";

interface TrendChartProps {
  data: TrendPoint[];
}

export const TrendChart = ({ data }: TrendChartProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="trend-chart-skeleton" />;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradEventos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B1A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAsistentes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF2D87" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF2D87" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="mes"
          tick={{ fill: "var(--color-dark-gray)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-dark-gray)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-card)",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="eventos"
          name="Eventos"
          stroke="#FF6B1A"
          strokeWidth={2.5}
          fill="url(#gradEventos)"
        />
        <Area
          type="monotone"
          dataKey="asistentes"
          name="Asistentes"
          stroke="#FF2D87"
          strokeWidth={2.5}
          fill="url(#gradAsistentes)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
