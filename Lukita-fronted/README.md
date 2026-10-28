# Lukita - Frontend

Interfaz de demostracion para un gestor de finanzas personales y empresariales.
Esta etapa usa datos de prueba guardados en el navegador; aun no tiene API ni
base de datos conectadas. La autenticacion local tampoco sustituye seguridad
de servidor.

## Estructura

```text
src/
  main.jsx                 Entrada de React y BrowserRouter
  App.jsx                  Rutas de login, registro y dashboard protegido
  components/
    AuthLayout.jsx         Estructura visual compartida por login y registro
    AuthControls.jsx       Controles de formulario de autenticacion
    FinanceUI.jsx          Componentes visuales compartidos del dashboard
  lib/
    auth.js                Registro y sesion demo en almacenamiento local
    financeStore.jsx       Datos iniciales, perfiles y persistencia financiera
    financeUtils.js        Formato de moneda/fecha y nombres de referencias
  page/
    login.jsx              Inicio de sesion
    registro.jsx           Registro de usuario demo
    dashboard.jsx          Shell, navegacion y rutas privadas del dashboard
    dashboardHome.jsx      Resumen principal y graficos
    finance/
      index.js             Exportaciones usadas por las rutas del dashboard
      options.js           Opciones de categorias y cuentas para formularios
      shared.jsx           Formularios y componentes reutilizados por modulos
      transactions.jsx     Transacciones, gastos extras y categorias
      planning.jsx         Presupuestos y metas de ahorro
      accounts.jsx         Cuentas, perfiles y resumen de dinero
      recurring.jsx        Pagos y cobros recurrentes
      reports.jsx          Reportes y exportacion
      settings.jsx         Preferencias y opciones adicionales
```

## Donde hacer cambios

- Rutas, menu o estructura general del dashboard: `src/page/dashboard.jsx`.
- Una pantalla financiera: el archivo correspondiente dentro de
  `src/page/finance/`; sus exportaciones llegan al router mediante `index.js`.
- Estilo y controles visuales comunes: `src/components/FinanceUI.jsx`.
- Semillas, perfiles o guardado de datos demo: `src/lib/financeStore.jsx`.
- Login, registro y sesion local: `src/page/login.jsx`,
  `src/page/registro.jsx` y `src/lib/auth.js`.

## Comandos

- `npm run dev`: inicia el servidor local de Vite.
- `npm run lint`: revisa el codigo con ESLint.
- `npm run build`: genera la version de produccion en `dist/`.
