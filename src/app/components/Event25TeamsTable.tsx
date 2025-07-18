"use client";

import { TeamDataType } from "../lib/event";
import SortableTable from "./SortableTable";

export default function Event25TeamsTable({ teams }: { teams: TeamDataType[] }) {
  const columns = [
    { key: "key", label: "Team", sortable: false },
    { key: "rank", label: "Rank", sortable: true, getValue: (team: TeamDataType) => team.rank },
    { key: "fsm", label: "FSM", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.fsm) },
    { key: "auto", label: "Auto", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.auto) },
    { key: "coral", label: "Coral", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.coral) },
    { key: "algae", label: "Algae", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.algae) },
    { 
      key: "cyp", 
      label: "CYP", 
      sortable: true, 
      getValue: (team: TeamDataType) => Number(team.algae) * 1.4 + Number(team.auto) + Number(team.coral),
      render: (team: TeamDataType) => (Number(team.algae) * 1.4 + Number(team.auto) + Number(team.coral)).toFixed(2)
    },
  ];

  return <SortableTable data={teams} columns={columns} defaultSort="rank" getItemKey={(team) => team.key} />;
}
