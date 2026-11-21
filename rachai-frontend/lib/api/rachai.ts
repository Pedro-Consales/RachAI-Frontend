/**
 * Uma função por rota real do backend (app/routes/). Se uma rota não está
 * aqui, ela não existe na API: não invente, peça no backend.
 */

import { http } from "./cliente";
import type {
  Apoiador,
  Contribuicao,
  Despesa,
  Grupo,
  GrupoId,
  Membro,
  NovaContribuicao,
  NovaDespesa,
  NovaVaquinha,
  NovoGrupo,
  NovoMembro,
  NovoPagamento,
  Pagamento,
  SaldosDoGrupo,
  Saude,
  Vaquinha,
  VaquinhaId,
} from "./tipos";

const grupo = (id: GrupoId) => `/grupos/${id}`;

export const api = {
  grupos: {
    criar: (dados: NovoGrupo) => http.post<Grupo>("/grupos", dados),
    consultar: (id: GrupoId) => http.get<Grupo>(grupo(id)),
    adicionarMembro: (id: GrupoId, dados: NovoMembro) =>
      http.post<Membro>(`${grupo(id)}/membros`, dados),
  },

  despesas: {
    lancar: (id: GrupoId, dados: NovaDespesa) =>
      http.post<Despesa>(`${grupo(id)}/despesas`, dados),
    listar: (id: GrupoId) => http.get<Despesa[]>(`${grupo(id)}/despesas`),
  },

  pagamentos: {
    registrar: (id: GrupoId, dados: NovoPagamento) =>
      http.post<Pagamento>(`${grupo(id)}/pagamentos`, dados),
    listar: (id: GrupoId) => http.get<Pagamento[]>(`${grupo(id)}/pagamentos`),
  },

  saldos: {
    consultar: (id: GrupoId) => http.get<SaldosDoGrupo>(`${grupo(id)}/saldos`),
  },

  vaquinhas: {
    criar: (id: GrupoId, dados: NovaVaquinha) =>
      http.post<Vaquinha>(`${grupo(id)}/vaquinhas`, dados),
    listar: (id: GrupoId) => http.get<Vaquinha[]>(`${grupo(id)}/vaquinhas`),
    contribuir: (id: GrupoId, vaquinhaId: VaquinhaId, dados: NovaContribuicao) =>
      http.post<Contribuicao>(`${grupo(id)}/vaquinhas/${vaquinhaId}/contribuicoes`, dados),
    encerrar: (id: GrupoId, vaquinhaId: VaquinhaId) =>
      http.post<Vaquinha>(`${grupo(id)}/vaquinhas/${vaquinhaId}/encerrar`),
  },

  apoiadores: {
    consultar: (id: GrupoId) => http.get<Apoiador[]>(`${grupo(id)}/apoiadores`),
  },

  saude: {
    consultar: () => http.get<Saude>("/health"),
  },
};
