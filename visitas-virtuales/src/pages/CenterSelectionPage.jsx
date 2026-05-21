import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { useCenter } from '@/hooks/useCenter.js';
import { toast } from 'sonner';
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Settings,
	Search,
} from 'lucide-react';
import Button from '@/components/Button.jsx';
import UserDropdown from '../components/UserDropdown';
import Input from '../components/Input.jsx';
import Select from '@/components/Select.jsx';

export default function CenterSelectionPage() {
	const navigate = useNavigate();
	const hasFetchedRef = useRef(false);
	const initialValues = {
		search: '',
		limit: 6,
		page: 1,
	};

	const [searchParams, setSearchParams] = useSearchParams(initialValues);
	const searchQuery = searchParams.get('search') || '';
	const order = searchParams.get('order') || '';
	const location = searchParams.get('location') || '';
	const itemsPerPage = Number(searchParams.get('limit')) || 6;
	const currentPage = Number(searchParams.get('page')) || 1;

	const updateSearchParams = (updates) => {
		const nextParams = new URLSearchParams(searchParams);

		Object.entries(updates).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				nextParams.delete(key);
				return;
			}

			nextParams.set(key, String(value));
		});

		setSearchParams(nextParams);
	};

	const normalizeText = (text) =>
		text
			?.toString()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim() || '';

	const { isAdmin, isTeacher } = useAuth();
	const isStaff = isAdmin || isTeacher;
	const {
		allCenters,
		selectedCenter,
		isCentersLoading,
		centersError,
		saveSelectedCenter,
		fetchCenters,
	} = useCenter();

	// Iniciamos el local con lo que haya en el contexto (por si vuelve para cambiar)
	const [localSelectedCenter, setLocalSelectedCenter] = useState(
		selectedCenter || null,
	);

	const handleSearchChange = (value) => {
		updateSearchParams({
			search: value,
			page: 1,
			limit: itemsPerPage,
			order,
			location,
		});
	};

	const handleOrderChange = (e) => {
		const value = e.target.value;
		updateSearchParams({
			search: searchQuery,
			page: 1,
			limit: itemsPerPage,
			order: value,
			location,
		});
	};

	const handleLocationChange = (e) => {
		const value = e.target.value;
		updateSearchParams({
			search: searchQuery,
			page: 1,
			limit: itemsPerPage,
			order,
			location: value,
		});
	};

	const handlePageChange = (nextPage) => {
		updateSearchParams({
			search: searchQuery,
			page: nextPage,
			limit: itemsPerPage,
			order,
			location,
		});
	};

	useEffect(() => {
		if (
			!hasFetchedRef.current &&
			!isCentersLoading &&
			(!allCenters || allCenters.length === 0)
		) {
			hasFetchedRef.current = true;
			fetchCenters();
		}
	}, [fetchCenters, isCentersLoading, allCenters]);

	useEffect(() => {
		if (isCentersLoading || centersError) return;

		// Si no hay centros, no hacemos nada (el toast se muestra en la Landing)
		if (!allCenters || allCenters.length === 0) return;

		if (!selectedCenter) {
			toast.info('Selecciona un centro para continuar', {
				description: `Es necesario elegir un centro educativo para ${isAdmin || isTeacher ? 'configurar sus POIs y acceder a su tour virtual' : 'acceder al tour virtual'}`,
			});
		}
	}, [
		isCentersLoading,
		centersError,
		allCenters,
		selectedCenter,
		isAdmin,
		isTeacher,
	]);

	const handleConfirm = () => {
		if (localSelectedCenter) {
			// Actualizamos el contexto global (esto permitirá entrar a /viewer)
			saveSelectedCenter(localSelectedCenter);

			toast.success(
				`${isAdmin || isTeacher ? `Seleccionado ${localSelectedCenter.name}` : `Cargando ${localSelectedCenter.name}`}`,
				{
					description: `${isAdmin || isTeacher ? 'Ahora puedes configurar los POIs o acceder al tour virtual' : 'Preparando tour virtual'}`,
				},
			);

			// Redirigimos a la escena de Unity o al gestor de POIs según el rol
			navigate(isAdmin || isTeacher ? '/listpois' : '/viewer');
		}
	};

	// Filtrar y paginar centros
	const filteredCenters = (allCenters || [])
		.filter((center) => {
			if (!searchQuery) return true;

			return center.name.toLowerCase().includes(searchQuery.toLowerCase());
		})
		.filter((center) => {
			if (!location) return true;

			const normalizedLocation = normalizeText(location);
			return (
				normalizeText(center.name).includes(normalizedLocation) ||
				normalizeText(center.location).includes(normalizedLocation)
			);
		})
		.sort((a, b) => {
			if (order === 'name_asc') {
				return a.name.localeCompare(b.name);
			}

			if (order === 'name_desc') {
				return b.name.localeCompare(a.name);
			}

			return 0;
		});

	const locationOptions = [
		{ id: '', name: 'Todas las ubicaciones' },
		...Array.from(
			new Map(
				(allCenters || [])
					.map((center) => center.location)
					.filter(Boolean)
					.map((locationName) => [normalizeText(locationName), locationName]),
			).values(),
		)
			.sort((a, b) => a.localeCompare(b, 'es'))
			.map((locationName) => ({ id: locationName, name: locationName })),
	];

	const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
	const paginatedCenters = filteredCenters.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);
	const canGoPrevious = currentPage > 1;
	const canGoNext = currentPage < totalPages;

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col gap-4">
			{/* Botón flotante para volver a la Landing (útil para invitados) + dropdown de usuario para logueados */}
			<div
				className="sticky top-0 z-40 h-16 w-full flex items-center justify-between p-4 lg:py-4 lg:px-8 border-b border-transparent
                    bg-slate-50/80 backdrop-blur-xl
                    transition-all pl-1.75!"
			>
				<Link to="/">
					<Button variant="ghost" size="normal">
						<ArrowLeft size={20} />
						<span>Volver a inicio</span>
					</Button>
				</Link>
				{isStaff ? (
					<UserDropdown />
				) : (
					<Link to="/login">
						<Button variant="primary" size="normal" type="button">
							Iniciar sesión
						</Button>
					</Link>
				)}
			</div>

			<main className="flex-1 flex flex-col items-center justify-center p-6">
				<div className="w-full max-w-6xl">
					{/* Título */}
					<div className="mb-8 text-center">
						<h1 className="text-3xl font-bold text-slate-700 tracking-tight leading-tight">
							¿Qué centro quieres visitar?
						</h1>
						<p className="text-slate-500 mt-2 text-sm max-w-md mx-auto leading-relaxed">
							Selecciona una ubicación para explorar sus instalaciones en el
							tour virtual 360°.
						</p>
					</div>

					{/* Buscador de centros */}
					<div className="mb-8">
						<div className="relative w-full mx-auto flex sm:flex-row flex-col justify-center items-center gap-4">
							<Input
								placeholder="Buscar centro por nombre..."
								className="w-full lg:max-w-sm"
								value={searchQuery}
								onChange={(e) => handleSearchChange(e.target.value)}
							>
								<Search size={18} />
							</Input>
							{/* Filtros de orden y ubicación */}
							<div className="flex w-full sm:w-auto gap-4 justify-center">
								<Select
									size="small"
									variant="outline"
									className="w-35!"
									value={order}
									onChange={handleOrderChange}
									options={[
										{ id: 'name_asc', name: 'Nombre A-Z' },
										{ id: 'name_desc', name: 'Nombre Z-A' },
									]}
								/>
								<Select
									size="small"
									variant="outline"
									className="w-fit! pr-9"
									value={location}
									onChange={handleLocationChange}
									options={locationOptions}
								/>
							</div>
						</div>
					</div>

					{/* Estados de carga y error */}
					{isCentersLoading && (
						<div className="flex justify-center items-center h-48">
							<div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full" />
						</div>
					)}

					{/* Grid de tarjetas */}
					{!isCentersLoading && !centersError && allCenters && (
						<div className="flex w-full flex-col items-center">
							{filteredCenters.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-slate-500 text-lg leading-relaxed">
										No hay centros que coincidan con &quot;{searchQuery}&quot;
									</p>
								</div>
							) : (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
										{paginatedCenters.map((center) => {
											const isActive = localSelectedCenter?.id === center.id;
											return (
												<div
													key={center.id}
													onClick={() => setLocalSelectedCenter(center)}
													className={`
														group relative text-left rounded-2xl overflow-hidden bg-white
														border-2 transition-all duration-300 focus:outline-none w-full
														hover:shadow-2xl cursor-pointer flex flex-col min-w-75 lg:w-75 h-75
														${isActive ? 'border-navy ring-10 ring-navy/4' : 'border-slate-100 hover:border-navy/40'}
													`}
												>
													{/* Boton de configuracion para admins */}
													{isAdmin && isActive && (
														<button
															onClick={(e) => {
																e.stopPropagation();
																navigate('/settings', {
																	state: { centerId: center.id },
																});
															}}
															className="cursor-pointer absolute top-3 right-3 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors duration-200 backdrop-blur-sm"
														>
															<Settings size={16} />
														</button>
													)}

													{/* Imagen con overlay si está activo */}
													<div className="relative h-40 w-full overflow-hidden">
														{center.imageUrl ? (
															<img
																src={center.imageUrl}
																alt={center.name}
																className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
															/>
														) : (
															<div className="w-full h-full bg-linear-to-br from-navy/6 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
																{center.name.charAt(0)}
															</div>
														)}
														{isActive && <div className="absolute inset-0" />}
													</div>

													<div className="p-5 flex-1 flex flex-col justify-between">
														<div>
															<h2 className="font-bold text-slate-700 text-base mb-1">
																{center.name}
															</h2>
															<p className="text-slate-500 text-xs flex items-center gap-1 leading-relaxed">
																{center.location || 'Ubicación disponible'}
															</p>
														</div>

														{/* Indicador visual de selección */}
														<div className="mt-4">
															{isActive ? (
																<Button
																	variant="primary"
																	size="small"
																	className="w-full"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleConfirm();
																	}}
																>
																	Acceder al Centro
																</Button>
															) : (
																<div className="h-9 flex justify-center items-center text-sm font-bold text-slate-100 border-rounded border-slate-400 group-hover:text-navy transition-colors duration-300">
																	Haz clic para seleccionar
																</div>
															)}
														</div>
													</div>
												</div>
											);
										})}
									</div>

									{/* Controles de paginación */}
									{totalPages > 1 && (
										<div className="mt-8 flex items-center justify-center gap-3">
											<Button
												variant="outline"
												size="small"
												disabled={!canGoPrevious}
												onClick={() => handlePageChange(currentPage - 1)}
											>
												<ChevronLeft size={16} />
												<span>Anterior</span>
											</Button>
											<span className="min-w-28 text-center text-sm text-slate-500">
												Página {currentPage} de {totalPages}
											</span>
											<Button
												variant="outline"
												size="small"
												disabled={!canGoNext}
												onClick={() => handlePageChange(currentPage + 1)}
											>
												<span>Siguiente</span>
												<ChevronRight size={16} />
											</Button>
										</div>
									)}
								</>
							)}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
