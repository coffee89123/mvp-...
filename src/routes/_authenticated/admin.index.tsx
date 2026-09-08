import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { adminDashboard } from "@/lib/admin.functions";
import { STATUS_CLASS, STATUS_LABEL, formatDate, type AppointmentStatus } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(adminDashboard);
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fn({}) });

  if (query.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> 載入中…
      </p>
    );
  }
  if (query.error) {
    return <p className="text-sm text-destructive">資料載入失敗，請稍後再試。</p>;
  }

  const data = query.data!;
  const cards = [
    { label: "今日預約", value: data.stats.today },
    { label: "待處理", value: data.stats.pending },
    { label: "已完成", value: data.stats.completed },
    { label: "已取消", value: data.stats.cancelled },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">儀表板</h2>
        <p className="mt-1 text-sm text-muted-foreground">今日日期：{formatDate(data.today)}（台灣時間）</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-3xl font-bold text-primary">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground">今日預約</h3>
          {data.todayList.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">今日目前沒有預約。</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">時間</th>
                    <th className="py-2 pr-4 font-medium">客戶</th>
                    
                    <th className="py-2 font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayList.map((row) => (
                    <tr key={row.booking_number} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4">{row.appointment_time.slice(0, 5)}</td>
                      <td className="py-3 pr-4">{row.customer_name}</td>
                      
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${STATUS_CLASS[row.status as AppointmentStatus]}`}
                        >
                          {STATUS_LABEL[row.status as AppointmentStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
