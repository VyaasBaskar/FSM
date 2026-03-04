"use client";

import { useState, useEffect } from "react";
import PaginatedGlobalTable from "./PaginatedGlobalTable";

interface GlobalStat {
  teamKey: string;
  bestFSM: string;
  auto: string;
  fuel: string;
  climb: string;
  coral: string;
  algae: string;
  country: string;
  state_prov: string;
}

interface ProgressiveGlobalTableProps {
  initialStats: Array<{ teamKey: string; bestFSM: string; auto: string; fuel: string; climb: string; coral: string; algae: string }>;
  year: string;
  rankingId: number;
}

export default function ProgressiveGlobalTable({
  initialStats,
  year,
  rankingId,
}: ProgressiveGlobalTableProps) {
  const [stats, setStats] = useState<GlobalStat[]>(() =>
    initialStats.map((stat) => ({
      ...stat,
      country: "",
      state_prov: "",
    }))
  );
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadLocations() {
      try {
        const cachedResponse = await fetch(
          `/api/global-rankings?rankingId=${rankingId}`
        );

        if (cachedResponse.ok) {
          const { data: cachedData } = await cachedResponse.json();
          if (cachedData && cachedData.length > 0 && mounted) {
            console.log("Using cached location data from Supabase");
            const merged = initialStats.map((stat) => {
              const cached = cachedData.find((c: any) => c.teamKey === stat.teamKey);
              return {
                ...stat,
                country: cached?.country || "",
                state_prov: cached?.state_prov || "",
              };
            });
            setStats(merged);
            setIsLoadingLocations(false);
            return;
          }
        }

        console.log("Fetching fresh location data from TBA API");
        const teamKeys = initialStats.map((stat) => stat.teamKey);

        const locationsResponse = await fetch("/api/team-locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ teamKeys }),
        });

        if (!locationsResponse.ok) {
          throw new Error("Failed to fetch locations");
        }

        const { locations } = await locationsResponse.json();

        if (mounted) {
          const statsWithLocations = initialStats.map((stat) => ({
            ...stat,
            country: locations[stat.teamKey]?.country || "",
            state_prov: locations[stat.teamKey]?.state_prov || "",
          }));

          setStats(statsWithLocations);
          setIsLoadingLocations(false);

          console.log("Storing location data to Supabase");
          try {
            await fetch("/api/global-rankings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                rankingId,
                stats: statsWithLocations,
              }),
            });
            console.log("Location data stored successfully");
          } catch (error) {
            console.error("Error storing locations to Supabase:", error);
          }
        }
      } catch (error) {
        console.error("Error loading locations:", error);
        if (mounted) {
          setIsLoadingLocations(false);
        }
      }
    }

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [initialStats, rankingId]);

  return (
    <div>
      {isLoadingLocations && (
        <div
          style={{
            background: "var(--background-pred)",
            border: "2px solid var(--yellow-color)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            textAlign: "center",
            fontSize: "0.9rem",
            fontWeight: "600",
            color: "var(--foreground)",
          }}
        >
          Loading team locations...
        </div>
      )}
      <PaginatedGlobalTable stats={stats} year={year} />
    </div>
  );
}
