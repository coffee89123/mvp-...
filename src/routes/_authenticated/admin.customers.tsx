import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminCustomers } from "@/lib/admin.functions";
import { formatDate } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: Customers,
});

function Customers() {
  const fn = useServerFn(adminCustomers);
  const query = useQuery({ queryKey: ["admin-customers"], queryFn: () => fn({}) });
  const [keyword, setKeyword] = useState("");

  const list = (query.data ?? []).filter(
    (c) => c.name.includes(keyword) || c.phone.includes(keyword.trim()),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">客戶資料</h2>
      <Card className="border-border">
        <CardContent className="pt-6">
          <Input
            className="h-11 max-w-sm"
            placeholder="搜尋姓名或手機"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {query.isLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> 載入中…
            </p>
          ) : list.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">目前沒有符合條件的客戶。</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">姓名</th>
                    <th className="py-2 pr-4 font-medium">手機</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">預約次數</th>
                    <th className="py-2 font-medium">最近預約日</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.phone} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4">{c.name}</td>
                      <td className="py-3 pr-4">{c.phone}</td>
                      <td className="py-3 pr-4">{c.email ?? "—"}</td>
                      <td className="py-3 pr-4">{c.total}</td>
                      <td className="py-3">{formatDate(c.lastDate)}</td>
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
