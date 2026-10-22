import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const response = await fetchFromExternalApi(
      request,
      `/equipamentos/${id}/servicos`
    );
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao buscar serviços do equipamento' }, 
      { status: 500 }
    );
  }
}