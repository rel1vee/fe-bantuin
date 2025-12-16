import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate API_URL is defined
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_URL}/admin/services/pending`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      try {
        const err = JSON.parse(text);
        return NextResponse.json(
          { error: err.message || err.error || "Backend error" },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: "Backend returned non-JSON error" },
          { status: response.status }
        );
      }
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      // If backend returns empty or invalid JSON, return empty array
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error("Error fetching pending services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
