import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server-api-proxy";

export async function GET(request: NextRequest) {
  return proxyRequest(request, "/users/top-sellers", "GET");
}
