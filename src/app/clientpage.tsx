"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

interface ClientHomeProps {
  events: { key: string; value: string }[];
  teams: { key: string; value: string }[];
}

export default function ClientHome({ events, teams }: ClientHomeProps) {
  const [eventCode, setEventCode] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [year, setYear] = useState("2025");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = eventCode.trim();
    if (trimmed && trimmed.length > 5) {
      if (trimmed.startsWith("2026")) {
        router.push(`/event26/${trimmed.slice(4)}`);
      } else if (trimmed.startsWith("2025")) {
        router.push(`/event25/${trimmed.slice(4)}`);
      } else {
        router.push(`/event/${trimmed}`);
      }
    }
  };

  const handleGoTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamCode.trim();
    if (trimmed) {
      router.push(`/team/frc${trimmed}-${year}`);
    }
  };

  return (
    <div className={styles.modernPage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleMain}>FunkyStats</span>
            <span className={styles.heroTitleSub}>
              Powered by the FSM formula
            </span>
          </h1>
          <p className={styles.heroDescription}>
            Advanced FRC data analytics using the Funky Scoring Metric to
            deliver highly accurate predictions of team performance and match
            outcomes.
          </p>
          <Link href={`/global/${year}`} className={styles.heroCTA}>
            <span>Explore Global Rankings</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      <main className={styles.modernMain}>
        <div className={styles.searchGrid}>
          <div className={styles.searchCard}>
            <div className={styles.cardIcon}>📍</div>
            <h2 className={styles.cardTitle}>Event Finder</h2>
            <p className={styles.cardDescription}>
              Search for events and view detailed analytics, match predictions,
              and team rankings
            </p>
            <form onSubmit={handleGoEvent} className={styles.searchForm}>
              <div className={styles.inputGroup}>
                <input
                  list="event-options"
                  placeholder="Search event name or code..."
                  value={eventCode}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const matchedEvent = events.find(
                      (event) => event.value === selectedValue
                    );
                    if (matchedEvent) {
                      setEventCode(matchedEvent.key);
                    } else {
                      setEventCode(selectedValue);
                    }
                  }}
                  className={styles.modernInput}
                />
                <datalist id="event-options">
                  {events
                    .filter((event) =>
                      event.value
                        .toLowerCase()
                        .includes(eventCode.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((event) => (
                      <option key={event.key} value={event.value} />
                    ))}
                </datalist>
              </div>
              <button type="submit" className={styles.modernButton}>
                Search Event
              </button>
            </form>
          </div>

          <div className={styles.searchCard}>
            <div className={styles.cardIcon}>🤖</div>
            <h2 className={styles.cardTitle}>Team Finder</h2>
            <p className={styles.cardDescription}>
              Analyze team performance, view historical FSM data, and track
              year-over-year progress
            </p>
            <form onSubmit={handleGoTeam} className={styles.searchForm}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <input
                    list="team-options"
                    type="text"
                    placeholder="Team number (e.g. 846)"
                    value={teamCode}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const matchedTeam = teams.find(
                        (team) => team.value === selectedValue
                      );
                      if (matchedTeam) {
                        setTeamCode(matchedTeam.key);
                      } else {
                        setTeamCode(selectedValue);
                      }
                    }}
                    className={styles.modernInput}
                  />
                  <datalist id="team-options">
                    {teams
                      .filter((team) =>
                        team.value
                          .toLowerCase()
                          .includes(teamCode.toLowerCase())
                      )
                      .sort((a, b) => Number(a.key) - Number(b.key))
                      .slice(0, 5)
                      .map((team) => (
                        <option key={team.key} value={team.value} />
                      ))}
                  </datalist>
                </div>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={styles.modernSelect}
                >
                  <option value="general">All Years</option>
                  {[
                    "2025",
                    "2024",
                    "2023",
                    "2022",
                    "2019",
                    "2018",
                    "2017",
                    "2016",
                    "2015",
                    "2014",
                    "2013",
                  ].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={styles.modernButton}>
                View Team Stats
              </button>
            </form>
          </div>
        </div>

        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Why FSM?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconLarge}>🎯</div>
              <h3>Cycle-Level Precision</h3>
              <p>
                Predicts team scoring to within fractions of a cycle—unmatched
                accuracy verified with real match data
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconLarge}>⚡</div>
              <h3>Smart & Adaptive</h3>
              <p>
                Instantly responds to robot improvements while prioritizing
                recent and peak performance for the most accurate predictions
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconLarge}>🔮</div>
              <h3>Highly Predictive</h3>
              <p>
                Game-specific prediction model delivers accuracy that
                consistently outperforms Statbotics
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconLarge}>📊</div>
              <h3>Comprehensive Coverage</h3>
              <p>
                {mounted ? (
                  <>
                    Tracking {teams.length.toLocaleString()}+ teams across{" "}
                    {events.length}+ events with continuously updated analytics
                  </>
                ) : (
                  <>
                    Tracking thousands of teams across hundreds of events with
                    continuously updated analytics
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
