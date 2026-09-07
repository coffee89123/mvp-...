import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, bootstrapAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "管理員登入｜客戶預約服務中心" },
      { name: "description", content: "管理員登入預約管理中心，管理預約、客戶資料與可預約時段。" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "管理員登入｜客戶預約服務中心" },
      { property: "og:description", content: "管理員登入預約管理中心。" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const existsFn = useServerFn(adminExists);
  const bootstrapFn = useServerFn(bootstrapAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const existing = useQuery({ queryKey: ["admin-exists"], queryFn: () => existsFn({}) });
  const needsSetup = existing.data?.exists === false;

  const signIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("帳號或密碼不正確，請重新輸入。");
    },
    onSuccess: () => navigate({ to: "/admin" }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setup = useMutation({
    mutationFn: async () => {
      await bootstrapFn({ data: { email: email.trim(), password } });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("管理員已建立，請重新登入。");
    },
    onSuccess: () => {
      toast.success("管理員帳號已建立。");
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => {
      toast.error(e.message || "建立失敗，請稍後再試。");
      void existing.refetch();
    },
  });

  const pending = signIn.isPending || setup.isPending;

  function submit() {
    if (!email.trim() || !password) {
      toast.error("請確認必填欄位是否已完成。");
      return;
    }
    if (needsSetup) setup.mutate();
    else signIn.mutate();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Card className="border-border">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" aria-hidden />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground">管理員登入</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {needsSetup ? "系統尚未設定管理員，請建立第一組管理員帳號。" : "請輸入管理員帳號與密碼。"}
              </p>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div>
                <Label className="mb-2 block">帳號（Email）</Label>
                <Input
                  className="h-11"
                  type="email"
                  autoComplete="username"
                  placeholder="請輸入管理員 Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">密碼</Label>
                <Input
                  className="h-11"
                  type="password"
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  placeholder={needsSetup ? "請設定至少 8 位密碼" : "請輸入密碼"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {needsSetup ? "建立管理員並登入" : "登入"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
