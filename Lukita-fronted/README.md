# Lukita - Frontend

Interfaz de demostración para un gestor de finanzas personales y empresariales.
Esta etapa usa datos de prueba guardados en el navegador; aún no tiene API ni
base de datos conectadas. La autenticación local tampoco sustituye la seguridad
de un servidor.

## Estructura

```text
src/
  main.jsx                 Entrada de React y BrowserRouter
  App.jsx                  Rutas de login, registro y dashboard protegido
  components/
    AuthLayout.jsx         Estructura visual compartida por login y registro
    AuthControls.jsx       Campos, alertas y botones de login y registro
    ChartTooltip.jsx       Globo con datos al pasar el cursor sobre un gráfico
    DashboardLayout.jsx    Menú lateral, cabecera y navegación móvil
    FinanceUI.jsx          Componentes visuales compartidos del dashboard
  lib/
    auth.js                Registro y sesión demo en almacenamiento local
    authValidation.js      Validaciones de los formularios de login y registro
    financeSeed.js         Datos de ejemplo con los que arranca cada perfil
    financeStore.jsx       Contexto financiero: guardado por usuario y operaciones
    financeUtils.js        Formatos, meses y cálculos sobre transacciones
    navigation.js          Opciones del menú (escritorio y móvil) y títulos
    useChartTooltip.js     Estado del tooltip de los gráficos
    ruc.js                 Validación del RUC peruano (11 dígitos y dígito verificador)
  page/
    login.jsx              Inicio de sesión
    registro.jsx           Registro de usuario demo
    dashboard.jsx          Rutas privadas del dashboard
    dashboardHome.jsx      Resumen principal y gráficos
    finance/
      index.js             Exportaciones usadas por las rutas del dashboard
      options.js           Opciones de categorías y cuentas para formularios
      shared.jsx           Formularios y componentes reutilizados por módulos
      transactions.jsx     Transacciones, gastos extras y categorías
      planning.jsx         Presupuestos y metas de ahorro
      accounts.jsx         Cuentas, perfiles y resumen de dinero
      recurring.jsx        Pagos y cobros recurrentes
      reports.jsx          Reportes y exportación
      settings.jsx         Preferencias y opciones adicionales
```

## Dónde hacer cambios

- Menú o títulos de las rutas: `src/lib/navigation.js`.
- Rutas del dashboard: `src/page/dashboard.jsx`. Aspecto del menú, la cabecera
  y la barra móvil: `src/components/DashboardLayout.jsx`.
- Una pantalla financiera: el archivo correspondiente dentro de
  `src/page/finance/`; sus exportaciones llegan al router mediante `index.js`.
- Estilo y controles visuales comunes: `src/components/FinanceUI.jsx`.
- Datos de ejemplo: `src/lib/financeSeed.js`. Guardado y operaciones sobre los
  datos: `src/lib/financeStore.jsx`. Cálculos y formatos: `src/lib/financeUtils.js`.
- Login, registro y sesión local: `src/page/login.jsx`, `src/page/registro.jsx`,
  `src/components/AuthControls.jsx` y `src/lib/auth.js`.

## Cómo funcionan los datos

- Cada usuario guarda sus datos con su propia clave en `localStorage`
  (`lukita_finance_demo_v1:<correo>`), así dos cuentas no se mezclan.
- **Una cuenta nueva empieza vacía**: sin transacciones, con las categorías por
  defecto y una cuenta "Efectivo" en 0. Todos los totales del dashboard valen 0.
- En Configuración, "Cargar datos de ejemplo" reemplaza los datos por los de
  `financeSeed.js` y "Borrar mis datos" vuelve a dejar la cuenta vacía.
- El dashboard muestra el **balance total** (todos los ingresos menos todos los
  gastos) y, para el mes y año elegidos en el selector, los ingresos, gastos,
  el gráfico circular y las barras de los últimos 6 meses. Por defecto se usa el
  mes de la transacción más reciente (`getReferenceMonth`).
- Los gráficos muestran el detalle (nombre, monto y porcentaje, o mes y monto)
  al pasar el cursor o enfocar con el teclado.
- La contraseña debe tener mínimo 8 caracteres (`MIN_PASSWORD_LENGTH` en `auth.js`).
- El RUC se pide al registrarse como "Empresarial" y se puede editar en
  Configuración con el perfil empresarial activo. En la demo se guarda junto al
  usuario (`auth.js`); con el backend pertenecerá al perfil empresarial.

## Cuando exista el backend (Node.js)

`src/lib/auth.js` es el único archivo que simula el servidor: `registerUser` y
`authenticate` deben pasar a llamar a la API y el token JWT debe firmarse en el
servidor. El resto de la app solo usa `getSession`, `createSession` y
`clearSession`.

## Comandos

- `npm run dev`: inicia el servidor local de Vite.
- `npm run lint`: revisa el código con ESLint.
- `npm run build`: genera la versión de producción en `dist/`.
