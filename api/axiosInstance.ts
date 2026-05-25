// lib/axiosInstance.ts
import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://calls.brightechsoftware.com/api/v1";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Cache companyId fetched from /company
let cachedCompanyId: string | null = null;
let cachedCostCenterId: string | null = null;

async function getCompanyId(): Promise<string | null> {
  if (cachedCompanyId) return cachedCompanyId;

  try {
    const res = await axios.get(`${baseURL}/company`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
    });
    const company = Array.isArray(res.data) ? res.data[0] : res.data;
    cachedCompanyId    = company?.COMPID    ? String(company.COMPID) : null;
    cachedCostCenterId = company?.COSTID    ?? null;
    console.log("[AxiosInstance] Fetched COMPANYID:", cachedCompanyId);
    console.log("[AxiosInstance] Fetched COSTID:",    cachedCostCenterId);
  } catch (err: any) {
    console.log("[AxiosInstance] /company fetch FAILED:", err?.response?.status, err?.response?.data || err?.message);
    cachedCompanyId = null;
  }
  return cachedCompanyId;
}

// Request interceptor — attach USERID, token, COMPANYID, COSTID
axiosInstance.interceptors.request.use(async (config) => {
  const isAuthRoute = config.url?.startsWith("/auth");

  if (!isAuthRoute && typeof window !== "undefined") {
    const userId = localStorage.getItem("userId");
    const token  = localStorage.getItem("token");
    if (userId) config.headers["USERID"]        = userId;
    if (token)  config.headers["Authorization"] = `Bearer ${token}`;

    const companyId = await getCompanyId();
    if (companyId)          config.headers["COMPANYID"] = companyId;
    if (cachedCostCenterId) config.headers["COSTID"]    = cachedCostCenterId;

    console.log("[AxiosInstance] Request Headers:", {
      url:           config.url,
      USERID:        config.headers["USERID"],
      COMPANYID:     config.headers["COMPANYID"],
      COSTID:        config.headers["COSTID"],
      Authorization: config.headers["Authorization"],
    });
  }

  return config;
});
