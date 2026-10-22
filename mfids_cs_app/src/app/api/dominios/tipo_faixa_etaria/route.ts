import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo_resposta } = body;

    if (!tipo_resposta) {
      return NextResponse.json(
        { error: 'tipo_resposta é obrigatório' }, 
        { status: 400 }
      );
    }

    const response = await fetchFromExternalApi(
      request,
      '/dominios/tipo_faixa_etaria',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo_resposta }),
      }
    );
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro na API tipo_faixa_etaria:', error);
    return NextResponse.json([], { status: 500 });
  }
}