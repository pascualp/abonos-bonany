const dos = (n: number) => String(n).padStart(2, '0');

/** Fecha local YYYY-MM-DD (no UTC: a las 00:30 sigue siendo "hoy" en España). */
export const diaISO = (d = new Date()) =>
  `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

export const horaLocal = (d = new Date()) => `${dos(d.getHours())}:${dos(d.getMinutes())}`;

export const sumarDias = (iso: string, dias: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return diaISO(new Date(y, m - 1, d + dias));
};

/** "2026-11-10" → "10/11/2026" */
export const formatoDia = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
