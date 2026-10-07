import type { Booking, Hours } from "./types";
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function minutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }
export function bookingSlots(hours: Hours[], date: string, duration: number) {
  const day = new Date(`${date}T12:00:00`).getDay();
  const schedule = hours.find(h => h.day.startsWith(["일", "월", "화", "수", "목", "금", "토"][day]));
  if (!schedule || schedule.closed) return [];
  const slots: string[] = [];
  for (let value = Math.ceil(minutes(schedule.open) / 30) * 30; value + duration <= minutes(schedule.close); value += 30) {
    slots.push(`${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`);
  }
  return slots;
}
export function slotBooked(bookings: Booking[], date: string, time: string, doctorId: string, duration: number, durationOf: (id: string) => number) {
  const start = minutes(time);
  return bookings.some(b => b.status !== "취소" && b.date === date && b.doctorId === doctorId && start < minutes(b.time) + durationOf(b.treatmentId) && start + duration > minutes(b.time));
}
