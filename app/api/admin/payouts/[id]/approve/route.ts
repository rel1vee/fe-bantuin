// app/api/admin/payouts/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FORWARD to NestJS: POST /admin/payouts/:id/approve
    const response = await fetch(`${API_URL}/admin/payouts/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
