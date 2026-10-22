import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromExternalApi(
      request,
      `/equipamentos/`
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
      '/equipamentos/create',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Erro ao processar a requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor', details: error.message },
      { status: 500 }
    );
  }
}