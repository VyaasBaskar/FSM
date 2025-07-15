"use server";
import ClientHome from "./clientpage";

import { getEvents, getTeams } from "./lib/global";
import { fetchAll25Teams, setAll25Teams } from "./lib/supabase";

export default async function Home() {
  const events = await getEvents();
  let teams = await fetchAll25Teams();
  if (teams.length === 0) {
    console.warn("No teams found in Supabase, fetching from TBA");
    teams = await getTeams();
    await setAll25Teams(teams);
  }
  console.log("Fetched teams:", teams.length);
  return (
    <ClientHome events={events} teams={teams} />
  );
}