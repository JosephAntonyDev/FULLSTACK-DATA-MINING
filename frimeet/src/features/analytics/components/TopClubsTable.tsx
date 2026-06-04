"use client";

import type { ClubRanking } from "../types";
import { Trophy, Medal, Award, Star } from "lucide-react";

const POSITION_STYLES: Record<number, { icon: React.ReactNode; color: string }> = {
  1: { icon: <Trophy size={16} />, color: "#FFD700" },
  2: { icon: <Medal size={16} />, color: "#C0C0C0" },
  3: { icon: <Award size={16} />, color: "#CD7F32" },
};

function formatMembers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

interface TopClubsTableProps {
  clubs: ClubRanking[];
}

export const TopClubsTable = ({ clubs }: TopClubsTableProps) => {
  return (
    <div className="clubs-table-wrapper">
      <table className="clubs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Club</th>
            <th>Miembros</th>
            <th>Eventos</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => {
            const posStyle = POSITION_STYLES[club.posicion];
            return (
              <tr key={club.posicion}>
                <td>
                  <div className="clubs-table__pos" style={posStyle ? { color: posStyle.color } : undefined}>
                    {posStyle ? posStyle.icon : <span>{club.posicion}</span>}
                  </div>
                </td>
                <td>
                  <div className="clubs-table__name">
                    <div className="clubs-table__avatar" style={{ background: `hsl(${club.posicion * 60}, 70%, 85%)` }}>
                      {club.nombre.charAt(0)}
                    </div>
                    <span>{club.nombre}</span>
                  </div>
                </td>
                <td>{formatMembers(club.miembros)}</td>
                <td>{club.eventos}</td>
                <td>
                  <span className="clubs-table__rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="#FFD700" color="#FFD700" /> {club.rating}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
