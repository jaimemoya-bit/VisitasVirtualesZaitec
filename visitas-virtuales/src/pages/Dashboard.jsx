import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCenter } from '../hooks/useCenter';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	LabelList,
} from 'recharts';
import { fetchWithAuth } from '../helpers/fetchWithAuth';
import Button from '@/components/Button.jsx';
import { useAuth } from '@/hooks/useAuth.js';

const Dashboard = () => {
	const [pois, setPois] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const { allCenters, saveSelectedCenter } = useCenter();
	const navigate = useNavigate();
	const { logout } = useAuth();

	// Cargar todos los POIs al montar el componente
	useEffect(() => {
		const fetchData = async () => {
			const fetchPois = fetchWithAuth('/api/pois', {}, logout);
			try {
				const response = await fetchPois;
				const data = await response.json();
				if (!response.ok)
					throw new Error(
						'No se pudo cargar el listado de POIs: ' + data.message,
					);
				setPois(
					Array.isArray(data)
						? data
						: Array.isArray(data.pois)
							? data.pois
							: [],
				);
			} catch (err) {
				setError(err.message || 'Error desconocido');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const totalPois = pois.length;
	const uniqueCenters = [...new Set(pois.map((p) => p.centerId))].length;
	const lastChanges = [...pois]
		.sort((a, b) => Number(b.id) - Number(a.id))
		.slice(0, 5);

	const getPoiTimestamp = (poi) => {
		const rawTimestamp =
			poi.timestamp ?? poi.updatedAt ?? poi.createdAt ?? poi.date;
		const date = rawTimestamp ? new Date(rawTimestamp) : null;
		return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
	};

	const hasPoiDates = pois.some((poi) => getPoiTimestamp(poi));
	const now = new Date();
	const startOfToday = new Date(now);
	startOfToday.setHours(0, 0, 0, 0);

	const startOfLast7Days = new Date(startOfToday);
	startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);

	const startOfPrevious7Days = new Date(startOfLast7Days);
	startOfPrevious7Days.setDate(startOfPrevious7Days.getDate() - 7);

	const poisToday = hasPoiDates
		? pois.reduce((sum, poi) => {
				const date = getPoiTimestamp(poi);
				return date && date >= startOfToday ? sum + 1 : sum;
			}, 0)
		: lastChanges.length;

	const poisLast7Days = hasPoiDates
		? pois.reduce((sum, poi) => {
				const date = getPoiTimestamp(poi);
				return date && date >= startOfLast7Days ? sum + 1 : sum;
			}, 0)
		: lastChanges.length;

	const poisPrevious7Days = hasPoiDates
		? pois.reduce((sum, poi) => {
				const date = getPoiTimestamp(poi);
				return date && date >= startOfPrevious7Days && date < startOfLast7Days
					? sum + 1
					: sum;
			}, 0)
		: 0;

	const weeklyChange =
		poisPrevious7Days === 0
			? poisLast7Days === 0
				? 0
				: 100
			: Number(
					(
						((poisLast7Days - poisPrevious7Days) / poisPrevious7Days) *
						100
					).toFixed(0),
				);

	const weeklyChangeTrend =
		weeklyChange > 0 ? 'up' : weeklyChange < 0 ? 'down' : 'neutral';
	const weeklyChangeLabel = hasPoiDates
		? `${weeklyChange > 0 ? '+' : ''}${weeklyChange}%`
		: 'Últimos 5 cambios';

	const weeklyChangeCaption = hasPoiDates
		? 'vs semana anterior'
		: 'Sin fechas exactas';

	// Helper para obtener el nombre del centro por ID
	const getCenterName = (centerId) => {
		if (!allCenters || allCenters.length === 0) return null;
		const center = allCenters.find((c) => Number(c.id) === Number(centerId));
		return center ? center.name : null;
	};

	// Calcular distribución de POIs por centro
	const poisByCenter =
		allCenters && allCenters.length > 0
			? pois.reduce((acc, poi) => {
					const centerName = getCenterName(poi.centerId);
					if (!centerName) return acc; // Ignorar POIs sin centro válido
					const existingCenter = acc.find((c) => c.name === centerName);
					if (existingCenter) {
						existingCenter.value++;
					} else {
						acc.push({ name: centerName, value: 1 });
					}
					return acc;
				}, [])
			: [];

	// Ordenar por mayor cantidad para resaltar los centros más activos
	poisByCenter.sort((a, b) => b.value - a.value);

	const recentCountsByCenter = lastChanges.reduce((acc, poi) => {
		const centerName = getCenterName(poi.centerId);
		if (!centerName) return acc;
		acc[centerName] = (acc[centerName] || 0) + 1;
		return acc;
	}, {});

	const poisByCenterWithPercent = poisByCenter.map((item) => ({
		...item,
		percentage:
			totalPois > 0 ? Number(((item.value / totalPois) * 100).toFixed(1)) : 0,
		recentCount: recentCountsByCenter[item.name] || 0,
	}));

	const mostActiveCenter = poisByCenterWithPercent[0] || null;
	const topCenters = poisByCenterWithPercent.slice(0, 3);

	const [mostRecentCenterName, mostRecentCenterCount] = Object.entries(
		recentCountsByCenter,
	).sort(([, a], [, b]) => b - a)[0] || [null, 0];

	// Obtener el último centro activo (el último en el array de allCenters)
	const lastActiveCenterName =
		allCenters && allCenters.length > 0
			? allCenters[allCenters.length - 1].name
			: null;

	// Obtener el centro con POIs de hoy más reciente
	const poiTodayByCenter = pois
		.filter((poi) => {
			const date = getPoiTimestamp(poi);
			return date && date >= startOfToday;
		})
		.sort((a, b) => {
			const dateA = getPoiTimestamp(a);
			const dateB = getPoiTimestamp(b);
			return dateB - dateA;
		})[0];
	const lastPoiTodayCenterName = poiTodayByCenter
		? getCenterName(poiTodayByCenter.centerId)
		: mostRecentCenterName;

	// Obtener el centro con POIs de los últimos 7 días más reciente
	const poiLast7DaysByCenter = pois
		.filter((poi) => {
			const date = getPoiTimestamp(poi);
			return date && date >= startOfLast7Days;
		})
		.sort((a, b) => {
			const dateA = getPoiTimestamp(a);
			const dateB = getPoiTimestamp(b);
			return dateB - dateA;
		})[0];
	const lastPoi7DaysCenterName = poiLast7DaysByCenter
		? getCenterName(poiLast7DaysByCenter.centerId)
		: mostRecentCenterName;

	const filteredPoisByCenter = searchQuery
		? poisByCenterWithPercent.filter((item) =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: poisByCenterWithPercent;

	const handleCenterCardClick = (centerName) => {
		if (!centerName || !allCenters) {
			navigate('/centros');
			return;
		}
		const center = allCenters.find((c) => c.name === centerName);
		if (center) {
			saveSelectedCenter(center);
			navigate('/viewer');
		} else {
			navigate('/centros');
		}
	};

	// Handler para click en las barras del gráfico
	const handleBarClick = (data) => {
		const centerName = data.name;
		if (!centerName || !allCenters) {
			navigate('/centros');
			return;
		}
		const center = allCenters.find((c) => c.name === centerName);
		if (center) {
			saveSelectedCenter(center);
			navigate('/viewer');
		} else {
			navigate('/centros');
		}
	};

	return (
		<div className="flex flex-col min-h-screen gap-4 p-10 pb-16">
			<header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
				<div className="flex-1">
					<h1 className="text-4xl font-black bg-linear-to-r from-navy to-navy bg-clip-text text-transparent tracking-tight leading-tight">
						DASHBOARD
					</h1>
					<p className="text-slate-600 mt-2 text-sm font-medium leading-relaxed">
						Resumen completo de puntos de interés y actividad reciente
					</p>
				</div>
				<Link to="/listpois">
					<Button variant="primary" size="normal" className="w-full">
						Ir a POIs
					</Button>
				</Link>
			</header>

			{loading ? (
				<div className="p-6 bg-white rounded-xl shadow border border-slate-200">
					Cargando datos...
				</div>
			) : error ? (
				<div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700">
					{error}
				</div>
			) : (
				<>
					<section className="grid gap-4 lg:grid-cols-4">
						<button
							type="button"
							onClick={() => navigate('/centros')}
							className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md text-left"
						>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm font-semibold text-slate-500">
										Total de POIs
									</p>
									<p className="mt-4 text-4xl font-black text-slate-700">
										{totalPois}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-navy-100 text-navy text-xl">
									📍
								</div>
							</div>
							<p className="mt-4 text-sm text-slate-500">
								Todo el inventario de puntos de interés.
							</p>
						</button>

						<button
							type="button"
							onClick={() => handleCenterCardClick(lastActiveCenterName)}
							className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md text-left"
						>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm font-semibold text-slate-500">
										Centros activos
									</p>
									<p className="mt-4 text-4xl font-black text-slate-700">
										{uniqueCenters}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 text-xl">
									🏢
								</div>
							</div>
							<p className="mt-4 text-sm text-slate-500">
								Centros con al menos un POI asignado.
							</p>
						</button>

						<button
							type="button"
							onClick={() => handleCenterCardClick(lastPoiTodayCenterName)}
							className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md text-left"
						>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm font-semibold text-slate-500">
										POIs hoy
									</p>
									<p className="mt-4 text-4xl font-black text-slate-700">
										{poisToday}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700 text-xl">
									🕐
								</div>
							</div>
							<p className="mt-4 text-sm text-slate-500">
								{hasPoiDates
									? 'Registros con fecha de hoy'
									: 'Basado en últimos cambios'}
							</p>
						</button>

						<button
							type="button"
							onClick={() => handleCenterCardClick(lastPoi7DaysCenterName)}
							className="cursor-pointer group overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm transition hover:shadow-md text-left"
						>
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm font-semibold text-slate-500">
										Actividad 7 días
									</p>
									<p className="mt-4 text-4xl font-black text-slate-700">
										{poisLast7Days}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-700 text-xl">
									📈
								</div>
							</div>
							<div className="mt-4 flex items-center gap-2">
								<span
									className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${weeklyChangeTrend === 'up' ? 'bg-emerald-100 text-emerald-700' : weeklyChangeTrend === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}
								>
									{weeklyChangeTrend === 'up'
										? '▲'
										: weeklyChangeTrend === 'down'
											? '▼'
											: '•'}{' '}
									{weeklyChangeLabel}
								</span>
							</div>
							<p className="mt-3 text-sm text-slate-500">
								{weeklyChangeCaption}
							</p>
						</button>
					</section>

					<section className="grid gap-4 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => handleCenterCardClick(mostActiveCenter?.name)}
							className="group w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-navy-500 hover:shadow-md hover:cursor-pointer"
						>
							<p className="text-sm text-slate-500">Centro con más POIs</p>
							<p className="text-2xl font-bold text-slate-700">
								{mostActiveCenter ? mostActiveCenter.name : '—'}
							</p>
							<p className="text-sm text-slate-500 mt-1">
								{mostActiveCenter
									? `${mostActiveCenter.value} POIs`
									: 'Sin datos'}
							</p>
						</button>
						<button
							type="button"
							onClick={() => handleCenterCardClick(mostRecentCenterName)}
							className="group w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-navy-500 hover:shadow-md hover:cursor-pointer"
						>
							<p className="text-sm text-slate-500">
								Centro con más cambios recientes
							</p>
							<p className="text-2xl font-bold text-slate-700">
								{mostRecentCenterName || '—'}
							</p>
							<p className="text-sm text-slate-500 mt-1">
								{mostRecentCenterName
									? `${mostRecentCenterCount} cambios`
									: 'Sin datos recientes'}
							</p>
						</button>
					</section>

					<section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
						<h2 className="text-lg font-semibold text-slate-700 mb-4">
							Top 3 centros más activos
						</h2>
						{topCenters.length === 0 ? (
							<p className="text-slate-500">
								No hay centros con POIs para mostrar.
							</p>
						) : (
							<ol className="space-y-3">
								{topCenters.map((center, index) => (
									<button
										key={center.name}
										type="button"
										onClick={() => handleCenterCardClick(center.name)}
										className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 hover:border-navy-400 transition cursor-pointer text-left"
									>
										<div className="flex items-center justify-between">
											<span className="text-sm font-semibold text-slate-700">
												#{index + 1} {center.name}
											</span>
											<span className="text-sm text-slate-500">
												{center.percentage}%
											</span>
										</div>
										<p className="mt-2 text-sm text-slate-600">
											{center.value} POIs · {center.recentCount} cambios
											recientes
										</p>
									</button>
								))}
							</ol>
						)}
					</section>

					<section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
						<h2 className="text-lg font-semibold text-slate-700 mb-3">
							Últimos cambios en POIs
						</h2>
						{lastChanges.length === 0 ? (
							<p className="text-slate-500">No hay POIs disponibles.</p>
						) : (
							<ul className="space-y-3">
								{lastChanges.map((poi) => {
									const centerName =
										getCenterName(poi.centerId) || 'Sin centro';
									return (
										<button
											key={poi.id}
											type="button"
											onClick={() => handleCenterCardClick(centerName)}
											className="w-full border border-slate-100 rounded-lg p-3 hover:bg-slate-100 hover:border-navy-400 transition cursor-pointer text-left"
										>
											<p className="font-semibold text-slate-700">{poi.name}</p>
											<p className="text-xs text-slate-500">
												Centro: {centerName}
											</p>
											<p className="text-sm text-slate-600 mt-1">
												{poi.description}
											</p>
										</button>
									);
								})}
							</ul>
						)}
					</section>

					<section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
						<label
							htmlFor="search-centers"
							className="block text-sm font-semibold text-slate-700 mb-2"
						>
							Buscar centro
						</label>
						<input
							id="search-centers"
							type="text"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Escribe el nombre del centro..."
							className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-navy-500 focus:ring-navy-500"
						/>
					</section>

					<section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
						<h2 className="text-lg font-semibold text-slate-700 mb-3">
							POIs totales y últimos cambios por Centro
						</h2>
						{filteredPoisByCenter.length === 0 ? (
							<p className="text-slate-500">
								No hay datos disponibles para mostrar el gráfico.
							</p>
						) : (
							<>
								<ResponsiveContainer width="100%" height={520}>
									<BarChart
										data={filteredPoisByCenter}
										margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="name"
											label={{ value: 'Centro', position: 'insideBottomRight' }}
											textAnchor="middle"
											height={80}
										/>
										<YAxis
											label={{
												value: 'Cantidad',
												angle: -90,
												position: 'insideLeft',
												offset: 0,
												textAnchor: 'middle',
											}}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
											}}
											formatter={(value, name) => {
												if (name === 'recentCount')
													return [`${value} recientes`, 'Últimos cambios'];
												if (name === 'value') return [`${value} POIs`, 'Total'];
												return [value, name];
											}}
											labelFormatter={(label) => `Centro: ${label}`}
										/>
										<Legend
											formatter={(value) =>
												value === 'recentCount'
													? 'Últimos cambios'
													: 'Total POIs'
											}
										/>
										<Bar
											dataKey="recentCount"
											fill="#10b981"
											name="recentCount"
											radius={[8, 8, 0, 0]}
											cursor="pointer"
										/>
										<Bar
											dataKey="value"
											fill="#2563eb"
											name="value"
											radius={[8, 8, 0, 0]}
											onClick={handleBarClick}
											cursor="pointer"
										>
											<LabelList
												dataKey="percentage"
												position="top"
												formatter={(value) => `${value}%`}
											/>
										</Bar>
									</BarChart>
								</ResponsiveContainer>
								<p className="mt-3 text-sm text-slate-500">
									La barra verde muestra cuántos POIs de los últimos cambios
									recientes pertenecen al centro.
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
