"use client";

import styles from "../../page.module.css";
import { useState } from "react";
import DashboardTable from "@/app/components/DashboardTable";

/* eslint-disable */

import { useRouter } from "next/navigation";

type ClientScoutingPageProps = {
  matches: any[];
  eventCode: string;
  rawData: { [key: string]: string }[];
};

type TeamDataScouting = {
  [team: string]: {
    climbed: boolean;
    autoIsSide: boolean;
    autoScore: number;
    coralScore: number;
    algaeScore: number;
  };
};

function setDefaultTeamData(
  teamData: TeamDataScouting,
  teamNumber: string
): TeamDataScouting {
  if (!teamData[teamNumber]) {
    teamData[teamNumber] = {
      climbed: false,
      autoIsSide: false,
      autoScore: 0,
      coralScore: 0,
      algaeScore: 0,
    };
  }
  return teamData;
}

function TeamRepresentation(
  teamNumber: string,
  td: TeamDataScouting,
  setTd: (td: TeamDataScouting) => void
) {
  setDefaultTeamData(td, teamNumber);
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "8px",
        paddingInline: "55px",
      }}
    >
      <p style={{ fontWeight: "bold" }}>{teamNumber}</p>
      <br></br>
      <p>Autos</p>
      <button
        onClick={() => {
          const newTd = { ...td };
          setDefaultTeamData(newTd, teamNumber);
          newTd[teamNumber].autoIsSide = !newTd[teamNumber].autoIsSide;
          setTd(newTd);
        }}
        style={{
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 4,
          border: "none",
          color: "#fff",
          backgroundColor: td[teamNumber]?.autoIsSide ? "blue" : "purple",
          cursor: "pointer",
          margin: "8px",
        }}
      >
        {td[teamNumber]?.autoIsSide ? "Side Auto" : "Center Auto"}
      </button>
      <br></br>
      <button
        onClick={() => {
          const newTd = { ...td };
          setDefaultTeamData(newTd, teamNumber);
          let current = newTd[teamNumber].autoScore || 1;
          if (current === 0) current = 1;
          let next = current >= 4 ? 1 : current + 1;
          if (next === 1) {
            next = 0;
          }
          newTd[teamNumber].autoScore = next;
          setTd(newTd);
        }}
        style={{
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 4,
          border: "none",
          color: "#fff",
          backgroundColor: (() => {
            switch (td[teamNumber]?.autoScore) {
              case 4:
                return "#1976d2";
              case 3:
                return "#388e3c";
              case 2:
                return "#f78401ff";
              default:
                return "#d32f2f";
            }
          })(),
          cursor: "pointer",
          margin: "8px",
        }}
      >
        {(() => {
          switch (td[teamNumber]?.autoScore) {
            case 4:
              return "Elite";
            case 3:
              return "Good";
            case 2:
              return "Mid";
            default:
              return "Bad";
          }
        })()}
      </button>
      <br></br>
      <br></br>
      <p>Coral Score</p>
      <button
        onClick={() => {
          const newTd = { ...td };
          setDefaultTeamData(newTd, teamNumber);
          let current = newTd[teamNumber].coralScore || 1;
          if (current === 0) current = 1;
          let next = current >= 4 ? 1 : current + 1;
          if (next === 1) {
            next = 0;
          }
          newTd[teamNumber].coralScore = next;
          setTd(newTd);
        }}
        style={{
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 4,
          border: "none",
          color: "#fff",
          backgroundColor: (() => {
            switch (td[teamNumber]?.coralScore) {
              case 4:
                return "#1976d2";
              case 3:
                return "#388e3c";
              case 2:
                return "#f78401ff";
              default:
                return "#d32f2f";
            }
          })(),
          cursor: "pointer",
          margin: "8px",
        }}
      >
        {(() => {
          switch (td[teamNumber]?.coralScore) {
            case 4:
              return "Elite";
            case 3:
              return "Good";
            case 2:
              return "Mid";
            default:
              return "Bad";
          }
        })()}
      </button>
      <p>Algae Score</p>
      <button
        onClick={() => {
          const newTd = { ...td };
          setDefaultTeamData(newTd, teamNumber);
          let current = newTd[teamNumber].algaeScore || 1;
          if (current === 0) current = 1;
          let next = current >= 4 ? 1 : current + 1;
          if (next === 1) {
            next = 0;
          }
          newTd[teamNumber].algaeScore = next;
          setTd(newTd);
        }}
        style={{
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 4,
          border: "none",
          color: "#fff",
          backgroundColor: (() => {
            switch (td[teamNumber]?.algaeScore) {
              case 4:
                return "#1976d2";
              case 3:
                return "#388e3c";
              case 2:
                return "#f78401ff";
              default:
                return "#d32f2f";
            }
          })(),
          cursor: "pointer",
          margin: "8px",
        }}
      >
        {(() => {
          switch (td[teamNumber]?.algaeScore) {
            case 4:
              return "Elite";
            case 3:
              return "Good";
            case 2:
              return "Mid";
            default:
              return "Bad";
          }
        })()}
      </button>
      <br></br>
      <br></br>
      <p>Climb</p>
      <button
        onClick={() => {
          const newTd = { ...td };
          setDefaultTeamData(newTd, teamNumber);
          newTd[teamNumber].climbed = !newTd[teamNumber].climbed;
          setTd(newTd);
        }}
        style={{
          padding: "8px 24px",
          fontSize: 16,
          borderRadius: 4,
          border: "none",
          color: "#fff",
          backgroundColor: td[teamNumber]?.climbed ? "green" : "red",
          cursor: "pointer",
          margin: "8px",
        }}
      >
        {td[teamNumber]?.climbed ? "Climbed" : "Not Climbed"}
      </button>
    </div>
  );
}

const ClientScoutingPage = ({
  matches,
  eventCode,
  rawData,
}: ClientScoutingPageProps) => {
  const [matchNumber, setMatchNumber] = useState("1");
  const [teamColor, setTeamColor] = useState("red");

  const [teamData, setTeamData] = useState<TeamDataScouting>({});

  const router = useRouter();

  const handleSubmit = () => {
    const dataToSubmit = {
      matchNumber,
      teamColor,
      teamData,
      eventCode,
    };

    router.push(
      "/submit?json=" + encodeURIComponent(JSON.stringify(dataToSubmit))
    );
  };

  function checkIsScouted() {
    if (Object.keys(teamData).length === 0) {
      return false;
    }
    const key = eventCode + "-" + Object.keys(teamData)[0] + "-" + matchNumber;
    for (const r in rawData) {
      if (rawData[r].team_match === key) {
        return true;
      }
    }
    return false;
  }

  return (
    <div
      style={{
        width: "100%",
        justifyContent: "center",
        textAlign: "center",
        gap: 4,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <br></br>
      <p>
        Closing or reloading this page without submitting will result in lost
        data.
      </p>
      <p>
        Changing match number or team color will reset the scouting data for the
        current match.
      </p>
      <br></br>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <input
          list="match-options"
          placeholder="Search or enter match number"
          value={matchNumber}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setMatchNumber(selectedValue);
            setTeamData({});
          }}
          className={styles.input}
          style={{
            padding: 8,
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            width: 230,
          }}
        />

        <datalist id="match-options">
          {matches
            .filter((match) =>
              match.key
                .slice(4)
                .toString()
                .toLowerCase()
                .includes(matchNumber.toLowerCase())
            )
            .sort((a, b) => a.match_number - b.match_number)
            .slice(0, 5)
            .map((match) => (
              <option key={match.match_number} value={match.match_number}>
                {match.key}
              </option>
            ))}
        </datalist>
        <button
          style={{
            padding: "8px 24px",
            fontSize: 16,
            borderRadius: 4,
            border: "none",
            backgroundColor: styles.button,
            color: "#fff",
            background: teamColor === "red" ? "#d32f2f" : "#1976d2",
            cursor: "pointer",
          }}
          onClick={() => {
            setTeamColor(teamColor === "red" ? "blue" : "red");
            setTeamData({});
          }}
        >
          {teamColor === "red" ? "Red" : "Blue"}
        </button>
      </div>
      <br></br>
      {checkIsScouted() && (
        <div>
          {" "}
          <p style={{ color: "red" }}>
            This match has already been scouted. Submitting will overwrite the
            existing data.
          </p>{" "}
          <br></br>{" "}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "2rem",
          rowGap: "2rem",
          justifyContent: "center",
          width: "100%",
          flexWrap: "wrap",
          boxSizing: "border-box",
          maxWidth: "100vw",
          overflowX: "auto",
        }}
      >
        {(() => {
          const match = matches.find(
            (m) => String(m.match_number) === String(matchNumber)
          );
          return (
            match &&
            match.alliances[teamColor].team_keys.map((team: string) => (
              <div key={team}>
                {TeamRepresentation(team, teamData, setTeamData)}
              </div>
            ))
          );
        })()}
      </div>
      <br></br>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <button
          style={{
            padding: "20px 100px",
            fontSize: 16,
            borderRadius: 4,
            border: "none",
            backgroundColor: "#1976d2",
            color: "#fff",
            cursor: "pointer",
            width: "fit-content",
          }}
          onClick={() => {
            handleSubmit();
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

type DashboardProps = {
  jsonData: { [key: string]: string }[];
  eventCode: string;
};

const ClientDashboard = ({ jsonData, eventCode }: DashboardProps) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <DashboardTable teams={jsonData} />
      <br></br>
      <br></br>
      <h2>Raw Data</h2>
      {jsonData && (
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )}
    </div>
  );
};

type CompleteClientPageProps = {
  matches: any[];
  eventCode: string;
  jsonData: { [key: string]: string }[];
  rawData: { [key: string]: string }[];
};

const CompleteClientPage = ({
  matches,
  eventCode,
  jsonData,
  rawData,
}: CompleteClientPageProps) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "scouting">(
    "scouting"
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <button
          onClick={() => setActiveTab("scouting")}
          style={{
            padding: "10px 40px",
            fontSize: 16,
            borderRadius: 4,
            border: "2px solid #0932edff",
            backgroundColor:
              activeTab === "scouting" ? "#1976d2" : "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Scouting
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "10px 40px",
            fontSize: 16,
            borderRadius: 4,
            border: "2px solid #0932edff",
            backgroundColor:
              activeTab === "dashboard" ? "#1976d2" : "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </div>
      {activeTab === "dashboard" ? (
        <ClientDashboard jsonData={jsonData} eventCode={eventCode} />
      ) : (
        <ClientScoutingPage
          matches={matches}
          eventCode={eventCode}
          rawData={rawData}
        />
      )}
    </div>
  );
};

export default CompleteClientPage;
