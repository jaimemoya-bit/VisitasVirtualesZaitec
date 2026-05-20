import { useState, useEffect } from 'react';
import fetchWithAuth from '../helpers/fetchWithAuth';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePoiHistory = () => {
	const [poiHistory, setPoiHistory] = useState([]);
	const [isPoiHistoryLoading, setIsPoiHistoryLoading] = useState(true);

	const { logout } = useAuth();

	useEffect(() => {
		const fetchPoiHistory = async () => {
			try {
				const response = await fetchWithAuth(
					'/api/audit/poi-history',
					{ method: 'GET' },
					logout,
				);
				if (!response.ok) {
					toast.error('Error al cargar el historial de POIs');
					return;
				}
				const data = await response.json();
				setPoiHistory(Array.isArray(data.history) ? data.history : []);
			} catch {
				console.error('Error al cargar el historial de POIs');
			} finally {
				setIsPoiHistoryLoading(false);
			}
		};
		fetchPoiHistory();
	}, [logout]);

	return { poiHistory, isPoiHistoryLoading };
};
