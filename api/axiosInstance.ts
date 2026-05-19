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

// Cache companyId fetched from /company/1
let cachedCompanyId: string | null = null;
let cachedCostCenterId: string | null = null;

async function getCompanyId(): Promise<string | null> {
  if (cachedCompanyId) return cachedCompanyId;

  try {
    const res = await axios.get(`${baseURL}/company/1`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
    });
    cachedCompanyId = res.data?.COMPANYID ?? null;
    cachedCostCenterId = res.data?.COSTID ?? null;
    console.log("[AxiosInstance] Fetched COMPANYID:", cachedCompanyId);
    console.log("[AxiosInstance] Fetched COSTID:", cachedCostCenterId);
  } catch {
    cachedCompanyId = null;
  }
  return cachedCompanyId;
}

// Request interceptor — attach USERID, token, and COMPANYID
axiosInstance.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("userId");
    const token  = localStorage.getItem("token");
    if (userId) config.headers["USERID"] = userId;
    if (token)  config.headers["Authorization"] = `Bearer ${token}`;
  }

  const companyId = await getCompanyId();
  if (companyId) config.headers["COMPANYID"] = companyId;
  if (cachedCostCenterId) config.headers["COSTID"] = cachedCostCenterId;

  return config;
});
