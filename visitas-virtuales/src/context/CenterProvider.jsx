import { useEffect, useMemo, useRef } from 'react';
import { useState, useCallback } from 'react';
import {
	getLocalStorageAllCenters,
	setLocalStorageAllCenters,
	getLocalStorageSelectedCenter,
	setLocalStorageSelectedCenter,
	removeLocalStorageAllCenters,
	removeLocalStorageSelectedCenter,
} from '../helpers/centerLocalStorage.js';
import { CenterContext } from './CenterContext';
import { useAuth } from '../hooks/useAuth.js';

export const CenterProvider = ({ children }) => {
	// Carga inicial de centros desde localStorage al montar el proveedor, para evitar parpadeos y llamadas innecesarias
	const getInitialCenters = () => {
		let allCenters = [];
		let selectedCenter = null;
		try {
			allCenters = getLocalStorageAllCenters();
			selectedCenter = getLocalStorageSelectedCenter();
		} catch {
			removeLocalStorageAllCenters();
			removeLocalStorageSelectedCenter();
		}
		return {
			allCenters,
			isCentersLoading: false,
			centersError: null,
			selectedCenter,
		};
	};

	const [centerState, setCenterState] = useState(getInitialCenters);
	const CHECK_INTERVAL = 5 * 60 * 1000;
	const lastCheckRef = useRef(Date.now());
	const hasFetchedRef = useRef(false);

	const { logout } = useAuth();

	/* ============================ */
	/* ==== Gestión de centros ==== */
	/* ============================ */

	// Carga la lista de centros, renovando tokens si es necesario
	const fetchCenters = useCallback(async () => {
		setCenterState((prev) => ({
			...prev,
			isCentersLoading: true,
			centersError: null,
		}));
		try {
			const response = await fetch('/api/centers', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.ok) throw new Error('Error al cargar centros');

			const data = await response.json();
			lastCheckRef.current = Date.now();

			setCenterState((prev) => {
				const prevStr = JSON.stringify(prev.allCenters);
				const newStr = JSON.stringify(data.centers);
				if (prevStr !== newStr) {
					return { ...prev, allCenters: data.centers };
				}
				return { ...prev };
			});
			setLocalStorageAllCenters(data.centers);
		} catch {
			setCenterState((prev) => ({ ...prev, centersError: 'Error de red' }));
		} finally {
			setCenterState((prev) => ({ ...prev, isCentersLoading: false }));
		}
	}, [logout]);

	// Actualizar la imagen de un centro específico en estado local después de subirla
	const updateCenterImage = useCallback((centerId, imageUrl) => {
		const id = Number(centerId);
		setCenterState((prev) => {
			const updatedCenters = prev.allCenters.map((c) =>
				c.id === id ? { ...c, imageUrl } : c,
			);
			const updatedSelected =
				prev.selectedCenter?.id === id
					? { ...prev.selectedCenter, imageUrl }
					: prev.selectedCenter;
			setLocalStorageAllCenters(updatedCenters);
			setLocalStorageSelectedCenter(updatedSelected);
			return {
				...prev,
				allCenters: updatedCenters,
				selectedCenter: updatedSelected,
			};
		});
	}, []);

	const saveSelectedCenter = useCallback((center) => {
		setCenterState((prev) => ({ ...prev, selectedCenter: center }));
		setLocalStorageSelectedCenter(center);
	}, []);

	const saveAllCenters = useCallback((allCenters) => {
		setCenterState((prev) => ({ ...prev, allCenters }));
		setLocalStorageAllCenters(allCenters);
	}, []);

	// Cargar centros al montar el proveedor y cada 5 minutos
	useEffect(() => {
		if (!hasFetchedRef.current) {
			hasFetchedRef.current = true;
			const now = Date.now();
			if (now - lastCheckRef.current > CHECK_INTERVAL) {
				fetchCenters();
			}
		}
	}, [CHECK_INTERVAL, fetchCenters]);

	const value = useMemo(
		() => ({
			allCenters: centerState.allCenters || getLocalStorageAllCenters() || [],
			selectedCenter:
				centerState.selectedCenter || getLocalStorageSelectedCenter() || null,
			isCentersLoading: centerState.isCentersLoading,
			fetchCenters,
			centersError: centerState.centersError,
			saveAllCenters,
			saveSelectedCenter,
			updateCenterImage,
		}),
		[
			centerState,
			fetchCenters,
			saveAllCenters,
			saveSelectedCenter,
			updateCenterImage,
		],
	);

	return (
		<CenterContext.Provider value={value}>{children}</CenterContext.Provider>
	);
};
