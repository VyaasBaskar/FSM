"use client";

import { TeamDataType } from "../lib/event";
import SortableTable from "./SortableTable";
import TeamLink from "./TeamLink";

export default function EventTeamsTable({ teams, year }: { teams: TeamDataType[]; year?: string | number }) {
  const columns = [
    {
      key: "key",
      label: "Team",
      sortable: false,
      render: (team: TeamDataType) => <TeamLink teamKey={team.key} year={year} />,
    },
    { key: "rank", label: "Rank", sortable: true, getValue: (team: TeamDataType) => team.rank },
    { key: "fsm", label: "FSM", sortable: true, getValue: (team: TeamDataType) => parseFloat(team.fsm) },
  ];

  return (
    <SortableTable
      data={teams}
      columns={columns}
      defaultSort="rank"
      getItemKey={(team) => team.key}
      showSortIndex
      sortIndexHideFor="rank"
    />
  );
}
