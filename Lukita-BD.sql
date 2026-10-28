--drop schema if exists Lukita cascade;
create schema Lukita;

set search_path to Lukita;

--REGISTRO Y LOGIN
create table Usuarios(
	id 				bigint 			generated always as identity primary key,
	nombre 			varchar(120)	not null,
	email			varchar(120)	not null,
	password  		text 			not null,
	creado_en 		timestamptz 	not null default now()
);

--Para evitar correos duplicados e ignorar mayusculas y minusculas
create unique index usuarios_email_uq on Usuarios (lower(email));

--Perfiles (Personal/Empresarial)
create table Perfiles(
	id 				bigint 			generated always as identity primary key,
	usuario_id 		bigint 			not null references usuarios(id) on delete cascade,
	tipo 			varchar(12) 	not null check(tipo in ('personal', 'empresarial')),
	nombre			varchar(120),
	creado_en 		timestamptz 	not null default now(),
	unique (usuario_id, tipo)
);

--Cuentas
create table Cuentas(
	id 				bigint 			generated always as identity primary key,
	perfil_id		bigint 			not null references perfiles(id) on delete cascade,
	nombre 			varchar(80)		not null,
	tipo			varchar(10) 	not null check (tipo in ('efectivo','banco','tarjeta')),
	saldo_inicial 	numeric(12,2) 	not null default 0,
	creado_en 		timestamptz 	not null default now()
);

create index cuentas_perfil_idx on cuentas (perfil_id);

--Categorias
create table Categorias(
	id  			bigint 			generated always as identity primary key,
	perfil_id 		bigint 			not null references perfiles(id) on delete cascade,
	nombre 			varchar(60)		not null,
	tipo 			varchar(8) 		not null check(tipo in ('ingreso','gasto')),
	color 			char(7), 				--ej. '#10B981'
	unique (perfil_id,tipo,nombre)
);

--Pagos Recurrentes
create table pagos_recurrentes(
	id 				bigint 			generated always as identity primary key,
	perfil_id 	 	bigint 			not null references perfiles(id) on delete cascade,
	cuenta_id 		bigint 			not null references cuentas (id) on delete no action,
	categorias_id  	bigint 			not null references categorias (id) on delete no action,
	tipo 			varchar(8) 		not null check (tipo in ('ingreso','gasto')),
	descripcion 	varchar(200),
	monto 			numeric(12,2) 	not null check(monto > 0),
	frecuencia 		varchar(10) 	not null check (frecuencia in ('semanal','quincenal','mensual','anual')),
	proxima_fecha 	date 			not null,
	activo 			boolean 		not null default true
);
create index recurrentes_proxima_idx on pagos_recurrentes (perfil_id, proxima_fecha) where activo;

--Transacciones
create table transacciones(
	id 				bigint  		generated always as identity primary key,
	perfil_id 		bigint 			not null references perfiles(id) on delete cascade,
	cuenta_id 		bigint 			not null references cuentas(id) on delete no action,
	categoria_id	bigint 			not null references categorias(id) on delete no action,
	recurrente_id 	bigint 					 references pagos_recurrentes(id) on delete set null,
	tipo 			varchar(8)		not null check (tipo in ('ingreso','gasto')),
	monto 			numeric(12,2) 	not null check (monto > 0),
	fecha 			date 			not null,
	descripcion 	varchar(200),
	es_extra		boolean 		not null default false,
	creado_en 		timestamptz 	not null default now()
);

--Indices para filtros, dashboard y reportes
create index trans_perfil_fecha_idx on transacciones (perfil_id,fecha desc);
create index trans_categoria_idx on transacciones (categoria_id);
create index trans_cuenta_idx on transacciones (cuenta_id);

--Presupuesto para categorias
create table presupuestos(
	id 				bigint 			generated always as identity primary key,
	perfil_id 		bigint 			not null references perfiles(id) on delete cascade,
	categoria_id 	bigint 			not null references categorias(id) on delete cascade,
	mes 			date 			not null check (extract(day from mes) = 1 ),
	monto_limite 	numeric(12,2)	not null check (monto_limite  > 0),
	unique (perfil_id,categoria_id, mes)
);

--Metas de ahorro
create table metas_ahorro(
	id 				bigint 			generated always as identity primary key,
	perfil_id 		bigint 			not null references perfiles(id) on delete cascade,
	nombre 			varchar(100) 	not null,
	monto_objetivo  numeric(12,2) 	not null check (monto_objetivo > 0),
	monto_actual 	numeric(12,2)	not null default 0 check (monto_actual >= 0),
	fecha_limite 	date 			not null,
	creado_en 		timestamptz 	not null default now()
);

create index metas_perfil_idx on metas_ahorro (perfil_id);

--DATOS DE PRUEBA 
-- Contraseña de TODOS los usuarios de prueba: Lukita-Demo-2026!
-- USUARIOS -----------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password) VALUES
  ('Ana Torres',    'ana.personal@lukita.test',  '$2b$12$yEzLj117MkQ4fOzKb7f1O.d9tu2r.AtwzmaZwVAvaMwQE.Lf.kPhC'),
  ('Carlos Ruiz',   'carlos.empresa@lukita.test','$2b$12$PZbWMQjBKQEEgGdpjszqr.hB.KNheido1cQM3DgYrKHs/tKCPhWOi'),
  ('Lucía Vega',    'lucia.mixto@lukita.test',   '$2b$12$edMiBZLhSUzoIqM4HJBumO2bIpw8oaP7yuNcGWACVkB.aO65HTRqi'),
  ('Usuario Vacío', 'vacio@lukita.test',         '$2b$12$jhUKX4S9kqGQpWOYoz9hzOn1G8JbVf1Tpcho28PAAZfb.4G1ZJWWi');

-- PERFILES -----------------------------------------------------------------
INSERT INTO perfiles (usuario_id, tipo, nombre)
SELECT u.id, v.tipo, v.nombre
FROM (VALUES
  ('ana.personal@lukita.test',   'personal',    'Personal'),
  ('carlos.empresa@lukita.test', 'empresarial', 'Ruiz Servicios SAC'),
  ('lucia.mixto@lukita.test',    'personal',    'Personal'),
  ('lucia.mixto@lukita.test',    'empresarial', 'Vega Diseño'),
  ('vacio@lukita.test',          'personal',    'Personal')
) AS v(email, tipo, nombre)
JOIN usuarios u ON u.email = v.email;

-- CATEGORÍAS por defecto (según el tipo de perfil) -------------------------
INSERT INTO categorias (perfil_id, nombre, tipo, color)
SELECT p.id, v.nombre, v.tipo, v.color
FROM perfiles p
JOIN (VALUES
  ('personal',    'Salario',          'ingreso', '#10B981'),
  ('personal',    'Freelance',        'ingreso', '#14B8A6'),
  ('personal',    'Otros ingresos',   'ingreso', '#84CC16'),
  ('personal',    'Alimentación',     'gasto',   '#F59E0B'),
  ('personal',    'Transporte',       'gasto',   '#3B82F6'),
  ('personal',    'Vivienda',         'gasto',   '#8B5CF6'),
  ('personal',    'Servicios',        'gasto',   '#06B6D4'),
  ('personal',    'Salud',            'gasto',   '#EF4444'),
  ('personal',    'Ocio',             'gasto',   '#EC4899'),
  ('personal',    'Educación',        'gasto',   '#6366F1'),
  ('personal',    'Otros gastos',     'gasto',   '#94A3B8'),
  ('empresarial', 'Ventas',           'ingreso', '#10B981'),
  ('empresarial', 'Servicios prestados','ingreso','#14B8A6'),
  ('empresarial', 'Proveedores',      'gasto',   '#F59E0B'),
  ('empresarial', 'Sueldos',          'gasto',   '#3B82F6'),
  ('empresarial', 'Alquiler',         'gasto',   '#8B5CF6'),
  ('empresarial', 'Servicios',        'gasto',   '#06B6D4'),
  ('empresarial', 'Marketing',        'gasto',   '#EC4899'),
  ('empresarial', 'Impuestos',        'gasto',   '#EF4444'),
  ('empresarial', 'Otros gastos',     'gasto',   '#94A3B8')
) AS v(perfil, nombre, tipo, color) ON v.perfil = p.tipo
JOIN usuarios u ON u.id = p.usuario_id AND u.email LIKE '%@lukita.test';

-- CUENTAS ------------------------------------------------------------------
INSERT INTO cuentas (perfil_id, nombre, tipo, saldo_inicial)
SELECT p.id, v.cuenta, v.tipo, v.saldo
FROM (VALUES
  ('ana.personal@lukita.test',   'personal',    'Efectivo',       'efectivo', 150.00),
  ('ana.personal@lukita.test',   'personal',    'Ahorros BCP',    'banco',    2000.00),
  ('ana.personal@lukita.test',   'personal',    'Visa',           'tarjeta',  0.00),
  ('carlos.empresa@lukita.test', 'empresarial', 'Caja chica',     'efectivo', 300.00),
  ('carlos.empresa@lukita.test', 'empresarial', 'Banco empresa',  'banco',    12000.00),
  ('lucia.mixto@lukita.test',    'personal',    'Efectivo',       'efectivo', 80.00),
  ('lucia.mixto@lukita.test',    'empresarial', 'Banco negocio',  'banco',    3500.00),
  ('vacio@lukita.test',          'personal',    'Efectivo',       'efectivo', 0.00)
) AS v(email, perfil, cuenta, tipo, saldo)
JOIN usuarios u ON u.email = v.email
JOIN perfiles p ON p.usuario_id = u.id AND p.tipo = v.perfil;

-- TRANSACCIONES (meses_atras 0 = este mes, 1 = mes pasado, 2 = hace dos) ----
INSERT INTO transacciones (perfil_id, cuenta_id, categoria_id, tipo, monto, fecha, descripcion, es_extra)
SELECT p.id, c.id, k.id, v.tipo, v.monto,
       (date_trunc('month', current_date) - v.meses_atras * interval '1 month'
         + (v.dia - 1) * interval '1 day')::date,
       v.descripcion, v.extra
FROM (VALUES
  -- Ana (personal)
  ('ana.personal@lukita.test','personal','Ahorros BCP','Salario','ingreso',3200.00,0,1,'Sueldo del mes',false),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Freelance','ingreso',450.00,0,10,'Diseño de logo',false),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Vivienda','gasto',900.00,0,2,'Alquiler',false),
  ('ana.personal@lukita.test','personal','Visa','Alimentación','gasto',185.50,0,3,'Supermercado',false),
  ('ana.personal@lukita.test','personal','Efectivo','Transporte','gasto',42.00,0,4,'Taxi y pasajes',false),
  ('ana.personal@lukita.test','personal','Visa','Ocio','gasto',15.99,0,5,'Netflix',false),
  ('ana.personal@lukita.test','personal','Visa','Servicios','gasto',68.30,0,6,'Luz e internet',false),
  ('ana.personal@lukita.test','personal','Efectivo','Salud','gasto',120.00,0,8,'Consulta médica urgente',true),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Salario','ingreso',3200.00,1,1,'Sueldo del mes',false),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Vivienda','gasto',900.00,1,2,'Alquiler',false),
  ('ana.personal@lukita.test','personal','Visa','Alimentación','gasto',240.80,1,7,'Supermercado',false),
  ('ana.personal@lukita.test','personal','Visa','Ocio','gasto',95.00,1,15,'Cine y cena',false),
  ('ana.personal@lukita.test','personal','Efectivo','Transporte','gasto',55.00,1,18,'Taxi y pasajes',false),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Salario','ingreso',3200.00,2,1,'Sueldo del mes',false),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Vivienda','gasto',900.00,2,2,'Alquiler',false),
  ('ana.personal@lukita.test','personal','Visa','Educación','gasto',180.00,2,12,'Curso en línea',false),
  -- Carlos (empresarial)
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Ventas','ingreso',8400.00,0,5,'Ventas de la semana 1',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Servicios prestados','ingreso',2600.00,0,12,'Consultoría cliente A',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Alquiler','gasto',1200.00,0,2,'Alquiler del local',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Sueldos','gasto',3500.00,0,4,'Planilla',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Proveedores','gasto',2100.00,0,6,'Compra de insumos',false),
  ('carlos.empresa@lukita.test','empresarial','Caja chica','Marketing','gasto',350.00,0,9,'Anuncios en redes',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Servicios','gasto',30.00,0,10,'Hosting',false),
  ('carlos.empresa@lukita.test','empresarial','Caja chica','Otros gastos','gasto',210.00,0,11,'Reparación imprevista',true),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Ventas','ingreso',9100.00,1,5,'Ventas del mes',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Alquiler','gasto',1200.00,1,2,'Alquiler del local',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Sueldos','gasto',3500.00,1,4,'Planilla',false),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Impuestos','gasto',780.00,1,20,'Pago de impuestos',false),
  -- Lucía (dos perfiles con datos distintos)
  ('lucia.mixto@lukita.test','personal','Efectivo','Otros ingresos','ingreso',200.00,0,3,'Venta de ropa usada',false),
  ('lucia.mixto@lukita.test','personal','Efectivo','Alimentación','gasto',60.00,0,5,'Mercado',false),
  ('lucia.mixto@lukita.test','empresarial','Banco negocio','Servicios prestados','ingreso',1800.00,0,7,'Proyecto de branding',false),
  ('lucia.mixto@lukita.test','empresarial','Banco negocio','Servicios','gasto',45.00,0,8,'Licencia de software',false)
) AS v(email, perfil, cuenta, categoria, tipo, monto, meses_atras, dia, descripcion, extra)
JOIN usuarios u    ON u.email = v.email
JOIN perfiles p    ON p.usuario_id = u.id AND p.tipo = v.perfil
JOIN cuentas c     ON c.perfil_id = p.id AND c.nombre = v.cuenta
JOIN categorias k  ON k.perfil_id = p.id AND k.nombre = v.categoria AND k.tipo = v.tipo;

-- PRESUPUESTOS del mes actual ----------------------------------------------
INSERT INTO presupuestos (perfil_id, categoria_id, mes, monto_limite)
SELECT p.id, k.id, date_trunc('month', current_date)::date, v.limite
FROM (VALUES
  ('ana.personal@lukita.test','personal','Alimentación',300.00),   -- ~62% usado
  ('ana.personal@lukita.test','personal','Transporte',  50.00),    -- ~84%: cerca del límite
  ('ana.personal@lukita.test','personal','Salud',       100.00),   -- excedido (120 de 100)
  ('carlos.empresa@lukita.test','empresarial','Marketing',800.00),
  ('carlos.empresa@lukita.test','empresarial','Proveedores',2000.00) -- excedido (2100)
) AS v(email, perfil, categoria, limite)
JOIN usuarios u   ON u.email = v.email
JOIN perfiles p   ON p.usuario_id = u.id AND p.tipo = v.perfil
JOIN categorias k ON k.perfil_id = p.id AND k.nombre = v.categoria AND k.tipo = 'gasto';

-- METAS DE AHORRO ----------------------------------------------------------
INSERT INTO metas_ahorro (perfil_id, nombre, monto_objetivo, monto_actual, fecha_limite)
SELECT p.id, v.nombre, v.objetivo, v.actual, (current_date + v.dias * interval '1 day')::date
FROM (VALUES
  ('ana.personal@lukita.test','personal','Viaje a Cusco',      3000.00, 1200.00, 240),
  ('ana.personal@lukita.test','personal','Fondo de emergencia',5000.00, 4800.00, 60),
  ('carlos.empresa@lukita.test','empresarial','Equipo nuevo',  8000.00, 2500.00, 180)
) AS v(email, perfil, nombre, objetivo, actual, dias)
JOIN usuarios u ON u.email = v.email
JOIN perfiles p ON p.usuario_id = u.id AND p.tipo = v.perfil;

-- PAGOS RECURRENTES --------------------------------------------------------
INSERT INTO pagos_recurrentes
  (perfil_id, cuenta_id, categorias_id, tipo, descripcion, monto, frecuencia, proxima_fecha, activo)
SELECT p.id, c.id, k.id, v.tipo, v.descripcion, v.monto, v.frecuencia,
       (current_date + v.en_dias * interval '1 day')::date, v.activo
FROM (VALUES
  ('ana.personal@lukita.test','personal','Visa','Ocio','gasto','Netflix',15.99,'mensual',5,true),
  ('ana.personal@lukita.test','personal','Ahorros BCP','Vivienda','gasto','Alquiler',900.00,'mensual',3,true),
  ('ana.personal@lukita.test','personal','Visa','Educación','gasto','Suscripción de idiomas',25.00,'mensual',20,false), -- pausado
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Alquiler','gasto','Alquiler del local',1200.00,'mensual',4,true),
  ('carlos.empresa@lukita.test','empresarial','Banco empresa','Servicios','gasto','Hosting',30.00,'mensual',2,true)
) AS v(email, perfil, cuenta, categoria, tipo, descripcion, monto, frecuencia, en_dias, activo)
JOIN usuarios u   ON u.email = v.email
JOIN perfiles p   ON p.usuario_id = u.id AND p.tipo = v.perfil
JOIN cuentas c    ON c.perfil_id = p.id AND c.nombre = v.cuenta
JOIN categorias k ON k.perfil_id = p.id AND k.nombre = v.categoria AND k.tipo = v.tipo;	