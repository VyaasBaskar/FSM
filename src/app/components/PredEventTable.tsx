"use client";

import SortableTable from "./SortableTable";

type TTType = {
  key: string;
  fsm: string;
  rank: number;
};

export default function PredEventTable({ teams }: { teams: TTType[] }) {
  const columns = [
    { key: "key", label: "Team", sortable: false },
    {
      key: "rank",
      label: "FSM Rank",
      sortable: true,
      getValue: (team: TTType) => team.rank,
    },
    {
      key: "fsm",
      label: "FSM",
      sortable: true,
      getValue: (team: TTType) => parseFloat(team.fsm),
    },
  ];

  return (
    <SortableTable
      data={teams}
      columns={columns}
      defaultSort="rank"
      getItemKey={(team) => team.key}
    />
  );
}
