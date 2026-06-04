"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { GastoResponse } from "../types";

interface GastoResultProps {
  data: GastoResponse;
}

const COLORS = ["#FF6B1A", "#FF2D87", "#B8F02D", "#6E6E6E"];

function formatMXN(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

export const GastoResult = ({ data }: GastoResultProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pieData = [
    { name: "Lugar", value: data.desglose.lugar },
    { name: "Comida", value: data.desglose.comida },
    { name: "Bebida", value: data.desglose.bebida },
    { name: "Otros", value: data.desglose.otros },
  ].filter((d) => d.value > 0);

  const total = data.desglose.lugar + data.desglose.comida + data.desglose.bebida + data.desglose.otros;

  return (
    <div className="gasto-result">
      {/* Rango principal */}
      <div className="gasto-result__range">
        <p className="gasto-result__range-label">Inversión estimada (Total del Evento)</p>
        <div className="gasto-result__range-values">
          <span className="gasto-result__min">{formatMXN(data.gasto_min)}</span>
          <span className="gasto-result__separator">—</span>
          <span className="gasto-result__max">{formatMXN(data.gasto_max)}</span>
        </div>
        {/* Barra de rango visual */}
        <div className="gasto-result__bar-track">
          <div className="gasto-result__bar-fill" />
        </div>
        <p className="gasto-result__currency">
          MXN (Pesos mexicanos)<br/>
          <span style={{ fontSize: '0.85em', color: 'var(--color-text-light)', marginTop: '4px', display: 'inline-block' }}>
            Gasto promedio por persona: <strong>{formatMXN(data.gasto_promedio_persona)}</strong>
          </span>
        </p>
      </div>

      {/* Gráfica de dona */}
      <div className="gasto-result__chart">
        <p className="gasto-result__chart-title">Distribución del gasto</p>
        {mounted && (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatMXN(Number(value || 0))}
                contentStyle={{
                  background: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Desglose */}
      <div className="gasto-result__breakdown">
        {pieData.map((item, i) => (
          <div key={item.name} className="gasto-result__breakdown-item">
            <div className="gasto-result__breakdown-dot" style={{ background: COLORS[i] }} />
            <span className="gasto-result__breakdown-name">{item.name}</span>
            <span className="gasto-result__breakdown-value">{formatMXN(item.value)}</span>
            <span className="gasto-result__breakdown-pct">{((item.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
