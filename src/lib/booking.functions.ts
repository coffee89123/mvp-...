import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { taipeiToday } from "./booking";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正確");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}




/** 取得某日期的可預約時段（含已被預約狀態） */
export const listDaySlots = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string }) => z.object({ date: dateSchema }).parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const [slotsRes, apptRes] = await Promise.all([
      db
        .from("time_slots")
        .select("id, start_time, end_time, is_available")
        .eq("date", data.date)
        .eq("is_available", true)
        .order("start_time", { ascending: true }),
      db
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", data.date)
        .neq("status", "cancelled"),
    ]);
    if (slotsRes.error || apptRes.error) throw new Error("時段載入失敗，請稍後再試。");
    const taken = new Set((apptRes.data ?? []).map((a) => a.appointment_time.slice(0, 5)));
    const past = data.date < taipeiToday();
    return (slotsRes.data ?? []).map((s) => ({
      id: s.id,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
      booked: past || taken.has(s.start_time.slice(0, 5)),
    }));
  });

/** 取得未來有開放時段的日期清單 */
export const listOpenDates = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const today = taipeiToday();
  const { data, error } = await db
    .from("time_slots")
    .select("date")
    .eq("is_available", true)
    .gte("date", today)
    .order("date", { ascending: true });
  if (error) throw new Error("日期載入失敗，請稍後再試。");
  return Array.from(new Set((data ?? []).map((r) => r.date)));
});

const bookingSchema = z.object({
  date: dateSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/, "時間格式不正確"),
  name: z.string().trim().min(1, "請輸入姓名").max(50, "姓名過長"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^09\d{8}$/.test(v), "手機號碼格式不正確"),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Email 格式不正確"),
  reason: z.string().trim().min(1, "請選擇預約事項"),
  note: z.string().trim().max(500, "備註最多 500 字").optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();

    if (data.date < taipeiToday()) {
      throw new Error("不可預約過去的日期，請重新選擇。");
    }

    const { data: slot } = await db
      .from("time_slots")
      .select("id")
      .eq("date", data.date)
      .eq("start_time", `${data.time}:00`)
      .eq("is_available", true)
      .maybeSingle();
    if (!slot) throw new Error("很抱歉，此時段目前無法預約，請重新選擇時間。");

    const { data: created, error } = await db
      .from("appointments")
      .insert({
        booking_number: "",
        appointment_date: data.date,
        appointment_time: `${data.time}:00`,
        customer_name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        appointment_reason: data.reason,
        service_name: data.reason,
        note: data.note ?? null,
        status: "booked",
      })
      .select("id, booking_number, appointment_date, appointment_time, customer_name, phone")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("很抱歉，此時段剛剛已被其他客戶預約，請重新選擇時間。");
      }
      throw new Error("預約未完成，請稍後再試。");
    }

    if (data.profile) {
      const { error: profileError } = await db
        .from("appointment_profiles")
        .insert({ appointment_id: created.id, data: data.profile as never });
      if (profileError) throw new Error("基本資料儲存失敗，請聯繫客服確認預約。");
    }

    return created;
  });

const lookupSchema = z.object({
  bookingNumber: z.string().trim().min(1, "請輸入預約編號").max(40),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^09\d{8}$/.test(v), "手機號碼格式不正確"),
});

export const lookupBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("appointments")
      .select(
        "booking_number, appointment_date, appointment_time, customer_name, appointment_reason, note, status",
      )
      .eq("booking_number", data.bookingNumber.trim().toUpperCase())
      .eq("phone", data.phone)
      .maybeSingle();
    if (!row) throw new Error("查無此預約，請確認預約編號與手機號碼是否正確。");
    return row;
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("appointments")
      .select("id, status")
      .eq("booking_number", data.bookingNumber.trim().toUpperCase())
      .eq("phone", data.phone)
      .maybeSingle();
    if (!row) throw new Error("查無此預約，請確認預約編號與手機號碼是否正確。");
    if (row.status === "cancelled") throw new Error("這筆預約已經取消。");
    if (row.status !== "booked") throw new Error("這筆預約目前無法取消，請聯繫客服。");

    const { error } = await db.from("appointments").update({ status: "cancelled" }).eq("id", row.id);
    if (error) throw new Error("取消未完成，請稍後再試。");
    return { ok: true };
  });
