import { NextRequest, NextResponse } from "next/server";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.headers.get("authorization");

  const response = await fetch(`${API_URL}/orders/${id}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token || "" },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
