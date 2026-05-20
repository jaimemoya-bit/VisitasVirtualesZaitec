import { toast } from 'sonner';
import { History, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePoiHistory } from '../hooks/usePoiHistory.js';
import { useCenter } from '../hooks/useCenter.js';
import { useMemo, useState } from 'react';

export default function NewHistorial() {
	const navigate = useNavigate();
	const { saveSelectedCenter, allCenters } = useCenter();
	const { isPoiHistoryLoading, poiHistory } = usePoiHistory();

	const centerNames = poiHistory.map(
		(entry) => entry.poi.center?.name || 'Centro desconocido',
	);
	const userNames = poiHistory.map(
		(entry) => entry.user?.username || 'Usuario desconocido',
	);
	const uniqueCenters = [...new Set(centerNames)];
	const uniqueUsers = [...new Set(userNames)];

	const filterMap = new Map([
		['Fecha', ['Más recientes', 'Más antiguos']],
		['Centro', ['Todos', ...uniqueCenters]],
		['Usuario', ['Todos', ...uniqueUsers]],
	]);

	const filterInitialState = {
		fecha: filterMap.get('Fecha')[0],
		centro: filterMap.get('Centro')[0],
		usuario: filterMap.get('Usuario')[0],
	};

	const [filter, setFilter] = useState(filterInitialState);

	const isFiltered =
		filter.centro !== 'Todos' ||
		filter.usuario !== 'Todos' ||
		filter.fecha !== filterInitialState.fecha;

	const filteredPoiHistory = useMemo(() => {
		let result = [...poiHistory];

		if (filter.centro && filter.centro !== 'Todos') {
			result = result.filter((entry) => {
				const centerName = entry.poi?.center?.name || 'Centro desconocido';
				return centerName === filter.centro;
			});
		}

		if (filter.usuario && filter.usuario !== 'Todos') {
			result = result.filter((poi) => poi.user?.username === filter.usuario);
		}

		if (filter.fecha === 'Más antiguos') {
			result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
		} else {
			result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
		}

		return result;
	}, [filter, poiHistory]);

	// Seleccionar centro relacionado al cambio y redirigir a la lista de POIs de ese centro
	const handleEntryClick = (entry) => {
		if (!entry.poi || !entry.poi.center) {
			toast.error('No se pudo determinar el centro de este cambio');
			return;
		}
		saveSelectedCenter(
			allCenters.find((c) => c.id === entry.details.oldValue.centerId) || null,
		);
		navigate(`/listpois`);
	};

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilter((prev) => ({ ...prev, [name]: value }));
	};

	if (isPoiHistoryLoading)
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
					<p className="italic text-slate-500 leading-relaxed">
						Obteniendo los últimos cambios...
					</p>
				</div>
			</div>
		);

	return (
		<div className="relative flex flex-col items-center justify-center min-h-full w-full py-6 lg:py-20 lg:px-12 md:px-10 px-3 mt-8">
			<section className="flex flex-col gap-6 w-full justify-center lg:justify-start min-h-125 max-w-4xl">
				<div className="flex flex-col w-full justify-between items-center lg:items-start gap-1 p-2 lg:p-0">
					<h1 className="text-xl lg:text-2xl font-semibold text-slate-700 flex items-center gap-2 tracking-tight leading-tight">
						Historial de Auditoría
						<span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
							Live
						</span>
					</h1>
					<div className="flex items-center gap-2">
						<p className="text-slate-500 text-sm font-base lg:font-medium flex items-center gap-1 leading-relaxed">
							Últimos cambios en los puntos de interés
						</p>
					</div>
				</div>
				{/* Filtros */}
				<div className="w-full gap-6 flex items-center justify-start flex-wrap p-4 bg-slate-50 rounded-lg outline outline-slate-100 shadow-sm/8">
					{Array.from(filterMap.entries()).map(([filterName, options]) => (
						<label
							key={filterName}
							className="text-sm text-slate-600 gap-2 inline-flex items-center"
						>
							<span className="font-medium text-slate-500">{filterName}</span>
							<select
								value={filter[filterName.toLowerCase()]}
								name={filterName.toLowerCase()}
								onChange={handleFilterChange}
								className="border border-slate-200 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 bg-white text-slate-600"
							>
								{options.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>
					))}
				</div>

				{filteredPoiHistory.length > 0 ? (
					<div className="relative ml-4 md:ml-6">
						{filteredPoiHistory.map((entry, idx) => {
							const oldV =
								entry.details?.oldValue ?? entry.details?.before ?? {};
							const newV =
								entry.details?.newValue ?? entry.details?.after ?? {};
							const nameOld = oldV?.name ?? entry.poi?.name ?? '—';
							const nameNew = newV?.name ?? entry.poi?.name ?? '—';
							const descOld =
								oldV?.details?.description ?? oldV?.description ?? '—';
							const descNew =
								newV?.details?.description ?? newV?.description ?? '—';
							const centerName =
								entry.poi?.center?.name ?? 'Centro desconocido';

							return (
								<div
									key={entry.id}
									className="mb-10 ml-6 group relative"
									onClick={() => handleEntryClick(entry)}
								>
									{/* Linea vertical */}
									{idx < filteredPoiHistory.length - 1 && (
										<div className="absolute -left-6.25 top-7 -bottom-18 w-px bg-navy-muted" />
									)}

									{/* Punto */}
									<span className="absolute top-6.5 -left-8 flex items-center justify-center w-4 h-4 bg-white border-2 border-navy rounded-full group-hover:bg-navy transition-colors shadow-sm cursor-pointer" />

									<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
										{/* Header con información del centro */}
										<div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
											<MapPin size={18} className="text-navy shrink-0" />
											<h3 className="text-lg font-semibold text-slate-700">
												{centerName}
											</h3>
											<span
												className={`ml-auto text-xs font-medium px-2 py-1 rounded ${
													entry.action === 'create'
														? 'bg-green-100 text-green-700'
														: entry.action === 'delete'
															? 'bg-red-100 text-red-700'
															: 'bg-amber-100 text-amber-700'
												}`}
											>
												{(entry.action === 'create' && 'Crear') ||
													(entry.action === 'delete' && 'Eliminar') ||
													(entry.action === 'update' && 'Modificar') ||
													'Desconocida'}
											</span>
										</div>

										{/* Fecha y hora */}
										<div className="flex justify-between items-start gap-4 mb-4">
											<div className="flex gap-2 items-center">
												<div className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded">
													{new Date(entry.timestamp).toLocaleDateString()}
												</div>
												<div className="text-xs text-slate-400">
													{new Date(entry.timestamp).toLocaleTimeString([], {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</div>
											</div>

											<div className="text-right">
												<div className="text-[10px] text-slate-300 font-mono">
													ID: {entry.id}
												</div>
											</div>
										</div>

										{/* Cambios antes y después */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
											<div className="md:col-span-2 grid grid-cols-2 gap-4">
												<div className="p-3 rounded border border-slate-100 bg-slate-50">
													<div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
														<span>Antes</span>
													</div>
													<div className="font-semibold text-slate-700 text-ellipsis line-clamp-1">
														{nameOld}
													</div>
													<div className="text-sm text-slate-500 mt-2 text-ellipsis line-clamp-2 min-h-10">
														{descOld}
													</div>
												</div>

												<div className="p-3 rounded border border-slate-100 bg-navy-50/30">
													<div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
														<span>Después</span>
													</div>
													<div className="font-semibold text-slate-700 text-ellipsis line-clamp-1">
														{nameNew}
													</div>
													<div className="text-sm text-slate-500 mt-2 text-ellipsis line-clamp-2 min-h-10">
														{descNew}
													</div>
												</div>
											</div>

											{/* Usuario y razón */}
											<div className="flex flex-col items-start gap-3 pt-2">
												<div className="flex items-center gap-2 w-full">
													<img
														src={
															entry.user?.imageUrl ||
															'https://github.com/identicons/j.png'
														}
														className="w-8 h-8 rounded-full border border-slate-200 shrink-0 "
														alt="avatar"
													/>
													<div className="min-w-0 flex-1">
														<div className="text-sm font-semibold text-slate-700 truncate">
															{entry.user?.username ?? 'Usuario desconocido'}
														</div>
														<div className="text-xs text-slate-400">
															{entry.action === 'create'
																? 'Creó el punto de interés'
																: entry.action === 'delete'
																	? 'Eliminó el punto de interés'
																	: 'Modificó el punto de interés'}
														</div>
													</div>
												</div>

												{entry.details?.reason && (
													<div className="w-full p-2 bg-slate-50 rounded border border-slate-100 h-full">
														<div className="text-xs font-medium text-slate-500 mb-1">
															Razón
														</div>
														<p className="text-xs text-slate-600 italic leading-relaxed">
															{entry.details.reason}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center gap-4 py-10">
						<History size={48} className="text-slate-300" />
						<p className="text-slate-400 leading-relaxed">
							No hay cambios registrados
							{isFiltered
								? ' para los filtros aplicados'
								: ' en el historial de auditoría'}
							.
						</p>
					</div>
				)}

				{!isFiltered && (
					<p className="text-sm text-slate-400 italic text-center py-6 leading-relaxed">
						Nota: Solo se muestran los últimos 20 cambios.
					</p>
				)}
			</section>
		</div>
	);
}
