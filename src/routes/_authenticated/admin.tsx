import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "儀表板", icon: LayoutDashboard, exact: true },
  { to: "/admin/appointments", label: "預約管理", icon: ListChecks, exact: false },
  { to: "/admin/customers", label: "客戶資料", icon: Users, exact: false },
  { to: "/admin/slots", label: "時段管理", icon: CalendarClock, exact: false },
  { to: "/admin/settings", label: "系統設定", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const checkFn = useServerFn(checkAdmin);
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => checkFn({}) });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (admin.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> 載入中…
      </div>
    );
  }

  if (!admin.data?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">您沒有管理員權限</h1>
        <p className="text-sm text-muted-foreground">請使用管理員帳號登入後再試。</p>
        <Button onClick={signOut}>返回登入</Button>
      </div>
    );
  }

  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          activeOptions={{ exact: item.exact }}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground font-medium" }}
        >
          <item.icon className="size-4" aria-hidden />
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={signOut}
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="size-4" aria-hidden />
        登出
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background px-4">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="開啟選單"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-base font-semibold text-primary sm:text-lg">預約管理中心</h1>
        <Link to="/" className="ml-auto text-sm text-muted-foreground hover:text-primary">
          回到網站
        </Link>
      </header>

      <div className="flex">
        <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
          <div className="sticky top-16">{sidebar}</div>
        </aside>
        {open ? (
          <div className="fixed inset-x-0 top-16 bottom-0 z-30 bg-sidebar lg:hidden">{sidebar}</div>
        ) : null}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
