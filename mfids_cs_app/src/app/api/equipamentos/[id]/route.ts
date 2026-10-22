import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    const response = await fetchFromExternalApi(
      request,
      `/equipamentosById/${id}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao buscar equipamento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const response = await fetchFromExternalApi(
      request,
      `/equipamentos/${id}/`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno no servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    const response = await fetchFromExternalApi(
      request,
      `/equipamentos/${id}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao excluir equipamento' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao excluir equipamento' },
      { status: 500 }
    );
  }
}
