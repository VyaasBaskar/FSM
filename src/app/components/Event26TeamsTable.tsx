"use client";

import Event25TeamsTable from "./Event25TeamsTable";
import type { TeamDataType26 } from "../lib/event26";

export default function Event26TeamsTable({ teams }: { teams: TeamDataType26[] }) {
  return <Event25TeamsTable teams={teams} gameYear={2026} />;
}
