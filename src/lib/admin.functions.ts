import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { taipeiToday } from "./booking";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("您沒有管理員權限。");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

/** 建立第一位管理員（僅在系統尚無管理員時可用） */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("Email 格式不正確"),
        password: z.string().min(8, "密碼至少需 8 個字元").max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("系統已有管理員帳號，請直接登入。");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error("建立管理員失敗，請稍後再試。");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleError) throw new Error("建立管理員權限失敗，請稍後再試。");
    return { ok: true };
  });

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context);
    const today = taipeiToday();
    const { data: todayRows } = await db
      .from("appointments")
      .select("booking_number, appointment_time, customer_name, service_name, status")
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });
    const { data: allRows } = await db.from("appointments").select("status");
    const rows = allRows ?? [];
    return {
      today,
      stats: {
        today: (todayRows ?? []).filter((r) => r.status !== "cancelled").length,
        pending: rows.filter((r) => r.status === "booked").length,
        completed: rows.filter((r) => r.status === "completed").length,
        cancelled: rows.filter((r) => r.status === "cancelled").length,
      },
      todayList: todayRows ?? [],
    };
  });

export const adminAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context);
    const { data, error } = await db
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) throw new Error("預約資料載入失敗。");
    return data ?? [];
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["booked", "completed", "cancelled", "no_show"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context);
    const { error } = await db.from("appointments").update({ status: data.status }).eq("id", data.id);
    if (error) {
      if (error.code === "23505") throw new Error("此時段已有其他有效預約，無法改回已預約。");
      throw new Error("狀態更新失敗，請稍後再試。");
    }
    return { ok: true };
  });

export const adminSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context);
    const today = taipeiToday();
    const [slotsRes, apptRes] = await Promise.all([
      db
        .from("time_slots")
        .select("id, date, start_time, end_time, is_available")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
      db
        .from("appointments")
        .select("appointment_date, appointment_time")
        .gte("appointment_date", today)
        .neq("status", "cancelled"),
    ]);
    const taken = new Set(
      (apptRes.data ?? []).map((a) => `${a.appointment_date} ${a.appointment_time.slice(0, 5)}`),
    );
    return (slotsRes.data ?? []).map((s) => ({
      id: s.id,
      date: s.date,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
      is_available: s.is_available,
      booked: taken.has(`${s.date} ${s.start_time.slice(0, 5)}`),
    }));
  });

export const setSlotAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isAvailable: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context);
    const { data: slot } = await db
      .from("time_slots")
      .select("date, start_time")
      .eq("id", data.id)
      .maybeSingle();
    if (!slot) throw new Error("找不到此時段。");

    if (!data.isAvailable) {
      const { count } = await db
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", slot.date)
        .eq("appointment_time", slot.start_time)
        .neq("status", "cancelled");
      if ((count ?? 0) > 0) throw new Error("此時段已有預約，無法關閉。");
    }

    const { error } = await db
      .from("time_slots")
      .update({ is_available: data.isAvailable })
      .eq("id", data.id);
    if (error) throw new Error("時段更新失敗，請稍後再試。");
    return { ok: true };
  });

export const addSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正確"),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間格式不正確"),
        durationMinutes: z.number().int().min(10).max(180).default(30),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context);
    if (data.date < taipeiToday()) throw new Error("不可新增過去日期的時段。");
    const [h, m] = data.startTime.split(":").map(Number);
    const total = (h ?? 0) * 60 + (m ?? 0) + data.durationMinutes;
    const end = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
    const { error } = await db
      .from("time_slots")
      .insert({ date: data.date, start_time: `${data.startTime}:00`, end_time: end, is_available: true });
    if (error) {
      if (error.code === "23505") throw new Error("此日期已有相同開始時間的時段。");
      throw new Error("新增時段失敗，請稍後再試。");
    }
    return { ok: true };
  });

export const adminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context);
    const { data } = await db
      .from("appointments")
      .select("customer_name, phone, email, appointment_date, status, created_at")
      .order("created_at", { ascending: false });
    const map = new Map<
      string,
      { name: string; phone: string; email: string | null; total: number; lastDate: string }
    >();
    for (const row of data ?? []) {
      const existing = map.get(row.phone);
      if (existing) {
        existing.total += 1;
        if (row.appointment_date > existing.lastDate) existing.lastDate = row.appointment_date;
        if (!existing.email && row.email) existing.email = row.email;
      } else {
        map.set(row.phone, {
          name: row.customer_name,
          phone: row.phone,
          email: row.email,
          total: 1,
          lastDate: row.appointment_date,
        });
      }
    }
    return Array.from(map.values());
  });
