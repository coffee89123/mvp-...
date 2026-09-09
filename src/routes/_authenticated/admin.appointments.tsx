import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminAppointmentProfile,
  adminAppointments,
  updateAppointmentStatus,
} from "@/lib/admin.functions";
import { STATUS_CLASS, STATUS_LABEL, formatDate, type AppointmentStatus } from "@/lib/booking";
import { toMinguo } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  component: AppointmentsPage,
});

type Row = {
  id: string;
  booking_number: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  phone: string;
  email: string | null;
  
  appointment_reason: string;
  note: string | null;
  status: string;
};

function AppointmentsPage() {
  const listFn = useServerFn(adminAppointments);
  const updateFn = useServerFn(updateAppointmentStatus);
  const qc = useQueryClient();

  const list = useQuery({ queryKey: ["admin-appointments"], queryFn: () => listFn({}), retry: 1 });

  const [keyword, setKeyword] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [detail, setDetail] = useState<Row | null>(null);

  const profileFn = useServerFn(adminAppointmentProfile);
  const profile = useQuery({
    queryKey: ["admin-appointment-profile", detail?.id],
    queryFn: () => profileFn({ data: { appointmentId: detail?.id as string } }),
    enabled: Boolean(detail?.id),
    retry: 1,
  });

  const rows = (list.data ?? []) as Row[];

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (
        kw &&
        !`${r.customer_name} ${r.phone} ${r.booking_number}`.toLowerCase().includes(kw)
      )
        return false;
      if (date && r.appointment_date !== date) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
    const key = (r: Row) => `${r.appointment_date} ${r.appointment_time}`;
    return out.sort((a, b) =>
      sort === "oldest" ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a)),
    );
  }, [rows, keyword, date, status, sort]);

  const mutate = useMutation({
    mutationFn: (v: { id: string; status: AppointmentStatus }) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("狀態已更新。");
      setDetail(null);
      void qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message || "狀態更新失敗，請稍後再試。"),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">預約管理</h2>

      <Card className="border-border">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <Input
            placeholder="搜尋姓名、手機或預約編號"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="md:col-span-2"
          />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="booked">已預約</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="no_show">未到</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">日期由新到舊</SelectItem>
              <SelectItem value="oldest">日期由舊到新</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">預約編號</th>
                <th className="pb-3 pr-4 font-medium">日期</th>
                <th className="pb-3 pr-4 font-medium">時間</th>
                <th className="pb-3 pr-4 font-medium">姓名</th>
                <th className="pb-3 pr-4 font-medium">手機</th>
                <th className="pb-3 pr-4 font-medium">狀態</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium text-foreground">{r.booking_number}</td>
                  <td className="py-3 pr-4">{r.appointment_date}</td>
                  <td className="py-3 pr-4">{r.appointment_time.slice(0, 5)}</td>
                  <td className="py-3 pr-4">{r.customer_name}</td>
                  <td className="py-3 pr-4">{r.phone}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[r.status as AppointmentStatus] ?? ""}`}
                    >
                      {STATUS_LABEL[r.status as AppointmentStatus] ?? r.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" onClick={() => setDetail(r)}>
                      詳細資料
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    目前沒有符合條件的預約資料。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>預約詳細資料</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <Line label="預約編號" value={detail.booking_number} />
              <Line label="預約日期" value={formatDate(detail.appointment_date)} />
              <Line label="預約時間" value={detail.appointment_time.slice(0, 5)} />
              <Line label="姓名" value={detail.customer_name} />
              <Line label="手機" value={detail.phone} />
              <Line label="Email" value={detail.email ?? "（未填寫）"} />
              <Line label="預約事項" value={detail.appointment_reason} />
              <Line label="備註" value={detail.note ?? "（無）"} />
              <Line
                label="目前狀態"
                value={STATUS_LABEL[detail.status as AppointmentStatus] ?? detail.status}
              />

              <div className="pt-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">客戶基本資料</h3>
                {profile.isLoading ? (
                  <p className="text-muted-foreground">載入中…</p>
                ) : profile.data ? (
                  <ProfileView data={profile.data as Record<string, any>} />
                ) : (
                  <p className="text-muted-foreground">未填寫</p>
                )}
              </div>

              {detail.status === "booked" ? (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => mutate.mutate({ id: detail.id, status: "completed" })}
                    disabled={mutate.isPending}
                  >
                    標記為已完成
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => mutate.mutate({ id: detail.id, status: "cancelled" })}
                    disabled={mutate.isPending}
                  >
                    取消此預約
                  </Button>
                </div>
              ) : (
                <p className="pt-4 text-muted-foreground">此預約已結案，無法再變更狀態。</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function ProfileView({ data }: { data: Record<string, any> }) {
  const t = (v: unknown) => (v === undefined || v === null || v === "" ? "（未填寫）" : String(v));
  const other = (v: unknown, o: unknown) => (v === "其他" && o ? `其他：${String(o)}` : t(v));
  const addr = (zip: unknown, city: unknown, dist: unknown, street: unknown) =>
    t(`${t(zip) === "（未填寫）" ? "" : zip} ${city ?? ""}${dist ?? ""}${street ?? ""}`.trim());
  const reps: Record<string, any>[] = Array.isArray(data["reps"]) ? data["reps"] : [];

  return (
    <div className="space-y-5">
      <Group title="委託人基本資料">
        <Line label="委託人姓名" value={t(data["clientName"])} />
        <Line label="身分證字號／統一編號" value={t(data["clientId"])} />
        <Line label="生日" value={toMinguo(String(data["clientBirth"] ?? "")) || "（未填寫）"} />
        <Line label="國籍" value={t(data["nationality"])} />
        <Line label="性別" value={t(data["gender"])} />
        <Line label="出生地" value={t(data["birthPlace"])} />
        <Line label="住家電話" value={t(data["homePhone"])} />
        <Line label="手機" value={t(data["mobilePhone"])} />
      </Group>

      <Group title="地址資訊">
        <Line
          label="戶籍地址"
          value={addr(data["hZip"], data["hCity"], data["hDistrict"], data["hStreet"])}
        />
        <Line
          label="通訊地址"
          value={addr(data["mZip"], data["mCity"], data["mDistrict"], data["mStreet"])}
        />
      </Group>

      <Group title="聯絡與電子郵件">
        <Line label="E-mail" value={t(data["email"])} />
        <Line label="緊急聯絡人" value={t(data["emergencyName"])} />
        <Line label="緊急聯絡人關係" value={t(data["emergencyRelation"])} />
        <Line label="緊急聯絡人手機" value={t(data["emergencyPhone"])} />
      </Group>

      <Group title="學歷與職業概況">
        <Line label="教育程度" value={other(data["education"], data["educationOther"])} />
        <Line label="就業狀態" value={other(data["employment"], data["employmentOther"])} />
        <Line label="服務機構名稱" value={t(data["companyName"])} />
        <Line label="服務機構電話" value={t(data["companyPhone"])} />
        <Line label="職稱" value={t(data["jobTitle"])} />
        <Line label="行業類別" value={other(data["industry"], data["industryOther"])} />
      </Group>

      {reps.map((r, i) => (
        <Group key={i} title={`法定代理人${i === 0 ? "一" : "二"}`}>
          <Line label="姓名" value={t(r["name"])} />
          <Line label="身分證字號" value={t(r["id"])} />
          <Line label="手機" value={t(r["phone"])} />
          <Line label="就業狀態" value={other(r["employment"], r["employmentOther"])} />
          <Line label="服務機構名稱" value={t(r["company"])} />
          <Line label="服務機構電話" value={t(r["companyPhone"])} />
          <Line label="職稱" value={t(r["title"])} />
          <Line label="行業別" value={t(r["industry"])} />
          <Line label="E-mail" value={t(r["email"])} />
        </Group>
      ))}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 border-b border-border pb-1 text-sm font-bold text-foreground">{title}</p>
      {children}
    </div>
  );
}

