import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domain_name = url.searchParams.get('domain_name');
    const response = await fetchFromExternalApi(
      request,
      `/dominios/?domain_name=${domain_name}`
    );
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    console.log("response", response);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}