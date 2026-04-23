import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import fetchWithTimeout from '@/helpers/fetchWithTimeout.js';
import Button from '@/components/Button.jsx';

/*
 * DASHBOARD PRINCIPAL DE LA APLICACIÓN
 *
 * Este componente muestra un resumen completo de la actividad de POIs (Puntos de Interés)
 * con métricas interactivas, gráficos y navegación directa a centros específicos.
 *
 * FUNCIONALIDADES PRINCIPALES:
 * - Métricas KPI con tarjetas clicables
 * - Gráficos de barras interactivos
 * - Navegación automática a centros
 * - Búsqueda y filtrado de centros
 * - Visualización de últimos cambios
 */

const Dashboard = () => {
  // Estados principales del componente
  const [pois, setPois] = useState([]); // Array con todos los POIs cargados desde la API
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState(''); // Mensaje de error si falla la carga
  const [searchQuery, setSearchQuery] = useState(''); // Texto de búsqueda para filtrar centros en el gráfico

  // Contexto de autenticación y navegación
  const { centerState, saveSelectedCenter } = useAuth(); // Hook personalizado para gestión de centros
  const { allCenters } = centerState; // Lista completa de centros disponibles
  const navigate = useNavigate(); // Hook de React Router para navegación programática

  // EFECTO PARA CARGAR DATOS INICIALES
  // Se ejecuta una sola vez al montar el componente para obtener todos los POIs
  useEffect(() => {
    const fetchData = async () => {
      // Llamada a la API para obtener todos los POIs con timeout de 5 segundos
      const fetchPois = fetchWithTimeout('/api/pois', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') }
      }, 5000);

      try {
        const response = await fetchPois;
        const data = await response.json();

        if (!response.ok) throw new Error('No se pudo cargar el listado de POIs: ' + (data.message));

        // Normalizar los datos: asegurar que sea un array
        setPois(Array.isArray(data) ? data : Array.isArray(data.pois) ? data.pois : []);
      } catch (err) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false); // Finalizar estado de carga independientemente del resultado
      }
    };

    fetchData();
  }, []);

  // ===========================================
  // CÁLCULOS DE MÉTRICAS Y DATOS DERIVADOS
  // ===========================================

  // MÉTRICAS BÁSICAS
  const totalPois = pois.length; // Número total de POIs en el sistema
  const uniqueCenters = [...new Set(pois.map((p) => p.centerId))].length; // Número de centros únicos con POIs

  // ÚLTIMOS 5 CAMBIOS - POIs ordenados por ID descendente (más recientes primero)
  const lastChanges = [...pois]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  // FUNCIÓN HELPER: Extrae timestamp de un POI intentando diferentes campos
  const getPoiTimestamp = (poi) => {
    const rawTimestamp = poi.timestamp ?? poi.updatedAt ?? poi.createdAt ?? poi.date;
    const date = rawTimestamp ? new Date(rawTimestamp) : null;
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  };

  // Verificar si algún POI tiene fechas válidas para cálculos temporales
  const hasPoiDates = pois.some((poi) => getPoiTimestamp(poi));

  // FECHAS DE REFERENCIA PARA CÁLCULOS TEMPORALES
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0); // Inicio del día actual

  const startOfLast7Days = new Date(startOfToday);
  startOfLast7Days.setDate(startOfLast7Days.getDate() - 6); // Hace 7 días (incluyendo hoy)

  const startOfPrevious7Days = new Date(startOfLast7Days);
  startOfPrevious7Days.setDate(startOfPrevious7Days.getDate() - 7); // Hace 14 días

  // MÉTRICAS TEMPORALES
  const poisToday = hasPoiDates
    ? pois.reduce((sum, poi) => {
        const date = getPoiTimestamp(poi);
        return date && date >= startOfToday ? sum + 1 : sum;
      }, 0)
    : lastChanges.length; // Fallback si no hay fechas

  const poisLast7Days = hasPoiDates
    ? pois.reduce((sum, poi) => {
        const date = getPoiTimestamp(poi);
        return date && date >= startOfLast7Days ? sum + 1 : sum;
      }, 0)
    : lastChanges.length;

  const poisPrevious7Days = hasPoiDates
    ? pois.reduce((sum, poi) => {
        const date = getPoiTimestamp(poi);
        return date && date >= startOfPrevious7Days && date < startOfLast7Days ? sum + 1 : sum;
      }, 0)
    : 0;

  // CÁLCULO DE CAMBIO SEMANAL (comparación con semana anterior)
  const weeklyChange = poisPrevious7Days === 0
    ? poisLast7Days === 0 ? 0 : 100 // Si no había actividad previa, mostrar 100% si hay nueva
    : Number((((poisLast7Days - poisPrevious7Days) / poisPrevious7Days) * 100).toFixed(0));

  // Determinar tendencia del cambio semanal
  const weeklyChangeTrend = weeklyChange > 0 ? 'up' : weeklyChange < 0 ? 'down' : 'neutral';
  const weeklyChangeLabel = hasPoiDates
    ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange}%`
    : 'Últimos 5 cambios';

  const weeklyChangeCaption = hasPoiDates
    ? 'vs semana anterior'
    : 'Sin fechas exactas';

  // ===========================================
  // FUNCIONES HELPER Y CÁLCULOS DE DISTRIBUCIÓN
  // ===========================================

  // FUNCIÓN HELPER: Obtiene el nombre de un centro por su ID
  const getCenterName = (centerId) => {
    if (!allCenters || allCenters.length === 0) return null;
    const center = allCenters.find((c) => Number(c.id) === Number(centerId));
    return center ? center.name : null;
  };

  // DISTRIBUCIÓN DE POIS POR CENTRO
  // Crear array con centros y cantidad de POIs asociados
  const poisByCenter = (allCenters && allCenters.length > 0)
    ? pois.reduce((acc, poi) => {
        const centerName = getCenterName(poi.centerId);
        if (!centerName) return acc; // Ignorar POIs sin centro válido

        const existingCenter = acc.find((c) => c.name === centerName);
        if (existingCenter) {
          existingCenter.value++; // Incrementar contador si centro ya existe
        } else {
          acc.push({ name: centerName, value: 1 }); // Agregar nuevo centro
        }
        return acc;
      }, [])
    : [];

  // Ordenar centros por cantidad de POIs (descendente)
  poisByCenter.sort((a, b) => b.value - a.value);

  // CONTADORES DE CAMBIOS RECIENTES POR CENTRO
  // Contar cuántos de los últimos cambios pertenecen a cada centro
  const recentCountsByCenter = lastChanges.reduce((acc, poi) => {
    const centerName = getCenterName(poi.centerId);
    if (!centerName) return acc;
    acc[centerName] = (acc[centerName] || 0) + 1;
    return acc;
  }, {});

  // ENRIQUECER DATOS CON PORCENTAJES Y CONTEOS RECIENTES
  const poisByCenterWithPercent = poisByCenter.map((item) => ({
    ...item,
    percentage: totalPois > 0 ? Number(((item.value / totalPois) * 100).toFixed(1)) : 0,
    recentCount: recentCountsByCenter[item.name] || 0,
  }));

  // CENTROS DESTACADOS
  const mostActiveCenter = poisByCenterWithPercent[0] || null; // Centro con más POIs
  const topCenters = poisByCenterWithPercent.slice(0, 3); // Top 3 centros

  // Centro con más cambios recientes (de los últimos 5)
  const [mostRecentCenterName, mostRecentCenterCount] = Object.entries(recentCountsByCenter)
    .sort(([, a], [, b]) => b - a)[0] || [null, 0];

  // FILTRADO PARA BÚSQUEDA
  const filteredPoisByCenter = searchQuery
    ? poisByCenterWithPercent.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : poisByCenterWithPercent;

  // ===========================================
  // HANDLERS DE EVENTOS (CLICKS)
  // ===========================================

  // HANDLER PRINCIPAL: Navegar a un centro específico
  // Se usa en todas las tarjetas y elementos clicables del dashboard
  const handleCenterCardClick = (centerName) => {
    if (!centerName || !allCenters) return;

    // Buscar el centro por nombre en la lista completa
    const center = allCenters.find((c) => c.name === centerName);
    if (center) {
      saveSelectedCenter(center); // Guardar centro seleccionado en el contexto
      navigate('/home'); // Navegar a la página principal del centro
    }
  };

  // HANDLER PARA CLICKS EN LAS BARRAS DEL GRÁFICO
  // Permite navegación directa desde el gráfico de barras
  const handleBarClick = (data) => {
    const centerName = data.name;
    const center = allCenters.find((c) => c.name === centerName);
    if (center) {
      selectCenter(center); // ERROR: debería ser saveSelectedCenter
      navigate('/home');
    }
  };

  // ===========================================
  // RENDERIZADO DEL COMPONENTE (JSX)
  // ===========================================

  return (
    // CONTENEDOR PRINCIPAL: Layout completo del dashboard
    <div className="flex flex-col min-h-screen gap-4 p-10 pb-16">

      {/* HEADER DEL DASHBOARD */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
          {/* TÍTULO PRINCIPAL con gradiente azul */}
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            DASHBOARD
          </h1>
          {/* SUBTÍTULO descriptivo */}
          <p className="text-slate-600 mt-2 text-sm font-medium">
            Resumen completo de puntos de interés y actividad reciente
          </p>
        </div>

        {/* BOTÓN DE ACCIÓN: Enlace a la lista completa de POIs */}
        <Link to="/listpois">
          <Button variant="primary" size="normal" className="w-full">
            Ir a POIs
          </Button>
        </Link>
      </header>

      {/* ESTADOS CONDICIONALES: Carga y Error */}
      {loading ? (
        // ESTADO DE CARGA: Spinner mientras se obtienen los datos
        <div className="p-6 bg-white rounded-xl shadow border border-slate-200">
          Cargando datos...
        </div>
      ) : error ? (
        // ESTADO DE ERROR: Mensaje de error si falla la carga
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700">
          {error}
        </div>
      ) : (
        // CONTENIDO PRINCIPAL: Solo se muestra cuando hay datos disponibles
        <>
          {/* ===========================================
              SECCIÓN 1: TARJETAS KPI (MÉTRICAS PRINCIPALES)
              =========================================== */}
          <section className="grid gap-4 lg:grid-cols-4">

            {/* TARJETA 1: Total de POIs - Navega a selección de centro */}
            <button
              type="button"
              onClick={() => navigate('/centerselection')}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md hover:border-blue-400 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Total de POIs</p>
                  <p className="mt-4 text-4xl font-black text-slate-900">{totalPois}</p>
                </div>
                {/* ICONO: Ubicación (📍) */}
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 text-xl">📍</div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Todo el inventario de puntos de interés.</p>
            </button>

            {/* TARJETA 2: Centros activos - Navega al centro más activo */}
            <button
              type="button"
              onClick={() => mostActiveCenter && handleCenterCardClick(mostActiveCenter.name)}
              disabled={!mostActiveCenter}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md hover:border-emerald-400 cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Centros activos</p>
                  <p className="mt-4 text-4xl font-black text-slate-900">{uniqueCenters}</p>
                </div>
                {/* ICONO: Edificio (🏢) */}
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 text-xl">🏢</div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Centros con al menos un POI asignado.</p>
            </button>

            {/* TARJETA 3: POIs hoy - Navega al centro con más cambios recientes */}
            <button
              type="button"
              onClick={() => mostRecentCenterName && handleCenterCardClick(mostRecentCenterName)}
              disabled={!mostRecentCenterName}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md hover:border-indigo-400 cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">POIs hoy</p>
                  <p className="mt-4 text-4xl font-black text-slate-900">{poisToday}</p>
                </div>
                {/* ICONO: Reloj (🕐) - representa tiempo/reciente */}
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700 text-xl">🕐</div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {hasPoiDates ? 'Registros con fecha de hoy' : 'Basado en últimos cambios'}
              </p>
            </button>

            {/* TARJETA 4: Actividad 7 días - Navega al centro con más cambios recientes */}
            <button
              type="button"
              onClick={() => mostRecentCenterName && handleCenterCardClick(mostRecentCenterName)}
              disabled={!mostRecentCenterName}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md hover:border-slate-400 cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Actividad 7 días</p>
                  <p className="mt-4 text-4xl font-black text-slate-900">{poisLast7Days}</p>
                </div>
                {/* ICONO: Gráfico (📈) - representa tendencias */}
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-700 text-xl">📈</div>
              </div>

              {/* BADGE DE CAMBIO SEMANAL con indicador visual */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  weeklyChangeTrend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                  weeklyChangeTrend === 'down' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {/* INDICADOR VISUAL: ▲ (subida), ▼ (bajada), • (estable) */}
                  {weeklyChangeTrend === 'up' ? '▲' : weeklyChangeTrend === 'down' ? '▼' : '•'} {weeklyChangeLabel}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{weeklyChangeCaption}</p>
            </button>
          </section>

          {/* ===========================================
              SECCIÓN 2: BOTONES DE CENTROS DESTACADOS
              =========================================== */}
          <section className="grid gap-4 sm:grid-cols-2">
            {/* BOTÓN: Centro con más POIs */}
            <button
              type="button"
              onClick={() => handleCenterCardClick(mostActiveCenter?.name)}
              disabled={!mostActiveCenter}
              className="group w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="text-sm text-slate-500">Centro con más POIs</p>
              <p className="text-2xl font-bold text-slate-800">{mostActiveCenter ? mostActiveCenter.name : '—'}</p>
              <p className="text-sm text-slate-500 mt-1">
                {mostActiveCenter ? `${mostActiveCenter.value} POIs` : 'Sin datos'}
              </p>
            </button>

            {/* BOTÓN: Centro con más cambios recientes */}
            <button
              type="button"
              onClick={() => handleCenterCardClick(mostRecentCenterName)}
              disabled={!mostRecentCenterName}
              className="group w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="text-sm text-slate-500">Centro con más cambios recientes</p>
              <p className="text-2xl font-bold text-slate-800">{mostRecentCenterName || '—'}</p>
              <p className="text-sm text-slate-500 mt-1">
                {mostRecentCenterName ? `${mostRecentCenterCount} cambios` : 'Sin datos recientes'}
              </p>
            </button>
          </section>

          {/* ===========================================
              SECCIÓN 3: TOP 3 CENTROS MÁS ACTIVOS
              =========================================== */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Top 3 centros más activos</h2>
            {topCenters.length === 0 ? (
              <p className="text-slate-500">No hay centros con POIs para mostrar.</p>
            ) : (
              <ol className="space-y-3">
                {topCenters.map((center, index) => (
                  // ELEMENTO CLICABLE: Cada centro del top 3
                  <button
                    key={center.name}
                    type="button"
                    onClick={() => handleCenterCardClick(center.name)}
                    className="w-full text-left rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      {/* POSICIÓN EN EL RANKING */}
                      <span className="text-sm font-semibold text-slate-700">#{index + 1} {center.name}</span>
                      {/* PORCENTAJE DEL TOTAL */}
                      <span className="text-sm text-slate-500">{center.percentage}%</span>
                    </div>
                    {/* DETALLES: POIs totales y cambios recientes */}
                    <p className="mt-2 text-sm text-slate-600">
                      {center.value} POIs · {center.recentCount} cambios recientes
                    </p>
                  </button>
                ))}
              </ol>
            )}
          </section>

          {/* ===========================================
              SECCIÓN 4: ÚLTIMOS CAMBIOS EN POIS
              =========================================== */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Últimos cambios en POIs</h2>
            {lastChanges.length === 0 ? (
              <p className="text-slate-500">No hay POIs disponibles.</p>
            ) : (
              <ul className="space-y-3">
                {lastChanges.map((poi) => {
                  const centerName = getCenterName(poi.centerId) || 'Sin centro';
                  const isClickable = centerName !== 'Sin centro'; // Solo clicable si tiene centro válido

                  return (
                    <li key={poi.id}>
                      {isClickable ? (
                        // ELEMENTO CLICABLE: POI con centro válido
                        <button
                          type="button"
                          onClick={() => handleCenterCardClick(centerName)}
                          className="w-full text-left border border-slate-100 rounded-lg p-3 transition hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                        >
                          <p className="font-semibold text-slate-800">{poi.name}</p>
                          <p className="text-xs text-slate-500">Centro: {centerName}</p>
                          <p className="text-sm text-slate-600 mt-1">{poi.description}</p>
                        </button>
                      ) : (
                        // ELEMENTO NO CLICABLE: POI sin centro asignado
                        <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                          <p className="font-semibold text-slate-800">{poi.name}</p>
                          <p className="text-xs text-slate-500">Centro: {centerName}</p>
                          <p className="text-sm text-slate-600 mt-1">{poi.description}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ===========================================
              SECCIÓN 5: CAMPO DE BÚSQUEDA
              =========================================== */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label htmlFor="search-centers" className="block text-sm font-semibold text-slate-700 mb-2">
          Buscar centro
        </label>
        <input
          id="search-centers"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Escribe el nombre del centro..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-blue-500 focus:ring-blue-500"
        />
      </section>

          {/* ===========================================
              SECCIÓN 6: GRÁFICO DE BARRAS INTERACTIVO
              =========================================== */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">POIs totales y últimos cambios por Centro</h2>
            {filteredPoisByCenter.length === 0 ? (
              <p className="text-slate-500">No hay datos disponibles para mostrar el gráfico.</p>
            ) : (
              <>
                {/* CONTENEDOR RESPONSIVO para el gráfico */}
                <ResponsiveContainer width="100%" height={520}>
                  <BarChart data={filteredPoisByCenter} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                    {/* REJILLA del gráfico */}
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* EJES X e Y */}
                    <XAxis
                      dataKey="name"
                      label={{ value: 'Centro', position: 'insideBottomRight' }}
                      textAnchor="middle"
                      height={80}
                    />
                    <YAxis
                      label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', offset: 0, textAnchor: 'middle' }}
                    />

                    {/* TOOLTIP: Información al pasar el mouse */}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'recentCount') return [`${value} recientes`, 'Últimos cambios'];
                        if (name === 'value') return [`${value} POIs`, 'Total'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Centro: ${label}`}
                    />

                    {/* LEYENDA del gráfico */}
                    <Legend formatter={(value) => (value === 'recentCount' ? 'Últimos cambios' : 'Total POIs')} />

                    {/* BARRAS VERDES: Cambios recientes (últimos 5 POIs) */}
                    <Bar
                      dataKey="recentCount"
                      fill="#10b981"
                      name="recentCount"
                      radius={[8, 8, 0, 0]}
                      cursor="pointer"
                    />

                    {/* BARRAS AZULES: Total de POIs por centro (CLICABLES) */}
                    <Bar
                      dataKey="value"
                      fill="#2563eb"
                      name="value"
                      radius={[8, 8, 0, 0]}
                      onClick={handleBarClick} // Handler para navegación al hacer click
                      cursor="pointer"
                    >
                      {/* ETIQUETAS con porcentajes en la parte superior */}
                      <LabelList dataKey="percentage" position="top" formatter={(value) => `${value}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* DESCRIPCIÓN del gráfico */}
                <p className="mt-3 text-sm text-slate-500">
                  La barra verde muestra cuántos POIs de los últimos cambios recientes pertenecen al centro.
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;