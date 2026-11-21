/**
 * Tipos das respostas e pedidos da API do RachAÍ.
 *
 * Derivados de `app/routes/*.py` do backend (inf1041-trabalho-a2): cada tipo
 * espelha uma função `*_json` ou um corpo lido pela rota. Nomes seguem o
 * GLOSSARY.md. Todo Valor trafega em centavos inteiros (ADR 0002).
 *
 * Nada aqui é calculado no front (ADR 0008): os tipos só descrevem o que a
 * API já entrega pronto.
 */

/** Centavos inteiros. Positivo, exceto em Saldo, que aceita sinal. */
export type Centavos = number;

/** Data ISO `AAAA-MM-DD`. */
export type DataISO = string;

export type MembroId = number;
export type GrupoId = number;
export type VaquinhaId = number;

// ── Grupo e Membros ─────────────────────────────── grupo_routes.py

export type Membro = {
  id: MembroId;
  nome: string;
  chave_pix: string | null;
};

export type Grupo = {
  id: GrupoId;
  nome: string;
  membros: Membro[];
};

export type NovoGrupo = {
  nome: string;
};

export type NovoMembro = {
  nome: string;
  chave_pix?: string;
};

// ── Despesas ────────────────────────────────────── despesa_routes.py

export type Cota = {
  membro_id: MembroId;
  valor_centavos: Centavos;
};

export type Despesa = {
  id: number;
  descricao: string;
  valor_centavos: Centavos;
  pagador_id: MembroId;
  data: DataISO;
  cotas: Cota[];
};

/** Pedido de Divisão: a API monta as Cotas (igualitária) ou valida a soma (por valores). */
export type PedidoDeDivisao =
  | { modo: "igualitaria"; membros: MembroId[] }
  | { modo: "por_valores"; cotas: Cota[] };

export type NovaDespesa = {
  descricao: string;
  valor_centavos: Centavos;
  pagador_id: MembroId;
  divisao: PedidoDeDivisao;
  /** Opcional: sem ela, a API usa a data de hoje. */
  data?: DataISO;
};

// ── Pagamentos ──────────────────────────────────── pagamento_routes.py

/** domain/meio.py */
export type Meio = "pix" | "dinheiro" | "outro";

export const MEIOS: readonly Meio[] = ["pix", "dinheiro", "outro"];

export type Pagamento = {
  id: number;
  de_membro_id: MembroId;
  para_membro_id: MembroId;
  valor_centavos: Centavos;
  meio: Meio;
  data: DataISO;
};

export type NovoPagamento = {
  de_membro_id: MembroId;
  para_membro_id: MembroId;
  valor_centavos: Centavos;
  meio: Meio;
};

// ── Saldos ──────────────────────────────────────── saldo_routes.py

/** Positivo: tem a receber. Negativo: deve. */
export type SaldoDoMembro = {
  membro_id: MembroId;
  saldo_centavos: Centavos;
};

export type TransferenciaSugerida = {
  de_membro_id: MembroId;
  para_membro_id: MembroId;
  valor_centavos: Centavos;
};

/** `saldos` traz todos os Membros, na ordem do Grupo. */
export type SaldosDoGrupo = {
  saldos: SaldoDoMembro[];
  transferencias: TransferenciaSugerida[];
};

// ── Vaquinhas ───────────────────────────────────── vaquinha_routes.py

export type StatusDaVaquinha = "aberta" | "encerrada";

export type Contribuicao = {
  membro_id: MembroId;
  valor_centavos: Centavos;
  meio: Meio;
  data: DataISO;
};

export type Vaquinha = {
  id: VaquinhaId;
  titulo: string;
  descricao: string;
  meta_centavos: Centavos;
  beneficiario_id: MembroId;
  status: StatusDaVaquinha;
  total_arrecadado_centavos: Centavos;
  contribuicoes: Contribuicao[];
};

export type NovaVaquinha = {
  titulo: string;
  descricao: string;
  meta_centavos: Centavos;
  beneficiario_id: MembroId;
};

export type NovaContribuicao = {
  membro_id: MembroId;
  valor_centavos: Centavos;
  meio: Meio;
};

// ── Reconhecimento de ajuda ─────────────────────── apoiador_routes.py

/** A lista de Apoiadores já vem ordenada pela API (ADR 0006). */
export type Apoiador = {
  membro_id: MembroId;
  nome: string;
  total_contribuido_centavos: Centavos;
  vaquinhas_apoiadas: number;
};

// ── Saúde ───────────────────────────────────────── health_routes.py

export type Saude = {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
  timestamp: string;
};
