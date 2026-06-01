import { useEffect, useRef, useState, useCallback } from 'react';
import { ESCENAS_POR_CENTRO } from '@/helpers/escenas.js';
import { useCenter } from '../hooks/useCenter';
import { useAuth } from '@/hooks/useAuth.js';
import { XCircle, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import fetchWithAuth from '@/helpers/fetchWithAuth.js';

const API_URL = import.meta.env.VITE_API_URL;

// TODO: cambiar a "true" cuando los archivos del build de Unity estén en el folder de Built_Unity
//Ver instrucciones en public/Build_Unity/.gitkeep
const UNITY_BUILD_LISTO = true;

export default function UnityViewer({ modoEdicion = false }) {
	const { selectedCenter } = useCenter();
	const { isAdmin, user, logout } = useAuth();
	const selectedCenterId = selectedCenter?.id ?? null;
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	const sceneId =
		selectedCenterId !== null
			? (ESCENAS_POR_CENTRO[selectedCenterId] ?? 0)
			: null;

	const canvasRef = useRef(null);
	const unityInstanceRef = useRef(null);
	const containerRef = useRef(null);

	// Refs para valores que Unity necesita pero que NO deben disparar una recarga del visor
	const modoEdicionRef = useRef(modoEdicion);
	const isAdminRef = useRef(isAdmin);
	const userRef = useRef(user);
	// Ref para el callback de POI, así Unity siempre llama a la versión más reciente
	// sin que el useEffect de carga se re-ejecute
	const onPoiCoordinatesReadyRef = useRef(null);

	const [loadingProgress, setLoadingProgress] = useState(0);
	const [isUnityLoaded, setIsUnityLoaded] = useState(false);

	// Mantener refs sincronizadas con props/contexto sin disparar recarga de Unity
	useEffect(() => { modoEdicionRef.current = modoEdicion; }, [modoEdicion]);
	useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
	useEffect(() => { userRef.current = user; }, [user]);

	// Alterna entre pantalla completa y modo normal
	const handleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen().catch((err) => {
				console.warn('Error al activar fullscreen:', err);
			});
		} else {
			document.exitFullscreen();
		}
	};


	const onPoiCoordinatesReady = useCallback((jsonString) => {
		try {
			const datos = JSON.parse(jsonString);
	        console.log('[UnityViewer] POI creado por Unity — id:', datos.poiId, '| tipo:', datos.tipo);

		// Unity ya creó el POI y recargó los POIs internamente.
	    // Solo mostramos la notificación con opción de ir a edición.
	         toast.success('POI añadido correctamente', {
	             description: 'Puedes editarlo cuando quieras.',
	             action: {
	                 label: 'Ir a edición',
	                 onClick: () => navigate('/crud', {
	                     state: {
	                        id: datos.poiId,
	                         centerId: selectedCenter?.name,
	                         tipo: datos.tipo,
	                         posX: datos.x,
	                         posY: datos.y,
	                         isEditing: true,
	                     },
	                 }),
	             },
	             duration: 6000,
	         });
	     } catch (error) {
	         console.error('[UnityViewer] Error procesando señal de Unity:', error);
	     }
	 }, [navigate, selectedCenter]);

	// Mantener la ref del callback actualizada para que Unity llame siempre a la última versión
		useEffect(() => {
		if (selectedCenterId === null) return;
		if (!UNITY_BUILD_LISTO) {
			console.log('Unity build no disponible aún');
			return;
		}

		window.OnPoiCoordinatesReady = (jsonString) => {
			onPoiCoordinatesReadyRef.current?.(jsonString);
		};

		// Definir handleClickOutside aquí arriba para que el return pueda accederla
		const handleClickOutside = (e) => {
			if (canvasRef.current && !canvasRef.current.contains(e.target)) {
				canvasRef.current.blur();
				document.activeElement?.blur();
			}
		};

		const script = document.createElement('script');
		script.src = '/Build_Unity/Build/Build_Unity.loader.js';

		script.onload = () => {
			createUnityInstance(
				canvasRef.current,
				{
					dataUrl: '/Build_Unity/Build/Build_Unity.data',
					frameworkUrl: '/Build_Unity/Build/Build_Unity.framework.js',
					codeUrl: '/Build_Unity/Build/Build_Unity.wasm',
				},
				(progress) => {
					setLoadingProgress(progress);
					console.log('Cargando Unity... ' + Math.round(progress * 100) + '%');
				},
			)
				.then((unityInstance) => {
					unityInstanceRef.current = unityInstance;
					setIsUnityLoaded(true);
					setErrorMessage('');

					// Registrar el listener aquí, la función está definida arriba
					document.addEventListener('mousedown', handleClickOutside);

					setTimeout(() => {
						unityInstance.SendMessage('WebBridge', 'RecibirIdCentro', selectedCenterId.toString());
						console.log('[UnityViewer] ID de centro enviado a Unity:', selectedCenterId);

						if (sceneId !== null) {
							unityInstance.SendMessage('WebBridge', 'RecibirIdEscena', sceneId.toString());
							console.log('[UnityViewer] ID de escena enviado a Unity:', sceneId);
						}

						if (modoEdicionRef.current && isAdminRef.current) {
							unityInstance.SendMessage('WebBridge', 'RecibirModoEdicion', 'true');
							unityInstance.SendMessage('WebBridge', 'RecibirUserId', userRef.current?.id?.toString() ?? '');
							console.log('[UnityViewer] Modo edición activo al cargar, usuario:', userRef.current?.id);
						}
					}, 1500);
				})
				.catch((error) => {
					setIsUnityLoaded(false);
					setErrorMessage('No se pudo cargar la vista 360°. Por favor, inténtalo de nuevo más tarde.');
					console.warn('[UnityViewer] Error al cargar Unity:', error);
				});
		};

		document.body.appendChild(script);

		// Un solo return con toda la limpieza
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			delete window.OnPoiCoordinatesReady;
			const instance = unityInstanceRef.current;
			unityInstanceRef.current = null;
			setIsUnityLoaded(false);
			setLoadingProgress(0);

			if (instance) {
				instance
					.Quit()
					.then(() => {
						if (document.body.contains(script)) document.body.removeChild(script);
					})
					.catch(() => {
						if (document.body.contains(script)) document.body.removeChild(script);
					});
			} else {
				if (document.body.contains(script)) document.body.removeChild(script);
			}
		};
	}, [sceneId, selectedCenterId, modoEdicion]); // modoEdicion aquí → Unity recarga al cambiar de modo

	return (
		<div className="flex flex-col w-full overflow-hidden rounded-lg bg-slate-100 h-160">
			<div ref={containerRef} className="relative flex-1 h-full">
				{/* Overlay de carga */}
				{!isUnityLoaded && !errorMessage && (
					<div className="absolute inset-0 z-20 flex flex-col items-center justify-center w-full bg-gray-900 rounded-lg">
						<p className="mb-3 text-sm text-white">
							Cargando visita virtual... {Math.round(loadingProgress * 100)}%
						</p>
						<div className="w-64 h-2 overflow-hidden bg-gray-700 rounded-full">
							<div
								className="h-full transition-all duration-300 bg-teal-400 rounded-full"
								style={{ width: `${loadingProgress * 100}%` }}
							/>
						</div>
					</div>
				)}

				{/* Overlay de error */}
				{errorMessage && (
					<div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center text-white bg-gray-900 rounded-lg">
						<XCircle size={40} className="mb-2 text-red-400" />
						<p className="text-sm italic">{errorMessage}</p>
					</div>
				)}

				<canvas
					ref={canvasRef}
					id="unity-canvas"
					className="w-full h-full"
					style={{ display: isUnityLoaded ? 'block' : 'none' }}
				/>

				{/* Badge modo edición — visible solo cuando el admin tiene el modo edición activo */}
				{isUnityLoaded && modoEdicion && (
					<div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-full shadow">
						<Pencil size={12} />
						Modo edición
					</div>
				)}

				{/* Botón de fullscreen — esquina inferior derecha */}
				{isUnityLoaded && (
					<button
						onClick={handleFullscreen}
						title="Pantalla completa"
						className="absolute z-10 p-2 text-white transition-colors duration-200 rounded-lg cursor-pointer bottom-3 right-3 bg-black/50 hover:bg-black/80"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
						</svg>
					</button>
				)}
			</div>
		</div>
	);
}
