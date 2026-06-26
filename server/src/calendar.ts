// Generate .ics calendar invites for bookings and site visits.

import { createEvent, type EventAttributes } from "ics";

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startAt: string; // ISO date string
  endAt: string;   // ISO date string
}

function toDateArray(iso: string): [number, number, number, number, number] {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

export function generateIcs(event: CalendarEvent): Promise<string> {
  const attrs: EventAttributes = {
    title: event.title,
    description: event.description,
    location: event.location,
    start: toDateArray(event.startAt),
    end: toDateArray(event.endAt),
    organizer: { name: "Aztech Co-Works", email: "noreply@aztechcoworks.in" },
    productId: "aztech-coworks/booking",
    status: "CONFIRMED",
  };

  return new Promise((resolve, reject) => {
    createEvent(attrs, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}
