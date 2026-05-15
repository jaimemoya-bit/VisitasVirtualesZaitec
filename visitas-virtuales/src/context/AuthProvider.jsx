import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
	getLocalStorageAccessToken,
	setLocalStorageAccessToken,
	isTokenExpired,
	getLocalStorageUser,
	setLocalStorageUser,
	clearAuthLocalStorage,
} from '../helpers/authLocalStorage.js';
import { AuthContext } from '@/context/AuthContext.js';
import LoadingPage from '../components/LoadingPage.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchWithAuth } from '../helpers/fetchWithAuth.js';

/**
 * @typedef {Object} AuthContextType
 * @property {Object|null} user Perfil del usuario autenticado o null
 * @property {string} user.id ID del usuario
 * @property {string} user.email Email del usuario
 * @property {string} user.role Rol del usuario ('admin' | 'teacher')
 * @property {boolean} isAdmin True si el usuario es admin
 * @property {boolean} isTeacher True si el usuario es teacher
 * @property {Function} login Función para iniciar sesión (accessToken: string) => Promise<void>
 * @property {Function} logout Función para cerrar sesión () => Promise<void>
 * @property {Function} fetchProfile Función para cargar el perfil del usuario () => Promise<void>
 * @property {boolean} isProfileLoading True si el perfil del usuario se está cargando por primera vez
 */

/** Context provider de estado de usuario, autenticación y gestión de tokens
 * @param {JSX.Element} props.children Componentes hijos que consumirán el contexto
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
	// Estado para controlar carga inicial del perfil del usuario
	const [authState, setAuthState] = useState({
		user: getLocalStorageUser() || null,
		isUserLoading: false,
		accessToken: getLocalStorageAccessToken(),
	});

	const clearAuthState = useCallback(() => {
		setAuthState({
			user: null,
			isUserLoading: false,
			accessToken: null,
		});
	}, []);

	// Estados y constantes para controlar la animación de carga inicial
	const [isExiting, setIsExiting] = useState(false);
	const [showLoading, setShowLoading] = useState(true);
	const CHECK_INTERVAL = 5 * 60 * 1000;
	const MIN_LOADING_DURATION = 600;
	const isMountedRef = useRef(false);
	const isLoggingOut = useRef(false);

	const navigate = useNavigate();
	const location = useLocation();

	// Si hay rastro de usuario o token, consideramos que hay una sesión que vale la pena intentar cargar
	const hasStoredSession =
		Boolean(getLocalStorageAccessToken()) || Boolean(getLocalStorageUser());

	const isPublicPage =
		location.pathname === '/' ||
		location.pathname === '/login' ||
		location.pathname === '/centros' ||
		location.pathname === '/viewer';

	/* =========================================== */
	/* ==== Autenticación y gestión de tokens ==== */
	/* =========================================== */

	const refreshTokens = useCallback(async () => {
		try {
			const response = await fetch('/api/users/auth/refresh', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
			});
			if (!response.ok) throw new Error();
			const data = await response.json();
			setAuthState((prev) => ({ ...prev, accessToken: data.accessToken }));
			setLocalStorageAccessToken(data.accessToken);
			return data.accessToken;
		} catch {
			return null;
		}
	}, []);

	const getValidAccessToken = useCallback(
		async (silent = false) => {
			const token = getLocalStorageAccessToken();

			// Si no hay token, intentamos un refresh silencioso antes de rendirnos
			if (!token) {
				const refreshedToken = await refreshTokens();
				return refreshedToken; // Puede ser null
			}

			if (isTokenExpired(token)) {
				const newToken = await refreshTokens();
				if (!newToken) {
					if (!silent && !isLoggingOut.current) {
						toast.error('Tu sesión ha expirado.');
					}
					return null;
				}
				return newToken;
			}

			return token;
		},
		[refreshTokens],
	);

	/* ============================= */
	/* ==== Gestión de usuarios ==== */
	/* ============================= */

	/** Al hacer logout, se avisa al backend para invalidar tokens, se limpia el estado y localStorage y se redirige a landing */
	const logout = useCallback(async () => {
		if (isLoggingOut.current) return;
		isLoggingOut.current = true;

		const token = await getValidAccessToken(true);
		try {
			if (token) {
				await fetch('/api/users/auth/logout', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
				});
			}
		} catch (err) {
			console.error('Error al cerrar sesión:', err);
		} finally {
			clearAuthState();
			clearAuthLocalStorage();
			isLoggingOut.current = false;
			if (!isPublicPage) {
				navigate('/');
			}
		}
	}, [navigate, getValidAccessToken, clearAuthState, isPublicPage]);

	/** Carga el perfil del usuario autenticado; fetchWithAuth intenta refresh si falta el access token. */
	const fetchProfile = useCallback(async () => {
		if (isLoggingOut.current) return;
		try {
			// Intentamos cargar el perfil. fetchWithAuth ya maneja la lógica de refresco si el token falta/falla
			const res = await fetchWithAuth('/api/me', {}, logout);

			if ((res.status === 401 || res.status === 403) && !isLoggingOut.current) {
				toast.error('Sesión expirada', {
					description:
						'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
				});
				return;
			}

			if (!res.ok) {
				// Si la petición falla y no tenemos sesión guardada localmente, limpiamos
				if (!hasStoredSession) {
					clearAuthState();
					clearAuthLocalStorage();
				}
				throw new Error();
			}

			const data = await res.json();
			setAuthState((prev) => ({ ...prev, user: data.profile }));
			setLocalStorageUser(data.profile);
		} catch {
			if (!isLoggingOut.current && hasStoredSession) {
				toast.error('Error al cargar perfil');
			}
		}
	}, [logout, clearAuthState, hasStoredSession]);

	const loadProfileWithTransition = useCallback(async () => {
		setAuthState((prev) => ({ ...prev, isUserLoading: true }));
		setIsExiting(false);
		setShowLoading(true);

		const startTime = Date.now();

		try {
			await fetchProfile();
		} finally {
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);

			await new Promise((resolve) => setTimeout(resolve, remaining));

			setAuthState((prev) => ({ ...prev, isUserLoading: false }));
			setIsExiting(true);

			await new Promise((resolve) => setTimeout(resolve, 1000));
			setShowLoading(false);
		}
	}, [fetchProfile, MIN_LOADING_DURATION]);

	const loadProfileSilent = useCallback(async () => {
		await fetchProfile();
	}, [fetchProfile]);

	/** Al hacer login, se guarda el token en localStorage y en estado y se carga el perfil del usuario.
	 * @param {string} accessToken Token de acceso devuelto por el backend
	 */
	const login = useCallback(
		async (accessToken) => {
			setLocalStorageAccessToken(accessToken);
			setAuthState((prev) => ({ ...prev, accessToken }));
			await loadProfileWithTransition();
		},
		[loadProfileWithTransition],
	);

	// Cargar perfil al montar provider, con animación de carga inicial
	useEffect(() => {
		const initProfile = async () => {
			if (!hasStoredSession) {
				setAuthState((prev) => ({ ...prev, isUserLoading: false }));
				setIsExiting(true);
				setShowLoading(false);
				return;
			}

			if (!isMountedRef.current) {
				await loadProfileWithTransition();
				isMountedRef.current = true;
			} else {
				await loadProfileSilent();
			}
		};

		initProfile();

		const interval = hasStoredSession
			? setInterval(() => {
					loadProfileSilent();
				}, CHECK_INTERVAL)
			: null;

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [
		CHECK_INTERVAL,
		hasStoredSession,
		loadProfileSilent,
		loadProfileWithTransition,
	]);

	// Evitar re-renders innecesarios usando useMemo
	const value = useMemo(
		() => ({
			user: authState.user,
			isAdmin: authState.user?.role === 'admin',
			isTeacher: authState.user?.role === 'teacher',
			login,
			logout,
			fetchProfile,
			isInitialLoading: authState.isUserLoading,
		}),
		[login, logout, fetchProfile, authState.isUserLoading, authState.user],
	);

	return (
		<AuthContext.Provider value={value}>
			{showLoading && <LoadingPage isExiting={isExiting} />}
			<div
				className={`
          w-full min-h-screen
          transition-opacity duration-1000 ease-in-out
          ${isExiting ? 'opacity-100' : 'opacity-0'}
          ${authState.isUserLoading && !isExiting ? 'pointer-events-none' : ''}
        `}
			>
				{children}
			</div>
		</AuthContext.Provider>
	);
};
