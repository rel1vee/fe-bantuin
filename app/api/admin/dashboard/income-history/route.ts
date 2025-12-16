// app/api/admin/dashboard/income-history/route.ts
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server-api-proxy";

export async function GET(request: NextRequest) {
  // Proxy ke NestJS: GET /api/admin/dashboard/income-history
  return proxyRequest(request, "/admin/dashboard/income-history", "GET");
}