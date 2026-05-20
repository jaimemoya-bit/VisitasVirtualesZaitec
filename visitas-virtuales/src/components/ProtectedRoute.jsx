import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import LoadingPage from './LoadingPage';

export const ProtectedRoute = ({ requiredRoles, children }) => {
	const { user, isAdmin, isTeacher, isInitialLoading } = useAuth();
	const location = useLocation();
	const requiresAdmin = requiredRoles?.includes('admin');
	const requiresTeacher = requiredRoles?.includes('teacher');

	if (!requiredRoles) return null;
	if (isInitialLoading) return <LoadingPage />;
	// Si no hay usuario, redirigir a login con la ruta de origen para volver después
	if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
	// Las rutas de admin solo pueden ser accedidas por admins
	if (requiresAdmin && !requiresTeacher && !isAdmin)
		return <Navigate to="/" replace />;
	// Las rutas de profesor pueden ser accedidas por profesores y admins
	if (requiresTeacher && !isTeacher && !isAdmin)
		return <Navigate to="/" replace />;

	return children;
};
