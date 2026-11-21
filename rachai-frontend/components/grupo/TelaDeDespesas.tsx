"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import { AvisoDeErro, Botao, Campo, Cartao, Dinheiro, Selecao } from "@/components/ui";
import { api } from "@/lib/api/rachai";
import type { Cota, Despesa, MembroId, PedidoDeDivisao } from "@/lib/api/tipos";
import { formatarData } from "@/lib/data";
import { useRecurso } from "@/lib/useRecurso";
import { lerValor } from "@/lib/valor";

/** Tela 2 (#4 e #5): lançar Despesa com Divisão igualitária ou por valores, e listar. */
export function TelaDeDespesas() {
  const { grupo } = useGrupo();
  const carregar = useCallback(() => api.despesas.listar(grupo.id), [grupo.id]);
  const [estado, recarregar] = useRecurso(carregar);

  if (grupo.membros.length === 0) {
    return (
      <Cartao className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Ainda não há Membros</h2>
        <p>Uma Despesa precisa de um Pagador e de quem participa dela. Adicione os Membros primeiro.</p>
        <Link href={`/grupos/${grupo.id}`} className="font-semibold text-acento hover:underline">
          Ir para Membros
        </Link>
      </Cartao>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <LancarDespesa aoLancar={recarregar} />
      <Cartao>
        <h2 className="mb-4 text-lg font-semibold">Despesas</h2>
        {estado.tipo === "carregando" && <p aria-busy="true">Carregando Despesas…</p>}
        {estado.tipo === "erro" && <AvisoDeErro erro={estado.erro} />}
        {estado.tipo === "ok" &&
          (estado.dados.length === 0 ? (
            <p>Nenhuma Despesa lançada ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {estado.dados.map((despesa) => (
                <LinhaDaDespesa key={despesa.id} despesa={despesa} />
              ))}
            </ul>
          ))}
      </Cartao>
    </div>
  );
}

function LinhaDaDespesa({ despesa }: { despesa: Despesa }) {
  const { nomeDe } = useGrupo();
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium text-texto">{despesa.descricao}</span>
          <span className="text-sm">
            Pago por {nomeDe(despesa.pagador_id)} · {formatarData(despesa.data)}
          </span>
        </div>
        <Dinheiro centavos={despesa.valor_centavos} className="font-semibold" />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer select-none hover:text-texto">Ver Cotas</summary>
        <ul className="mt-2 flex flex-col gap-1 border-l border-white/10 pl-3">
          {despesa.cotas.map((cota) => (
            <li key={cota.membro_id} className="flex justify-between gap-3">
              <span>{nomeDe(cota.membro_id)}</span>
              <Dinheiro centavos={cota.valor_centavos} />
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

type Modo = PedidoDeDivisao["modo"];

const FORMATO_DE_VALOR = "Use reais com até 2 casas, como 12,34.";

function LancarDespesa({ aoLancar }: { aoLancar: () => void }) {
  const { grupo, eu } = useGrupo();
  const membros = grupo.membros;

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [pagadorId, setPagadorId] = useState<MembroId>(eu?.id ?? membros[0].id);
  const [data, setData] = useState("");
  const [modo, setModo] = useState<Modo>("igualitaria");
  const [participantes, setParticipantes] = useState<Set<MembroId>>(() => new Set(membros.map((m) => m.id)));
  const [cotas, setCotas] = useState<Record<MembroId, string>>({});

  const [erroDoValor, setErroDoValor] = useState<string>();
  const [errosDasCotas, setErrosDasCotas] = useState<Record<MembroId, string>>({});
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [lancada, setLancada] = useState(false);

  function alternarParticipante(membroId: MembroId) {
    setParticipantes((atual) => {
      const novo = new Set(atual);
      if (novo.has(membroId)) novo.delete(membroId);
      else novo.add(membroId);
      return novo;
    });
  }

  /** Lê o formulário e monta o pedido. Só traduz texto em centavos: a soma das Cotas é validada pela API (422). */
  function montarDivisao(): PedidoDeDivisao | null {
    if (modo === "igualitaria") {
      // Na ordem do Grupo: a sobra de centavos vai para os primeiros da lista (ADR 0003).
      return { modo, membros: membros.filter((m) => participantes.has(m.id)).map((m) => m.id) };
    }
    const lidas: Cota[] = [];
    const erros: Record<MembroId, string> = {};
    for (const membro of membros) {
      const texto = (cotas[membro.id] ?? "").trim();
      if (!texto) continue;
      const centavos = lerValor(texto);
      if (centavos === null) erros[membro.id] = FORMATO_DE_VALOR;
      else lidas.push({ membro_id: membro.id, valor_centavos: centavos });
    }
    setErrosDasCotas(erros);
    return Object.keys(erros).length > 0 ? null : { modo, cotas: lidas };
  }

  async function lancar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setLancada(false);

    const valorCentavos = lerValor(valor);
    setErroDoValor(valorCentavos === null ? FORMATO_DE_VALOR : undefined);
    const divisao = montarDivisao();
    if (valorCentavos === null || divisao === null) return;

    setEnviando(true);
    try {
      await api.despesas.lancar(grupo.id, {
        descricao,
        valor_centavos: valorCentavos,
        pagador_id: pagadorId,
        divisao,
        data: data || undefined,
      });
      setDescricao("");
      setValor("");
      setCotas({});
      setData("");
      setLancada(true);
      aoLancar();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao as="form" onSubmit={lancar} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Lançar Despesa</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Descrição"
          placeholder="Conta de luz"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          autoComplete="off"
          className="sm:col-span-2"
        />
        <Campo
          rotulo="Valor"
          placeholder="R$ 0,00"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          erro={erroDoValor}
          autoComplete="off"
        />
        <Selecao rotulo="Pagador" value={pagadorId} onChange={(e) => setPagadorId(Number(e.target.value))}>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
              {m.id === eu?.id ? " (você)" : ""}
            </option>
          ))}
        </Selecao>
        <Campo
          rotulo="Data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          dica="Opcional. Sem data, vale a de hoje."
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-texto">Divisão</legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          <OpcaoDeModo atual={modo} valor="igualitaria" aoEscolher={setModo}>
            Igualitária
          </OpcaoDeModo>
          <OpcaoDeModo atual={modo} valor="por_valores" aoEscolher={setModo}>
            Por valores
          </OpcaoDeModo>
        </div>

        {modo === "igualitaria" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">Marque quem participa. O RachAÍ reparte o Valor em Cotas iguais.</p>
            <ul className="flex flex-wrap gap-2">
              {membros.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-borda-vidro bg-vidro px-3 py-1.5 text-sm text-texto transition-colors hover:bg-vidro-forte">
                    <input
                      type="checkbox"
                      checked={participantes.has(m.id)}
                      onChange={() => alternarParticipante(m.id)}
                      className="size-4 accent-acento"
                    />
                    {m.nome}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Informe a Cota de cada participante. Deixe em branco quem não participa. A soma das Cotas precisa ser
              igual ao Valor.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {membros.map((m) => (
                <Campo
                  key={m.id}
                  rotulo={`Cota de ${m.nome}`}
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                  value={cotas[m.id] ?? ""}
                  onChange={(e) => setCotas((atual) => ({ ...atual, [m.id]: e.target.value }))}
                  erro={errosDasCotas[m.id]}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <AvisoDeErro erro={erro} />
      {lancada && (
        <p role="status" className="text-sm text-credito">
          Despesa lançada.
        </p>
      )}
      <Botao type="submit" carregando={enviando} className="self-start">
        Lançar Despesa
      </Botao>
    </Cartao>
  );
}

function OpcaoDeModo({
  atual,
  valor,
  aoEscolher,
  children,
}: {
  atual: Modo;
  valor: Modo;
  aoEscolher: (modo: Modo) => void;
  children: string;
}) {
  const marcado = atual === valor;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcado}
      onClick={() => aoEscolher(valor)}
      className={[
        "h-9 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
        marcado ? "border-acento bg-acento/15 text-acento" : "border-borda-vidro text-texto-suave hover:text-texto",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
