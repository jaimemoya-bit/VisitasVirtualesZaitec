import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ESCENAS_POR_CENTRO } from '@/helpers/escenas.js';
import { useCenter } from './useCenter';

/** Hook encargado de sincronizar el centro seleccionado en el context con el query param "center" de la URL. */
export const useCenterQuery = () => {
	const { selectedCenter, allCenters, saveSelectedCenter } = useCenter();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		// Si no hay centro seleccionado en el context, intentar cargarlo desde el query param "center"
		if (!selectedCenter) {
			const centerIdFromUrl = searchParams.get('center');
			if (centerIdFromUrl) {
				const match = allCenters.find(
					(c) => c.id.toString() === centerIdFromUrl,
				);
				if (match) {
					saveSelectedCenter(match);
				} else {
					// Si el ID del centro en la URL no es válido, limpiar el query param y redirigir a selección de centro
					setSearchParams({});
					navigate('/centros');
				}
			} else {
				// Si no hay centro seleccionado ni en el context ni en la URL, redirigir a selección de centro
				navigate('/centros');
			}
		} else {
			//Busca en la tabla cual escena le corresponde al centro seleccionado.
			// Si no esta usa 0 como valor por defecto
			const sceneId = ESCENAS_POR_CENTRO[selectedCenter.id] ?? 0;

			//ir actualizando la URL con centro y la escena
			setSearchParams({ center: selectedCenter.id, scene: sceneId });
		}
	}, [
		selectedCenter,
		searchParams,
		allCenters,
		setSearchParams,
		navigate,
		saveSelectedCenter,
	]);
};
