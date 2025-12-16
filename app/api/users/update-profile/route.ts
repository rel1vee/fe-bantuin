import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const token = request.headers.get("authorization")?.split(" ")[1];

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";
        const res = await fetch(`${apiUrl}/users/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
