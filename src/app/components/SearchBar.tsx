/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  isMobile?: boolean;
  onSearchStateChange?: (isSearching: boolean) => void;
}

interface TeamOption {
  key: string;
  value: string;
}

interface EventOption {
  key: string;
  value: string;
}

interface FilteredOption {
  type: "team" | "event";
  key: string;
  value: string;
  display: string;
}

export default function SearchBar({
  isMobile = false,
  onSearchStateChange,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getTheme = () => {
      const saved = localStorage.getItem("theme");
      const system = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      return saved === "light" || saved === "dark" ? saved : system;
    };

    const updateTheme = () => {
      setTheme(getTheme() as "light" | "dark");
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [teamsRes, events2025Res, events2026Res] = await Promise.all([
          fetch("/api/teams?year=2025"),
          fetch("/api/events?year=2025"),
          fetch("/api/events?year=2026"),
        ]);

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          teamsData.sort((a: TeamOption, b: TeamOption) => {
            const numA = Number(a.key) || 0;
            const numB = Number(b.key) || 0;
            if (numA < numB) return -1;
            if (numA > numB) return 1;
            return a.value.localeCompare(b.value);
          });
          setTeams(teamsData);
        }

        if (events2025Res.ok && events2026Res.ok) {
          const events2025 = await events2025Res.json();
          const events2026 = await events2026Res.json();
          const allEvents = [...events2025, ...events2026];
          const uniqueEvents = Array.from(
            new Map(allEvents.map((event) => [event.key, event])).values()
          );
          uniqueEvents.sort((a, b) => {
            const firstCharA = a.value.charAt(0);
            const firstCharB = b.value.charAt(0);
            if (firstCharA !== firstCharB) {
              return firstCharA.localeCompare(firstCharB);
            }
            return a.value.localeCompare(b.value);
          });
          setEvents(uniqueEvents);
        }
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigateToResult = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    let teamNumber = trimmed.toLowerCase().replace(/^frc/, "").trim();
    const teamMatch = teamNumber.match(/^\d+$/);
    if (teamMatch) {
      router.push(`/team/frc${teamNumber}-2025`);
      setSearchQuery("");
      setFocused(false);
      return;
    }

    const teamPrefixMatch = trimmed.match(/^team\s+(\d+)$/i);
    if (teamPrefixMatch) {
      router.push(`/team/frc${teamPrefixMatch[1]}-2025`);
      setSearchQuery("");
      setFocused(false);
      return;
    }

    const matchedTeam = teams.find(
      (team) =>
        team.value === trimmed ||
        team.value.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedTeam) {
      router.push(`/team/frc${matchedTeam.key}-2025`);
      setSearchQuery("");
      setFocused(false);
      return;
    }

    const matchedEvent = events.find(
      (event) => event.value.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedEvent) {
      const eventCode = matchedEvent.key;
      if (eventCode.startsWith("2026")) {
        router.push(`/event26/${eventCode.slice(4)}`);
      } else if (eventCode.startsWith("2025")) {
        router.push(`/event25/${eventCode.slice(4)}`);
      } else {
        router.push(`/event/${eventCode}`);
      }
      setSearchQuery("");
      setFocused(false);
      return;
    }

    const partialEventMatch = events.find((event) =>
      event.value.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (partialEventMatch) {
      const eventCode = partialEventMatch.key;
      if (eventCode.startsWith("2026")) {
        router.push(`/event26/${eventCode.slice(4)}`);
      } else if (eventCode.startsWith("2025")) {
        router.push(`/event25/${eventCode.slice(4)}`);
      } else {
        router.push(`/event/${eventCode}`);
      }
      setSearchQuery("");
      setFocused(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToResult(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
  };

  const handleOptionSelect = (option: FilteredOption) => {
    if (option.type === "team") {
      const teamNumber = option.key;
      router.push(`/team/frc${teamNumber}-2025`);
    } else {
      const eventCode = option.key;
      if (eventCode.startsWith("2026")) {
        router.push(`/event26/${eventCode.slice(4)}`);
      } else if (eventCode.startsWith("2025")) {
        router.push(`/event25/${eventCode.slice(4)}`);
      } else {
        router.push(`/event/${eventCode}`);
      }
    }
    setSearchQuery("");
    setFocused(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
        handleOptionSelect(filteredOptions[selectedIndex]);
      } else {
        navigateToResult(searchQuery);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setFocused(false);
      setSelectedIndex(-1);
    }
  };

  const filteredOptions: FilteredOption[] = searchQuery
    ? (() => {
        const queryLower = searchQuery.toLowerCase();
        const queryNum = Number(searchQuery);
        const isNumericQuery = !isNaN(queryNum) && isFinite(queryNum);
        
        const teamMatches = teams.filter((team) =>
          team.value.toLowerCase().includes(queryLower)
        );
        
        let teamExact: typeof teams = [];
        let teamPrefix: typeof teams = [];
        let teamPartial: typeof teams = [];
        
        if (isNumericQuery) {
          teamExact = teamMatches.filter((team) => {
            const teamNum = Number(team.key);
            return !isNaN(teamNum) && teamNum === queryNum;
          });
          teamPrefix = teamMatches.filter((team) => {
            if (teamExact.includes(team)) return false;
            return team.key.startsWith(searchQuery);
          });
          teamPartial = teamMatches.filter(
            (team) => !teamExact.includes(team) && !teamPrefix.includes(team)
          );
        } else {
          teamPrefix = teamMatches.filter((team) =>
            team.value.toLowerCase().startsWith(queryLower)
          );
          teamPartial = teamMatches.filter(
            (team) => !teamPrefix.includes(team)
          );
        }
        
        const eventMatches = events.filter((event) =>
          event.value.toLowerCase().includes(queryLower)
        );
        const eventComplete = eventMatches.filter((event) =>
          event.value.toLowerCase().startsWith(queryLower)
        );
        const eventPartial = eventMatches.filter(
          (event) => !event.value.toLowerCase().startsWith(queryLower)
        );
        
        const allTeams = [...teamExact, ...teamPrefix, ...teamPartial].slice(0, 5);
        const allEvents = [...eventComplete, ...eventPartial].slice(0, 5);
        
        return [
          ...allTeams.map((team) => ({
            type: "team" as const,
            key: team.key,
            value: team.value,
            display: `Team ${team.value}`,
          })),
          ...allEvents.map((event) => ({
            type: "event" as const,
            key: event.key,
            value: event.value,
            display: event.value,
          })),
        ];
      })()
    : [];

  useEffect(() => {
    if (onSearchStateChange) {
      onSearchStateChange(focused && filteredOptions.length > 0);
    }
  }, [focused, filteredOptions.length, onSearchStateChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
        setSelectedIndex(-1);
      }
    };

    const updateDropdownPosition = () => {
      if (!isMobile && inputRef.current && focused) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (focused) {
      document.addEventListener("mousedown", handleClickOutside);
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [focused, isMobile]);

  const getBorderColor = () => {
    if (theme === "light") {
      return focused
        ? "2px solid rgba(107, 114, 128, 0.8)"
        : "2px solid rgba(107, 114, 128, 0.4)";
    }
    return focused
      ? "2px solid var(--yellow-color)"
      : "2px solid rgba(253, 224, 71, 0.5)";
  };

  const getBoxShadow = () => {
    if (theme === "light") {
      return focused
        ? "0 0 0 3px rgba(107, 114, 128, 0.15)"
        : "0 0 0 3px rgba(107, 114, 128, 0.08)";
    }
    return focused
      ? "0 0 0 3px rgba(253, 224, 71, 0.2)"
      : "0 0 0 3px rgba(253, 224, 71, 0.1)";
  };

  const inputId = `search-input-${isMobile ? "mobile" : "desktop"}`;
  const placeholderColor =
    theme === "light" ? "rgba(107, 114, 128, 0.6)" : "rgba(253, 224, 71, 0.7)";

  return (
    <>
      <style>{`
        #${inputId}::placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
        #${inputId}::-webkit-input-placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
        #${inputId}::-moz-placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
        #${inputId}:-ms-input-placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: isMobile ? "flex" : "inline-block",
          justifyContent: isMobile ? "center" : "flex-start",
          alignItems: isMobile ? "flex-start" : "flex-start",
          width: isMobile ? "100%" : "auto",
          flexShrink: 0,
          isolation: "isolate",
          margin: 0,
          padding: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            position: "relative",
            width: mounted && isMobile ? "95%" : "100%",
            maxWidth: mounted && isMobile ? "95%" : "100%",
            margin: 0,
            boxSizing: "border-box",
            display: "block",
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: "absolute",
              left: isMobile ? "18px" : "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              zIndex: 1,
              color: "var(--foreground)",
              opacity: 0.6,
            }}
          >
            <path
              d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            id={inputId}
            ref={inputRef}
            list={`search-options-${isMobile ? "mobile" : "desktop"}`}
            type="text"
            placeholder={isMobile ? "Search teams/events" : "Search..."}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                if (!containerRef.current?.querySelector(":hover")) {
                  setFocused(false);
                  setSelectedIndex(-1);
                }
              }, 200);
            }}
            onKeyDown={handleKeyDown}
            style={{
              padding: isMobile ? "12px 14px 12px 42px" : "10px 14px 10px 38px",
              fontSize: isMobile ? 15 : 14,
              borderRadius: "10px",
              border: getBorderColor(),
              background: "var(--background)",
              color: "var(--foreground)",
              width: isMobile ? "100%" : "220px",
              minWidth: isMobile ? "100%" : "180px",
              maxWidth: isMobile ? "100%" : "220px",
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              outline: "none",
              boxShadow: getBoxShadow(),
              lineHeight: "1.5",
              verticalAlign: "middle",
            }}
          />
        </form>
        {focused && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: isMobile ? "absolute" : "fixed",
              ...(isMobile
                ? {
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "95%",
                    marginTop: "4px",
                  }
                : {
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }),
              background: isMobile
                ? theme === "dark"
                  ? "#2b2b2b"
                  : "#ffffff"
                : "var(--option-bg)",
              opacity: 1,
              borderRadius: "10px",
              border: `2px solid ${
                theme === "dark"
                  ? "rgba(253, 224, 71, 0.3)"
                  : "rgba(107, 114, 128, 0.3)"
              }`,
              boxShadow:
                theme === "dark"
                  ? "0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(253, 224, 71, 0.1)"
                  : "0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(107, 114, 128, 0.1)",
              zIndex: 100000,
              maxHeight: "300px",
              overflowY: "auto",
              overflowX: "hidden",
              isolation: "isolate",
            }}
          >
            {filteredOptions.map((option, idx) => (
              <div
                key={`${option.type}-${option.key}-${idx}`}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background:
                    selectedIndex === idx
                      ? theme === "dark"
                        ? "rgba(253, 224, 71, 0.15)"
                        : "rgba(107, 114, 128, 0.1)"
                      : isMobile
                      ? theme === "dark"
                        ? "#2b2b2b"
                        : "#ffffff"
                      : "var(--option-bg)",
                  color: "var(--foreground)",
                  fontSize: isMobile ? 15 : 14,
                  borderBottom:
                    idx < filteredOptions.length - 1
                      ? `1px solid ${
                          theme === "dark"
                            ? "rgba(253, 224, 71, 0.1)"
                            : "rgba(107, 114, 128, 0.1)"
                        }`
                      : "none",
                  transition: "background 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    opacity: 0.6,
                    fontWeight: 500,
                    color:
                      theme === "dark"
                        ? "rgba(253, 224, 71, 0.8)"
                        : "rgba(107, 114, 128, 0.8)",
                    minWidth: "40px",
                  }}
                >
                  {option.type === "team" ? "Team" : "Event"}
                </span>
                <span style={{ flex: 1 }}>{option.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
