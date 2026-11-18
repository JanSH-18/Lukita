// Misma validacion que Lukita-fronted/src/lib/ruc.js: nunca confiar solo en
// la validacion del navegador para un dato que se va a guardar en la BD.
const RUC_PREFIXES = ['10', '15', '16', '17', '20']
const CHECK_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

export function isValidRuc(value) {
  const ruc = String(value ?? '')
  if (!/^\d{11}$/.test(ruc) || !RUC_PREFIXES.includes(ruc.slice(0, 2))) return false

  const sum = CHECK_WEIGHTS.reduce(
    (total, weight, index) => total + weight * Number(ruc[index]),
    0,
  )
  return (11 - (sum % 11)) % 10 === Number(ruc[10])
}
