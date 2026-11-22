// Nome normalizado de produto e de loja (architecture §5.1): sem acento, sem
// espaços nas pontas, em minúsculas e com espaços internos reduzidos a um.
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
