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

<<<<<<< HEAD
	// Recibe notificación desde Unity cuando un POI ya fue creado en la API.
	// Unity llama a window.OnPoiCoordinatesReady con un JSON: { x, y, idCentro, userId, poiId, tipo }
	// Unity ya hizo el POST — aquí solo mostramos feedback y recargamos.
	const onPoiCoordinatesReady = useCallback((jsonString) => {
=======
	// Recibe las coordenadas del nuevo POI desde Unity y lo crea en la API.
	// Unity llama a window.OnPoiCoordinatesReady con un JSON: { x, y, idCentro, userId, tipo }
	const onPoiCoordinatesReady = useCallback(async (jsonString) => {
>>>>>>> origin/Web_Zaitec_Fermin
		try {
			const datos = JSON.parse(jsonString);
			console.log('[UnityViewer] POI confirmado por Unity:', datos);

<<<<<<< HEAD
			unityInstanceRef.current?.SendMessage('JsonLoader', 'RecargarPois');
			toast.success('POI añadido correctamente', {
				description: datos.tipo === 'imagen'
					? 'Ahora añade las imágenes desde el editor.'
					: 'Puedes editarlo cuando quieras.',
				action: datos.poiId
					? {
							label: 'Ir a edición',
							onClick: () => navigate('/crud', {
								state: {
									id: datos.poiId,
									centerId: selectedCenter?.name,
									tipo: datos.tipo,
									imagenes: [],
									isEditing: true,
								},
							}),
					  }
					: undefined,
				duration: 6000,
			});
=======
			const details = datos.tipo === 'imagen'
				? { description: '', posX: datos.x, posY: datos.y, tipo: 'imagen', imagenes: [] }
				: { description: '', posX: datos.x, posY: datos.y, tipo: 'basico' };

			// Nombre único con timestamp para evitar colisión 409 UNIQUE(name, centerId)
			const poiName = `Nuevo POI ${Date.now()}`;

			const response = await fetchWithAuth(
				`${API_URL}api/v1/centers/${datos.idCentro}/pois`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: poiName,
						details,
						center_id: parseInt(datos.idCentro),
						user_id: parseInt(datos.userId),
					}),
				},
				logout,
			);

			if (response.ok) {
				const data = await response.json();
				console.log('[UnityViewer] POI creado correctamente desde Unity:', data.newPoi.id);

				// Recargar POIs en Unity para que el nuevo aparezca en el visor al instante
				if (unityInstanceRef.current) {
					unityInstanceRef.current.SendMessage('JsonManager', 'RecargarPois');
				} else {
					console.warn('[UnityViewer] No se pudo recargar POIs: la instancia de Unity no está disponible');
				}

				// Notificar al admin con opción de ir directamente al formulario de edición.
				// Pasamos posX/posY para que el PATCH los preserve al guardar.
				toast.success('POI añadido correctamente', {
					description: 'Puedes editarlo cuando quieras.',
					action: {
						label: 'Ir a edición',
						onClick: () => navigate('/crud', {
							state: {
								id: data.newPoi.id,
								centerId: selectedCenter?.name,
								name: data.newPoi.name,
								description: '',
								tipo: datos.tipo,
								imagenes: [],
								posX: datos.x,
								posY: datos.y,
								isEditing: true,
							},
						}),
					},
					duration: 6000,
				});
			} else {
				const errText = await response.text();
				console.warn('[UnityViewer] Error al crear POI:', response.status, errText);
				toast.error('Error al crear el POI', {
					description: response.status === 409
						? 'Ya existe un POI con ese nombre. Inténtalo de nuevo.'
						: 'Inténtalo de nuevo más tarde.',
				});
			}
>>>>>>> origin/Web_Zaitec_Fermin
		} catch (error) {
			console.error('[UnityViewer] Error procesando coords de Unity:', error);
			toast.error('Error inesperado al crear el POI');
		}
	}, [navigate, selectedCenter]);

	// Mantener la ref del callback actualizada para que Unity llame siempre a la última versión
	useEffect(() => {
		onPoiCoordinatesReadyRef.current = onPoiCoordinatesReady;
	}, [onPoiCoordinatesReady]);

	// ── Efecto de CARGA de Unity ──────────────────────────────────────────────
	// Solo depende de centro y escena. El modo edición NO está aquí para evitar
	// que cambiar el toggle de admin desmonte y recargue Unity completamente.
	useEffect(() => {
		if (selectedCenterId === null) return;
		if (!UNITY_BUILD_LISTO) {
			console.log('Unity build no disponible aún');
			return;
		}

		// Exponer el callback vía ref-wrapper: así Unity siempre llama a la versión
		// más reciente sin que el efecto de carga tenga que re-ejecutarse
		window.OnPoiCoordinatesReady = (jsonString) => {
			onPoiCoordinatesReadyRef.current?.(jsonString);
		};

		const script = document.createElement('script');
		script.src = '/Build_Unity/Build/Build_Unity.loader.js';

		script.onload = () => {
			// eslint-disable-next-line no-undef
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

					// Delay de 1.5s para que Unity termine de inicializar GameObjects
					setTimeout(() => {
						unityInstance.SendMessage('WebBridge', 'RecibirIdCentro', selectedCenterId.toString());
						console.log('[UnityViewer] ID de centro enviado a Unity:', selectedCenterId);

						if (sceneId !== null) {
							unityInstance.SendMessage('WebBridge', 'RecibirIdEscena', sceneId.toString());
							console.log('[UnityViewer] ID de escena enviado a Unity:', sceneId);
						}

						// Leer modo edición desde ref para no tener modoEdicion como dependencia
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

		return () => {
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
		<div className="w-full flex flex-col rounded-lg overflow-hidden bg-slate-100 h-160">
			<div ref={containerRef} className="relative flex-1 h-full">
				{/* Overlay de carga */}
				{!isUnityLoaded && !errorMessage && (
					<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 rounded-lg w-full">
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
					<div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-900 rounded-lg text-white p-4 text-center">
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
