import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/server-api-proxy";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    return proxyRequest(request, `/users/public/${id}`, "GET");
}
