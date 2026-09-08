import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  REASON_OPTIONS,
  formatDate,
  isValidEmail,
  isValidPhone,
  taipeiToday,
  toDateKey,
  weekdayLabel,
} from "@/lib/booking";
import { createBooking, listDaySlots, listOpenDates } from "@/lib/booking.functions";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "我要預約｜客戶預約服務中心" },
      { name: "description", content: "三個步驟完成線上預約：選擇時間、填寫資料、確認預約。" },
      { property: "og:title", content: "我要預約｜客戶預約服務中心" },
      { property: "og:description", content: "三個步驟完成線上預約，並取得專屬預約編號。" },
    ],
  }),
  component: BookPage,
});

const STEP_LABELS = ["選擇時間", "填寫資料", "確認預約"];

type Result = {
  booking_number: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  phone: string;
};

function BookPage() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", reason: "", note: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  const openDatesFn = useServerFn(listOpenDates);
  const slotsFn = useServerFn(listDaySlots);
  const createFn = useServerFn(createBooking);

  const openDates = useQuery({
    queryKey: ["open-dates"],
    queryFn: () => openDatesFn({}),
    retry: 2,
    retryDelay: 800,
  });
  const slots = useQuery({
    queryKey: ["slots", date],
    queryFn: () => slotsFn({ data: { date: date as string } }),
    enabled: Boolean(date),
    retry: 2,
    retryDelay: 800,
  });

  const booking = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          date: date as string,
          time: time as string,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          reason: form.reason,
          note: form.note || undefined,
        },
      }),
    onSuccess: (data) => setResult(data as Result),
    onError: (error: Error) => {
      toast.error(error.message || "預約未完成，請稍後再試。");
      if (error.message.includes("時段")) {
        setTime(null);
        setStep(1);
        void slots.refetch();
      }
    },
  });

  function validateForm() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = "請輸入姓名";
    if (!form.phone.trim()) next["phone"] = "請輸入手機號碼";
    else if (!isValidPhone(form.phone)) next["phone"] = "手機號碼格式不正確（例：0912345678）";
    if (form.email && !isValidEmail(form.email)) next["email"] = "Email 格式不正確";
    if (!form.reason) next["reason"] = "請選擇預約事項";
    if (form.note.length > 500) next["note"] = "備註最多 500 字";
    if (!agreed) next["agreed"] = "請勾選確認後才能繼續";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("請確認必填欄位是否已完成。");
      return false;
    }
    return true;
  }

  const openDateSet = new Set(openDates.data ?? []);
  const today = taipeiToday();

  if (result) {
    return (
      <Shell>
        <Card className="mx-auto max-w-xl border-border">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
            <h1 className="mt-4 text-2xl font-bold text-foreground">預約成功！</h1>
            <p className="mt-2 text-sm text-muted-foreground">您的預約已建立，請保留以下預約資訊。</p>
            <dl className="mt-6 divide-y divide-border rounded-lg border border-border text-left">
              <Row label="預約編號" value={result.booking_number} strong />
              <Row label="日期" value={formatDate(result.appointment_date)} />
              <Row label="時間" value={result.appointment_time.slice(0, 5)} />
              <Row label="姓名" value={result.customer_name} />
              <Row label="手機" value={result.phone} />
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-11">
                <Link to="/lookup">查詢預約</Link>
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link to="/">返回首頁</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-foreground">我要預約</h1>

      <ol className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`rounded-lg border px-3 py-3 text-sm ${
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : done
                    ? "border-border bg-secondary text-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              <span className="block text-xs">Step {n}</span>
              <span className="font-medium">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        {step === 1 ? (
          <section>
            <h2 className="text-lg font-semibold text-foreground">Step 1：選擇日期與時間</h2>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardContent className="flex justify-center pt-6">
                  <Calendar
                    mode="single"
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    onSelect={(d) => {
                      setTime(null);
                      setDate(d ? toDateKey(d) : null);
                    }}
                    disabled={(d) => {
                      const key = toDateKey(d);
                      return key < today || !openDateSet.has(key);
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  {!date ? (
                    <p className="text-sm text-muted-foreground">請先選擇預約日期。</p>
                  ) : slots.isLoading ? (
                    <Loading />
                  ) : (slots.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      目前此日期沒有可預約時段，請選擇其他日期。
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(date)}（{weekdayLabel(date)}）可預約時間
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {(slots.data ?? []).map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={slot.booked}
                            onClick={() => setTime(slot.start_time)}
                            className={`h-16 rounded-lg border text-sm transition-colors ${
                              slot.booked
                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                                : time === slot.start_time
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 hover:bg-secondary"
                            }`}
                          >
                            <span className="block text-base font-medium">{slot.start_time}</span>
                            <span className="block text-xs">{slot.booked ? "已預約" : "可預約"}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {date && time ? (
              <div className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm text-primary">
                <p>預約日期：{formatDate(date)}</p>
                <p className="mt-1">預約時間：{time}</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button className="h-11 sm:ml-auto" disabled={!date || !time} onClick={() => setStep(2)}>
                下一步
              </Button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <h2 className="text-lg font-semibold text-foreground">Step 2：填寫預約資料</h2>
            <Card className="mt-4 border-border">
              <CardContent className="space-y-5 pt-6">
                <Field label="姓名" required error={errors["name"]}>
                  <Input
                    className="h-11"
                    placeholder="請輸入姓名"
                    maxLength={50}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="手機號碼" required error={errors["phone"]}>
                  <Input
                    className="h-11"
                    inputMode="tel"
                    placeholder="請輸入手機號碼"
                    maxLength={15}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Email（非必填）" error={errors["email"]}>
                  <Input
                    className="h-11"
                    type="email"
                    placeholder="請輸入 Email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="預約事項" required error={errors["reason"]}>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="請選擇預約事項" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="備註（非必填）" error={errors["note"]}>
                  <Textarea
                    placeholder="如有其他需要提前告知的事項，請在此填寫"
                    maxLength={500}
                    rows={4}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">{form.note.length}/500</p>
                </Field>

                <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">個人資料使用說明</p>
                  <p className="mt-1">
                    您提供的資料僅用於本次預約聯繫與服務安排，請勿填寫非預約所需的敏感資訊。
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="agree" className="text-sm leading-relaxed font-normal">
                    我已確認以上資料正確，並同意提供資料進行本次預約。
                  </Label>
                </div>
                {errors["agreed"] ? (
                  <p className="text-sm text-destructive">{errors["agreed"]}</p>
                ) : null}
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" className="h-11" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                className="h-11"
                onClick={() => {
                  if (validateForm()) setStep(3);
                }}
              >
                下一步
              </Button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <h2 className="text-lg font-semibold text-foreground">Step 3：確認預約</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold text-foreground">預約資訊</h3>
                  <dl className="mt-4 divide-y divide-border">
                    <Row label="日期" value={date ? formatDate(date) : ""} />
                    <Row label="時間" value={time ?? ""} />
                  </dl>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold text-foreground">聯絡資料</h3>
                  <dl className="mt-4 divide-y divide-border">
                    <Row label="姓名" value={form.name} />
                    <Row label="手機" value={form.phone} />
                    <Row label="Email" value={form.email || "未填寫"} />
                    <Row label="預約事項" value={form.reason} />
                    <Row label="備註" value={form.note || "未填寫"} />
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" className="h-11" onClick={() => setStep(2)}>
                返回修改
              </Button>
              <Button className="h-11" disabled={booking.isPending} onClick={() => booking.mutate()}>
                {booking.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                確認預約
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Loading() {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> 載入中…
    </p>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block text-sm">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`text-right ${strong ? "text-base font-semibold text-primary" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
