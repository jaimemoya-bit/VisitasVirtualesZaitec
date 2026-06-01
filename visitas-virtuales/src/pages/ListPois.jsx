import {
	Search,
	Plus,
	Pencil,
	Trash,
	ChevronLeft,
	ChevronRight,
	MapPin,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useCenter } from '../hooks/useCenter';
import Input from '../components/Input';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';

export default function ListPois({ centerId }) {
	const [pois, setPois] = useState([]);
	const [search, setSearch] = useState('');
	const { selectedCenter } = useCenter();
	const navigate = useNavigate();

	const API_URL = import.meta.env.VITE_API_URL;
	// limit=100 para traer todos los POIs del centro (máx permitido por la API)
	const GET_PATH = `/api/v1/centers/${centerId}/pois?limit=100`;

	const filteredPois = pois.filter((poi) =>
		poi.name.toLowerCase().includes(search.toLowerCase()),
	);

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const totalPages = Math.ceil(filteredPois.length / itemsPerPage);
	const safeTotalPages = Math.max(1, totalPages);
	const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
	const lastIndex = safeCurrentPage * itemsPerPage;
	const firstIndex = lastIndex - itemsPerPage;
	const currentPois = filteredPois.slice(firstIndex, lastIndex);

	const deletePois = async (id) => {
		try {
			const response = await fetch(
				API_URL + `/api/v1/centers/${centerId}/pois/${id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
					},
				},
			);

			if (response.ok) {
				getPois();
				toast.success('POI eliminado correctamente');
			} else {
				toast.error('Error al eliminar el POI');
			}
		} catch (error) {
			console.error('Error al eliminar:', error);
		}
	};

	const getPois = useCallback(async () => {
		try {
			const response = await fetch(API_URL + GET_PATH, {
				headers: {
					Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
				},
			});
			const data = await response.json();
			if (response.ok && !!data) {
				setPois(Array.isArray(data.pois) ? data.pois : []);
			}
		} catch (error) {
			setPois([]);
			console.error('Error al obtener POIs:', error);
		}
	}, [API_URL, GET_PATH]);

	useEffect(() => {
		getPois();
	}, [getPois]);

	if (!selectedCenter) {
		navigate('/centros');
		return null;
	}

	//He metido todo el section dentro de un div para centrarlo.
	return (
		<div className="relative flex flex-col items-center justify-center w-full min-h-full px-3 py-6 lg:px-12 lg:py-20 md:px-10">
			<section className="flex flex-col justify-center w-full max-w-4xl gap-4 min-h-125">
				<div className="flex flex-col items-end justify-between w-full gap-4 lg:flex-row">
					<PageHeader
						title="Gestión de puntos de interés"
						contextText={selectedCenter.name}
						contextIcon={<MapPin className="w-4 h-4" />}
					/>
					<Button
						size="small"
						onClick={() =>
							navigate('/crud', {
								state: {
									id: '',
									centerId: selectedCenter.name,
									name: '',
									description: '',
									tipo: 'basico',
									imagenes: [],
									isEditing: false,
								},
							})
						}
						className="w-full ml-auto lg:ml-0 lg:w-auto"
					>
						<Plus size={18} strokeWidth={2.25} /> Nuevo POI
					</Button>
				</div>
				<div className="min-w-full p-4 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-100">
					<Input
						placeholder="Buscador de POI"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
					>
						<Search size={18} />
					</Input>
					{/* TODO: Filtros de fecha, centro y usuario */}
					{/* <div className="flex flex-wrap items-center justify-start w-full gap-6 p-4 rounded-lg bg-slate-50 outline outline-slate-100 shadow-sm/8">
						{Array.from(filterMap.entries()).map(([filterName, options]) => (
							<label
								key={filterName}
								className="inline-flex items-center gap-2 text-sm text-slate-600"
							>
								<span className="font-medium text-slate-500">{filterName}</span>
								<select
									// value={filter[filterName.toLowerCase()]}
									name={filterName.toLowerCase()}
									// onChange={handleFilterChange}
									className="px-3 py-1 text-sm bg-white border rounded border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-slate-600"
								>
									{options.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</label>
						))}
					</div> */}

					<div className="mt-5 overflow-x-auto rounded-lg outline outline-slate-100 bg-slate-50 shadow-sm/8">
						<table className="w-full min-w-0 text-sm text-left sm:min-w-130">
							<thead className="text-xs font-semibold uppercase bg-slate-100 text-slate-600">
								<tr>
									<th className="px-4 py-4 lg:px-6 lg:py-4">
										Punto de interés
									</th>
									<th className="hidden px-4 py-3 sm:table-cell lg:px-6 lg:py-4 text-ellipsis">
										Descripción
									</th>
									<th className="px-4 py-4 text-right lg:px-6 lg:py-4">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-200">
								{currentPois.length === 0 ? (
									<tr>
										<td
											colSpan="3"
											className="px-6 py-10 italic text-center text-slate-500"
										>
											No se encontraron puntos de interés
										</td>
									</tr>
								) : (
									currentPois.map((poi) => (
										<tr
											key={poi.id}
											className="transition-colors hover:bg-slate-50/86"
										>
											<td className="px-4 py-4 overflow-hidden font-medium lg:px-6 lg:py-4 text-slate-700 text-ellipsis max-w-50 whitespace-nowrap">
												{poi.name}
												{/* Badge visual para POIs de imagen */}
												{poi.details?.tipo === 'imagen' && (
													<span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-normal">
														Imagen
													</span>
												)}
											</td>
											<td className="hidden px-4 py-3 sm:table-cell lg:px-6 lg:py-4 text-slate-600">
												<span className="text-ellipsis line-clamp-2">
													{poi.details.description}
												</span>
											</td>
											<td className="px-4 py-4 text-right lg:px-6 lg:py-4">
												<div className="flex justify-end gap-2 whitespace-nowrap">
													<Link
														to="/crud"
														state={{
															id: poi.id,
															centerId: selectedCenter.name,
															name: poi.name,
															description: poi.details.description,
															tipo: poi.details?.tipo || 'basico',
															imagenes: poi.details?.imagenes || [],
															// Preservar coordenadas de Unity para que el PATCH no las pierda
															posX: poi.details?.posX,
															posY: poi.details?.posY,
															isEditing: true,
														}}
														className="p-2 transition-colors text-navy hover:bg-navy-muted rounded-xl"
													>
														<Pencil size={18} />
													</Link>
													<button
														onClick={() => deletePois(poi.id)}
														className="p-2 text-red-600 transition-colors cursor-pointer hover:bg-red-100 rounded-xl"
													>
														<Trash size={18} />
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>

						{filteredPois.length > 0 && (
							<div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50 lg:px-6 border-slate-200">
								<p className="text-xs leading-relaxed text-slate-500">
									Mostrando{' '}
									<span className="font-semibold">{firstIndex + 1}</span> -{' '}
									<span className="font-semibold">
										{Math.min(lastIndex, filteredPois.length)}
									</span>{' '}
									de {filteredPois.length}
								</p>
								<div className="flex items-center gap-2">
									<button
										onClick={() =>
											setCurrentPage(Math.max(1, safeCurrentPage - 1))
										}
										disabled={safeCurrentPage === 1}
										className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
									>
										<ChevronLeft size={18} />
									</button>
									<span className="text-xs font-medium text-slate-700">
										Página {safeCurrentPage} de {safeTotalPages}
									</span>
									<button
										onClick={() =>
											setCurrentPage(
												Math.min(safeTotalPages, safeCurrentPage + 1),
											)
										}
										disabled={safeCurrentPage === safeTotalPages}
										className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
									>
										<ChevronRight size={18} />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}