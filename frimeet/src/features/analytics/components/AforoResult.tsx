"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { AforoResponse } from "../types";

interface AforoResultProps {
  data: AforoResponse;
}

export const AforoResult = ({ data }: AforoResultProps) => {
  const isLleno = data.prediccion === "Lleno";

  return (
    <div className="aforo-result">
      {/* Indicador principal */}
      <div className="aforo-result__indicator">
        <div
          className="aforo-result__circle"
          style={{
            background: isLleno
              ? "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
              : "linear-gradient(135deg, #22c55e 0%, #B8F02D 100%)",
          }}
        >
          <span className="aforo-result__circle-text">
            {isLleno ? <XCircle size={32} color="white" /> : <CheckCircle2 size={32} color="white" />}
          </span>
        </div>
        <h3 className="aforo-result__verdict" style={{ color: isLleno ? "#ef4444" : "#22c55e" }}>
          {data.prediccion}
        </h3>
      </div>

      {/* Barra de confianza */}
      <div className="aforo-result__confidence">
        <div className="aforo-result__confidence-header">
          <span>Nivel de confianza</span>
          <span className="aforo-result__confidence-value">{(data.confianza * 100).toFixed(1)}%</span>
        </div>
        <div className="aforo-result__confidence-bar">
          <div
            className="aforo-result__confidence-fill"
            style={{
              width: `${data.confianza * 100}%`,
              background: isLleno
                ? "linear-gradient(90deg, #ef4444, #f97316)"
                : "linear-gradient(90deg, #22c55e, #B8F02D)",
            }}
          />
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="aforo-result__legend">
        <div className="aforo-result__legend-item">
          <span className="aforo-result__dot" style={{ background: "#22c55e" }} />
          <div>
            <strong>Suficiente espacio</strong>
            <p>Hay espacio para tú y tus amigos</p>
          </div>
        </div>
        <div className="aforo-result__legend-item">
          <span className="aforo-result__dot" style={{ background: "#f59e0b" }} />
          <div>
            <strong>Poco espacio</strong>
            <p>Falta poco para que se llene</p>
          </div>
        </div>
        <div className="aforo-result__legend-item">
          <span className="aforo-result__dot" style={{ background: "#ef4444" }} />
          <div>
            <strong>Sin espacio</strong>
            <p>El lugar está completamente lleno</p>
          </div>
        </div>
      </div>

      {/* Recomendación */}
      <div className="aforo-result__recomendacion">
        <p>{data.recomendacion}</p>
      </div>
    </div>
  );
};
