"use client";

import TeamLink from "../components/TeamLink";
import SortableTable from "../components/SortableTable";

interface UnluckyData {
  teamKey: string;
  unluckyPoints: number;
  eventCount: number;
  unluckyPerEvent?: number;
}

interface UnluckyTableProps {
  data: UnluckyData[];
}

export default function UnluckyTable({ data }: UnluckyTableProps) {
  const dataWithRank = data.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const columns = [
    {
      key: "rank",
      label: "Rank",
      sortable: false,
      render: (item: UnluckyData & { rank: number }) => (
        <span style={{ fontWeight: 600 }}>{item.rank}</span>
      ),
    },
    {
      key: "teamKey",
      label: "Team",
      sortable: false,
      render: (item: UnluckyData) => <TeamLink teamKey={item.teamKey} />,
    },
    {
      key: "unluckyPerEvent",
      label: "Unlucky",
      sortable: true,
      render: (item: UnluckyData) => {
        const unluckyPerEvent = item.unluckyPerEvent ?? (item.unluckyPoints / Math.max(item.eventCount, 10));
        return (
          <span style={{ fontWeight: 500 }}>
            {unluckyPerEvent.toFixed(2)}
          </span>
        );
      },
      getValue: (item: UnluckyData) => item.unluckyPerEvent ?? (item.unluckyPoints / Math.max(item.eventCount, 10)),
    },
    {
      key: "eventCount",
      label: "Events",
      sortable: true,
      render: (item: UnluckyData) => item.eventCount,
      getValue: (item: UnluckyData) => item.eventCount,
    },
  ];

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      <SortableTable
        data={dataWithRank}
        columns={columns}
        defaultSort="unluckyPerEvent"
        getItemKey={(item) => item.teamKey}
        showSortIndex
        sortIndexHideFor="rank"
      />
    </div>
  );
}

