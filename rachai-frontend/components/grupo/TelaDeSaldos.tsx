"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import { AvisoDeErro, Cartao, Dinheiro, Etiqueta } from "@/components/ui";
import { api } from "@/lib/api/rachai";
import type { Centavos, GrupoId, SaldosDoGrupo, TransferenciaSugerida } from "@/lib/api/tipos";
import { useRecurso } from "@/lib/useRecurso";

/**
 * Tela 3 (#6): Saldos e Transferências sugeridas.
 * Tudo vem pronto de GET /saldos (ADR 0004). Aqui só se exibe e se filtra o
 * que envolve "quem sou eu"; nada é somado, subtraído ou recalculado.
 */
export function TelaDeSaldos() {
  const { grupo } = useGrupo();
  const carregar = useCallback(() => api.saldos.consultar(grupo.id), [grupo.id]);
  const [estado] = useRecurso(carregar);

  if (estado.tipo === "carregando") return <p aria-busy="true">Carregando Saldos…</p>;
  if (estado.tipo === "erro") return <AvisoDeErro erro={estado.erro} />;
  return <Saldos dados={estado.dados} />;
}

/** Link para a tela de Pagamento já preenchida com a Transferência sugerida (só copia os números). */
function linkDePagamento(grupoId: GrupoId, t: TransferenciaSugerida) {
  return `/grupos/${grupoId}/pagamentos?de=${t.de_membro_id}&para=${t.para_membro_id}&valor=${t.valor_centavos}`;
}

const CLASSES_DO_LINK =
  "inline-flex h-8 items-center rounded-full border border-borda-vidro bg-vidro px-3 text-xs font-semibold text-texto transition-colors hover:bg-vidro-forte";

/** Texto ao lado da cor, para a informação não depender só do vermelho e do verde. */
function situacao(centavos: Centavos) {
  if (centavos > 0) return "tem a receber";
  if (centavos < 0) return "deve";
  return "quitado";
}

function Saldos({ dados }: { dados: SaldosDoGrupo }) {
  const { grupo, eu, nomeDe } = useGrupo();

  if (grupo.membros.length === 0) {
    return (
      <Cartao className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Ainda não há Membros</h2>
        <Link href={`/grupos/${grupo.id}`} className="font-semibold text-acento hover:underline">
          Ir para Membros
        </Link>
      </Cartao>
    );
  }

  const meuSaldo = eu ? dados.saldos.find((s) => s.membro_id === eu.id) : undefined;
  const minhas = eu
    ? dados.transferencias.filter((t) => t.de_membro_id === eu.id || t.para_membro_id === eu.id)
    : [];

  return (
    <div className="flex flex-col gap-8">
      {meuSaldo ? (
        // Saldo: a informação mais importante da tela. Sem vidro em cima, maior e com mais contraste.
        <section aria-labelledby="meu-saldo" className="flex flex-col gap-2">
          <h2 id="meu-saldo" className="text-sm font-medium uppercase tracking-wider text-texto-suave">
            Seu Saldo
          </h2>
          <Dinheiro centavos={meuSaldo.saldo_centavos} modo="saldo" className="text-5xl font-semibold sm:text-6xl" />
          <p>
            {meuSaldo.saldo_centavos < 0
              ? "Você deve ao Grupo."
              : meuSaldo.saldo_centavos > 0
                ? "Você tem a receber."
                : "Você está quitado."}
          </p>
          {minhas.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {minhas.map((t) => (
                <li key={`${t.de_membro_id}-${t.para_membro_id}`} className="flex flex-wrap items-baseline gap-x-1.5">
                  {t.de_membro_id === eu!.id ? (
                    <>
                      Pague <Dinheiro centavos={t.valor_centavos} className="font-semibold" /> para{" "}
                      <span className="font-medium text-texto">{nomeDe(t.para_membro_id)}</span>
                      <Link href={linkDePagamento(grupo.id, t)} className={`${CLASSES_DO_LINK} ml-2`}>
                        Registrar Pagamento
                      </Link>
                    </>
                  ) : (
                    <>
                      Receba <Dinheiro centavos={t.valor_centavos} className="font-semibold" /> de{" "}
                      <span className="font-medium text-texto">{nomeDe(t.de_membro_id)}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p role="status" className="rounded-xl border border-acento/40 bg-acento/10 px-4 py-3 text-sm text-texto">
          Escolha quem você é em{" "}
          <Link href={`/grupos/${grupo.id}`} className="font-semibold text-acento hover:underline">
            Membros
          </Link>{" "}
          para ver o seu Saldo em destaque.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Cartao>
          <h2 className="mb-4 text-lg font-semibold">Saldos</h2>
          <ul className="flex flex-col divide-y divide-white/10">
            {dados.saldos.map((s) => (
              <li key={s.membro_id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-texto">
                  {nomeDe(s.membro_id)}
                  {s.membro_id === eu?.id && <Etiqueta tom="acento">Você</Etiqueta>}
                </span>
                <span className="flex flex-col items-end">
                  <Dinheiro centavos={s.saldo_centavos} modo="saldo" className="font-semibold" />
                  <span className="text-xs">{situacao(s.saldo_centavos)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao>
          <h2 className="mb-1 text-lg font-semibold">Transferências sugeridas</h2>
          <p className="mb-4 text-sm">Pagamentos que, juntos, zeram os Saldos do Grupo.</p>
          {dados.transferencias.length === 0 ? (
            <p className="flex items-center gap-2">
              <Etiqueta tom="credito">Quitado</Etiqueta> Ninguém deve nada a ninguém.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dados.transferencias.map((t) => (
                <LinhaDaTransferencia key={`${t.de_membro_id}-${t.para_membro_id}`} transferencia={t} />
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}

function LinhaDaTransferencia({ transferencia: t }: { transferencia: TransferenciaSugerida }) {
  const { grupo, eu, nomeDe } = useGrupo();
  const envolveEu = eu !== null && (t.de_membro_id === eu.id || t.para_membro_id === eu.id);
  return (
    <li
      className={[
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
        envolveEu ? "bg-acento/10 ring-1 ring-acento/40" : "",
      ].join(" ")}
    >
      <span>
        <span className="text-texto">{nomeDe(t.de_membro_id)}</span>
        <span aria-hidden="true"> → </span>
        <span className="sr-only"> paga para </span>
        <span className="text-texto">{nomeDe(t.para_membro_id)}</span>
      </span>
      <span className="flex items-center gap-3">
        <Dinheiro centavos={t.valor_centavos} className="font-semibold" />
        <Link
          href={linkDePagamento(grupo.id, t)}
          className={CLASSES_DO_LINK}
          aria-label={`Registrar Pagamento de ${nomeDe(t.de_membro_id)} para ${nomeDe(t.para_membro_id)}`}
        >
          Registrar
        </Link>
      </span>
    </li>
  );
}
