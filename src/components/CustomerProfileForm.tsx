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
import {
  CITIES,
  EDUCATIONS,
  EMPLOYMENTS,
  INDUSTRIES,
  type ProfileData,
  type Representative,
  toMinguo,
} from "@/lib/profile";

type Props = {
  value: ProfileData;
  onChange: (next: ProfileData) => void;
  errors: Record<string, string>;
};

export function CustomerProfileForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof ProfileData>(key: K, v: ProfileData[K]) =>
    onChange({ ...value, [key]: v });

  const setRep = (index: 0 | 1, key: keyof Representative, v: string) => {
    const reps = [value.reps[0], value.reps[1]] as [Representative, Representative];
    reps[index] = { ...reps[index], [key]: v };
    onChange({ ...value, reps });
  };

  const mailDisabled = value.sameAsHousehold;

  return (
    <div className="space-y-6">
      <Block title="區塊一：委託人基本資料">
        <Grid>
          <Field label="委託人姓名" required error={errors["clientName"]}>
            <Input
              className="h-11"
              maxLength={50}
              value={value.clientName}
              onChange={(e) => set("clientName", e.target.value)}
            />
          </Field>
          <Field label="身分證字號／統一編號" required error={errors["clientId"]}>
            <Input
              className="h-11"
              maxLength={20}
              placeholder="A123456789 或 12345678"
              value={value.clientId}
              onChange={(e) => set("clientId", e.target.value.toUpperCase())}
            />
          </Field>
          <Field
            label="生日"
            required
            error={errors["clientBirth"]}
            hint={value.clientBirth ? toMinguo(value.clientBirth) : "請選擇日期，將顯示民國年月日"}
          >
            <Input
              className="h-11"
              type="date"
              value={value.clientBirth}
              onChange={(e) => set("clientBirth", e.target.value)}
            />
          </Field>
          <Field label="出生地" error={errors["birthPlace"]}>
            <Input
              className="h-11"
              maxLength={50}
              value={value.birthPlace}
              onChange={(e) => set("birthPlace", e.target.value)}
            />
          </Field>
          <Field label="國籍" required>
            <Radios
              name="nationality"
              options={["本國", "外國人"]}
              value={value.nationality}
              onChange={(v) => set("nationality", v)}
            />
          </Field>
          <Field label="性別" required error={errors["gender"]}>
            <Radios
              name="gender"
              options={["男", "女"]}
              value={value.gender}
              onChange={(v) => set("gender", v)}
            />
          </Field>
          <Field label="聯絡電話（住家）" error={errors["homePhone"]}>
            <Input
              className="h-11"
              inputMode="tel"
              maxLength={20}
              value={value.homePhone}
              onChange={(e) => set("homePhone", e.target.value)}
            />
          </Field>
          <Field label="聯絡電話（手機）" required error={errors["mobilePhone"]}>
            <Input
              className="h-11"
              inputMode="tel"
              maxLength={20}
              value={value.mobilePhone}
              onChange={(e) => set("mobilePhone", e.target.value)}
            />
          </Field>
        </Grid>
      </Block>

      <Block title="區塊二：地址資訊">
        <p className="text-sm font-semibold text-foreground">戶籍地址</p>
        <Grid className="mt-3">
          <Field label="郵遞區號">
            <Input
              className="h-11"
              inputMode="numeric"
              maxLength={6}
              value={value.hZip}
              onChange={(e) => set("hZip", e.target.value)}
            />
          </Field>
          <Field label="縣市" required error={errors["hCity"]}>
            <CitySelect value={value.hCity} onChange={(v) => set("hCity", v)} />
          </Field>
          <Field label="鄉鎮市區">
            <Input
              className="h-11"
              maxLength={30}
              value={value.hDistrict}
              onChange={(e) => set("hDistrict", e.target.value)}
            />
          </Field>
          <Field label="路段巷弄號樓" required error={errors["hStreet"]} className="sm:col-span-2">
            <Input
              className="h-11"
              maxLength={120}
              value={value.hStreet}
              onChange={(e) => set("hStreet", e.target.value)}
            />
          </Field>
        </Grid>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
          <p className="text-sm font-semibold text-foreground">通訊地址</p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sameAsHousehold"
              checked={value.sameAsHousehold}
              onCheckedChange={(v) => {
                const checked = v === true;
                onChange(
                  checked
                    ? {
                        ...value,
                        sameAsHousehold: true,
                        mZip: value.hZip,
                        mCity: value.hCity,
                        mDistrict: value.hDistrict,
                        mStreet: value.hStreet,
                      }
                    : { ...value, sameAsHousehold: false },
                );
              }}
            />
            <Label htmlFor="sameAsHousehold" className="text-sm font-normal">
              同戶籍地址
            </Label>
          </div>
        </div>
        <Grid className="mt-3">
          <Field label="郵遞區號">
            <Input
              className="h-11"
              inputMode="numeric"
              maxLength={6}
              disabled={mailDisabled}
              value={value.mZip}
              onChange={(e) => set("mZip", e.target.value)}
            />
          </Field>
          <Field label="縣市" required error={errors["mCity"]}>
            {mailDisabled ? (
              <Input className="h-11" disabled value={value.mCity} />
            ) : (
              <CitySelect value={value.mCity} onChange={(v) => set("mCity", v)} />
            )}
          </Field>
          <Field label="鄉鎮市區">
            <Input
              className="h-11"
              maxLength={30}
              disabled={mailDisabled}
              value={value.mDistrict}
              onChange={(e) => set("mDistrict", e.target.value)}
            />
          </Field>
          <Field label="路段巷弄號樓" required error={errors["mStreet"]} className="sm:col-span-2">
            <Input
              className="h-11"
              maxLength={120}
              disabled={mailDisabled}
              value={value.mStreet}
              onChange={(e) => set("mStreet", e.target.value)}
            />
          </Field>
        </Grid>
      </Block>

      <Block title="區塊三：聯絡與緊急聯絡人">
        <Grid>
          <Field label="E-mail" error={errors["email"]}>
            <Input
              className="h-11"
              type="email"
              maxLength={255}
              value={value.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="緊急聯絡人姓名">
            <Input
              className="h-11"
              maxLength={50}
              value={value.emergencyName}
              onChange={(e) => set("emergencyName", e.target.value)}
            />
          </Field>
          <Field label="與委託人關係">
            <Input
              className="h-11"
              maxLength={30}
              value={value.emergencyRelation}
              onChange={(e) => set("emergencyRelation", e.target.value)}
            />
          </Field>
          <Field label="緊急聯絡人電話">
            <Input
              className="h-11"
              inputMode="tel"
              maxLength={20}
              value={value.emergencyPhone}
              onChange={(e) => set("emergencyPhone", e.target.value)}
            />
          </Field>
        </Grid>
      </Block>

      <Block title="區塊四：學歷與職業概況">
        <div className="space-y-5">
          <Field label="最高學歷" required error={errors["education"]}>
            <Radios
              name="education"
              options={EDUCATIONS}
              value={value.education}
              onChange={(v) => set("education", v)}
            />
            {value.education === "其他" ? (
              <Input
                className="mt-2 h-11 sm:max-w-xs"
                placeholder="請說明"
                maxLength={40}
                value={value.educationOther}
                onChange={(e) => set("educationOther", e.target.value)}
              />
            ) : null}
          </Field>
          <Field label="就業狀態" required error={errors["employment"]}>
            <Radios
              name="employment"
              options={EMPLOYMENTS}
              value={value.employment}
              onChange={(v) => set("employment", v)}
            />
            {value.employment === "其他" ? (
              <Input
                className="mt-2 h-11 sm:max-w-xs"
                placeholder="請說明"
                maxLength={40}
                value={value.employmentOther}
                onChange={(e) => set("employmentOther", e.target.value)}
              />
            ) : null}
          </Field>
          <Grid>
            <Field label="服務機構名稱">
              <Input
                className="h-11"
                maxLength={80}
                value={value.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </Field>
            <Field label="服務機構電話">
              <Input
                className="h-11"
                inputMode="tel"
                maxLength={20}
                value={value.companyPhone}
                onChange={(e) => set("companyPhone", e.target.value)}
              />
            </Field>
            <Field label="職稱">
              <Input
                className="h-11"
                maxLength={40}
                value={value.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
              />
            </Field>
          </Grid>
          <Field label="行業類別" required error={errors["industry"]}>
            <Radios
              name="industry"
              options={INDUSTRIES}
              value={value.industry}
              onChange={(v) => set("industry", v)}
            />
            {value.industry === "其他" ? (
              <Input
                className="mt-2 h-11 sm:max-w-xs"
                placeholder="請說明"
                maxLength={40}
                value={value.industryOther}
                onChange={(e) => set("industryOther", e.target.value)}
              />
            ) : null}
          </Field>
        </div>
      </Block>

      {([0, 1] as const).map((i) => (
        <Block key={i} title={`區塊五：法定代理人資訊（法代${i === 0 ? "一" : "二"}）`}>
          <div className="space-y-5">
            <Grid>
              <Field label="法代姓名" required={i === 0} error={errors[`rep${i}Name`]}>
                <Input
                  className="h-11"
                  maxLength={50}
                  value={value.reps[i].name}
                  onChange={(e) => setRep(i, "name", e.target.value)}
                />
              </Field>
              <Field label="身分證字號" required={i === 0} error={errors[`rep${i}Id`]}>
                <Input
                  className="h-11"
                  maxLength={20}
                  value={value.reps[i].id}
                  onChange={(e) => setRep(i, "id", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="手機" required={i === 0} error={errors[`rep${i}Phone`]}>
                <Input
                  className="h-11"
                  inputMode="tel"
                  maxLength={20}
                  value={value.reps[i].phone}
                  onChange={(e) => setRep(i, "phone", e.target.value)}
                />
              </Field>
              <Field label="服務機構名稱">
                <Input
                  className="h-11"
                  maxLength={80}
                  value={value.reps[i].company}
                  onChange={(e) => setRep(i, "company", e.target.value)}
                />
              </Field>
              <Field label="服務機構電話">
                <Input
                  className="h-11"
                  inputMode="tel"
                  maxLength={20}
                  value={value.reps[i].companyPhone}
                  onChange={(e) => setRep(i, "companyPhone", e.target.value)}
                />
              </Field>
              <Field label="職稱">
                <Input
                  className="h-11"
                  maxLength={40}
                  value={value.reps[i].title}
                  onChange={(e) => setRep(i, "title", e.target.value)}
                />
              </Field>
              <Field label="行業別">
                <Input
                  className="h-11"
                  maxLength={40}
                  value={value.reps[i].industry}
                  onChange={(e) => setRep(i, "industry", e.target.value)}
                />
              </Field>
              <Field label="E-mail" error={errors[`rep${i}Email`]}>
                <Input
                  className="h-11"
                  type="email"
                  maxLength={255}
                  value={value.reps[i].email}
                  onChange={(e) => setRep(i, "email", e.target.value)}
                />
              </Field>
            </Grid>
            <Field label="就業狀態">
              <Radios
                name={`rep${i}Employment`}
                options={EMPLOYMENTS}
                value={value.reps[i].employment}
                onChange={(v) => setRep(i, "employment", v)}
              />
              {value.reps[i].employment === "其他" ? (
                <Input
                  className="mt-2 h-11 sm:max-w-xs"
                  placeholder="請說明"
                  maxLength={40}
                  value={value.reps[i].employmentOther}
                  onChange={(e) => setRep(i, "employmentOther", e.target.value)}
                />
              ) : null}
            </Field>
          </div>
        </Block>
      ))}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <h3 className="mb-4 border-b border-border pb-3 text-base font-bold text-foreground">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Grid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 ${className}`}>{children}</div>;
}

function Field({
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-bold">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-full">
        <SelectValue placeholder="請選擇縣市" />
      </SelectTrigger>
      <SelectContent>
        {CITIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Radios({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            onChange={() => onChange(o)}
            className="size-4 accent-[var(--primary)]"
          />
          {o}
        </label>
      ))}
    </div>
  );
}
