import { fetchFromExternalApi } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Token de autorização necessário' },
      { status: 401 }
    );
  }
  
  try {
    const response = await fetchFromExternalApi(
      request,
      `/profile/`
    );
    
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao obter dados do perfil' }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao obter dados do perfil' }, 
      { status: 500 }
    );
  }
}