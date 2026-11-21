import type { DataISO } from "./api/tipos";

/** "2026-11-21" → "21/11/2026". Só formatação, sem fuso: a API manda a data pura. */
export function formatarData(data: DataISO): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
