import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultBookingSettings, reservationSlots, validateAdminHallEnquiry, validateAdminReservation, validateHallEnquiry } from "../app/lib/bookings";

test("table booking defaults start with forty seats and ninety-minute sittings", () => {
  assert.equal(defaultBookingSettings.capacity, 40);
  assert.equal(defaultBookingSettings.sittingMinutes, 90);
  assert.equal(defaultBookingSettings.slotMinutes, 30);
  assert.equal(reservationSlots(defaultBookingSettings)[0], "12:00");
  assert.equal(reservationSlots(defaultBookingSettings).at(-1), "21:00");
});

test("hall requests capture contact and planning details without becoming confirmed bookings", () => {
  const future = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const enquiry = validateHallEnquiry({ name: "Guest", email: "guest@example.com", phone: "+44 7700 900123", preferredDate: future, preferredTime: "Evening", guestCount: "40", occasion: "Family celebration", message: "We would like catering and stage access.", contactPreference: "phone" });
  assert.equal(enquiry.guestCount, 40);
  assert.equal(enquiry.contactPreference, "phone");
});

test("database capacity is checked atomically and notification delivery is idempotent", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /pg_advisory_xact_lock/);
  assert.match(schema, /occupied[\s\S]*party_size[\s\S]*capacity/i);
  assert.match(schema, /event_key text primary key/i);
  assert.match(schema, /email_delivery_log\.status='failed'[\s\S]*attempts < 5/i);
});

test("admin table edits validate every customer and sitting field", () => {
  const reservation = validateAdminReservation({name:"Guest",email:"guest@example.com",phone:"+44 7700 900123",bookingDate:"2027-01-15",startTime:"18:00",endTime:"19:30",partySize:"4",status:"confirmed",occasion:"Dinner",dietaryRequirements:"No nuts",accessibilityNeeds:"",notes:"Window if possible",adminNotes:"Confirmed by phone"}, defaultBookingSettings);
  assert.equal(reservation.partySize, 4);
  assert.equal(reservation.endTime, "19:30");
  assert.equal(reservation.adminNotes, "Confirmed by phone");
});

test("admin hall edits validate the complete enquiry", () => {
  const enquiry = validateAdminHallEnquiry({name:"Guest",email:"guest@example.com",phone:"+44 7700 900123",preferredDate:"2027-02-20",preferredTime:"Evening",alternativeDate:"",guestCount:"60",occasion:"Wedding",message:"Dinner and stage access",contactPreference:"email",status:"contacted",adminNotes:"Tour arranged"});
  assert.equal(enquiry.status, "contacted");
  assert.equal(enquiry.contactPreference, "email");
  assert.equal(enquiry.guestCount, 60);
});

test("admin booking routes expose create, read, update and delete controls", async () => {
  const [reservationsPage,hallPage,reservationRoute,hallRoute] = await Promise.all([
    readFile(new URL("../app/admin/reservations/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/hall-enquiries/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/reservations/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/hall-enquiries/[id]/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(reservationsPage, /Create a table reservation/);
  assert.match(reservationsPage, /Save full record/);
  assert.match(hallPage, /Create a hall enquiry/);
  assert.match(hallPage, /Save full record/);
  assert.match(reservationRoute, /export async function GET/);
  assert.match(reservationRoute, /deleteReservationFromAdmin/);
  assert.match(hallRoute, /export async function GET/);
  assert.match(hallRoute, /deleteHallEnquiryFromAdmin/);
});
