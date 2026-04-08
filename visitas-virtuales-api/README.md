# Visitas Virtuales API

### Guía rápida para desarrollo

Para iniciar la API en modo desarrollo será necesario:

1.  **Preparar el proyecto**:

    ```bash
    git clone https://github.com/jaimemoya-bit/VisitasVirtualesZaitec
    git switch API_Zaitec_Pablo_DAM
    cd VisitasVirtuales/visitas-virtuales-api
    ```

2.  **Instalar dependencias**: Ejecutar `npm install`.

3.  **Configurar el entorno**: Copiar `.env.template` (plantilla) a `.env.dev`. Este fichero contiene las variables de entorno que la API de Express recibirá mediante `preload.env.js`.

4.  **Definir credenciales**: En `.env.dev`, asignar credenciales seguras a:
    - `POSTGRES_PASSWORD`
    - `PGADMIN_DEFAULT_PASSWORD`
    - `JWT_SECRET`

    > Puedes usar `openssl rand -base64 32` para generar credenciales seguras. Es importante utilizar diferentes credenciales para cada variable.

5.  **Iniciar la base de datos**: Ejecutar el script `npm run db:up`. Puedes comprobar si has definido las variables de entorno correctamente observando los logs mediante `npm run db:logs`.

6.  **Generar migraciones y aplicarlas a la base de datos (Drizzle ORM)**:
    1.  `npm run db:generate`
    2.  `npm run db:migrate:dev`

    > El historial de migraciones se encuentra en `./drizzle`.
    > El schema de la base de datos se encuentra en `./src/db/schema.js`, será necesario generar y aplicar migraciones tras editarlo.

7.  **Iniciar aplicación de Express**: Ejecutar `npm run dev`.

---

### Herramientas útiles

- **Documentación API**: Puedes acceder la documentación generada mediante la especificación OpenAPI en [http://localhost:3000/api-docs](https://www.google.com/search?q=http://localhost:3000/api-docs)
- **Gestión de Base de Datos**:
  - **pgAdmin**: Interfaz web disponible en [http://localhost:15432/](https://www.google.com/search?q=http://localhost:15432/)
  - **psql**: Cliente de PostgreSQL en la terminal (`psql -h localhost -U postgres -p 5433`)

> Para más información sobre los scripts disponibles consulta [scripts](https://www.google.com/search?q=./docs/scripts.md)
