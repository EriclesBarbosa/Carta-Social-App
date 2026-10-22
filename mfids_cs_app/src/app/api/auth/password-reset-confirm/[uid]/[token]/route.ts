import { NextRequest, NextResponse } from 'next/server';
import { fetchFromExternalApi, handleApiError } from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const { uid, token } = await context.params;
    const data = await request.json();
    
    if (!data.new_password || !data.confirm_password) {
      return NextResponse.json(
        { detail: "Nova senha e confirmação são obrigatórias" },
        { status: 400 }
      );
    }
    
    if (data.new_password !== data.confirm_password) {
      return NextResponse.json(
        { detail: "As senhas não coincidem" },
        { status: 400 }
      );
    }
    
    const response = await fetchFromExternalApi(
      request,
      `/auth/password-reset-confirm/${uid}/${token}/`,
      {
        method: 'POST',
        body: JSON.stringify({
          new_password: data.new_password,
          confirm_password: data.confirm_password,
        }),
      }
    );
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Erro ao confirmar redefinição de senha');
  }
}