import { z } from "zod";

export const contactSchema = z.object({
  endereco: z.string().min(1, "Endereço é obrigatório"),
  caixa_postal: z.string().optional(),
  telefone: z.string().min(1, "Telefone é obrigatório")
  .regex(/^[2]\d{6}$/, "Telefone deve começar com 2 e ter 7 dígitowsdsddss"),
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

export const ownerBaseSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório e deve ter pelo menos 3 caracteres"),
  natureza_juridica_outro: z.string().optional(),
  nif: z.string().regex(/^\d{9}$/, "NIF deve ter exatamente 9 dígitos"),
  natureza_juridica: z.string().min(1, "Natureza jurídica é obrigatória"),
  tipo_organizacao: z.union([z.literal("P"), z.literal("PG")]),
  parent_id: z.literal(0).nullable().optional(),
});

export const managerBaseSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório e deve ter pelo menos 3 caracteres"),
  nif: z.string().regex(/^\d{9}$/, "NIF deve ter exatamente 9 dígitos"),
  natureza_juridica: z.string().min(1, "Natureza jurídica é obrigatória"),
  natureza_juridica_outro: z.string().optional(),
  tipo_organizacao: z.literal("G"),
  parent_id: z.number().min(1, "Proprietário é obrigatório para gestores"),
});

export const ownerSchema = ownerBaseSchema.extend({
  contato: contactSchema,
  geografia: geographySchema,
});

export const managerSchema = managerBaseSchema.extend({
  contato: contactSchema,
  geografia: geographySchema,
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;
export type ManagerFormValues = z.infer<typeof managerSchema>;