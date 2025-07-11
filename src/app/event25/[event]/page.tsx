import styles from "../../page.module.css";
import { getEventTeams } from "../../lib/event";
import LogoButton from "../../components/LogoButton";
import Event25TeamsTable from "../../components/Event25TeamsTable";
import Link from "next/link";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode, true);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <Link
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
      </Link>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Event FSM</h1>
        <h2 className={styles.table}>2025{eventCode}</h2>
        <Event25TeamsTable teams={teams} />
      </main>
      <LogoButton />
    </div>
  );
}
