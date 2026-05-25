import { useEffect, useRef, useState, useCallback } from 'react';
import { ESCENAS_POR_CENTRO } from '@/helpers/escenas.js';
import { useCenter } from '../hooks/useCenter';
import { useAuth } from '@/hooks/useAuth.js';
import { XCircle, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

// TODO: cambiar a "true" cuando los archivos del build de Unity estén en el folder de Built_Unity
//Ver instrucciones en public/Build_Unity/.gitkeep
const UNITY_BUILD_LISTO = true;

export default function UnityViewer({ modoEdicion = false }) {
	// Obtenemos el centro seleccionado del contexto global
	const { selectedCenter } = useCenter();
	const { isAdmin, user } = useAuth();
	const selectedCenterId = selectedCenter?.id ?? null;
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	// Calculamos sceneId directamente desde selectedCenter, sin depender de la URL
	// Así evitamos problemas de timing cuando la URL todavía no fue actualizada
	const sceneId =
		selectedCenterId !== null
			? (ESCENAS_POR_CENTRO[selectedCenterId] ?? 0)
			: null;

	// Referencia directa al canvas del DOM
	// Es como un "puntero" para que Unity sepa dónde pintarse
	const canvasRef = useRef(null);
	const unityInstanceRef = useRef(null);
	const containerRef = useRef(null);

	const [loadingProgress, setLoadingProgress] = useState(0);
	const [isUnityLoaded, setIsUnityLoaded] = useState(false);

	// Alterna entre pantalla completa y modo normal
	// Si no estamos en fullscreen lo activa, si ya estamos lo desactiva
	const handleFullscreen = () => {
		if (!document.fullscreenElement) {
			// Si no estamos en fullscreen, activarlo
			containerRef.current?.requestFullscreen().catch((err) => {
				console.warn('Error al activar fullscreen:', err);
			});
		} else {
			// Si estamos en fullscreen, salir
			document.exitFullscreen();
		}
	};

	// Recibe notificación desde Unity cuando un POI ya fue creado en la API.
	// Unity llama a window.OnPoiCoordinatesReady con un JSON: { x, y, idCentro, userId, poiId, tipo }
	// Unity ya hizo el POST — aquí solo mostramos feedback y recargamos.
	const onPoiCoordinatesReady = useCallback((jsonString) => {
		try {
			const datos = JSON.parse(jsonString);
			console.log('[UnityViewer] POI confirmado por Unity:', datos);

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
		} catch (error) {
			console.error('[UnityViewer] Error procesando coords de Unity:', error);
		}
	}, [navigate, selectedCenter]);

	// Se ejecuta una sola vez cuando el componente aparece en pantalla
	useEffect(() => {
		if (selectedCenterId === null) return;

		// Si el build no está listo todavía no se hace nada
		if (!UNITY_BUILD_LISTO) {
			console.log('Unity build no disponible aún');
			return;
		}

		// Exponer la función JS que Unity llama cuando el admin confirma la posición de un POI
		// Debe estar en window para que el DllImport de WebBridge.cs la encuentre
		window.OnPoiCoordinatesReady = onPoiCoordinatesReady;

		// Crear el script del loader de Unity dinámicamente
		const script = document.createElement('script');
		script.src = '/Build_Unity/Build/Build_Unity.loader.js';

		// Cuando el script termina de cargar, arrancamos Unity
		script.onload = () => {
			// createUnityInstance: función global que viene del loader.
			// Recibe: el canvas, los paths a los archivos del build, y un callback de progreso
			// eslint-disable-next-line no-undef
			createUnityInstance(
				canvasRef.current,
				{
					dataUrl: '/Build_Unity/Build/Build_Unity.data',
					frameworkUrl: '/Build_Unity/Build/Build_Unity.framework.js',
					codeUrl: '/Build_Unity/Build/Build_Unity.wasm',
				},
				(progress) => {
					setLoadingProgress(progress); // Actualizamos el estado con el valor 0-1
					console.log('Cargando Unity... ' + Math.round(progress * 100) + '%');
				},
			)
				//Cuando Unity termino de cargar correctamente
				.then((unityInstance) => {
					unityInstanceRef.current = unityInstance;
					setIsUnityLoaded(true);
					setErrorMessage('');

					//Delay de 1.5seg para que encuente el gameobject antes
					setTimeout(() => {
						// EL PUENTE: enviamos el ID del centro a Unity
						unityInstance.SendMessage(
							'WebBridge',
							'RecibirIdCentro',
							selectedCenterId.toString(),
						);

						console.log('ID enviado a Unity:', selectedCenterId);

						if (sceneId !== null) {
							unityInstance.SendMessage(
								'WebBridge',
								'RecibirIdEscena',
								sceneId.toString(),
							);
							console.log('ID de escena enviado a Unity:', sceneId);
						} else {
							console.log(
								'No se especificó escena en la URL, Unity usará la escena por defecto',
							);
						}

						// Si el admin activó el modo edición, enviamos el flag y su userId a Unity
						// WebBridge los recibe y activa el Canvas_Admin en la escena correspondiente
						if (modoEdicion && isAdmin) {
							unityInstance.SendMessage('WebBridge', 'RecibirModoEdicion', 'true');
							unityInstance.SendMessage('WebBridge', 'RecibirUserId', user?.id?.toString() ?? '');
							console.log('[UnityViewer] Modo edición activado para usuario:', user?.id);
						}
					}, 1500); // 1.5 seg de espera
				})

				// Si Unity falla al cargar
				.catch((error) => {
					setIsUnityLoaded(false);
					setErrorMessage(
						'No se pudo cargar la vista 360°. Por favor, inténtalo de nuevo más tarde.',
					);
					console.warn('Error al cargar Unity:', error);
				});
		};

		// Agregar el script al documento para que empiece a descargarse
		document.body.appendChild(script);

		// Limpieza cuando el usuario salga de esta página, y que no quede unity en segundo plano
		return () => {
			// Limpiar la función global al desmontar el componente
			delete window.OnPoiCoordinatesReady;

			if (unityInstanceRef.current) {
				unityInstanceRef.current
					.Quit()
					.then(() => {
						if (document.body.contains(script)) {
							document.body.removeChild(script);
						}
					})
					.catch(() => {
						if (document.body.contains(script)) {
							document.body.removeChild(script);
						}
					});
			} else {
				if (document.body.contains(script)) {
					document.body.removeChild(script);
				}
			}
		};
	}, [sceneId, selectedCenterId, modoEdicion, onPoiCoordinatesReady]);

	// Lo que se muestra en pantalla
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
					<div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-full shadow">
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