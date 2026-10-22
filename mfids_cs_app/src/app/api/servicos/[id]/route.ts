import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const response = await fetchFromExternalApi(
      request,
      `/servicos/${id}/`
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Serviço social não encontrado' }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao buscar valências/respostas sociais' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    
    const response = await fetchFromExternalApi(
      request,
      `/servicos/${id}/`,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao atualizar valências/respostas sociais' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const response = await fetchFromExternalApi(
      request,
      `/servicos/${id}/`,
      {
        method: 'DELETE'
      }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao excluir valências/respostas sociais' }, 
        { status: response.status }
      );
    }
    
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao excluir valências/respostas sociais' }, 
      { status: 500 }
    );
  }
}