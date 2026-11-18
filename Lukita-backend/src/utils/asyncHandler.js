// Evita el try/catch repetido en cada ruta async: si la promesa falla,
// el error llega al middleware de errores en vez de colgar el request.
export function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next)
}
