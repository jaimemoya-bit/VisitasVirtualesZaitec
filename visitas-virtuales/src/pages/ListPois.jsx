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
	const GET_PATH = `api/v1/centers/${centerId}/pois`;

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

	const centerNames = pois.map((poi) => poi.details.centerName);
	const userNames = pois.map((poi) => poi.details.userName);

	console.log(pois);
	const uniqueCenters = [...new Set(centerNames)];
	const uniqueUsers = [...new Set(userNames)];

	console.log('Unique Centers:', uniqueCenters);
	console.log('Unique Users:', uniqueUsers);

	const filterMap = new Map([
		['Fecha', ['Más recientes', 'Más antiguos']],
		['Centro', ['Todos', uniqueCenters]],
		['Usuario', ['Todos', uniqueUsers]],
	]);

	const deletePois = async (id) => {
		try {
			const response = await fetch(
				API_URL + `api/v1/centers/${selectedCenter.id}/pois/${id}`,
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
		<div className="relative flex flex-col items-center justify-center min-h-full w-full py-6 lg:px-12 lg:py-20 md:px-10 px-3">
			<section className="flex flex-col gap-4 w-full justify-center min-h-125 max-w-4xl">
				<div className="flex flex-col lg:flex-row w-full justify-between items-end gap-4">
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
									isEditing: false,
								},
							})
						}
						className="ml-auto lg:ml-0 lg:w-auto w-full"
					>
						<Plus size={18} strokeWidth={2.25} /> Nuevo POI
					</Button>
				</div>
				<div className="p-4 min-w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
					{/* <div className="w-full gap-6 flex items-center justify-start flex-wrap p-4 bg-slate-50 rounded-lg outline outline-slate-100 shadow-sm/8">
						{Array.from(filterMap.entries()).map(([filterName, options]) => (
							<label
								key={filterName}
								className="text-sm text-slate-600 gap-2 inline-flex items-center"
							>
								<span className="font-medium text-slate-500">{filterName}</span>
								<select
									// value={filter[filterName.toLowerCase()]}
									name={filterName.toLowerCase()}
									// onChange={handleFilterChange}
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
					</div> */}

					<div className="overflow-x-auto outline outline-slate-100 rounded-lg bg-slate-50 shadow-sm/8 mt-5">
						<table className="w-full min-w-0 sm:min-w-130 text-sm text-left">
							<thead className="bg-slate-100  text-xs uppercase text-slate-600 font-semibold">
								<tr>
									<th className="px-4 lg:px-6 py-4 lg:py-4">
										Punto de interés
									</th>
									<th className="hidden sm:table-cell px-4 lg:px-6 py-3 lg:py-4 text-ellipsis">
										Descripción
									</th>
									<th className="px-4 lg:px-6 py-4 lg:py-4 text-right">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 bg-white">
								{currentPois.length === 0 ? (
									<tr>
										<td
											colSpan="3"
											className="px-6 py-10 text-center text-slate-500 italic"
										>
											No se encontraron puntos de interés
										</td>
									</tr>
								) : (
									currentPois.map((poi) => (
										<tr
											key={poi.id}
											className="hover:bg-slate-50/86 transition-colors"
										>
											<td className="px-4 lg:px-6 py-4 lg:py-4 font-medium text-slate-700 text-ellipsis max-w-50 overflow-hidden whitespace-nowrap">
												{poi.name}
											</td>
											<td className="hidden sm:table-cell px-4 lg:px-6 py-3 lg:py-4 text-slate-600">
												<span className="text-ellipsis line-clamp-2">
													{poi.details.description}
												</span>
											</td>
											<td className="px-4 lg:px-6 py-4 lg:py-4 text-right">
												<div className="flex justify-end gap-2 whitespace-nowrap">
													<Link
														to="/crud"
														state={{
															id: poi.id,
															centerId: selectedCenter.name,
															name: poi.name,
															description: poi.details.description,
															isEditing: true,
														}}
														className="p-2 text-navy hover:bg-navy-muted rounded-xl transition-colors"
													>
														<Pencil size={18} />
													</Link>
													<button
														onClick={() => deletePois(poi.id)}
														className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
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
							<div className="bg-slate-50 px-4 lg:px-6 py-3 border-t border-slate-200 flex items-center justify-between">
								<p className="text-slate-500 text-xs leading-relaxed">
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
