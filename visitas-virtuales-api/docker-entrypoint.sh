#!/bin/sh
set -e

echo "Esperando disponibilidad de PostgreSQL..."
until nc -z postgres_service 5432; do
  sleep 1
done

if [ "$APP_STAGE" = "stage" ]; then
  echo "App ejecutándose en modo stage."
  echo "Recreando la base de datos de staging e introduciendo datos de prueba..."

  PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres_service -U "$POSTGRES_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "Error de conexión a PostgreSQL. Comprueba que la base de datos y credenciales sean correctas."
    exit 1
  fi

  PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres_service -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
  if [ $? -ne 0 ]; then
    echo "Error al eliminar la base de datos."
    exit 1
  fi

  PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres_service -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"
  if [ $? -ne 0 ]; then
    echo "Error al crear la base de datos."
    exit 1
  fi

  echo "Base de datos recreada correctamente. Ejecutando migraciones e insertando datos de prueba..."
  npm run db:migrate && npm run stage:db:seed && npm run openapi:generate
  if [ $? -ne 0 ]; then
    echo "Error al ejecutar migraciones o insertar datos de prueba."
    exit 1
  fi

  echo "Migraciones ejecutadas y datos de prueba insertados correctamente."
elif [ "$APP_STAGE" = "prod" ]; then
  echo "App ejecutándose en modo prod."
  npm run db:migrate && npm run prod:db:seed
  if [ $? -ne 0 ]; then
    echo "Error al ejecutar migraciones o seed de producción."
    exit 1
  fi
  echo "Migraciones y seed de producción ejecutados correctamente."
else
  npm run db:migrate
fi

echo "Iniciando la aplicación con PM2..."
pm2-runtime start ecosystem.config.cjs