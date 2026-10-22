import { z } from "zod";

export const operationSchema = z.object({
  dias_funcionamento: z.string().min(1, "Dias de funcionamento é obrigatório"),
  horario_abertura: z.string().min(1, "Horário de abertura é obrigatório"),
  horario_fechamento: z.string().min(1, "Horário de fechamento é obrigatório"),
});

export const demographicsSchema = z.object({
  total_masculino: z
    .number()
    .min(0, "Total masculino deve ser maior ou igual a zero"),
  total_feminino: z
    .number()
    .min(0, "Total feminino deve ser maior ou igual a zero"),
  deficientes_masculino: z
    .number()
    .min(0, "Total de deficientes masculinos deve ser maior ou igual a zero"),
  deficientes_feminino: z
    .number()
    .min(0, "Total de deficientes femininos deve ser maior ou igual a zero"),
});

export const serviceOfferedSchema = z.object({
  domain_tipo_servico: z.number().min(1, "Tipo de serviço é obrigatório"),
});

export const financingSourceSchema = z.object({
  fonte: z.string(),
  contexto: z.string(),
  domain_fonte_fin: z.number(),
});

export const socialServiceSchema = z
  .object({
    nome: z.string().min(1, "Nome do serviço é obrigatório"),
    licenciado: z.boolean().default(false),
    
    // Tornar campos de data opcionais inicialmente
    data_licenciamento: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Formato inválido para data. Use o formato YYYY-MM-DD.",
      }),

    data_inicio_funcionamento: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Formato inválido para data. Use o formato YYYY-MM-DD.",
      }),
      
    capacidade_instalada: z
      .number()
      .min(1, "Capacidade instalada é obrigatória"),
    meses_operacionais: z
      .number()
      .min(1, "Meses operacionais deve ser maior que zero")
      .max(12, "Meses operacionais não pode ser maior que 12"),
    mensalidade_min: z.number().optional(),
    mensalidade_max: z.number().optional(),
    nr_valencia: z.string().optional(),
    nr_funcionario: z
      .number()
      .min(1, "Número de funcionários é obrigatório"),
    codigo_tipo_resposta: z
      .string()
      .min(1, "Tipo de resposta social é obrigatório"),
    nr_alvara: z.string().min(1, "Número de alvará é obrigatório"),
    resposta_social_financiada: z.boolean().default(false),
    encerra_ferias: z.boolean().default(false),
    domain_periodo_funcionamento: z
      .number()
      .min(1, "Período de funcionamento é obrigatório"),
    nr_medio_utente_dia: z
      .number()
      .min(1, "Número médio de utentes por dia é obrigatório"),
    nr_utente_frequenta: z
      .number()
      .min(1, "Número de utentes que frequenta é obrigatório"),
    nr_utente_abranger: z
      .number()
      .min(1, "Número de utentes a abranger é obrigatório"),
    domain_dias_funcionamento: z
      .number()
      .min(1, "Dias de funcionamento é obrigatório"),
    domain_meses_funcionamento: z.array(z.string()),
    operacoes: z.array(operationSchema),
    demografias: z.array(demographicsSchema),
    servicos_oferecidos: z.array(serviceOfferedSchema),
    servicos_oferecidos_outros: z.string().optional(),
    domain_fonte_fin_outros: z.number().optional(),
    domain_acesso_gratuito: z.number().optional(),
    fontes_financiamento: z.array(financingSourceSchema).optional().default([]),
    equipamento: z.number({
      required_error: "O equipamento é obrigatório",
      invalid_type_error: "O equipamento deve ser um número (ID)",
    }),
  })
  .refine(
    (data) => {
      // Se licenciado é true, então data_licenciamento deve ser preenchida
      if (data.licenciado) {
        return data.data_licenciamento && 
               data.data_licenciamento.trim() !== "" &&
               /^\d{4}-\d{2}-\d{2}$/.test(data.data_licenciamento);
      }
      return true;
    },
    {
      message: "Data de licenciamento é obrigatória e deve estar no formato YYYY-MM-DD quando o serviço é licenciado",
      path: ["data_licenciamento"],
    }
  )
  .refine(
    (data) => {
      // Validação para data_inicio_funcionamento - sempre obrigatória
      return data.data_inicio_funcionamento && data.data_inicio_funcionamento.trim() !== "";
    },
    {
      message: "Data de início de funcionamento é obrigatória",
      path: ["data_inicio_funcionamento"],
    }
  )
  .refine(
    (data) => {
      // Se meses_operacionais < 12, então domain_meses_funcionamento deve ter pelo menos 1 item
      if (data.meses_operacionais < 12) {
        return (
          data.domain_meses_funcionamento &&
          data.domain_meses_funcionamento.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Deve selecionar pelo menos um mês de encerramento quando opera menos de 12 meses",
      path: ["domain_meses_funcionamento"],
    }
  );

export type SocialServiceFormValues = z.infer<typeof socialServiceSchema>;
export type OperationFormValues = z.infer<typeof operationSchema>;
export type DemographicsFormValues = z.infer<typeof demographicsSchema>;
export type ServiceOfferedFormValues = z.infer<typeof serviceOfferedSchema>;
export type FinancingSourceFormValues = z.infer<typeof financingSourceSchema>;