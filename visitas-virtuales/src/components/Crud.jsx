import React, { useState, useEffect } from 'react';
import Button from './Button.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { useCenter } from '../hooks/useCenter.js';
import Input from './Input.jsx';
import fetchWithAuth from '../helpers/fetchWithAuth.js';
import { useAuth } from '../hooks/useAuth.js';
import PageHeader from './PageHeader.jsx';

function Crud() {
	const { selectedCenter } = useCenter();
	const [formData, setFormData] = useState({
		id: '',
		centerId: '',
		name: '',
		description: '',
		tipo: 'basico',
		imagenes: [],
	});

	// Estado para el uploader de imágenes
	const [uploading, setUploading] = useState(false);
	const [imagenesLocales, setImagenesLocales] = useState([]); // URLs ya subidas a MinIO

	const location = useLocation();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const state = location.state || {};
	const isEditing = !!state.isEditing;

	const navigate = useNavigate();
	const { logout } = useAuth();

	const API_URL = import.meta.env.VITE_API_URL;
	const UPDATE_PATH = `api/v1/centers/${selectedCenter?.id}/pois/${location.state?.id}`;
	const CREATE_PATH = `api/v1/centers/${selectedCenter?.id}/pois`;

	// Cargar datos al montar
	useEffect(() => {
		if (isEditing && state) {
			setFormData({
				id: state.id || '',
				centerId: state.centerId || '',
				name: state.name || '',
				description: state.description || state.details?.description || '',
				tipo: state.tipo || 'basico',
				imagenes: state.imagenes || [],
			});
			// Precargar las imágenes ya existentes
			setImagenesLocales(state.imagenes || []);
		}
	}, [isEditing]);

	if (!selectedCenter) {
		navigate('/centros');
		return null;
	}

	// ── Subida de imagen a MinIO ──────────────────────────────────────────────

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validar que sea imagen
		if (!file.type.startsWith('image/')) {
			toast.error('Solo se permiten imágenes');
			return;
		}

		// Validar tamaño máximo 10MB
		if (file.size > 10 * 1024 * 1024) {
			toast.error('La imagen no puede superar 10MB');
			return;
		}

		setUploading(true);

		try {
			const formDataUpload = new FormData();
			formDataUpload.append('file', file);

			const response = await fetchWithAuth(
				`${API_URL}api/v1/upload`,
				{
					method: 'POST',
					body: formDataUpload,
					// No ponemos Content-Type — el navegador lo pone automáticamente con el boundary
				},
				logout,
			);

			if (response && response.ok) {
				const data = await response.json();
				// La API devuelve fileUrl con la URL pública de MinIO
				const nuevaUrl = data.fileUrl;
				const nuevasImagenes = [...imagenesLocales, nuevaUrl];
				setImagenesLocales(nuevasImagenes);
				toast.success('Imagen subida correctamente');
			} else {
				toast.error('Error al subir la imagen');
			}
		} catch (error) {
			console.error('Error al subir imagen:', error);
			toast.error('Error de red al subir la imagen');
		} finally {
			setUploading(false);
			// Limpiar el input para permitir subir la misma imagen otra vez
			e.target.value = '';
		}
	};

	const eliminarImagen = (index) => {
		const nuevasImagenes = imagenesLocales.filter((_, i) => i !== index);
		setImagenesLocales(nuevasImagenes);
	};

	// ── Crear POI ─────────────────────────────────────────────────────────────

	const createPois = async () => {
		try {
			const details =
				formData.tipo === 'imagen'
					? {
							description: formData.description,
							tipo: 'imagen',
							imagenes: imagenesLocales,
						}
					: {
							description: formData.description,
							tipo: 'basico',
						};

			const response = await fetchWithAuth(
				`${API_URL}${CREATE_PATH}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formData.name,
						details,
					}),
				},
				logout,
			);

			if (response && response.ok) {
				toast.success('POI creado con éxito', {
					description: 'Redirigiendo a la lista de POIs...',
				});
				navigate('/listpois');
				resetForm();
			} else if (response && response.status !== 401) {
				toast.error('Error al crear el POI', {
					description: 'Inténtalo de nuevo más tarde',
				});
			}
		} catch (error) {
			toast.error('Error de red', {
				description: 'No se pudo conectar con el servidor',
			});
			console.error('Error:', error);
		}
	};

	// ── Actualizar POI ────────────────────────────────────────────────────────

	const updatePois = async () => {
		try {
			// Construir details manteniendo posX/posY si ya existían
			const detailsBase = {
				description: formData.description,
				tipo: formData.tipo,
				// Preservar coordenadas de Unity si existen
				...(state.posX !== undefined && { posX: state.posX }),
				...(state.posY !== undefined && { posY: state.posY }),
			};

			const details =
				formData.tipo === 'imagen'
					? { ...detailsBase, imagenes: imagenesLocales }
					: detailsBase;

			const response = await fetchWithAuth(
				`${API_URL}${UPDATE_PATH}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formData.name,
						details,
					}),
				},
				logout,
			);

			if (response && response.ok) {
				toast.success('POI actualizado con éxito', {
					description: 'Redirigiendo a la lista de POIs...',
				});
				navigate('/listpois');
				resetForm();
			} else if (response && response.status !== 401) {
				toast.error('Error al actualizar el POI', {
					description: 'Inténtalo de nuevo más tarde',
				});
			}
		} catch (error) {
			toast.error('Error de red', {
				description: 'No se pudo conectar con el servidor',
			});
			console.error('Error:', error);
		}
	};

	const resetForm = () => {
		setFormData({
			id: '',
			centerId: '',
			name: '',
			description: '',
			tipo: 'basico',
			imagenes: [],
		});
		setImagenesLocales([]);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (isEditing) {
			updatePois();
		} else {
			createPois();
		}
	};

	const esTipoImagen = formData.tipo === 'imagen';

	return (
		<div className="flex flex-col items-center justify-center min-h-full w-full px-3 py-6 lg:px-12 md:px-10">
			<div className="flex flex-col gap-4 w-full justify-center min-h-125 mb-50 max-w-2xl">
				<div className="flex flex-col gap-4 w-full text-center lg:text-start">
					<PageHeader
						title={
							isEditing
								? 'Editar punto de interés'
								: 'Crear nuevo punto de interés'
						}
						contextIcon={<MapPin className="w-4 h-4" />}
						contextText={selectedCenter.name}
					/>
				</div>
				<section className="flex flex-col gap-2 w-full shadow-sm rounded-2xl bg-white min-h-full">
					<form
						onSubmit={handleSubmit}
						className="py-6 px-4 outline outline-slate-100 rounded-lg bg-slate-50 shadow-sm/8"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

							{/* Nombre */}
							<div className="md:col-span-2 space-y-2">
								<label className="block text-slate-600 text-sm font-medium mb-1">
									Nombre:
								</label>
								<Input
									type="text"
									name="name"
									value={formData.name || ''}
									onChange={handleInputChange}
									placeholder="Nombre del POI"
									required
								/>
							</div>

							{/* Descripción */}
							<div className="md:col-span-2 space-y-2">
								<label className="block text-slate-600 text-sm font-medium">
									Descripción:
								</label>
								<textarea
									name="description"
									value={formData.description || ''}
									onChange={handleInputChange}
									rows="6"
									className="group flex w-full flex-row p-2 gap-2 items-center bg-white outline-1! outline-slate-200 rounded-lg shadow-sm transition-all focus-within:ring-4 focus-within:ring-navy/10 focus-within:outline-navy"
									placeholder="Descripción del punto de interés"
									required
								/>
							</div>

							{/* Sección de imágenes — solo visible si tipo === 'imagen' */}
							{esTipoImagen && (
								<div className="md:col-span-2 space-y-3">
									<label className="block text-slate-600 text-sm font-medium">
										Imágenes:
									</label>

									{/* Grid de imágenes subidas */}
									{imagenesLocales.length > 0 && (
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
											{imagenesLocales.map((url, index) => (
												<div
													key={index}
													className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100"
												>
													<img
														src={url}
														alt={`Imagen ${index + 1}`}
														className="w-full h-full object-cover"
													/>
													{/* Botón eliminar sobre la imagen */}
													<button
														type="button"
														onClick={() => eliminarImagen(index)}
														className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<Trash2 size={14} />
													</button>
												</div>
											))}
										</div>
									)}

									{/* Botón para añadir imagen */}
									<label className={`
										flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed
										border-slate-300 text-slate-500 text-sm cursor-pointer
										hover:border-navy hover:text-navy transition-colors
										${uploading ? 'opacity-50 pointer-events-none' : ''}
									`}>
										{uploading ? (
											<>
												<Loader2 size={18} className="animate-spin" />
												Subiendo imagen...
											</>
										) : (
											<>
												<ImagePlus size={18} />
												Añadir imagen (máx. 10MB)
											</>
										)}
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleImageUpload}
											disabled={uploading}
										/>
									</label>

									{imagenesLocales.length === 0 && (
										<p className="text-xs text-slate-400">
											Aún no hay imágenes. Añade al menos una para este POI.
										</p>
									)}
								</div>
							)}
						</div>

						<div className="mt-4 flex w-full justify-end gap-2">
							<Button
								type="button"
								variant="secondary"
								onClick={(e) => {
									e.preventDefault();
									navigate('/listpois');
								}}
							>
								Cancelar
							</Button>
							<Button type="submit" variant="primary" disabled={uploading}>
								{isEditing ? 'Actualizar POI' : 'Crear POI'}
							</Button>
						</div>
					</form>
				</section>
			</div>
		</div>
	);
}

export default Crud;