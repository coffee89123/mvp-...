import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">系統設定</h2>

      <Card className="border-border">
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground">預約流程</h3>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. 選擇時間</li>
            <li>2. 填寫資料</li>
            <li>3. 確認預約</li>
          </ol>
        </CardContent>
      </Card>


      <Card className="border-border">
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground">資料安全說明</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• 預約資料僅供管理員登入後查看，一般訪客無法讀取任何客戶資料。</li>
            <li>• 客戶僅能透過「預約編號 + 手機號碼」查詢自己的預約。</li>
            <li>• 系統不收集身分證字號、金融帳號、密碼或信用卡等敏感資訊。</li>
            <li>• 所有日期與時間皆以台灣時區（Asia/Taipei）處理。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
