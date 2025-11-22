import { NextRequest, NextResponse } from "next/server";

// FIX: Tambahkan fallback http://localhost:5500/api agar aman saat dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization");

    // Debugging: Cek apakah request masuk ke Next.js API Route
    console.log(`🔍 [NextJS Proxy] GET /orders/${id}`);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = `${API_URL}/orders/${id}`;
    console.log(`   👉 Forwarding to Backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    // Cek response dari backend
    const data = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Backend Error (${response.status}):`, data);
      return NextResponse.json(
        { error: data.message || "Failed to fetch order" },
        { status: response.status }
      );
    }

    console.log("   ✅ Order found");
    return NextResponse.json(data);
  } catch (error) {
    console.error("   🔥 Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
