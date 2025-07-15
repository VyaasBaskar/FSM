"use server";
import ClientHome from "./clientpage";

import { getEvents, getTeams } from "./lib/global";

export default async function Home() {
  const events = await getEvents();
  const teams = await getTeams();
  return (
    <ClientHome events={events} teams={teams} />
  );
}