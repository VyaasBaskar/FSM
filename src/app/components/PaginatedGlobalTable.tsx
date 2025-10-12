"use client";

import { useState, useMemo } from "react";
import TeamLink from "./TeamLink";

const stateAbbreviations: { [key: string]: string } = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

function normalizeStateProv(stateProv: string): string {
  if (!stateProv) return "";
  const trimmed = stateProv.trim();
  return stateAbbreviations[trimmed] || trimmed;
}

interface GlobalStat {
  teamKey: string;
  bestFSM: string;
  country: string;
  state_prov: string;
}

interface PaginatedGlobalTableProps {
  stats: GlobalStat[];
  year: string;
}

type SortField = "rank" | "teamKey" | "bestFSM";

export default function PaginatedGlobalTable({
  stats,
  year,
}: PaginatedGlobalTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const countries = useMemo(() => {
    const uniqueCountries = new Set(
      stats.map((s) => s.country).filter((c) => c)
    );
    return ["all", ...Array.from(uniqueCountries).sort()];
  }, [stats]);

  const states = useMemo(() => {
    const uniqueStates = new Set(
      stats
        .filter((s) => s.country === "USA" && s.state_prov)
        .map((s) => normalizeStateProv(s.state_prov))
    );
    return ["all", ...Array.from(uniqueStates).sort()];
  }, [stats]);

  const filteredStats = useMemo(() => {
    let filtered = [...stats];

    if (countryFilter !== "all") {
      filtered = filtered.filter((s) => s.country === countryFilter);
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter(
        (s) =>
          s.country === "USA" &&
          normalizeStateProv(s.state_prov) === stateFilter
      );
    }

    return filtered;
  }, [stats, countryFilter, stateFilter]);

  const sortedStats = useMemo(() => {
    const sorted = [...filteredStats];

    if (sortField === "rank") {
      return sorted;
    }

    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "teamKey":
          aValue = a.teamKey.replace("frc", "");
          bValue = b.teamKey.replace("frc", "");
          aValue = parseInt(aValue) || 0;
          bValue = parseInt(bValue) || 0;
          break;
        case "bestFSM":
          aValue = parseFloat(a.bestFSM);
          bValue = parseFloat(b.bestFSM);
          break;
        default:
          return 0;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    return sorted;
  }, [filteredStats, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedStats.length / pageSize);

  const paginatedStats = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedStats.slice(startIndex, endIndex);
  }, [sortedStats, currentPage, pageSize]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rank" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const handleCountryChange = (country: string) => {
    setCountryFilter(country);
    if (country !== "USA") {
      setStateFilter("all");
    }
    setCurrentPage(1);
  };

  const handleStateChange = (state: string) => {
    setStateFilter(state);
    if (state !== "all") {
      setCountryFilter("USA");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const startRank =
    sortField === "rank" ? (currentPage - 1) * pageSize + 1 : null;

  const getSortFieldLabel = () => {
    switch (sortField) {
      case "rank":
        return "FSM Rank";
      case "teamKey":
        return "Team Number";
      case "bestFSM":
        return "FSM Score";
      default:
        return sortField;
    }
  };

  const hasActiveFilters = countryFilter !== "all" || stateFilter !== "all";

  return (
    <div>
      <div
        style={{
          background: "var(--background-pred)",
          border: "2px solid var(--border-color)",
          borderRadius: 8,
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label
            style={{
              fontWeight: "600",
              color: "var(--foreground)",
              fontSize: "0.9rem",
            }}
          >
            Country:
          </label>
          <select
            value={countryFilter}
            onChange={(e) => handleCountryChange(e.target.value)}
            style={{
              padding: "0.5rem 2rem 0.5rem 0.75rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background: "var(--background-pred)",
              color: "var(--foreground)",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">All Countries</option>
            {countries.slice(1).map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label
            style={{
              fontWeight: "600",
              color: "var(--foreground)",
              fontSize: "0.9rem",
            }}
          >
            State:
          </label>
          <select
            value={stateFilter}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={countryFilter !== "all" && countryFilter !== "USA"}
            style={{
              padding: "0.5rem 2rem 0.5rem 0.75rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background: "var(--background-pred)",
              color: "var(--foreground)",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor:
                countryFilter !== "all" && countryFilter !== "USA"
                  ? "not-allowed"
                  : "pointer",
              opacity:
                countryFilter !== "all" && countryFilter !== "USA" ? 0.5 : 1,
              outline: "none",
            }}
          >
            <option value="all">All States (USA)</option>
            {states.slice(1).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setCountryFilter("all");
              setStateFilter("all");
              setCurrentPage(1);
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background: "var(--background-pred)",
              color: "var(--foreground)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Clear Filters
          </button>
        )}

        {hasActiveFilters && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--gray-less)",
              fontWeight: "600",
            }}
          >
            Showing {sortedStats.length} of {stats.length} teams
          </div>
        )}
      </div>

      {sortField !== "rank" && (
        <div
          style={{
            background: "var(--background-pred)",
            border: "2px solid var(--border-color)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            textAlign: "center",
            fontSize: "0.9rem",
            fontWeight: "600",
            color: "var(--foreground)",
          }}
        >
          Sorted by{" "}
          <span style={{ color: "var(--yellow-color)" }}>
            {getSortFieldLabel()}
          </span>{" "}
          ({sortDirection === "asc" ? "Ascending" : "Descending"})
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "0 0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: "600", color: "var(--foreground)" }}>
            Teams per page:
          </span>
          {[20, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                border:
                  pageSize === size
                    ? "2px solid var(--yellow-color)"
                    : "2px solid var(--border-color)",
                background:
                  pageSize === size
                    ? "var(--yellow-color)"
                    : "var(--background-pred)",
                color: pageSize === size ? "#000" : "var(--foreground)",
                cursor: "pointer",
                fontWeight: pageSize === size ? "bold" : "normal",
                transition: "all 0.2s",
                boxShadow:
                  pageSize === size
                    ? "0 4px 12px rgba(253, 224, 71, 0.3)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background:
                currentPage === 1
                  ? "var(--gray-more)"
                  : "var(--background-pred)",
              color: "var(--foreground)",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            ← Previous
          </button>
          <span
            style={{
              fontWeight: "600",
              color: "var(--foreground)",
              padding: "0 0.5rem",
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background:
                currentPage === totalPages
                  ? "var(--gray-more)"
                  : "var(--background-pred)",
              color: "var(--foreground)",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            Next →
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr>
              <th
                onClick={() => handleSort("rank")}
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                  userSelect: "none",
                }}
              >
                FSM Rank{getSortIcon("rank")}
              </th>
              <th
                onClick={() => handleSort("teamKey")}
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                  userSelect: "none",
                }}
              >
                Team{getSortIcon("teamKey")}
              </th>
              <th
                onClick={() => handleSort("bestFSM")}
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                  userSelect: "none",
                }}
              >
                FSM{getSortIcon("bestFSM")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                }}
              >
                Country
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                }}
              >
                State/Prov
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStats.map((stat, index) => {
              const originalIndex = stats.findIndex(
                (s) => s.teamKey === stat.teamKey
              );
              const rank =
                startRank !== null ? startRank + index : originalIndex + 1;

              return (
                <tr
                  key={stat.teamKey}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--hover-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "12px 8px" }}>{rank}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>
                    <TeamLink teamKey={stat.teamKey} year={year} />
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontWeight: "bold",
                      color: "var(--yellow-color)",
                    }}
                  >
                    {stat.bestFSM}
                  </td>
                  <td style={{ padding: "12px 8px" }}>{stat.country || "-"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    {stat.country === "USA"
                      ? normalizeStateProv(stat.state_prov) || "-"
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "1.5rem",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "2px solid var(--border-color)",
            background:
              currentPage === 1 ? "var(--gray-more)" : "var(--background-pred)",
            color: "var(--foreground)",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1,
            fontWeight: "600",
            transition: "all 0.2s",
          }}
        >
          ← Previous
        </button>
        <span
          style={{
            fontWeight: "600",
            color: "var(--foreground)",
            padding: "0 0.5rem",
          }}
        >
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "2px solid var(--border-color)",
            background:
              currentPage === totalPages
                ? "var(--gray-more)"
                : "var(--background-pred)",
            color: "var(--foreground)",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1,
            fontWeight: "600",
            transition: "all 0.2s",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
