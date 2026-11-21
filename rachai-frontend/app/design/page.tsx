/**
 * Vitrine do design system e tela de exemplo (Saldos) para aprovar o visual.
 *
 * Os dados abaixo são FIXOS e copiados de respostas reais da API (teste de
 * fumaça contra o backend). Nada é calculado aqui. A tela de Saldos de
 * verdade vem num PR próprio e consome `api.saldos.consultar`.
 */

import { AvisoDeErro, Botao, Campo, Cartao, Dinheiro, Etiqueta } from "@/components/ui";
import { ErroDaApi } from "@/lib/api/erros";
import type { Membro, SaldosDoGrupo } from "@/lib/api/tipos";

const MEMBROS: Membro[] = [
  { id: 1, nome: "Ana", chave_pix: "ana@pix" },
  { id: 2, nome: "Bia", chave_pix: null },
  { id: 3, nome: "Caio", chave_pix: null },
];

const SALDOS: SaldosDoGrupo = {
  saldos: [
    { membro_id: 1, saldo_centavos: 5666 },
    { membro_id: 2, saldo_centavos: -3333 },
    { membro_id: 3, saldo_centavos: -2333 },
  ],
  transferencias: [
    { de_membro_id: 2, para_membro_id: 1, valor_centavos: 3333 },
    { de_membro_id: 3, para_membro_id: 1, valor_centavos: 2333 },
  ],
};

const EU = 2; // "quem sou eu" de exemplo: Bia

const nome = (id: number) => MEMBROS.find((m) => m.id === id)?.nome ?? `Membro ${id}`;

export default function DesignPage() {
  const meu = SALDOS.saldos.find((s) => s.membro_id === EU)!;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-acento">RachAÍ · design system</p>
        <h1 className="text-3xl font-semibold tracking-tight">República da Gávea</h1>
        <p>Você é <span className="font-medium text-texto">{nome(EU)}</span></p>
      </header>

      {/* Saldo: a informação mais importante. Sem vidro em cima, maior e com mais contraste. */}
      <section aria-labelledby="meu-saldo" className="flex flex-col gap-1">
        <h2 id="meu-saldo" className="text-sm font-medium uppercase tracking-wider text-texto-suave">
          Seu Saldo
        </h2>
        <Dinheiro centavos={meu.saldo_centavos} modo="saldo" className="text-5xl font-semibold sm:text-6xl" />
        <p>{meu.saldo_centavos < 0 ? "Você deve ao Grupo." : meu.saldo_centavos > 0 ? "Você tem a receber." : "Você está quitado."}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Cartao interativo>
          <h2 className="mb-4 text-lg font-semibold">Saldos</h2>
          <ul className="flex flex-col divide-y divide-white/10">
            {SALDOS.saldos.map((s) => (
              <li key={s.membro_id} className="flex items-center justify-between py-2.5">
                <span className="text-texto">{nome(s.membro_id)}</span>
                <Dinheiro centavos={s.saldo_centavos} modo="saldo" />
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao interativo>
          <h2 className="mb-4 text-lg font-semibold">Transferências sugeridas</h2>
          <ul className="flex flex-col gap-3">
            {SALDOS.transferencias.map((t) => (
              <li key={`${t.de_membro_id}-${t.para_membro_id}`} className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-texto">{nome(t.de_membro_id)}</span> → <span className="text-texto">{nome(t.para_membro_id)}</span>
                </span>
                <Dinheiro centavos={t.valor_centavos} />
              </li>
            ))}
          </ul>
          <Botao className="mt-6 w-full">Registrar Pagamento</Botao>
        </Cartao>
      </div>

      <Cartao>
        <h2 className="mb-4 text-lg font-semibold">Componentes</h2>

        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-3">
            <Botao>Primário</Botao>
            <Botao variante="secundario">Secundário</Botao>
            <Botao variante="fantasma">Fantasma</Botao>
            <Botao carregando>Salvando</Botao>
            <Botao disabled>Desabilitado</Botao>
          </div>

          <div className="flex flex-wrap gap-2">
            <Etiqueta>Neutro</Etiqueta>
            <Etiqueta tom="acento">Aberta</Etiqueta>
            <Etiqueta tom="credito">Quitado</Etiqueta>
            <Etiqueta tom="divida">Deve</Etiqueta>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Descrição" placeholder="Conta de luz" />
            <Campo rotulo="Valor" placeholder="R$ 0,00" inputMode="decimal" dica="Em reais, até 2 casas." />
            <Campo
              rotulo="Chave Pix"
              defaultValue={"x".repeat(80)}
              erro="A Chave Pix deve ter no maximo 77 caracteres."
              className="sm:col-span-2"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-texto">Erros por tipo</p>
            <AvisoDeErro erro={new ErroDaApi("dominio", "A soma das Cotas deve ser igual ao Valor da Despesa.", 422)} />
            <AvisoDeErro erro={new ErroDaApi("nao_encontrado", "Vaquinha 9 nao encontrada.", 404)} />
            <AvisoDeErro erro={new ErroDaApi("indisponivel", "", 500)} />
          </div>
        </div>
      </Cartao>
    </main>
  );
}
