"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AvisoDeErro, Botao, Campo, Cartao } from "@/components/ui";
import { eErroDaApi } from "@/lib/api/erros";
import { api } from "@/lib/api/rachai";

/** Início (#3): criar um Grupo ou entrar num Grupo pelo código. */
export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-acento">RachAÍ</p>
        <h1 className="text-4xl font-semibold tracking-tight">Dividam as contas sem briga.</h1>
        <p className="max-w-xl">
          Lancem Despesas, vejam quem deve a quem e peçam ajuda por Vaquinhas, tudo dentro de um Grupo.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <CriarGrupo />
        <EntrarNoGrupo />
      </div>
    </main>
  );
}

function CriarGrupo() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const grupo = await api.grupos.criar({ nome });
      router.push(`/grupos/${grupo.id}`);
    } catch (e) {
      setErro(e);
      setEnviando(false);
    }
  }

  return (
    <Cartao as="form" onSubmit={criar} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Criar Grupo</h2>
      <Campo
        rotulo="Nome do Grupo"
        placeholder="República da Gávea"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoComplete="off"
      />
      <AvisoDeErro erro={erro} />
      <Botao type="submit" carregando={enviando} className="mt-auto">
        Criar Grupo
      </Botao>
    </Cartao>
  );
}

function EntrarNoGrupo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroDoCampo, setErroDoCampo] = useState<string>();
  const [erro, setErro] = useState<unknown>(null);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setErroDoCampo(undefined);
    const limpo = codigo.trim();
    if (!/^\d+$/.test(limpo)) {
      setErroDoCampo("O código do Grupo é um número.");
      return;
    }
    setEnviando(true);
    try {
      const grupo = await api.grupos.consultar(Number(limpo));
      router.push(`/grupos/${grupo.id}`);
    } catch (e) {
      // Exceção combinada: nesta tela o 404 é um código digitado errado, então é erro da pessoa.
      if (eErroDaApi(e) && e.tipo === "nao_encontrado") setErroDoCampo("Grupo não encontrado.");
      else setErro(e);
      setEnviando(false);
    }
  }

  return (
    <Cartao as="form" onSubmit={entrar} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Entrar num Grupo</h2>
      <Campo
        rotulo="Código do Grupo"
        placeholder="Ex.: 12"
        inputMode="numeric"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        erro={erroDoCampo}
        dica="Peça o código ou o link a alguém do Grupo."
        autoComplete="off"
      />
      <AvisoDeErro erro={erro} />
      <Botao type="submit" variante="secundario" carregando={enviando} className="mt-auto">
        Entrar
      </Botao>
    </Cartao>
  );
}
