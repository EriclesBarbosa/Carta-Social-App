import { fetchFromExternalApi } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context?.params;
    const { zona } = params;

    const response = await fetchFromExternalApi(
      request,
      `/geografia/lugar/${zona}/`
    );

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
