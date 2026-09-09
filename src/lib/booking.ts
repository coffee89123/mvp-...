export type AppointmentStatus = "booked" | "completed" | "cancelled" | "no_show";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  booked: "已預約",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到",
};

export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

export const REASON_OPTIONS = ["未成年開戶"];

/** 以台灣時區（Asia/Taipei）取得今天的 YYYY-MM-DD */
export function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(dateKey: string): string {
  return dateKey.replaceAll("-", "/");
}

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  return `星期${WEEKDAYS[date.getUTCDay()]}`;
}

export function isValidPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone.replace(/[\s-]/g, ""));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)}-***-${phone.slice(-3)}`;
}
