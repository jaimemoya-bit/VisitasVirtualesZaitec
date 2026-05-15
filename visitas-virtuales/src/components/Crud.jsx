import React, { useState, useEffect } from 'react';
import Button from './Button.jsx';

import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
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
	});

	const location = useLocation();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const state = location.state || {};
	const isEditing = !!state.isEditing;

	const navigate = useNavigate();
	const { logout } = useAuth();

	const API_URL = import.meta.env.VITE_API_URL;
	const UPDATE_PATH = `api/v1/centers/${selectedCenter?.id}/pois/${location.state?.id}`;
	const CREATE_PATH = `api/v1/centers/${selectedCenter?.id}/pois`;

	// Cargar POIs al montar el componente
	useEffect(() => {
		if (isEditing && state) {
			setFormData({
				id: state.id || '',
				centerId: state.centerId || '',
				name: state.name || '',
				description: state.description || state.details?.description || '',
			});
		}
	}, [isEditing, state]);

	if (!selectedCenter) {
		navigate('/centros');
		return null;
	}

	const createPois = async () => {
		try {
			const response = await fetchWithAuth(
				`${API_URL}${CREATE_PATH}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: formData.name,
						details: { description: formData.description },
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

	const updatePois = async () => {
		try {
			const response = await fetchWithAuth(
				`${API_URL}${UPDATE_PATH}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: formData.name,
						details: { description: formData.description },
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
		});
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (isEditing) {
			updatePois();
		} else {
			createPois();
		}
	};

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
					{/* Formulario */}
					<form
						onSubmit={handleSubmit}
						className="py-6 px-4 outline outline-slate-100 rounded-lg bg-slate-50 shadow-sm/8"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							<div className="md:col-span-2 space-y-2">
								<label className="block text-slate-600  text-sm font-medium">
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
							<Button type="submit" variant="primary">
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
