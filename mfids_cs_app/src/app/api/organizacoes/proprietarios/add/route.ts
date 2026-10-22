import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetchFromExternalApi(
      request,
      '/organizacoes/proprietarios/add',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Falha ao criar proprietário' }, 
      { status: 500 }
    );
  }
}