import { useContext } from 'react';
import { CenterContext } from '../context/CenterContext';

export const useCenter = () => {
	const ctx = useContext(CenterContext);
	if (!ctx)
		throw new Error('useCenter debe ser usado dentro de un AuthProvider');
	return ctx;
};
