import { getEventRevalidationTime } from "./eventUtils";
import { NexusScheduleData } from "../event25/[event]/types";

export async function getNexusMatchSchedule(
  eventCode: string
): Promise<{ [key: string]: NexusScheduleData }> {
  console.log(`Fetching Nexus schedule for event: ${eventCode}`);

  try {
    const revalidateTime = await getEventRevalidationTime(eventCode);
    const nexusApiKey = "cfrUoyT-hh16Lx2BM-wZouwj07M";

    const response = await fetch(
      `https://frc.nexus/api/v1/event/${eventCode}`,
      {
        headers: {
          "Nexus-Api-Key": nexusApiKey,
        },
        next: { revalidate: revalidateTime },
      }
    );

    console.log(`Nexus API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nexus API error (${response.status}):`, errorText);
      return {};
    }

    const eventData = await response.json();
    console.log(`Nexus event data received:`, {
      matchCount: eventData.matches?.length || 0,
      nowQueuing: eventData.nowQueuing,
      dataAsOfTime: eventData.dataAsOfTime,
    });

    const scheduleData: { [key: string]: NexusScheduleData } = {};

    if (eventData.matches && Array.isArray(eventData.matches)) {
      console.log(`Processing ${eventData.matches.length} matches from Nexus`);

      for (const match of eventData.matches) {
        const label = match.label || '';
        let matchKey = '';
        
        if (label.includes('Practice')) {
          const num = label.replace(/[^0-9]/g, '');
          matchKey = `${eventCode}_pm${num}`;
        } else if (label.includes('Qualification')) {
          const num = label.replace(/[^0-9]/g, '');
          matchKey = `${eventCode}_qm${num}`;
        } else if (label.includes('Playoff')) {
          const num = label.replace(/[^0-9]/g, '');
          matchKey = `${eventCode}_sf${num}m1`;
        } else if (label.includes('Final')) {
          const num = label.replace(/[^0-9]/g, '');
          matchKey = `${eventCode}_f1m${num}`;
        } else {
          matchKey = `${eventCode}_${label.replace(/\s+/g, '_').toLowerCase()}`;
        }

        scheduleData[matchKey] = {
          scheduledTime: match.times?.estimatedStartTime
            ? new Date(match.times.estimatedStartTime).toISOString()
            : null,
          actualTime: match.times?.startTime
            ? new Date(match.times.startTime).toISOString()
            : null,
          status: match.status,
          label: match.label,
        };
      }

      console.log(`Sample match keys:`, Object.keys(scheduleData).slice(0, 5));
      console.log(
        `Sample match data:`,
        scheduleData[Object.keys(scheduleData)[0]]
      );
    } else {
      console.warn(`No matches array in Nexus response`);
    }

    console.log(
      `Returning Nexus schedule with ${
        Object.keys(scheduleData).length
      } matches`
    );
    return scheduleData;
  } catch (error) {
    console.error("Error fetching Nexus schedule:", error);
    return {};
  }
}
