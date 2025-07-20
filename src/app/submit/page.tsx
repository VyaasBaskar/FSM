"use server";
/* eslint-disable */

import { redirect } from "next/navigation";
import { setScoutingData } from "../lib/supabase";

interface SubmitPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  let jsonData = null;
  let error = null;
  let eventCode = "";

  const jsonParam = (await searchParams).json;

  if (jsonParam && typeof jsonParam === "string") {
    try {
      jsonData = JSON.parse(decodeURIComponent(jsonParam));
      eventCode = jsonData.eventCode || "";
      let data = jsonData.teamData || {};
      if (eventCode === "" || Object.keys(data).length === 0) {
        console.log("Event code is missing or data is empty");
        throw new Error("Error: Event code is missing or data is empty");
      }
      for (const teamNumber in data) {
        let key = eventCode + "-" + teamNumber + "-" + jsonData.matchNumber;
        await setScoutingData(key, JSON.stringify(data[teamNumber]));
      }
    } catch (err) {
      console.error("Error parsing JSON:", err);
      error = "Invalid JSON format in parameter";
    }
  }

  if (!error && jsonData) {
    await delay(1500);
    redirect(`/scouting/${eventCode || ""}`);
  }

  return (
    <div
      className="container mx-auto px-4 py-8"
      style={{ margin: "20px", color: "orange" }}
    >
      <h1 className="text-3xl font-bold mb-6">Submit Page</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {jsonData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">Received Data:</h2>
          <pre className="bg-white p-3 rounded border overflow-auto">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
      )}

      {!jsonData && !error && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>No data received.</p>
        </div>
      )}

      <br></br>
      <br></br>

      <p>Will redirect shortly...</p>
    </div>
  );
}
