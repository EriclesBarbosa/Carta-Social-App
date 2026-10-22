import { NextRequest, NextResponse } from 'next/server';
import { fetchFromExternalApi, handleApiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.email) {
      return NextResponse.json(
        { detail: "E-mail é obrigatório" },
        { status: 400 }
      );
    }
    
    const response = await fetchFromExternalApi(request, '/auth/password/reset/', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
      }),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Erro ao solicitar redefinição de senha');
  }
}