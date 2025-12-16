// app/api/admin/dashboard/stats/route.ts
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server-api-proxy";


export async function GET(request: NextRequest) {
  return proxyRequest(request, "/admin/dashboard/stats", "GET");
}

  