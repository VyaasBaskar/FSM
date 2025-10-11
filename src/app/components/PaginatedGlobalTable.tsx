"use client";

import { useState, useMemo } from "react";
import TeamLink from "./TeamLink";

interface GlobalStat {
  teamKey: string;
  bestFSM: string;
}

interface PaginatedGlobalTableProps {
  stats: GlobalStat[];
  year: string;
}

export default function PaginatedGlobalTable({
  stats,
  year,
}: PaginatedGlobalTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const totalPages = Math.ceil(stats.length / pageSize);

  const paginatedStats = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return stats.slice(startIndex, endIndex);
  }, [stats, currentPage, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startRank = (currentPage - 1) * pageSize + 1;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span>Teams per page:</span>
          {[20, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                background: pageSize === size ? "#0070f3" : "transparent",
                color: pageSize === size ? "#fff" : "inherit",
                cursor: "pointer",
                fontWeight: pageSize === size ? "bold" : "normal",
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: currentPage === 1 ? "#333" : "#0070f3",
              color: "#fff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: currentPage === totalPages ? "#333" : "#0070f3",
              color: "#fff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #ccc",
                padding: "8px",
              }}
            >
              FSM Rank
            </th>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #ccc",
                padding: "8px",
              }}
            >
              Team Key
            </th>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #ccc",
                padding: "8px",
              }}
            >
              FSM
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedStats.map((stat, index) => (
            <tr key={stat.teamKey}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {startRank + index}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <TeamLink teamKey={stat.teamKey} year={year} />
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {stat.bestFSM}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "1rem",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: currentPage === 1 ? "#333" : "#0070f3",
            color: "#fff",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: currentPage === totalPages ? "#333" : "#0070f3",
            color: "#fff",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
