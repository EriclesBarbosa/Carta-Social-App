export interface FreeOwner {
  id: number;
  nome: string;
  nif: string;
  natureza_juridica: string;
  tipo_organizacao: string;
}

export interface ApiResponse {
  operationStatus: string;
  operationType: string;
  operationDesc: string;
}

// AUTH
export interface LoginResponse {
  token: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface UserProfile {
  full_name: string | null;
  phone: string | null;
  municipio: string | null;
  country: string | null;
  city: string | null;
  zip_code: string | null;
  address: string | null;
  avatar: string | null;
}

export interface UserPermissions {
  [module: string]: {
    actions: string[];
  };
}

export interface UserType {
  tipo_organizacao: string;
  id_organizacao: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: UserProfile;
  permissions?: UserPermissions;
  user_type?: UserType;
}

export interface AuthResponse {
  operationStatus: number;
  operationType: string;
  operationDesc: string;
  token: string;
  user: {
    data: User;
    permission: UserPermissions;
    user_type: UserType;
  };
}

export interface UserData {
  data: User;
    permission: UserPermissions;
    user_type: UserType;
}

// GEAOGRAPHY
export interface GeographicItem {
  ilha?: string;
  concelho?: string;
  freguesia?: string;
  zona?: string;
  lugar?: string;
  id: string; 
}

// ORGANIZATION
export interface Contact {
  id?: number;
  endereco?: string;
  caixa_postal?: string;
  telefone?: string;
  telemovel: string;
  email?: string;
  website?: string;
}
export interface Geography {
  id?: number;
  ilha: string;
  concelho: string;
  freguesia: string;
  zona: string;
  lugar?: string;
  pais?: string;
}

export interface Manager {
  id?: number;
  nome: string;
  proprietario_nome?: string;
  nif: string;
  natureza_juridica: string;
  tipo_organizacao: "G";
  natureza_juridica_outro?: string;
  parent_id: number;
  contato?: number | Contact;
  geografia?: number | Geography;
}
export interface Owner {
  id?: number;
  nome: string;
  nif: string;
  natureza_juridica: string;
  tipo_organizacao: "P" | "PG";
  natureza_juridica_outro?: string;
  parent_id?: number | null;
  contato?: number | Contact;
  geografia?: number | Geography;
  gestor?: Manager[];
  gestor_count?: number;
}
export interface DomainItem {
  id: string | number;
  nome?: string;
  domain_description?: string;
  domain_description?: string;
  domain_description?: string;
  status?: boolean;
  [key: string]: any;
}


// EQUIPAMENT

export interface EquipmentContact {
  endereco?: string;
  caixa_postal?: string;
  telefone?: string;
  telemovel: string;
  email?: string;
  website?: string;
}

export interface FinancingSource {
  fonte: string;
  contexto: string;
  domain_fonte_fin: number;
}

export interface Equipment {
  id?: number;
  codigo?: string;
  nome: string;
  tipo_construcao_outro?: string;
  tipo_edificacao_outro?: string;
  data_oficializacao?: string;
  data_encerramento?: string;
  possui_eletricidade: boolean;
  tipo_sanitario?: string;
  regime_propriedade?: number;
  domain_tipo_edificacao?: number | DomainItem;
  n_andar?: number;
  possui_cozinha?: boolean;
  sistema_coleta_lixo?: string;
  acesso_deficientes?: boolean;
  latitude?: string;
  longitude?: string;
  altura?: string;
  ponto_referencia?: string;
  geografia: number | Geography;
  contato: EquipmentContact;
  gestor: number;
  servicos?: any[];
  domain_situacao_equipamento?: number | DomainItem;
  situacao_equipamento_outro?: string;
  domain_situacao_juridica?: number | DomainItem;
  domain_regime_propriedade: number | DomainItem;
  regime_propriedade_outro?: string;
  domain_estado_conservacao: number | DomainItem;
  domain_tipo_construcao_outro?: number | DomainItem;
  fonte_financiamento_outro?: string | DomainItem;
  remodelado: boolean;
  fonte_fin_remodelacao_outro?: string | DomainItem;
  domain_ligacao_rede_publica?: number | DomainItem;
  domain_sanita_latrina?: number | DomainItem;
  banheiro_poliban: boolean;
  domain_evacuacao_agua?: number | DomainItem;
  domain_possui_cozinha?: number | DomainItem;
  domain_colecta_lixo?: number | DomainItem;
  colecta_lixo_outro?: string;
  acesso_a_deficiente: boolean;
  fontes_financiamento?: FinancingSource[];
}

export interface ServiceOperation {
  dias_funcionamento: string;
  horario_abertura: string;
  horario_fechamento: string;
}

export interface DemographicData {
  domain_faixa_etaria?: string;
  total_masculino: number;
  total_feminino: number;
  deficientes_masculino: number;
  deficientes_feminino: number;
}

export interface ServiceOffered {
  domain_tipo_servico: number;
}

export interface SocialService {
  id?: number;
  nome: string;
  licenciado: boolean;
  data_licenciamento?: string;
  capacidade_instalada: number;
  meses_operacionais: number;
  mensalidade_min?: number;
  mensalidade_max?: number;
  nr_valencia?: string;
  nr_funcionario: number;
  codigo_tipo_resposta: string;
  nr_alvara?: string;
  resposta_social_financiada: boolean;
  data_inicio_funcionamento?: string;
  encerra_ferias: boolean;
  domain_periodo_funcionamento: number;
  tipo_resposta_social_desc?: string;
  nr_medio_utente_dia: number;
  nr_utente_frequenta: number;
  nr_utente_abranger: number;
  domain_dias_funcionamento: number;
  domain_meses_funcionamento: string[];
  operacoes: ServiceOperation[];
  demografias: DemographicData[];
  servicos_oferecidos_outros?: string;
  domain_fonte_fin_outros?: number;
  servicos_oferecidos: ServiceOffered[];
  equipamento: number;
  domain_acesso_gratuito?: number;
  fontes_financiamento?: FinancingSource[];
}

export interface DomainItem {
  id: string | number;
  domain_name?: string;
  domain_code?: string;
  domain_description?: string;
  domain_status?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  [key: string]: any;
}


// PROFILE
// Add these types to your types/type.ts file

export interface ProfileData {
  id?: number;
  username?: string;
  email?: string;
  last_name?: string;
  first_name?: string;
  profile?: {
    full_name?: string | null;
    phone?: string | null;
    municipio?: string | null;
    country?: string | null;
    city?: string | null;
    zip_code?: string | null;
    address?: string | null;
    avatar?: string | null;
  };
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}