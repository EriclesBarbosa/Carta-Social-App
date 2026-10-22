import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromExternalApi(
      request,
      `/servicos/`
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetchFromExternalApi(
      request,
      '/servicos/',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao criar valências/respostas sociais' }, 
      { status: 500 }
    );
  }
}