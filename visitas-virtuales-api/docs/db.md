# Visitas Virtuales — Base de datos

> **multi-inquilino (multi-tenant):** Una instancia de la aplicación ofrece servicio a varios institutos. Una única base de datos almacena datos de múltiples institutos, separándolos lógicamente mediante una columna discriminadora (clave foránea).

Se utiliza el ORM **Drizzle** para generar el schema y realizar migraciones a partir de `./src/db/schema.js`. Los [scripts](./scripts.md) disponibles facilitan estas operaciones.

## `centers` (Institutos)

| Campo           | Tipo   | Restricciones |
| :-------------- | :----- | :------------ |
| **id**          | SERIAL | PRIMARY KEY   |
| **name**        | TEXT   | NOT NULL      |
| **description** | TEXT   | NULL allowed  |
| **location**    | TEXT   | NOT NULL      |

## `users` (Usuarios)

**Cada usuario** (administrador, profesor o estudiante) **pertenece a un centro.**

| Campo         | Tipo    | Restricciones                                    |
| :------------ | :------ | :----------------------------------------------- |
| **id**        | SERIAL  | PRIMARY KEY                                      |
| **email**     | TEXT    | NOT NULL, UNIQUE                                 |
| **username**  | TEXT    | NOT NULL, UNIQUE                                 |
| **password**  | TEXT    | NOT NULL                                         |
| **role**      | TEXT    | NOT NULL                                         |
| **center_id** | INTEGER | NOT NULL, FK -> `centers(id)`, ON DELETE CASCADE |

## `pois` (POIs)

**Tabla de puntos de interés. Cada POI está asociado a un centro y un usuario y contiene detalles en formato JSONB.**

| Campo         | Tipo    | Restricciones                                    |
| :------------ | :------ | :----------------------------------------------- |
| **id**        | SERIAL  | PRIMARY KEY                                      |
| **name**      | TEXT    | NOT NULL                                         |
| **details**   | JSONB   | NOT NULL                                         |
| **user_id**   | INTEGER | NOT NULL, FK -> `users(id)`, ON DELETE CASCADE   |
| **center_id** | INTEGER | NOT NULL, FK -> `centers(id)`, ON DELETE CASCADE |

## `stats` (Historial_Logs)

**Almacena estadísticas de diferentes tipos.**

- `POI_VISIT` -> _`stats:center_3:poi_5:visit_count`_
- `CENTER_VISIT` -> _`stats:center_1:user_4:visit_count`_
- `USER_LOGIN` -> _`stats:user_10:login_count`_
- `...`

| Campo           | Tipo      | Restricciones                       |
| :-------------- | :-------- | :---------------------------------- |
| **id**          | SERIAL    | PRIMARY KEY                         |
| **event_type**  | TEXT      | NOT NULL                            |
| **event_count** | INTEGER   | NOT NULL, DEFAULT 0                 |
| **timestamp**   | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

> Para evitar sobrecargar la base de datos, usamos **Redis** (memoria volátil) para permitir el acceso y actualización de estas estadísticas de forma rápida y volcamos estas estadísticas a la base de datos cada cierto tiempo mediante una **tarea cron**.

## `stats_users`

**Tabla de unión para consultar estadísticas asociadas a un usuario concreto**

| Campo       | Tipo    | Restricciones                                  |
| :---------- | :------ | :--------------------------------------------- |
| **id**      | SERIAL  | PRIMARY KEY                                    |
| **stat_id** | INTEGER | NOT NULL, FK -> `stats(id)`, ON DELETE CASCADE |
| **user_id** | INTEGER | NOT NULL, FK -> `users(id)`, ON DELETE CASCADE |

## `stats_pois`

**Tabla de unión para consultar estadísticas asociadas a un punto de interés concreto**

| Campo       | Tipo    | Restricciones                                  |
| :---------- | :------ | :--------------------------------------------- |
| **id**      | SERIAL  | PRIMARY KEY                                    |
| **stat_id** | INTEGER | NOT NULL, FK -> `stats(id)`, ON DELETE CASCADE |
| **poi_id**  | INTEGER | NOT NULL, FK -> `pois(id)`, ON DELETE CASCADE  |

## Datos de prueba

Ejecuta `npm run db:seed` (tras generar y aplicar las migraciones) para insertar datos de prueba en la base de datos.

> El historial de migraciones se encuentra en `./drizzle`.

> El schema de la base de datos se encuentra en `./src/db/schema.js`. Será necesario generar y aplicar migraciones tras editarlo.

### Usuarios de prueba

| email                | username  | password     | role  | centro       |
| :------------------- | :-------- | :----------- | :---- | :----------- |
| francisco@zaitec.es  | francisco | francisco123 | admin | MEDAC Málaga |
| jaime@zaitec.es      | jaime     | jaime123     | admin | MEDAC Málaga |
| alumno@alu.medac.es  | alumno    | alumno123    | user  | MEDAC Madrid |
| alumno2@alu.medac.es | alumno2   | alumno123    | user  | MEDAC Madrid |

### Centros de prueba

- **MEDAC Málaga** — Centro MEDAC en Málaga, España
- **MEDAC Madrid** — Centro MEDAC en Madrid, España
- **MEDAC Sevilla** — Centro MEDAC en Sevilla, España
- **MEDAC Barcelona** — Centro MEDAC en Barcelona, España

Cada centro cuenta con POIs de prueba (Cafetería, Biblioteca, Aulas, etc.) asociados a usuarios creadores.
