import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUS_CLASS, STATUS_LABEL, formatDate, type AppointmentStatus } from "@/lib/booking";
import { cancelBooking, lookupBooking } from "@/lib/booking.functions";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "查詢預約｜客戶預約服務中心" },
      { name: "description", content: "輸入預約編號與手機號碼，即可查詢預約狀態或取消預約。" },
      { property: "og:title", content: "查詢預約｜客戶預約服務中心" },
      { property: "og:description", content: "輸入預約編號與手機號碼，即可查詢預約狀態或取消預約。" },
    ],
  }),
  component: LookupPage,
});

type Booking = {
  booking_number: string;
  
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  appointment_reason: string;
  note: string | null;
  status: string;
};

function LookupPage() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lookupFn = useServerFn(lookupBooking);
  const cancelFn = useServerFn(cancelBooking);

  const lookup = useMutation({
    mutationFn: () => lookupFn({ data: { bookingNumber, phone } }),
    onSuccess: (data) => setBooking(data as Booking),
    onError: (e: Error) => {
      setBooking(null);
      toast.error(e.message || "查詢失敗，請稍後再試。");
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { bookingNumber, phone } }),
    onSuccess: () => {
      setConfirmOpen(false);
      toast.success("預約已取消，該時段已重新開放預約。");
      lookup.mutate();
    },
    onError: (e: Error) => toast.error(e.message || "取消未完成，請稍後再試。"),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">查詢預約</h1>
        <p className="mt-2 text-sm text-muted-foreground">請輸入預約編號與預約時填寫的手機號碼。</p>

        <Card className="mt-6 border-border">
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="mb-2 block">預約編號</Label>
              <Input
                className="h-11"
                placeholder="例：BK-20260910-001"
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">手機號碼</Label>
              <Input
                className="h-11"
                inputMode="tel"
                placeholder="請輸入手機號碼"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button
              className="h-11 w-full"
              disabled={lookup.isPending}
              onClick={() => {
                if (!bookingNumber.trim() || !phone.trim()) {
                  toast.error("請確認必填欄位是否已完成。");
                  return;
                }
                lookup.mutate();
              }}
            >
              {lookup.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              查詢預約
            </Button>
          </CardContent>
        </Card>

        {booking ? (
          <Card className="mt-6 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-primary">{booking.booking_number}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_CLASS[booking.status as AppointmentStatus]
                  }`}
                >
                  {STATUS_LABEL[booking.status as AppointmentStatus]}
                </span>
              </div>
              <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
                
                <Row label="日期" value={formatDate(booking.appointment_date)} />
                <Row label="時間" value={booking.appointment_time.slice(0, 5)} />
                <Row label="姓名" value={booking.customer_name} />
                <Row label="預約事項" value={booking.appointment_reason} />
                <Row label="備註" value={booking.note || "未填寫"} />
              </dl>

              {booking.status === "booked" ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button variant="destructive" className="h-11" onClick={() => setConfirmOpen(true)}>
                    取消預約
                  </Button>
                  <Button asChild variant="outline" className="h-11">
                    <Link to="/book">修改預約（重新預約新時段）</Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">此預約已結案，如需協助請聯繫客服。</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
      <SiteFooter />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要取消這筆預約嗎？</AlertDialogTitle>
            <AlertDialogDescription>取消後該時段將重新開放給其他客戶預約。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancel.mutate();
              }}
            >
              確認取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
