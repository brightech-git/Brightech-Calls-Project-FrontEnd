import axios from 'axios';
import { ApiResponse } from '@/types/ApiResponse';
import { CompanyRecord } from '@/types/CompanyMaster/CompanyMaster';

const baseURL = process.env.NEXT_PUBLIC_API_URL ||  'https://calls.brightechsoftware.com/api/v1' ||'http://localhost:8111/api/v1';
export const axiosInstance = axios.create({ baseURL, timeout: 30000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
let companyPromise: Promise<CompanyRecord | null> | null = null;
function getCompany() {
  if (!companyPromise) companyPromise = axios.get<ApiResponse<CompanyRecord[]>>(`${baseURL}/company`, { timeout: 10000 }).then(response => response.data.data?.[0] ?? null).catch(() => { companyPromise = null; return null; });
  return companyPromise;
}
axiosInstance.interceptors.request.use(async config => {
  const isAuthRoute = config.url === '/user/login' || config.url === '/user/register' || config.url?.startsWith('/auth');
  if (!isAuthRoute && typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId'); const token = localStorage.getItem('calls_token');
    if (userId) config.headers.USERID = userId;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const company = await getCompany();
    if (company?.COMPID) config.headers.COMPANYID = String(company.COMPID);
    if (company?.COSTID) config.headers.COSTID = company.COSTID;
  }
  return config;
});
