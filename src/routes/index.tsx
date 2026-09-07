import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, CheckCircle2, UserRound, Info } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "客戶預約服務中心｜線上預約專人服務" },
      {
        name: "description",
        content: "線上選擇服務項目與方便的時間，快速完成預約。支援開戶諮詢、開戶協助、補件協助與其他諮詢。",
      },
      { property: "og:title", content: "客戶預約服務中心｜線上預約專人服務" },
      {
        property: "og:description",
        content: "線上選擇服務項目與方便的時間，快速完成預約，並可隨時查詢或取消預約。",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  { icon: ClipboardList, title: "選擇服務", desc: "挑選您需要的服務項目。" },
  { icon: CalendarDays, title: "選擇日期與時間", desc: "查看可預約時段並選擇。" },
  { icon: UserRound, title: "填寫基本資料", desc: "留下聯絡方式方便我們與您聯繫。" },
  { icon: CheckCircle2, title: "完成預約", desc: "取得專屬預約編號。" },
];

const NOTES = [
  "請確認預約日期與時間",
  "預約資料請填寫正確",
  "如需取消或修改預約，請使用預約查詢功能",
  "如有其他問題，請聯繫客服",
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-secondary/50">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                線上預約服務
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                歡迎使用客戶預約服務中心
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                請選擇您需要的服務與方便的時間，我們將為您安排服務。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 text-base">
                  <Link to="/book">立即預約</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 text-base">
                  <Link to="/lookup">查詢預約</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">預約流程</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Card key={step.title} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">步驟 {i + 1}</p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <Card className="border-border bg-secondary/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-primary">
                <Info className="size-5" aria-hidden />
                <h2 className="text-lg font-semibold">預約注意事項</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {NOTES.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
