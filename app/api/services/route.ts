import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Default to only returning ACTIVE services when no status is specified
    if (!searchParams.has("status")) {
      searchParams.set("status", "ACTIVE");
    }
    const queryString = searchParams.toString();

    const response = await fetch(`${API_URL}/services?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch services" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Ensure newly created services are always marked as pending review
    // Ignore any client-sent `status`/`isActive` to prevent bypassing review
    const createPayload = {
      ...body,
      status: "PENDING",
      isActive: false,
    };

    const response = await fetch(`${API_URL}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(createPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create service" },
        { status: response.status }
      );
    }

    // Some backend implementations may ignore provided status/isActive
    // and automatically activate the service. Ensure newly created
    // services remain pending by PATCHing the created resource if needed.
    try {
      const created = data.data || data;
      const svcId = created?.id;
      const svcStatus = created?.status;
      const svcIsActive = created?.isActive;

      if (svcId && (svcStatus === "ACTIVE" || svcIsActive === true)) {
        // First try to PATCH using seller's token (may be forbidden)
        let patched = false;
        try {
          const patchResp = await fetch(`${API_URL}/services/${svcId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ status: "PENDING", isActive: false }),
          });

          if (patchResp.ok) {
            patched = true;
          } else {
            const errBody = await patchResp.text().catch(() => "");
            console.warn(
              "Seller token could not patch service status:",
              patchResp.status,
              errBody
            );
          }
        } catch (e) {
          console.warn("Error while seller-level patch attempt:", e);
        }

        // If seller-level patch failed, try internal admin token if configured
        if (!patched) {
          const adminToken =
            process.env.NESTJS_SERVICE_TOKEN || process.env.INTERNAL_API_TOKEN;
          if (adminToken) {
            try {
              const adminPatch = await fetch(`${API_URL}/services/${svcId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ status: "PENDING", isActive: false }),
              });

              if (adminPatch.ok) {
                patched = true;
              } else {
                const adminErr = await adminPatch.text().catch(() => "");
                console.warn(
                  "Admin token could not patch service status:",
                  adminPatch.status,
                  adminErr
                );
              }
            } catch (e) {
              console.warn("Error while admin-level patch attempt:", e);
            }
          }
        }

        // Re-fetch to return the corrected object
        const refetch = await fetch(`${API_URL}/services/${svcId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const refData = await refetch.json();

        // If not patched, include a warning so frontend can surface it
        if (!patched) {
          return NextResponse.json(
            {
              success: true,
              data: refData.data || refData,
              warning:
                "Could not enforce PENDING status; backend auto-activated service.",
            },
            { status: 201 }
          );
        }

        return NextResponse.json(refData, { status: 201 });
      }
    } catch (err) {
      console.error("Error enforcing PENDING status:", err);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
