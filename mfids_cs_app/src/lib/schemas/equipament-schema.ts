import { z } from "zod";

export const contactSchema = z.object({
  endereco: z.string().min(1, "Endereço é obrigatório"),
  caixa_postal: z.string().optional(),
  telefone: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val || val.trim() === "") {
        return true;
      }
      return /^[2]\d{6}$/.test(val);
    }, {
      message: "Telefone deve começar com 2 e ter 7 dígitos"
    }),
  telemovel: z.string().min(1, "Telemóvel é obrigatório")
  .regex(/^[95]\d{6}$/, "Telemóvel deve começar com 9 ou 5 e ter 7 dígitos"),
  email: z.string().email("Email inválido").or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
});

export const geographySchema = z.object({
  ilha: z.string().min(1, "Ilha é obrigatória"),
  concelho: z.string().min(1, "Concelho é obrigatório"),
  freguesia: z.string().min(1, "Freguesia é obrigatória"),
  zona: z.string().min(1, "Localidade é obrigatória"),
  lugar: z.string().min(1, "Zona é obrigatório").optional(),
  id: z.string().optional(),
});

export const equipmentFormSchema = z.object({
  //codigo: z.string().min(1, "Código é obrigatório"),
  nome: z.string().min(1, "Nome do equipamento é obrigatório"),
   data_oficializacao: z.string().optional(),
  data_encerramento: z.string().optional(),
  possui_eletricidade: z.boolean().default(false),
  latitude: z.string().min(1, "Latitude é obrigatória"),
  longitude: z.string().min(1, "Longitude é obrigatória"),
  altura: z.string().min(1, "Altura é obrigatória"),
  ponto_referencia: z.string().min(1, "Ponto de referência é obrigatório"),
  geografia: geographySchema,
  contato: contactSchema,
  gestor: z.number().min(1, "Gestor é obrigatório"),
  domain_situacao_equipamento: z.number().min(1, "Situação do equipamento é obrigatória"),
  situacao_equipamento_outro: z.string().min(1, "Situação do equipamento outro é obrigatório"),
  domain_situacao_juridica: z.number().optional(),
  domain_regime_propriedade: z.number().min(1, "Regime de propriedade é obrigatório"),
  regime_propriedade_outro: z.string().min(1, "Regime de propriedade outro é obrigatório"),
  domain_tipo_edificacao: z.number().min(1, "Tipo de edificação é obrigatório"),
  n_andar: z.number().optional(),
  domain_estado_conservacao: z.number().min(1, "Estado de conservação é obrigatório"),
  domain_tipo_construcao_outro: z.number().min(1, "Tipo de construção é obrigatório"),
  fonte_financiamento_outro: z.string().min(1, "Fonte de financiamento outro é obrigatório"),
  remodelado: z.boolean().default(false),
  fonte_fin_remodelacao_outro: z.string().min(1, "Fonte de financiamento de remodelação outro é obrigatório"),
  domain_ligacao_rede_publica: z.number().optional(),
  domain_sanita_latrina: z.number().optional(),
  banheiro_poliban: z.boolean().default(false),
  domain_evacuacao_agua: z.number().optional(),
  domain_possui_cozinha: z.number().optional(),
  tipo_construcao_outro: z.string().optional(),
  domain_colecta_lixo: z.number().optional(),
  colecta_lixo_outro: z.string().optional(),
  acesso_a_deficiente: z.boolean().default(false),
  tipo_edificacao_outro: z.string().optional(),
  fontes_financiamento: z.array(
    z.object({
      fonte: z.string().min(1, "Fonte de financiamento é obrigatória"),
      contexto: z.string().min(1, "Contexto é obrigatório"),
      domain_fonte_fin: z.number().min(1, "Domínio de fonte de financiamento é obrigatório")
    })
  ).optional().default([]),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;