// Validacion del RUC peruano: 11 digitos, prefijo valido y digito verificador.

const RUC_LENGTH = 11
// 10 = persona natural, 15/16/17 = otros, 20 = persona juridica (empresa).
const RUC_PREFIXES = ['10', '15', '16', '17', '20']
const CHECK_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

export const RUC_LENGTH_DIGITS = RUC_LENGTH

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

export function isValidRuc(value) {
  const ruc = String(value ?? '')
  if (!/^\d{11}$/.test(ruc) || !RUC_PREFIXES.includes(ruc.slice(0, 2))) return false

  const sum = CHECK_WEIGHTS.reduce(
    (total, weight, index) => total + weight * Number(ruc[index]),
    0,
  )
  // Si 11 - (suma % 11) da 10 u 11, el digito verificador es 0 o 1.
  return (11 - (sum % 11)) % 10 === Number(ruc[10])
}

// Mensaje de error para el formulario, o '' si el RUC es valido.
export function getRucError(value) {
  const ruc = String(value ?? '')
  if (!ruc) return 'Ingresa el RUC de tu empresa.'
  if (ruc.length !== RUC_LENGTH) return `El RUC debe tener ${RUC_LENGTH} dígitos.`
  if (!isValidRuc(ruc)) return 'El RUC no es válido. Revísalo e inténtalo de nuevo.'
  return ''
}
