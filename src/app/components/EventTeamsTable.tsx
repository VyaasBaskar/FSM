"use client";

import { TeamDataType } from "../lib/event";
import SortableTable from "./SortableTable";

export default function EventTeamsTable({ teams }: { teams: TeamDataType[] }) {
  const columns = [
    { key: "key", label: "Team", sortable: false },
    { key: "rank", label: "Rank", sortable: true, getValue: (team: TeamDataType) => team.rank },
    { key: "fsm", label: "FSM", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.fsm) },
  ];

  return <SortableTable data={teams} columns={columns} defaultSort="rank" getItemKey={(team) => team.key} />;
}
