import { NextRequest, NextResponse } from 'next/server';
import { fetchFromExternalApi, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromExternalApi(request, '/profile/');
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Erro ao buscar dados do perfil');
  }
}

export async function PUT(request: NextRequest) {
  
  try {
    const profileData = await request.json();
    console.log("request", profileData);
    const response = await fetchFromExternalApi(request, '/profile/update/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Erro ao atualizar perfil');
  }
}