export const CITIES = [
  "臺北市","新北市","桃園市","臺中市","臺南市","高雄市","基隆市","新竹市","嘉義市",
  "宜蘭縣","新竹縣","苗栗縣","彰化縣","南投縣","雲林縣","嘉義縣","屏東縣","花蓮縣",
  "臺東縣","澎湖縣","金門縣","連江縣",
];

export const EDUCATIONS = ["博士", "碩士", "大學", "專科", "高中", "國中", "國小", "其他"];
export const EMPLOYMENTS = ["雇主(創業)", "受僱", "退休", "家管", "學生", "其他"];
export const INDUSTRIES = [
  "軍警公教","政府機關","醫療院所","農林漁牧","餐飲服務","製造營造","批發零售","貿易電子",
  "資訊通訊","大眾傳播","金融保險","證券期貨","珠寶銀樓","軍火博弈","律師會計師",
  "不動產經紀/仲介/代銷","其他",
];

export type Representative = {
  name: string;
  id: string;
  phone: string;
  employment: string;
  employmentOther: string;
  company: string;
  companyPhone: string;
  title: string;
  industry: string;
  email: string;
};

export type ProfileData = {
  clientName: string;
  clientId: string;
  clientBirth: string;
  nationality: string;
  gender: string;
  birthPlace: string;
  homePhone: string;
  mobilePhone: string;
  hZip: string;
  hCity: string;
  hDistrict: string;
  hStreet: string;
  sameAsHousehold: boolean;
  mZip: string;
  mCity: string;
  mDistrict: string;
  mStreet: string;
  email: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  education: string;
  educationOther: string;
  employment: string;
  employmentOther: string;
  companyName: string;
  companyPhone: string;
  jobTitle: string;
  industry: string;
  industryOther: string;
  reps: [Representative, Representative];
};

function emptyRep(): Representative {
  return {
    name: "",
    id: "",
    phone: "",
    employment: "",
    employmentOther: "",
    company: "",
    companyPhone: "",
    title: "",
    industry: "",
    email: "",
  };
}

export function emptyProfile(): ProfileData {
  return {
    clientName: "",
    clientId: "",
    clientBirth: "",
    nationality: "本國",
    gender: "",
    birthPlace: "",
    homePhone: "",
    mobilePhone: "",
    hZip: "",
    hCity: "",
    hDistrict: "",
    hStreet: "",
    sameAsHousehold: false,
    mZip: "",
    mCity: "",
    mDistrict: "",
    mStreet: "",
    email: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    education: "",
    educationOther: "",
    employment: "",
    employmentOther: "",
    companyName: "",
    companyPhone: "",
    jobTitle: "",
    industry: "",
    industryOther: "",
    reps: [emptyRep(), emptyRep()],
  };
}

/** 西元 YYYY-MM-DD → 民國年月日 */
export function toMinguo(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return "";
  const year = Number(m[1]) - 1911;
  if (year <= 0) return "";
  return `民國${year}年${Number(m[2])}月${Number(m[3])}日`;
}

export function isValidTwId(v: string): boolean {
  return /^[A-Za-z][0-9]{9}$/.test(v.trim()) || /^\d{8}$/.test(v.trim());
}

/** 回傳欄位錯誤訊息（空物件代表通過） */
export function validateProfile(p: ProfileData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.clientName.trim()) e["clientName"] = "請輸入委託人姓名";
  if (!p.clientId.trim()) e["clientId"] = "請輸入身分證字號／統一編號";
  else if (!isValidTwId(p.clientId)) e["clientId"] = "格式不正確（例：A123456789）";
  if (!p.clientBirth) e["clientBirth"] = "請選擇生日";
  else if (!toMinguo(p.clientBirth)) e["clientBirth"] = "生日年份不正確";
  if (!p.gender) e["gender"] = "請選擇性別";
  if (!p.mobilePhone.trim()) e["mobilePhone"] = "請輸入手機號碼";
  if (!p.hCity) e["hCity"] = "請選擇縣市";
  if (!p.hStreet.trim()) e["hStreet"] = "請輸入路段巷弄號樓";
  if (!p.sameAsHousehold) {
    if (!p.mCity) e["mCity"] = "請選擇縣市";
    if (!p.mStreet.trim()) e["mStreet"] = "請輸入路段巷弄號樓";
  }
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) e["email"] = "Email 格式不正確";
  if (!p.education) e["education"] = "請選擇最高學歷";
  if (!p.employment) e["employment"] = "請選擇就業狀態";
  if (!p.industry) e["industry"] = "請選擇行業類別";
  const rep = p.reps[0];
  if (!rep.name.trim()) e["rep0Name"] = "請輸入法代一姓名";
  if (!rep.id.trim()) e["rep0Id"] = "請輸入法代一身分證字號";
  if (!rep.phone.trim()) e["rep0Phone"] = "請輸入法代一手機";
  p.reps.forEach((r, i) => {
    if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email)) e[`rep${i}Email`] = "Email 格式不正確";
  });
  return e;
}

/** 送出前把「同戶籍地址」套用到通訊地址 */
export function normalizeProfile(p: ProfileData): ProfileData {
  if (!p.sameAsHousehold) return p;
  return { ...p, mZip: p.hZip, mCity: p.hCity, mDistrict: p.hDistrict, mStreet: p.hStreet };
}
