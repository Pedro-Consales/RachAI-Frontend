"use client";

import { useState, type FormEvent } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import { AvisoDeErro, Botao, Campo, Cartao, Etiqueta } from "@/components/ui";
import { api } from "@/lib/api/rachai";
import type { Membro } from "@/lib/api/tipos";

/** Tela 1 (#3): Membros do Grupo, adicionar Membro e escolher quem sou eu. */
export function TelaDeMembros() {
  const { grupo, eu } = useGrupo();

  return (
    <div className="flex flex-col gap-6">
      {!eu && grupo.membros.length > 0 && (
        <p role="status" className="rounded-xl border border-acento/40 bg-acento/10 px-4 py-3 text-sm text-texto">
          Quem é você neste Grupo? Escolha seu nome na lista. A escolha fica só neste navegador.
        </p>
      )}

      <Cartao>
        <h2 className="mb-4 text-lg font-semibold">Membros</h2>
        {grupo.membros.length === 0 ? (
          <p>O Grupo ainda não tem Membros. Adicione o primeiro abaixo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/10">
            {grupo.membros.map((membro) => (
              <LinhaDoMembro key={membro.id} membro={membro} />
            ))}
          </ul>
        )}
      </Cartao>

      <NovoMembro />
    </div>
  );
}

function LinhaDoMembro({ membro }: { membro: Membro }) {
  const { eu, escolherEu } = useGrupo();
  const souEu = eu?.id === membro.id;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 font-medium text-texto">
          {membro.nome}
          {souEu && <Etiqueta tom="acento">Você</Etiqueta>}
        </span>
        <span className="truncate text-sm">
          {membro.chave_pix ? `Chave Pix: ${membro.chave_pix}` : "Sem Chave Pix"}
        </span>
      </div>
      {souEu ? (
        <Botao variante="fantasma" onClick={() => escolherEu(null)}>
          Não sou eu
        </Botao>
      ) : (
        <Botao variante="secundario" onClick={() => escolherEu(membro.id)}>
          Sou eu
        </Botao>
      )}
    </li>
  );
}

function NovoMembro() {
  const { grupo, recarregar, eu, escolherEu } = useGrupo();
  const [nome, setNome] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  async function adicionar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const membro = await api.grupos.adicionarMembro(grupo.id, {
        nome,
        chave_pix: chavePix || undefined,
      });
      setNome("");
      setChavePix("");
      // Quem cria o primeiro Membro quase sempre é ele mesmo.
      if (!eu && grupo.membros.length === 0) escolherEu(membro.id);
      recarregar();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao as="form" onSubmit={adicionar} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Adicionar Membro</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
        <Campo
          rotulo="Chave Pix"
          value={chavePix}
          onChange={(e) => setChavePix(e.target.value)}
          dica="Opcional. Aparece para quem for pagar este Membro."
          autoComplete="off"
        />
      </div>
      <AvisoDeErro erro={erro} />
      <Botao type="submit" carregando={enviando} className="self-start">
        Adicionar Membro
      </Botao>
    </Cartao>
  );
}
