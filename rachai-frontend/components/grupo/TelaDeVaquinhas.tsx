"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import {
  AvisoDeErro,
  BarraDeProgresso,
  Botao,
  Campo,
  Cartao,
  Dinheiro,
  EscolhaDeOpcao,
  Etiqueta,
  Selecao,
} from "@/components/ui";
import { api } from "@/lib/api/rachai";
import { MEIOS, type Meio, type MembroId, type Vaquinha } from "@/lib/api/tipos";
import { formatarData } from "@/lib/data";
import { ROTULO_DO_MEIO } from "@/lib/meio";
import { useRecurso } from "@/lib/useRecurso";
import { lerValor } from "@/lib/valor";

const OPCOES_DE_MEIO = MEIOS.map((m) => ({ valor: m, rotulo: ROTULO_DO_MEIO[m] }));
const FORMATO_DE_VALOR = "Use reais com até 2 casas, como 12,34.";

/**
 * Tela 5 (#8): criar Vaquinha, contribuir, acompanhar o progresso e encerrar.
 * Total arrecadado, status e Contribuições vêm prontos da API. Regras como
 * "o Beneficiário não contribui" e "encerrada não aceita Contribuição" ficam
 * no backend e chegam como 422.
 */
export function TelaDeVaquinhas() {
  const { grupo } = useGrupo();
  const carregar = useCallback(() => api.vaquinhas.listar(grupo.id), [grupo.id]);
  const [estado, recarregar] = useRecurso(carregar);

  if (grupo.membros.length === 0) {
    return (
      <Cartao className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Ainda não há Membros</h2>
        <p>Toda Vaquinha é aberta em favor de um Membro do Grupo.</p>
        <Link href={`/grupos/${grupo.id}`} className="font-semibold text-acento hover:underline">
          Ir para Membros
        </Link>
      </Cartao>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <CriarVaquinha aoCriar={recarregar} />
      {estado.tipo === "carregando" && <p aria-busy="true">Carregando Vaquinhas…</p>}
      {estado.tipo === "erro" && <AvisoDeErro erro={estado.erro} />}
      {estado.tipo === "ok" && <ListaDeVaquinhas vaquinhas={estado.dados} aoMudar={recarregar} />}
    </div>
  );
}

function ListaDeVaquinhas({ vaquinhas, aoMudar }: { vaquinhas: Vaquinha[]; aoMudar: () => void }) {
  if (vaquinhas.length === 0) {
    return (
      <Cartao>
        <p>Nenhuma Vaquinha aberta ainda. Peça ajuda ao Grupo pelo formulário acima.</p>
      </Cartao>
    );
  }
  const abertas = vaquinhas.filter((v) => v.status === "aberta");
  const encerradas = vaquinhas.filter((v) => v.status === "encerrada");
  return (
    <>
      {abertas.length > 0 && (
        <section aria-labelledby="abertas" className="flex flex-col gap-4">
          <h2 id="abertas" className="text-lg font-semibold">
            Abertas
          </h2>
          {abertas.map((v) => (
            <CartaoDaVaquinha key={v.id} vaquinha={v} aoMudar={aoMudar} />
          ))}
        </section>
      )}
      {encerradas.length > 0 && (
        <section aria-labelledby="encerradas" className="flex flex-col gap-4">
          <h2 id="encerradas" className="text-lg font-semibold">
            Encerradas
          </h2>
          {encerradas.map((v) => (
            <CartaoDaVaquinha key={v.id} vaquinha={v} aoMudar={aoMudar} />
          ))}
        </section>
      )}
    </>
  );
}

function CartaoDaVaquinha({ vaquinha: v, aoMudar }: { vaquinha: Vaquinha; aoMudar: () => void }) {
  const { nomeDe } = useGrupo();
  const aberta = v.status === "aberta";

  return (
    <Cartao as="article" interativo className="flex flex-col gap-4" aria-labelledby={`vaquinha-${v.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 id={`vaquinha-${v.id}`} className="text-lg font-semibold">
            {v.titulo}
          </h3>
          <p className="text-sm">
            Para <span className="font-medium text-texto">{nomeDe(v.beneficiario_id)}</span>
          </p>
        </div>
        <span className="flex flex-wrap gap-2">
          {v.total_arrecadado_centavos >= v.meta_centavos && <Etiqueta tom="credito">Meta atingida</Etiqueta>}
          <Etiqueta tom={aberta ? "acento" : "neutro"}>{aberta ? "Aberta" : "Encerrada"}</Etiqueta>
        </span>
      </header>

      {v.descricao && <p>{v.descricao}</p>}

      <div className="flex flex-col gap-2">
        <BarraDeProgresso total={v.total_arrecadado_centavos} meta={v.meta_centavos} />
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
          <Dinheiro centavos={v.total_arrecadado_centavos} className="text-base font-semibold" />
          arrecadados de
          <Dinheiro centavos={v.meta_centavos} className="font-medium" />
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer select-none hover:text-texto">
          Contribuições ({v.contribuicoes.length})
        </summary>
        {v.contribuicoes.length === 0 ? (
          <p className="mt-2">Ninguém contribuiu ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 border-l border-white/10 pl-3">
            {v.contribuicoes.map((c, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  <span className="text-texto">{nomeDe(c.membro_id)}</span> · {ROTULO_DO_MEIO[c.meio]} ·{" "}
                  {formatarData(c.data)}
                </span>
                <Dinheiro centavos={c.valor_centavos} />
              </li>
            ))}
          </ul>
        )}
      </details>

      {aberta && (
        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <Contribuir vaquinha={v} aoContribuir={aoMudar} />
          <Encerrar vaquinha={v} aoEncerrar={aoMudar} />
        </div>
      )}
    </Cartao>
  );
}

function Contribuir({ vaquinha, aoContribuir }: { vaquinha: Vaquinha; aoContribuir: () => void }) {
  const { grupo, eu } = useGrupo();
  // Só o valor inicial: se quem sou eu é o Beneficiário, começa em outro Membro para não sugerir um 422.
  // A regra continua no backend; escolher o Beneficiário ainda é possível e devolve o 422.
  const inicial =
    eu && eu.id !== vaquinha.beneficiario_id
      ? eu.id
      : (grupo.membros.find((m) => m.id !== vaquinha.beneficiario_id) ?? grupo.membros[0]).id;
  const [membroId, setMembroId] = useState<MembroId>(inicial);
  const [valor, setValor] = useState("");
  const [meio, setMeio] = useState<Meio>("pix");
  const [erroDoValor, setErroDoValor] = useState<string>();
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  async function contribuir(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    const valorCentavos = lerValor(valor);
    setErroDoValor(valorCentavos === null ? FORMATO_DE_VALOR : undefined);
    if (valorCentavos === null) return;
    setEnviando(true);
    try {
      await api.vaquinhas.contribuir(grupo.id, vaquinha.id, { membro_id: membroId, valor_centavos: valorCentavos, meio });
      setValor("");
      aoContribuir();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={contribuir} className="flex flex-col gap-4" aria-label={`Contribuir em ${vaquinha.titulo}`}>
      <p className="text-sm">Contribuir é voluntário: não gera dívida e não pode ser desfeito.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao rotulo="Quem contribui" value={membroId} onChange={(e) => setMembroId(Number(e.target.value))}>
          {grupo.membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
              {m.id === eu?.id ? " (você)" : ""}
            </option>
          ))}
        </Selecao>
        <Campo
          rotulo="Valor da Contribuição"
          placeholder="R$ 0,00"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          erro={erroDoValor}
          autoComplete="off"
        />
      </div>
      <EscolhaDeOpcao rotulo="Meio" opcoes={OPCOES_DE_MEIO} valor={meio} aoEscolher={setMeio} />
      <AvisoDeErro erro={erro} />
      <Botao type="submit" carregando={enviando} className="self-start">
        Contribuir
      </Botao>
    </form>
  );
}

/** Encerrar não tem volta (ADR 0005), então pede uma confirmação. Qualquer Membro pode encerrar (#8). */
function Encerrar({ vaquinha, aoEncerrar }: { vaquinha: Vaquinha; aoEncerrar: () => void }) {
  const { grupo } = useGrupo();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  async function encerrar() {
    setEnviando(true);
    setErro(null);
    try {
      await api.vaquinhas.encerrar(grupo.id, vaquinha.id);
      aoEncerrar();
    } catch (e) {
      setErro(e);
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {confirmando ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-texto">Encerrar não tem volta. A Vaquinha deixa de aceitar Contribuições.</span>
          <Botao variante="secundario" carregando={enviando} onClick={encerrar}>
            Confirmar encerramento
          </Botao>
          <Botao variante="fantasma" onClick={() => setConfirmando(false)} disabled={enviando}>
            Cancelar
          </Botao>
        </div>
      ) : (
        <Botao variante="fantasma" className="self-start" onClick={() => setConfirmando(true)}>
          Encerrar Vaquinha
        </Botao>
      )}
      <AvisoDeErro erro={erro} />
    </div>
  );
}

function CriarVaquinha({ aoCriar }: { aoCriar: () => void }) {
  const { grupo, eu } = useGrupo();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("");
  const [beneficiarioId, setBeneficiarioId] = useState<MembroId>(eu?.id ?? grupo.membros[0].id);
  const [erroDaMeta, setErroDaMeta] = useState<string>();
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    const metaCentavos = lerValor(meta);
    setErroDaMeta(metaCentavos === null ? FORMATO_DE_VALOR : undefined);
    if (metaCentavos === null) return;
    setEnviando(true);
    try {
      await api.vaquinhas.criar(grupo.id, {
        titulo,
        descricao,
        meta_centavos: metaCentavos,
        beneficiario_id: beneficiarioId,
      });
      setTitulo("");
      setDescricao("");
      setMeta("");
      aoCriar();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao as="form" onSubmit={criar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Abrir Vaquinha</h2>
        <p className="text-sm">Peça ajuda ao Grupo. Vaquinha não entra no Saldo de ninguém.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Título"
          placeholder="Geladeira nova"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          autoComplete="off"
          className="sm:col-span-2"
        />
        <Campo
          rotulo="Descrição"
          placeholder="A antiga parou de gelar."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          autoComplete="off"
          className="sm:col-span-2"
        />
        <Campo
          rotulo="Meta"
          placeholder="R$ 0,00"
          inputMode="decimal"
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          erro={erroDaMeta}
          dica="Atingir a Meta não encerra a Vaquinha."
          autoComplete="off"
        />
        <Selecao
          rotulo="Beneficiário"
          value={beneficiarioId}
          onChange={(e) => setBeneficiarioId(Number(e.target.value))}
        >
          {grupo.membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
              {m.id === eu?.id ? " (você)" : ""}
            </option>
          ))}
        </Selecao>
      </div>
      <AvisoDeErro erro={erro} />
      <Botao type="submit" carregando={enviando} className="self-start">
        Abrir Vaquinha
      </Botao>
    </Cartao>
  );
}
