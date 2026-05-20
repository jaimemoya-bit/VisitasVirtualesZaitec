import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext.js';

// Hook para acceder al contexto de autenticación desde cualquier componente
export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
	return ctx;
};
