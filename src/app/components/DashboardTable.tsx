"use client";

import { memo } from "react";
import SortableTable from "./SortableTable";

function DashboardTable({ teams }: { teams: { [key: string]: string }[] }) {
  const columns = [
    {
      key: "key",
      label: "Team",
      sortable: false,
    },
    {
      key: "coral",
      label: "Coral Score",
      sortable: true,
      getValue: (team: { [key: string]: string }) => parseFloat(team.coral),
    },
    {
      key: "algae",
      label: "Algae Score",
      sortable: true,
      getValue: (team: { [key: string]: string }) => parseFloat(team.algae),
    },
    {
      key: "sauto",
      label: "Side Auto",
      sortable: true,
      getValue: (team: { [key: string]: string }) => parseFloat(team.sauto),
    },
    {
      key: "cauto",
      label: "Center Auto",
      sortable: true,
      getValue: (team: { [key: string]: string }) => parseFloat(team.cauto),
    },
    {
      key: "climb",
      label: "Climb",
      sortable: true,
      getValue: (team: { [key: string]: string }) => parseFloat(team.climb),
    },
  ];

  return (
    <SortableTable
      data={teams}
      columns={columns}
      defaultSort="coral"
      getItemKey={(team) => team.key}
    />
  );
}

export default memo(DashboardTable);
