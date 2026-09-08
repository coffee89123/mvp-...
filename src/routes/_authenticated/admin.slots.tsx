import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addSlot, adminSlots, setSlotAvailability } from "@/lib/admin.functions";
import { formatDate, taipeiToday } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/admin/slots")({
  component: SlotsPage,
});

function SlotsPage() {
  const listFn = useServerFn(adminSlots);
  const toggleFn = useServerFn(setSlotAvailability);
  const addFn = useServerFn(addSlot);
  const qc = useQueryClient();

  const list = useQuery({ queryKey: ["admin-slots"], queryFn: () => listFn({}), retry: 1 });

  const [date, setDate] = useState(taipeiToday());
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("30");

  const grouped = useMemo(() => {
    const map = new Map<string, NonNullable<typeof list.data>>();
    for (const s of list.data ?? []) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return Array.from(map.entries());
  }, [list.data]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-slots"] });
    void qc.invalidateQueries({ queryKey: ["open-dates"] });
  };

  const toggle = useMutation({
    mutationFn: (v: { id: string; isAvailable: boolean }) => toggleFn({ data: v }),
    onSuccess: () => {
      toast.success("時段已更新。");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "時段更新失敗，請稍後再試。"),
  });

  const create = useMutation({
    mutationFn: () =>
      addFn({ data: { date, startTime, durationMinutes: Number(duration) || 30 } }),
    onSuccess: () => {
      toast.success("已新增時段。");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "新增時段失敗，請稍後再試。"),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">時段管理</h2>

      <Card className="border-border">
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground">新增可預約時段</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Input
              type="date"
              value={date}
              min={taipeiToday()}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              type="time"
              step={900}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="number"
              min={10}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              新增時段
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">時段長度以分鐘為單位，預設 30 分鐘。</p>
        </CardContent>
      </Card>

      {grouped.map(([day, slots]) => (
        <Card key={day} className="border-border">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-foreground">{formatDate(day)}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {s.start_time}–{s.end_time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.booked ? "已有預約" : s.is_available ? "開放預約" : "已關閉"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={toggle.isPending}
                    onClick={() => {
                      if (s.is_available && s.booked) {
                        toast.error("此時段已有預約，無法關閉。");
                        return;
                      }
                      toggle.mutate({ id: s.id, isAvailable: !s.is_available });
                    }}
                  >
                    {s.is_available ? "關閉" : "開啟"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {grouped.length === 0 && !list.isLoading && (
        <p className="text-muted-foreground">目前沒有未來的時段，請先新增。</p>
      )}
    </div>
  );
}
