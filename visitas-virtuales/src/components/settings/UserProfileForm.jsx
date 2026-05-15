import { Pencil, RotateCcw, Save, Trash } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useCenter } from '../../hooks/useCenter';

export default function UserProfileForm() {
	const { fetchProfile, user } = useAuth();
	const { allCenters } = useCenter();

	const userImageRef = useRef(null);
	const userFormInitialState = {
		username: user?.username || '',
		email: user?.email || '',
		centerPreferenceId: String(user.centerPreferenceId) || '',
		imageUrl: user?.imageUrl || '',
	};

	const [userFormState, setUserFormState] = useState(userFormInitialState);
	const defaultImageUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.email}`;
	const imageUrl = user?.imageUrl || defaultImageUrl;
	const [preview, setPreview] = useState(imageUrl);
	const hasImage = !!preview && !preview.startsWith('https://api.dicebear.com');

	const updateUserAction = async (formData) => {
		// Eliminar el campo de centro si no se ha seleccionado ninguno
		if (formData.get('centerPreferenceId') === '') {
			formData.delete('centerPreferenceId');
		}
		if (preview === defaultImageUrl) {
			formData.set('imageUrl', '');
			formData.delete('file');
		}

		try {
			const token = localStorage.getItem('accessToken');
			const response = await fetch('/api/me', {
				method: 'PATCH',
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				// Refrescar datos del perfil después de la actualización
				fetchProfile();
				toast.success('Perfil actualizado exitosamente');
			} else {
				const errorData = await response.text();
				console.error('Error del servidor al actualizar el perfil:', errorData);
				toast.error(
					'Error al actualizar el perfil. Por favor, inténtalo más tarde.',
				);
			}
		} catch (error) {
			console.error('Error de red al actualizar el perfil:', error);
			toast.error(
				'Error de red al actualizar el perfil. Por favor, inténtalo más tarde.',
			);
		}
	};

	const resetChanges = async () => {
		setUserFormState(userFormInitialState);
		setPreview(imageUrl);
		toast.info('Cambios descartados');
	};

	const handleUserImageChange = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile) {
			setPreview(URL.createObjectURL(selectedFile));
		}
	};

	const handleClearImage = () => {
		setPreview(defaultImageUrl);
	};

	return (
		<form
			action={updateUserAction}
			className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10"
		>
			<div className="md:col-span-1 flex flex-col justify-center items-center gap-4">
				<h3 className="text-sm text-slate-600 mb-2 font-medium self-start">
					Foto de perfil:
				</h3>
				<div className="relative">
					<figure className="w-32 h-32 rounded-full overflow-hidden mb-4">
						<img
							src={preview}
							alt="User Avatar"
							className="w-full h-full object-cover"
						/>
					</figure>
					<div
						className="absolute bottom-2 right-2 bg-navy p-2 rounded-full cursor-pointer hover:bg-navy-dark transition-colors"
						onClick={() => userImageRef.current.click()}
					>
						<Pencil className="w-4 h-4 text-white" />
					</div>
					{hasImage && (
						<div
							className="absolute bottom-2 left-2 bg-red-100 p-2 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
							onClick={handleClearImage}
						>
							<Trash className="w-4 h-4 text-red-600" />
						</div>
					)}
					<input
						name="file"
						type="file"
						onChange={handleUserImageChange}
						ref={userImageRef}
						className="hidden"
					/>
				</div>
			</div>
			<div className="md:col-span-2 flex flex-col">
				<div>
					<p className="text-sm text-slate-600 mb-2 font-medium">
						Nombre de usuario
					</p>
					<Input
						type="text"
						name="username"
						value={userFormState.username}
						onChange={(e) =>
							setUserFormState((prev) => ({
								...prev,
								username: e.target.value,
							}))
						}
						placeholder="Tu nombre de usuario"
						className="mb-4"
					/>
				</div>
				<div>
					<p className="text-sm text-slate-600 mb-2 font-medium">
						Correo electrónico
					</p>
					<Input
						type="email"
						name="email"
						value={userFormState.email}
						onChange={(e) =>
							setUserFormState((prev) => ({ ...prev, email: e.target.value }))
						}
						placeholder="Tu correo electrónico"
						className="mb-4"
					/>
				</div>
				<div>
					<p className="text-sm text-slate-600 mb-2 font-medium">
						Centro educativo predeterminado
					</p>
					<Select
						name="centerPreferenceId"
						options={allCenters}
						value={userFormState.centerPreferenceId}
						onChange={(e) =>
							setUserFormState((prev) => ({
								...prev,
								centerPreferenceId: e.target.value,
							}))
						}
					/>
				</div>
				<div className="flex flex-col sm:flex-row w-full sm:justify-end gap-2 mt-6">
					<Button type="button" variant="secondary" onClick={resetChanges}>
						<RotateCcw className="w-5 h-5" strokeWidth={2} />
						Descartar
					</Button>
					<Button type="submit" variant="primary">
						<Save className="w-5 h-5" strokeWidth={2} />
						Guardar cambios
					</Button>
				</div>
			</div>
		</form>
	);
}
