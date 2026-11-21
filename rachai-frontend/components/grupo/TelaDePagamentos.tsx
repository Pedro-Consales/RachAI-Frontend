"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import { AvisoDeErro, Botao, BotaoCopiar, Campo, Cartao, Dinheiro, EscolhaDeOpcao, Selecao } from "@/components/ui";
import { api } from "@/lib/api/rachai";
import { MEIOS, type Meio, type MembroId, type Pagamento } from "@/lib/api/tipos";
import { formatarData } from "@/lib/data";
import { ROTULO_DO_MEIO } from "@/lib/meio";
import { useRecurso } from "@/lib/useRecurso";
import { formatarValor, lerValor } from "@/lib/valor";

const OPCOES_DE_MEIO = MEIOS.map((m) => ({ valor: m, rotulo: ROTULO_DO_MEIO[m] }));

/**
 * Tela 4 (#7): registrar Pagamento, com a Chave Pix do credor à mão, e listar.
 * Pode chegar pré-preenchida pela tela de Saldos: ?de=&para=&valor= (centavos),
 * vindos de uma Transferência sugerida. A tela só copia esses números.
 */
export function TelaDePagamentos() {
  const { grupo } = useGrupo();
  const carregar = useCallback(() => api.pagamentos.listar(grupo.id), [grupo.id]);
  const [estado, recarregar] = useRecurso(carregar);

  if (grupo.membros.length < 2) {
    return (
      <Cartao className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Faltam Membros</h2>
        <p>Um Pagamento acontece entre dois Membros do Grupo.</p>
        <Link href={`/grupos/${grupo.id}`} className="font-semibold text-acento hover:underline">
          Ir para Membros
        </Link>
      </Cartao>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <RegistrarPagamento aoRegistrar={recarregar} />
      <Cartao>
        <h2 className="mb-4 text-lg font-semibold">Pagamentos</h2>
        {estado.tipo === "carregando" && <p aria-busy="true">Carregando Pagamentos…</p>}
        {estado.tipo === "erro" && <AvisoDeErro erro={estado.erro} />}
        {estado.tipo === "ok" &&
          (estado.dados.length === 0 ? (
            <p>Nenhum Pagamento registrado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {estado.dados.map((pagamento) => (
                <LinhaDoPagamento key={pagamento.id} pagamento={pagamento} />
              ))}
            </ul>
          ))}
      </Cartao>
    </div>
  );
}

function LinhaDoPagamento({ pagamento: p }: { pagamento: Pagamento }) {
  const { nomeDe } = useGrupo();
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="flex flex-col">
        <span className="text-texto">
          {nomeDe(p.de_membro_id)}
          <span aria-hidden="true"> → </span>
          <span className="sr-only"> pagou para </span>
          {nomeDe(p.para_membro_id)}
        </span>
        <span className="text-sm">
          {ROTULO_DO_MEIO[p.meio]} · {formatarData(p.data)}
        </span>
      </div>
      <Dinheiro centavos={p.valor_centavos} className="font-semibold" />
    </li>
  );
}

/** Lê ?de=&para=&valor= e só aceita ids de Membros do Grupo e centavos inteiros positivos. */
function usePreenchimento(membros: { id: MembroId }[]) {
  const params = useSearchParams();
  const membro = (nome: string) => {
    const id = Number(params.get(nome));
    return membros.some((m) => m.id === id) ? id : null;
  };
  const valor = Number(params.get("valor"));
  return {
    de: membro("de"),
    para: membro("para"),
    valor: Number.isInteger(valor) && valor > 0 ? formatarValor(valor) : "",
  };
}

function RegistrarPagamento({ aoRegistrar }: { aoRegistrar: () => void }) {
  const { grupo, eu } = useGrupo();
  const router = useRouter();
  const membros = grupo.membros;
  const inicial = usePreenchimento(membros);

  const [deId, setDeId] = useState<MembroId>(inicial.de ?? eu?.id ?? membros[0].id);
  const [paraId, setParaId] = useState<MembroId>(
    inicial.para ?? membros.find((m) => m.id !== (inicial.de ?? eu?.id ?? membros[0].id))!.id,
  );
  const [valor, setValor] = useState(inicial.valor);
  const [meio, setMeio] = useState<Meio>("pix");

  const [erroDoValor, setErroDoValor] = useState<string>();
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const credor = membros.find((m) => m.id === paraId)!;

  async function registrar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setRegistrado(false);
    const valorCentavos = lerValor(valor);
    setErroDoValor(valorCentavos === null ? "Use reais com até 2 casas, como 12,34." : undefined);
    if (valorCentavos === null) return;

    setEnviando(true);
    try {
      await api.pagamentos.registrar(grupo.id, {
        de_membro_id: deId,
        para_membro_id: paraId,
        valor_centavos: valorCentavos,
        meio,
      });
      setValor("");
      setRegistrado(true);
      // Tira o pré-preenchimento da URL para um recarregar não sugerir o mesmo Pagamento de novo.
      router.replace(`/grupos/${grupo.id}/pagamentos`, { scroll: false });
      aoRegistrar();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  const rotuloDoMembro = (id: MembroId, nome: string) => (id === eu?.id ? `${nome} (você)` : nome);

  return (
    <Cartao as="form" onSubmit={registrar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Registrar Pagamento</h2>
        <p className="text-sm">
          Registre um acerto já feito entre dois Membros. O RachAÍ confia no que você declara e abate o Saldo dos
          dois.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao rotulo="Quem pagou" value={deId} onChange={(e) => setDeId(Number(e.target.value))}>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {rotuloDoMembro(m.id, m.nome)}
            </option>
          ))}
        </Selecao>
        <Selecao rotulo="Quem recebeu" value={paraId} onChange={(e) => setParaId(Number(e.target.value))}>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>
              {rotuloDoMembro(m.id, m.nome)}
            </option>
          ))}
        </Selecao>
        <Campo
          rotulo="Valor"
          placeholder="R$ 0,00"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          erro={erroDoValor}
          autoComplete="off"
        />
        <EscolhaDeOpcao rotulo="Meio" opcoes={OPCOES_DE_MEIO} valor={meio} aoEscolher={setMeio} />
      </div>

      <ChavePixDoCredor nome={credor.nome} chavePix={credor.chave_pix} realce={meio === "pix"} />

      <AvisoDeErro erro={erro} />
      {registrado && (
        <p role="status" className="text-sm text-credito">
          Pagamento registrado.{" "}
          <Link href={`/grupos/${grupo.id}/saldos`} className="font-semibold underline">
            Ver Saldos
          </Link>
        </p>
      )}
      <Botao type="submit" carregando={enviando} className="self-start">
        Registrar Pagamento
      </Botao>
    </Cartao>
  );
}

function ChavePixDoCredor({ nome, chavePix, realce }: { nome: string; chavePix: string | null; realce: boolean }) {
  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
        realce ? "border-acento/40 bg-acento/10" : "border-borda-vidro bg-fundo-1/40",
      ].join(" ")}
    >
      {chavePix ? (
        <>
          <div className="flex min-w-0 flex-col">
            <span className="text-xs">Chave Pix de {nome}</span>
            <span className="break-all font-medium text-texto">{chavePix}</span>
          </div>
          <BotaoCopiar texto={chavePix} rotulo="Copiar Chave Pix" />
        </>
      ) : (
        <span className="text-sm">{nome} não informou Chave Pix.</span>
      )}
    </div>
  );
}
