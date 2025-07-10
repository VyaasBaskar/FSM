"use client";

import { useState, useMemo } from "react";
import styles from "../page.module.css";
import { TeamDataType } from "../lib/event";

export default function EventTeamsTable({ teams }: { teams: TeamDataType[] }) {
  const [sortField, setSortField] = useState<"rank" | "fsm">("rank");
  const [isAscending, setIsAscending] = useState(true);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const aValue = sortField === "rank" ? a.rank : parseFloat(a.fsm);
      const bValue = sortField === "rank" ? b.rank : parseFloat(b.fsm);
      return isAscending ? aValue - bValue : bValue - aValue;
    });
  }, [teams, sortField, isAscending]);

  const handleSort = (field: "rank" | "fsm") => {
    if (sortField === field) {
      setIsAscending(!isAscending);
    } else {
      setSortField(field);
      setIsAscending(field === "rank");
    }
  };

  const getSortIcon = (field: "rank" | "fsm") => {
    if (sortField !== field) {
      return " ↕";
    }
    return isAscending ? " ↑" : " ↓";
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>
            Team
          </th>
          <th 
            className={`${styles.th} ${styles.sortableHeader}`}
            onClick={() => handleSort("rank")}
            style={{ cursor: "pointer" }}
          >
            Rank{getSortIcon("rank")}
          </th>
          <th 
            className={`${styles.th} ${styles.sortableHeader}`}
            onClick={() => handleSort("fsm")}
            style={{ cursor: "pointer" }}
          >
            FSM{getSortIcon("fsm")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedTeams.map((team) => (
          <tr key={team.key}>
            <td className={styles.td}>{team.key}</td>
            <td className={styles.td}>{team.rank}</td>
            <td className={styles.td}>{team.fsm}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
