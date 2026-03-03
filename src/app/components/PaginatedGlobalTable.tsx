"use client";

import { useState, useMemo, useCallback } from "react";
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

function getPercentileColor(percentile: number): string {
  if (percentile >= 99) return "#10b981";
  if (percentile >= 90) return "#22c55e";
  if (percentile >= 75) return "#84cc16";
  if (percentile >= 50) return "#eab308";
  if (percentile >= 25) return "#f97316";
  return "#ef4444";
}

function getPercentileLabel(percentile: number): string {
  if (percentile >= 99) return "Elite";
  if (percentile >= 90) return "Top 10%";
  if (percentile >= 75) return "Top 25%";
  if (percentile >= 50) return "Above Avg";
  if (percentile >= 25) return "Below Avg";
  return "Bottom 25%";
}

function DistributionChart({ stats }: { stats: GlobalStat[] }) {
  const { buckets, maxCount, bucketLabels } = useMemo(() => {
    const fsmValues = stats.map((s) => parseFloat(s.bestFSM)).filter(Number.isFinite);
    if (fsmValues.length === 0) return { buckets: [], maxCount: 0, bucketLabels: [] };

    const min = Math.floor(Math.min(...fsmValues));
    const max = Math.ceil(Math.max(...fsmValues));
    const range = max - min;
    const numBuckets = Math.min(20, Math.max(8, Math.ceil(range / 5)));
    const bucketSize = range / numBuckets;

    const bkts = new Array(numBuckets).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const lo = min + i * bucketSize;
      const hi = lo + bucketSize;
      labels.push(`${lo.toFixed(0)}-${hi.toFixed(0)}`);
    }

    for (const v of fsmValues) {
      const idx = Math.min(Math.floor((v - min) / bucketSize), numBuckets - 1);
      bkts[idx]++;
    }

    return { buckets: bkts, maxCount: Math.max(...bkts), bucketLabels: labels };
  }, [stats]);

  if (buckets.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--background-pred)",
        border: "2px solid var(--border-color)",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <h3
        style={{
          color: "var(--yellow-color)",
          fontSize: "1rem",
          fontWeight: "700",
          marginBottom: "1rem",
          textAlign: "center",
          letterSpacing: "0.03em",
        }}
      >
        FSM Score Distribution
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          height: "120px",
          padding: "0 0.25rem",
        }}
      >
        {buckets.map((count, i) => {
          const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div
              key={i}
              title={`${bucketLabels[i]}: ${count} teams`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: "0.55rem",
                  color: "var(--gray-less)",
                  fontWeight: "600",
                }}
              >
                {count > 0 ? count : ""}
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  minHeight: count > 0 ? "3px" : "0",
                  background: `linear-gradient(to top, var(--yellow-color), #fbbf24)`,
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.3s ease",
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.35rem",
          padding: "0 0.25rem",
        }}
      >
        <span style={{ fontSize: "0.65rem", color: "var(--gray-less)", fontWeight: "600" }}>
          {bucketLabels[0]?.split("-")[0]}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--gray-less)", fontWeight: "600" }}>
          FSM Score
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--gray-less)", fontWeight: "600" }}>
          {bucketLabels[bucketLabels.length - 1]?.split("-")[1]}
        </span>
      </div>
    </div>
  );
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [jumpToPage, setJumpToPage] = useState("");
  const [showDistribution, setShowDistribution] = useState(true);

  const summaryStats = useMemo(() => {
    const fsmValues = stats
      .map((s) => parseFloat(s.bestFSM))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    if (fsmValues.length === 0) {
      return { total: 0, avg: 0, median: 0, top10Avg: 0, top25Avg: 0, stdDev: 0, max: 0, min: 0 };
    }

    const total = fsmValues.length;
    const avg = fsmValues.reduce((a, b) => a + b, 0) / total;
    const sortedAsc = [...fsmValues].sort((a, b) => a - b);
    const mid = Math.floor(sortedAsc.length / 2);
    const median =
      sortedAsc.length % 2 === 0
        ? (sortedAsc[mid - 1] + sortedAsc[mid]) / 2
        : sortedAsc[mid];

    const top10Count = Math.max(1, Math.ceil(total * 0.1));
    const top25Count = Math.max(1, Math.ceil(total * 0.25));
    const top10Avg = fsmValues.slice(0, top10Count).reduce((a, b) => a + b, 0) / top10Count;
    const top25Avg = fsmValues.slice(0, top25Count).reduce((a, b) => a + b, 0) / top25Count;

    const variance = fsmValues.reduce((acc, v) => acc + (v - avg) ** 2, 0) / total;
    const stdDev = Math.sqrt(variance);

    return {
      total,
      avg,
      median,
      top10Avg,
      top25Avg,
      stdDev,
      max: fsmValues[0],
      min: fsmValues[fsmValues.length - 1],
    };
  }, [stats]);

  const percentileMap = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...stats].sort(
      (a, b) => parseFloat(b.bestFSM) - parseFloat(a.bestFSM)
    );
    const total = sorted.length;
    sorted.forEach((s, i) => {
      map.set(s.teamKey, ((total - i) / total) * 100);
    });
    return map;
  }, [stats]);

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const teamNum = s.teamKey.replace("frc", "");
        return (
          teamNum.includes(q) ||
          s.teamKey.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          normalizeStateProv(s.state_prov).toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [stats, countryFilter, stateFilter, searchQuery]);

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
          aValue = parseInt(a.teamKey.replace("frc", "")) || 0;
          bValue = parseInt(b.teamKey.replace("frc", "")) || 0;
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

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setJumpToPage("");
  }, [jumpToPage, totalPages]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return " \u2195";
    return sortDirection === "asc" ? " \u2191" : " \u2193";
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

  const hasActiveFilters =
    countryFilter !== "all" || stateFilter !== "all" || searchQuery.trim() !== "";

  const statCards = [
    { label: "Total Teams", value: summaryStats.total.toLocaleString(), color: "var(--foreground)" },
    { label: "Avg FSM", value: summaryStats.avg.toFixed(2), color: "#eab308" },
    { label: "Median FSM", value: summaryStats.median.toFixed(2), color: "#f97316" },
    { label: "Top 10% Avg", value: summaryStats.top10Avg.toFixed(2), color: "#22c55e" },
    { label: "Top 25% Avg", value: summaryStats.top25Avg.toFixed(2), color: "#84cc16" },
    { label: "Std Dev", value: summaryStats.stdDev.toFixed(2), color: "#8b5cf6" },
    { label: "Highest FSM", value: summaryStats.max.toFixed(2), color: "#10b981" },
    { label: "Lowest FSM", value: summaryStats.min.toFixed(2), color: "#ef4444" },
  ];

  return (
    <div>
      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "var(--background-pred)",
              border: "2px solid var(--border-color)",
              borderRadius: 10,
              padding: "0.85rem 0.75rem",
              textAlign: "center",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: "600",
                color: "var(--gray-less)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.35rem",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: "700",
                color,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Distribution Chart Toggle + Chart */}
      <div style={{ marginBottom: "0.75rem", textAlign: "center" }}>
        <button
          onClick={() => setShowDistribution(!showDistribution)}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: 8,
            border: "2px solid var(--border-color)",
            background: showDistribution ? "var(--yellow-color)" : "var(--background-pred)",
            color: showDistribution ? "#000" : "var(--foreground)",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {showDistribution ? "Hide Distribution" : "Show Distribution"}
        </button>
      </div>
      {showDistribution && <DistributionChart stats={filteredStats} />}

      {/* Search + Filters */}
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
          <input
            type="text"
            placeholder="Search team # or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "2px solid var(--border-color)",
              background: "var(--input-bg)",
              color: "var(--input-text)",
              fontSize: "0.9rem",
              fontWeight: "500",
              outline: "none",
              width: "200px",
              transition: "border-color 0.2s",
            }}
          />
        </div>

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
              setSearchQuery("");
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

      {/* Pagination Controls */}
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
            ← Prev
          </button>
          <span
            style={{
              fontWeight: "600",
              color: "var(--foreground)",
              padding: "0 0.25rem",
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
          <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder="#"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJumpToPage()}
              style={{
                width: "55px",
                padding: "0.45rem 0.4rem",
                borderRadius: 6,
                border: "2px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--input-text)",
                fontSize: "0.85rem",
                fontWeight: "600",
                textAlign: "center",
                outline: "none",
              }}
            />
            <button
              onClick={handleJumpToPage}
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: 6,
                border: "2px solid var(--border-color)",
                background: "var(--background-pred)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8rem",
                transition: "all 0.2s",
              }}
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "2px solid var(--border-color)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "700px",
          }}
        >
          <thead>
            <tr style={{ background: "var(--gray-more)" }}>
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
                  textAlign: "center",
                  borderBottom: "2px solid var(--border-color)",
                  padding: "12px 8px",
                  fontWeight: "700",
                  color: "var(--yellow-color)",
                }}
              >
                Percentile
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
              const percentile = percentileMap.get(stat.teamKey) ?? 0;
              const pColor = getPercentileColor(percentile);
              const pLabel = getPercentileLabel(percentile);

              const fsmVal = parseFloat(stat.bestFSM);
              const barWidth =
                summaryStats.max > 0
                  ? Math.max(0, Math.min(100, (fsmVal / summaryStats.max) * 100))
                  : 0;

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
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>{rank}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>
                    <TeamLink teamKey={stat.teamKey} year={year} />
                  </td>
                  <td style={{ padding: "12px 8px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "var(--yellow-color)",
                          minWidth: "50px",
                        }}
                      >
                        {stat.bestFSM}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: "6px",
                          background: "var(--gray-more)",
                          borderRadius: 3,
                          overflow: "hidden",
                          minWidth: "60px",
                          maxWidth: "120px",
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: "100%",
                            background: pColor,
                            borderRadius: 3,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.5rem",
                        borderRadius: 999,
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        background: `${pColor}18`,
                        color: pColor,
                        border: `1px solid ${pColor}40`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pLabel}
                    </span>
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

      {/* Bottom Pagination */}
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
