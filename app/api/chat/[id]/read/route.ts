import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/server-api-proxy";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    return proxyRequest(req, `/chat/${params.id}/read`, "POST");
}
