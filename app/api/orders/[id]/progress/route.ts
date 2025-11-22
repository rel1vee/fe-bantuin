import { NextRequest, NextResponse } from "next/server";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.headers.get("authorization");
  const body = await request.json();

  const response = await fetch(`${API_URL}/orders/${id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token || "" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
