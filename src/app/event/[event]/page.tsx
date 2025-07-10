import styles from "../../page.module.css";
import { getEventTeams } from "../../lib/event";
import LogoButton from "../../components/LogoButton";
import EventTeamsTable from "../../components/EventTeamsTable";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams(eventCode);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <a
      href="/"
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        textDecoration: "none",
        color: "inherit",
        fontSize: "4rem",
        display: "flex",
        alignItems: "center",
        zIndex: 10,
      }}
      aria-label="Back to Home"
      >
      &#8592;
      </a>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Event FSM</h1>
        <h2 className={styles.table}>{eventCode}</h2>
        <EventTeamsTable teams={teams} />
      </main>
      <LogoButton />
    </div>
  );
}
