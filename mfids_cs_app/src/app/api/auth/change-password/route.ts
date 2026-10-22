import { NextRequest, NextResponse } from 'next/server';
import { fetchFromExternalApi } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const passwordData = await request.json();
    
    if (!passwordData.old_password || !passwordData.new_password) {
      return NextResponse.json(
        { detail: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      );
    }
    
    const response = await fetchFromExternalApi(request, '/auth/change_password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
        email: passwordData.email
      }),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch(error: any) {
    return NextResponse.json(
      { error: 'Erro interno no servidor', details: error.message },
      { status: 500 }
    );
  }
}