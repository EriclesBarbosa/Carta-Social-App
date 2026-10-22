import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromExternalApi(
      request,
      `/organizacoes/proprietarios/free`
    );
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch(error: any) {
    
    return NextResponse.json({ error: 'Falha ao atualizar organização', details: error.message }, { status: 500 });
  }
}