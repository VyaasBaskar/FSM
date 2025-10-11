"use client";

import { useRouter } from "next/navigation";

const EXCLUDED_YEARS = [2020, 2021];

export default function YearDropdown({
  teamKey,
  currentYear,
}: {
  teamKey: string;
  currentYear: string;
}) {
  const router = useRouter();

  const yearOptions = [
    <option key="general" value="general">
      Summary
    </option>,
    ...Array.from(
      { length: new Date().getFullYear() - 2012 },
      (_, i) => new Date().getFullYear() - i
    )
      .filter((year) => !EXCLUDED_YEARS.includes(year))
      .map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      )),
  ];

  const absoluteCenter = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as const,
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "16px 0 24px",
      }}
    >
      <div style={{ position: "relative" }}>
        <select
          value={currentYear}
          onChange={(e) => router.push(`/team/${teamKey}-${e.target.value}`)}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = "#484848")}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = "#000")}
          style={{
            padding: "8px 40px 8px 16px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
            color: "var(--yellow-color)",
            border: "2px solid #000",
            backgroundColor: "var(--navbar-background)",
            cursor: "pointer",
            minWidth: "150px",
            transition: "border-color 0.2s",
            appearance: "none",
          }}
        >
          {yearOptions}
        </select>

        <div
          style={{
            ...absoluteCenter,
            right: "32px",
            width: "1px",
            height: "60%",
            backgroundColor: "var(--yellow-color)",
          }}
        />

        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ ...absoluteCenter, right: "12px" }}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="var(--yellow-color)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
