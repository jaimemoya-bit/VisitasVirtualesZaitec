import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Image, Save, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.js';
import { ImageIcon } from 'lucide-react';
import { getLocalStorageAccessToken } from '../../helpers/authLocalStorage';
import Button from '../Button';
import Select from '../Select';
import { useCenter } from '../../hooks/useCenter';

export default function CenterImageForm() {
	const [file, setFile] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const { user } = useAuth();
	const { updateCenterImage, allCenters } = useCenter();
	const [selectedId, setSelectedId] = useState(user?.centerPreferenceId || '');
	const currentImage = allCenters.find((c) => c.id == selectedId)?.imageUrl;
	const [preview, setPreview] = useState(currentImage || null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		setPreview(currentImage || null);
	}, [selectedId, currentImage]);

	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile) {
			setFile(selectedFile);
			setPreview(URL.createObjectURL(selectedFile));
		}
	};

	const handleUpload = async () => {
		if (!file) return;
		setIsUploading(true);

		const formData = new FormData();
		formData.append('file', file);

		try {
			const token = getLocalStorageAccessToken();
			const response = await fetch(`/api/centers/${selectedId}/image`, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				const { imageUrl } = data.center;
				updateCenterImage(selectedId, imageUrl);
				setFile(null);
				alert('Imagen de centro actualizada exitosamente');
			} else {
				const errorData = await response.text();
				console.error('Error del servidor:', errorData);
				alert(
					`Error: ${response.status} - No se pudo actualizar la imagen del centro`,
				);
			}
		} catch (error) {
			console.error('Error al subir la imagen:', error);
			alert('Error al subir la imagen: ' + error.message);
		} finally {
			setIsUploading(false);
		}
	};

	const handleClearImage = () => {
		setFile(null);
		setPreview(currentImage || null);
	};

	return (
		<>
			<p className="text-sm text-slate-600 mb-2 font-medium leading-relaxed">
				Selección de centro
			</p>
			<Select
				options={allCenters}
				value={String(selectedId)}
				onChange={(e) => setSelectedId(e.target.value)}
				defaultValue={selectedId}
			/>
			<p className="text-sm text-slate-600 mb-2 font-medium leading-relaxed">
				Imagen del centro
			</p>
			<div className="space-y-4">
				<div className="h-40 w-full bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-200">
					{preview ? (
						<img
							src={preview}
							className="w-full h-full object-cover"
							alt="Preview"
						/>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-slate-400">
							<ImageIcon className="w-8 h-8 mb-2" />
							<span className="text-xs font-medium">Sin imagen actual</span>
						</div>
					)}
				</div>

				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					onChange={handleFileChange}
					accept="image/*"
				/>

				{(selectedId && (
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							onClick={() => fileInputRef.current.click()}
							variant="secondary"
							className="w-full sm:flex-1"
						>
							{file ? (
								<Image className="w-4 h-4" />
							) : (
								<Upload className="w-4 h-4" />
							)}
							{file ? 'Cambiar imagen' : 'Subir nueva imagen'}
						</Button>
						{(file && (
							<>
								<Button
									variant="danger"
									onClick={handleClearImage}
									className="w-full sm:flex-1"
								>
									<Trash2 className="w-4 h-4" /> Eliminar
								</Button>
								<Button
									onClick={handleUpload}
									variant="primary"
									className="w-full sm:flex-1"
									disabled={isUploading}
								>
									{isUploading ? (
										<LoaderCircle className="animate-spin w-4 h-4" />
									) : (
										<Save className="w-4 h-4" />
									)}
									{isUploading ? 'Subiendo...' : 'Guardar'}
								</Button>
							</>
						)) ||
							null}
					</div>
				)) ||
					null}
			</div>
		</>
	);
}
