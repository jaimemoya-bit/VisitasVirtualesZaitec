# Visitas Virtuales API

### Guía rápida para desarrollo

Para iniciar la API en modo desarrollo será necesario:

1.  Copiar `.env.template` (plantilla) a `.env.dev`. Este fichero contiene las variables de entorno que la API de Express recibirá mediante `preload.env.js`.

2.  En `.env.dev`, asignar credenciales seguras a:
    - `POSTGRES_PASSWORD`
    - `PGADMIN_DEFAULT_PASSWORD`
    - `JWT_SECRET`

    > Puedes usar `openssl rand -base64 32` para generar credenciales seguras.
    > Es importante utilizar diferentes credenciales para cada variable.

3.  Iniciar la base de datos ejecutando el script `npm run db:up`. Puedes comprobar si has definido las variables de entorno correctamente observando los logs mediante `npm run db:logs`.

4.  Generar migraciones y aplicarlas a la base de datos (Drizzle ORM):
    1.  `npm run db:generate`
    2.  `npm run db:migrate:dev`

    > El historial de migraciones se encuentra en `./drizzle`.
    > El schema de la base de datos se encuentra en `./src/db/schema.js`, será necesario generar y aplicar migraciones tras editarlo.

5.  Iniciar la aplicación de Express ejecutando `npm run dev`.

> Para más información sobre los scripts disponibles consulta [scripts](https://www.google.com/search?q=./docs/scripts.md).
