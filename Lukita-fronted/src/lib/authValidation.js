// Validaciones de los formularios de login y registro (reglas de la HU-1 y la HU-2).
// Devuelven un objeto { campo: 'mensaje' }; vacio si todo esta bien.
import {
  EMAIL_REGEX,
  isDisposableEmail,
  isEmailRegistered,
  MIN_PASSWORD_LENGTH,
} from './auth'
import { getRucError } from './ruc'

export function validateLogin({ email, password }) {
  const errors = {}
  const cleanEmail = email.trim()

  if (!cleanEmail) {
    errors.email = 'Ingresa tu correo electrónico.'
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
  } else if (isDisposableEmail(cleanEmail)) {
    errors.email = 'No se permite el ingreso con correos falsos o dominios sospechosos.'
  }

  // Solo se exige que no esté vacía: una contraseña incorrecta, sea corta o larga,
  // recibe el mismo mensaje genérico ("Correo o contraseña incorrectos").
  if (!password) errors.password = 'Ingresa tu contraseña.'

  return errors
}

export function validateRegistro(form, usageType, acceptedTerms) {
  const errors = {}
  const email = form.email.trim().toLowerCase()

  if (!form.name.trim()) errors.name = 'Ingresa tu nombre completo.'

  if (!email) {
    errors.email = 'El correo es obligatorio.'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.'
  } else if (isDisposableEmail(email)) {
    errors.email = 'No se permite registrar correos falsos o dominios sospechosos.'
  } else if (isEmailRegistered(email)) {
    errors.email = 'Este correo ya está registrado.'
  }

  // El RUC solo es obligatorio para el perfil empresarial.
  if (usageType === 'empresarial') {
    const rucError = getRucError(form.ruc)
    if (rucError) errors.ruc = rucError
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.'
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  if (!acceptedTerms) {
    errors.terms = 'Debes aceptar los términos y la política de privacidad.'
  }

  return errors
}
