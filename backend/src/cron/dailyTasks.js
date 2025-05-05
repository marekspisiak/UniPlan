import cron from "node-cron";
import { createOccurrenceIfNeededFromEvent } from "../utils/eventOccurrences.js";
import prisma from "../../prisma/client.js";

const cronEvent = async () => {
  try {
    const events = await prisma.event.findMany({
      include: {
        eventDays: {
          include: { day: true },
        },
      },
    });
    for (const event of events) {
      try {
        await prisma.$transaction(async (tx) => {
          await createOccurrenceIfNeededFromEvent(tx, event);
        });
      } catch (e) {
        console.error(`Chyba pri spracovaní eventu ID ${event.id}:`, e);
      }
    }
    console.log(`Cron spracoval ${events.length} eventov`);
  } catch (error) {
    console.error("Chyba pri získavaní eventov:", error);
  }
};

cron.schedule("0 0 * * *", cronEvent, {
  timezone: "Europe/Bratislava",
});

cronEvent();
