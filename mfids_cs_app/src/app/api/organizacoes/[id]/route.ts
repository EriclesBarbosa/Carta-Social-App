import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: any) {
  
  try {
    const params = await context.params;
    const { id } = params;

    const response = await fetchFromExternalApi(
      request,
      `/organizacoes/${id}/`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar organização' },
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
      `/organizacoes/${id}/`,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar organização', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: any) {

  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const response = await fetchFromExternalApi(
      request,
      `/organizacoes/${id}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar organização', details: error.message },
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
      `/organizacoes/${id}/`,
      { method: 'DELETE' }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch  {
    return NextResponse.json(
      { error: 'Falha ao excluir organização' },
      { status: 500 }
    );
  }
}