# Visitas Virtuales API

API para ofrecer servicio de visitas virtuales a centros educativos.

Esta herramienta permite **registrar y autenticar usuarios** de forma segura mediante JWTs y HTTP-only cookies. Los administradores tienen permisos para **gestionar centros y puntos de interés (POIs)** (añadir, editar o eliminar), así como para administrar los roles de otros usuarios.

La arquitectura es **multi-inquilino**, lo que permite que una sola instancia de Express y de la base de datos PostgreSQL ofrezca servicio a múltiples centros educativos simultáneamente, sin necesidad de replicar la infraestructura.

Para su despliegue, la aplicación está _dockerizada_ y gestionada mediante el gestor de procesos **PM2**. (consultar [docker-compose.prod.yml](./docker-compose.prod.yml), [Dockerfile](./Dockerfile) y [docker-entrypoint.sh](./docker-entrypoint.sh))

### Guía rápida para desarrollo

Para iniciar la API en modo desarrollo será necesario:

1.  **Preparar el proyecto**:

    ```bash
    git clone https://github.com/jaimemoya-bit/VisitasVirtualesZaitec
    git switch API_Zaitec_Pablo_DAM
    cd VisitasVirtualesZaitec/visitas-virtuales-api
    ```

2.  **Instalar dependencias**: Ejecutar `npm install`.

3.  **Configurar el entorno**: Copiar `.env.template` (plantilla) a `.env.dev`. Este fichero contiene las variables de entorno que la API de Express recibirá mediante `preload-env.js`.

4.  **Definir credenciales**: En `.env.dev`, asignar credenciales seguras a:
    - `POSTGRES_PASSWORD`
    - `PGADMIN_DEFAULT_PASSWORD`
    - `JWT_SECRET`

    > Puedes usar `openssl rand -base64 32` para generar credenciales seguras. Es importante utilizar diferentes credenciales para cada variable.

5.  **Iniciar la base de datos**: Ejecutar el script `npm run db:up`. Puedes comprobar si has definido las variables de entorno correctamente observando los logs mediante `npm run db:logs`.

6.  **Generar migraciones, aplicarlas a la base de datos e insertar datos de prueba (Drizzle ORM)**:
    1.  `npm run db:generate`
    2.  `npm run db:migrate:dev`
    3.  `npm run db:seed`

    > Para más información sobre la base de datos consulta [db](./docs/db.md)

7.  **Iniciar aplicación de Express**: Ejecutar `npm run dev`.

---

### Herramientas útiles

- **Documentación API**: Puedes acceder la documentación generada mediante la especificación OpenAPI en [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Gestión de Base de Datos**:
  - **pgAdmin**: Interfaz web disponible en [http://localhost:15432/](http://localhost:15432/)
  - **psql**: Cliente de PostgreSQL en la terminal (`psql -h localhost -U postgres -p 5433`)

> Para más información sobre los scripts disponibles consulta [scripts](./docs/scripts.md)
