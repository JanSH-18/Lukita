// Convierte categorias y cuentas del almacen en opciones para formularios.
export const categoryOptions = (categories, type) =>
  categories
    .filter((category) => !type || category.type === type)
    .map((category) => ({ value: category.id, label: category.name }))

export const accountOptions = (accounts) =>
  accounts.map((account) => ({ value: account.id, label: account.name }))
