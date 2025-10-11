"use client";

import { useState, useEffect } from "react";
import {
  getCachedEvents,
  getCachedTeams,
  getCachedTeamStats,
  getCachedTeamInfo,
  getCachedEventTeams,
  getCachedGlobalStats,
  type EventData,
  type TeamData,
  type TeamStats,
  type TeamInfo,
  type EventTeam,
  type GlobalStat,
} from "../cachedApi";
import { isBrowser } from "../cache";

interface UseDataOptions {
  enabled?: boolean;
}

export function useCachedEvents(
  year: number = 2025,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<EventData[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedEvents(year);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return { data, loading, error };
}

export function useCachedTeams(
  year: number = 2025,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<TeamData[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedTeams(year);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return { data, loading, error };
}

export function useCachedTeamStats(
  teamKey: string | null,
  year: number = 2025,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(enabled && !!teamKey);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !teamKey || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const keyToFetch = teamKey;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedTeamStats(keyToFetch, year);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [teamKey, year, enabled]);

  return { data, loading, error };
}

export function useCachedTeamInfo(
  teamKey: string | null,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(enabled && !!teamKey);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !teamKey || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const keyToFetch = teamKey;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedTeamInfo(keyToFetch);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [teamKey, enabled]);

  return { data, loading, error };
}

export function useCachedEventTeams(
  eventCode: string | null,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<EventTeam[] | null>(null);
  const [loading, setLoading] = useState(enabled && !!eventCode);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !eventCode || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const codeToFetch = eventCode;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedEventTeams(codeToFetch);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [eventCode, enabled]);

  return { data, loading, error };
}

export function useCachedGlobalStats(
  year: number = 2025,
  options: UseDataOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<GlobalStat[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isBrowser()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCachedGlobalStats(year);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return { data, loading, error };
}
