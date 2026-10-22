import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatError(error: any) {
  let errorMessage = "Erro desconhecido.";
  if (error.response) {
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (typeof error.response.data === 'object') {
        errorMessage = JSON.stringify(error.response.data, null, 2);
      }
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
}
// Função para formatar data no formato brasileiro (dd/mm/aaaa)
// Corrigida para Cabo Verde (UTC-1)
export const formatDateBR = (dateString: string): string => {
  // Se a data já está no formato ISO (YYYY-MM-DD), usar split para evitar timezone
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString; // retorna original se inválida
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatDateBRIntl = (dateString: string): string => {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Atlantic/Cape_Verde'
  }).format(date);
};