import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const cookieStore = await cookies();
  const token =
    cookieStore.get("customer_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("client-token")?.value ||
    cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/me/orders/${orderNumber}/invoice`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch invoice" },
        { status: backendRes.status }
      );
    }

    const pdfBuffer = await backendRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${orderNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
