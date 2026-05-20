# Documentación de la API - Visitas Virtuales

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Tecnologías Utilizadas](#2-tecnologías-utilizadas)
3. [Características Principales](#3-características-principales)
4. [Instalación y Configuración](#4-instalación-y-configuración)
5. [Ejecutar el Proyecto](#5-ejecutar-el-proyecto)
6. [Arquitectura y Roles](#6-arquitectura-y-roles)
7. [Gestión de Base de Datos](#7-gestión-de-base-de-datos)
8. [Almacenamiento de Objetos](#8-almacenamiento-de-objetos)
9. [Despliegue](#9-despliegue-y-docker)
10. [Documentación de la API](#10-documentación-de-la-api)
11. [Solución de Problemas](#11-solución-de-problemas)

## 1. Introducción

Esta es la documentación de la API de Visitas Virtuales. Proporciona el backend necesario para la administración de centros, puntos de interés (POIs) y usuarios, asegurando un entorno seguro y escalable donde múltiples centros educativos pueden ofrecer visitas virtuales a sus instalaciones.

**Repositorio**: Visitas Virtuales Zaitec – API  
**Versión**: 0.1.0

---

## 2. Tecnologías Utilizadas

### Frameworks y Librerías Principales

| Tecnología  | Descripción                                 |
| ----------- | ------------------------------------------- |
| Express     | Framework web para Node.js                  |
| TypeScript  | Tipado estricto                             |
| PostgreSQL  | Base de datos relacional                    |
| Drizzle ORM | ORM para migraciones y acceso a datos       |
| Zod         | Validación de datos y contratos             |
| JWT         | Autenticación mediante cookies HTTP‑only    |
| Helmet      | Seguridad de cabeceras HTTP                 |
| MinIO       | Almacenamiento de objetos compatible con S3 |

### Herramientas de Despliegue

| Tecnología     | Descripción                        |
| -------------- | ---------------------------------- |
| Docker         | Containerización de servicios      |
| PM2            | Gestor de procesos para producción |
| GitHub Actions | CI/CD para despliegue automático   |

---

## 3. Características Principales

- **Arquitectura multi‑inquilino**: una única instancia de Express, PostgreSQL y MinIO da servicio a múltiples centros educativos.
- **Seguridad**: Autenticación mediante JWT, protección con Helmet y rate limiting para evitar abusos.
- **Tipado estricto**: Uso de TypeScript y Zod para garantizar la integridad de los datos.

---

## 4. Instalación y Configuración

### Paso 1: Preparar el proyecto

```bash
git clone https://github.com/jaimemoya-bit/VisitasVirtualesZaitec
git switch Web_Zaitec
cd VisitasVirtualesZaitec/visitas-virtuales-api
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.template .env
```

Configura:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `MINIO_ROOT_PASSWORD`

> Puedes usar `openssl rand -hex 32` para generar credenciales seguras.

---

## 5. Ejecutar el Proyecto

### 5.1 Iniciar la base de datos

```bash
npm run db:up
npm run db:logs # opcional, para ver logs
```

### 5.2 Iniciar almacén de objetos (MinIO)

```bash
npm run storage:up
npm run storage:logs # opcional, para ver logs
```

> MinIO es un servicio de almacenamiento de objetos compatible con S3. Se utiliza para almacenar imágenes de centros y usuarios.

### 5.3 Aplicar migraciones e insertar datos de prueba

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

> Las migraciones versionan el esquema y permiten revertir y reproducir un conjunto de cambios.

### 5.4 Iniciar la aplicación

```bash
npm run dev
```

---

## 6. Arquitectura y Roles

### Roles de usuario

| Rol                   | Permisos                                                 |
| --------------------- | -------------------------------------------------------- |
| Administrador (admin) | Control completo de centros, POIs, usuarios y auditoría. |
| Profesor (teacher)    | Edición de POIs y actualización de su propio perfil.     |
| Invitado (guest)      | Acceso de lectura. No se almacena en la base de datos.   |

---

## **7. Gestión de Base de Datos**

### **7.1 Esquema de la base de datos**

ORM: **Drizzle**. Esquema definido en `visitas-virtuales-api/src/db/schema.ts`.

### `centers`

Centros educativos registrados en el sistema.

| Campo       | Tipo   | Restricciones |
| :---------- | :----- | :------------ |
| id          | SERIAL | PRIMARY KEY   |
| name        | TEXT   | NOT NULL      |
| description | TEXT   | NULL allowed  |
| location    | TEXT   | NOT NULL      |

### `users`

Usuarios registrados en el sistema.

| Campo    | Tipo       | Restricciones             |
| :------- | :--------- | :------------------------ |
| id       | SERIAL     | PRIMARY KEY               |
| email    | TEXT       | NOT NULL, UNIQUE          |
| username | TEXT       | NOT NULL, UNIQUE          |
| password | TEXT       | NOT NULL                  |
| role     | user_roles | NOT NULL, DEFAULT 'guest' |

> El administrador se encargará de crear los usuarios y asignarles sus roles.  
> Si el rol no se especifica, se asignará automáticamente el rol de `guest`.  
> Los invitados no se almacenan en la base de datos, pero reciben este rol en cada solicitud.

> Estos usuarios no están asociados a ningún centro en particular.

### `pois`

Puntos de interés (POIs) asociados a un centro educativo.

| Campo     | Tipo    | Restricciones                               |
| :-------- | :------ | :------------------------------------------ |
| id        | SERIAL  | PRIMARY KEY                                 |
| name      | TEXT    | NOT NULL                                    |
| details   | JSONB   | NOT NULL                                    |
| user_id   | INTEGER | NOT NULL, FK users(id), ON DELETE CASCADE   |
| center_id | INTEGER | NOT NULL, FK centers(id), ON DELETE CASCADE |

> Restricción de unicidad compuesta: `UNIQUE(name, center_id)`  
> No pueden existir dos POIs con el mismo nombre dentro de un mismo centro.

> Los POIs son accesibles para todos los usuarios, pero solo profesores y administradores pueden crearlos o editarlos.

### `stats` (Historial/Logs)

Registro de eventos relevantes para estadísticas y auditoría.

| Campo       | Tipo      | Restricciones                       |
| :---------- | :-------- | :---------------------------------- |
| id          | SERIAL    | PRIMARY KEY                         |
| event_type  | TEXT      | NOT NULL                            |
| event_count | INTEGER   | NOT NULL, DEFAULT 0                 |
| timestamp   | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

> Ejemplos: `POI_VISIT`, `CENTER_VISIT`, `USER_LOGIN`.  
> Redis se usa para acceso rápido y se vuelca periódicamente a la base de datos.

### `stats_users`

Estadísticas de usuarios asociadas a eventos.

| Campo   | Tipo    | Restricciones                             |
| :------ | :------ | :---------------------------------------- |
| id      | SERIAL  | PRIMARY KEY                               |
| stat_id | INTEGER | NOT NULL, FK stats(id), ON DELETE CASCADE |
| user_id | INTEGER | NOT NULL, FK users(id), ON DELETE CASCADE |

### `stats_pois`

Estadísticas de POIs asociadas a eventos.

| Campo   | Tipo    | Restricciones                             |
| :------ | :------ | :---------------------------------------- |
| id      | SERIAL  | PRIMARY KEY                               |
| stat_id | INTEGER | NOT NULL, FK stats(id), ON DELETE CASCADE |
| poi_id  | INTEGER | NOT NULL, FK pois(id), ON DELETE CASCADE  |

### `poi_history`

Trazabilidad detallada de cambios en los POIs para auditoría.

| Campo     | Tipo      | Restricciones                              |
| :-------- | :-------- | :----------------------------------------- |
| id        | SERIAL    | PRIMARY KEY                                |
| poi_id    | INTEGER   | NOT NULL, FK pois(id), ON DELETE CASCADE   |
| user_id   | INTEGER   | NOT NULL, FK users(id), ON DELETE CASCADE  |
| action    | TEXT      | NOT NULL                                   |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP        |
| details   | JSONB     | Opcional. Información adicional del cambio |

> Guarda un registro de cada acción relevante sobre un POI (creación, edición, borrado, etc.), quién la realizó y cuándo.

### `user_roles`

**Enum** en la base de datos que define los posibles roles para los usuarios.

| Valor     | Descripción                                                                           |
| :-------- | :------------------------------------------------------------------------------------ |
| `admin`   | Control total sobre el sistema, todos los centros, todos los POIs y gestión de roles. |
| `teacher` | Gestión de POIs y consulta de estadísticas de su propio centro.                       |
| `guest`   | Rol por defecto para usuarios creados por el administrador.                           |

---

### **7.2 Datos de prueba**

Para insertar datos de prueba:

1. Genera y aplica migraciones (`npm run db:generate` y `npm run db:migrate`).
2. Ejecuta `npm run db:seed` para añadir usuarios de prueba, centros y POIs asociados.

> ⚠️ Esto eliminará cualquier información que hayas insertado de forma manual.

Puedes explorar la base de datos con Drizzle Kit Studio:

- `npm run db:studio` y abre [https://local.drizzle.studio](https://local.drizzle.studio)

### Usuarios de prueba

| email                     | username  | password  | role    |
| :------------------------ | :-------- | :-------- | :------ |
| admin_mad@instituto.es    | admin_mad | Admin123! | admin   |
| admin_pac@instituto.es    | admin_pac | Admin123! | admin   |
| admin_jer@instituto.es    | admin_jer | Admin123! | admin   |
| admin_cor@instituto.es    | admin_cor | Admin123! | admin   |
| profesor_mad@instituto.es | prof_mad  | Profe123! | teacher |
| profesor_pac@instituto.es | prof_pac  | Profe123! | teacher |
| profesor_jer@instituto.es | prof_jer  | Profe123! | teacher |
| profesor_cor@instituto.es | prof_cor  | Profe123! | teacher |

---

## 8. Almacenamiento de Objetos

MinIO se utiliza para almacenar:

- Imágenes de centros
- Imágenes de usuarios

### Endpoints según entorno

- Local: `MINIO_ENDPOINT=localhost`
- Docker: `MINIO_ENDPOINT=vv-minio`

---

## 9. Despliegue

### Archivos relevantes para despliegue

- `docker-compose.prod.yml`
- `docker-compose.stage.yml`
- `Dockerfile`
- `docker-entrypoint.sh`

### Entornos

- **Staging**: entorno previo a producción
- **Producción**: configuración final del sistema

### CI/CD

GitHub Actions está configurado para deploy automático a staging:

```
.github/workflows/deploy-stage.yml
```

### Variables de entorno en Docker

En stage/prod no se usa `.env`.  
Docker carga las variables mediante:

- `.env.stage`
- `.env.prod`

### Networking

En Docker se usan hostnames internos:

- `postgres_service`
- `vv-minio`

---

## 10. Documentación de la API

Swagger / OpenAPI disponible en:

```
http://localhost:8000/api-docs
```

> La documentación se genera automáticamente a partir de los esquemas definidos en las rutas del proyecto.

---

## 11. Solución de Problemas

### Error de conexión a la base de datos

**Causas comunes:**

- Contenedor de PostgreSQL no iniciado
- Variables de entorno faltantes (comprueba `.env.template`)
- Volumen con credenciales antiguas
- Hostname incorrecto (en staging/prod debe ser `postgres_service`)

**Comandos para verificar y solucionar:**

```bash
docker ps
npm run db:up # si no se está ejecutando
npm run db:logs # revisar errores
```

Si cambiaste credenciales y el contenedor sigue usando las antiguas, elimina el volumen (solo en desarrollo o staging):

```bash
docker compose down
docker volume ls
docker volume rm <volumen_postgres>
docker compose up -d
```

### Error de conexión a MinIO

**Causas comunes:**

- Contenedor de MinIO no iniciado
- Variables de entorno faltantes (comprueba `.env.template`)
- Endpoint equivocado (en staging/prod debe ser `vv-minio`)

**Comandos para verificar y solucionar:**

```bash
docker ps
npm run storage:up # si no se está ejecutando
npm run storage:logs # revisar errores
```

---
