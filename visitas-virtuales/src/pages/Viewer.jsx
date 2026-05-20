import { useAuth } from '@/hooks/useAuth.js';
import { useCenterQuery } from '@/hooks/useCenterQuery.js';
import { UserCheck, ShieldCheck, GraduationCap, MapPin } from 'lucide-react';
import UnityViewer from '../components/UnityViewer';
import { useCenter } from '../hooks/useCenter';
import { useWindowSize } from '../hooks/useWindowSize.js';
import PageHeader from '../components/PageHeader.jsx';

//tooltip de informacion
function InfoIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	);
}

export default function Viewer() {
	const { user, isAdmin, isTeacher } = useAuth();
	const { selectedCenter } = useCenter();
	const windowSize = useWindowSize();

	// Si el context no contiene un centro, utilizar el query param "center" de la URL,
	// proporcionado por la página de selección de centro. Esto es un fallback y además
	// permite compartir URLs directas a centros específicos.
	useCenterQuery();

	return (
		<div
			className={`lg:p-8 mx-auto w-full py-6 lg:px-12 lg:py-12 md:px-10 px-3 flex flex-col gap-4! justify-center max-w-5xl! ${!user ? 'max-w-380' : ''}`}
		>
			<PageHeader
				title="Visita 360°"
				contextText={selectedCenter?.name}
				contextIcon={<MapPin className="w-4 h-4" />}
			/>

			<div className="lg:p-6 overflow-hidden bg-white border rounded-xl shadow-xl/6 border-slate-100">
				{windowSize.width >= 640 && (
					<>
						<div className="flex items-center gap-4 mb-4">
							{/* Icono dinámico según el rol */}
							<div
								className={`p-3 rounded-full transition-colors ${
									isAdmin
										? 'bg-navy-muted text-navy'
										: isTeacher
											? 'bg-amber-100 text-amber-600'
											: 'bg-gray-100 text-slate-400'
								}`}
							>
								{/* 1. Si es Admin, SOLO esto */}
								{isAdmin ? (
									<ShieldCheck size={32} />
								) : isTeacher ? (
									/* 2. Si no es Admin pero es Profe, SOLO esto */
									<GraduationCap size={32} />
								) : (
									/* 3. Si no es ninguno de los anteriores, SOLO esto */
									<UserCheck size={32} />
								)}
							</div>
							<div className="space-y-1">
								<h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-tight">
									¡Bienvenido{isAdmin || isTeacher ? ' de nuevo, ' : ' '}
									{user?.username || 'Invitado'}!
								</h1>

								<p className="flex items-center gap-2 text-gray-500 leading-relaxed">
									Has iniciado sesión como
									<span
										className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
											isAdmin
												? 'bg-navy-muted text-navy border-navy/20'
												: isTeacher
													? 'bg-amber-50 text-amber-700 border-amber-200'
													: 'bg-transparent text-zinc-400 border-zinc-200'
										}`}
									>
										{isAdmin
											? 'Administrador'
											: isTeacher
												? 'Profesor'
												: 'Invitado'}
									</span>
									{/* Icono de info con tooltip */}
									<span className="relative group">
										<span
											className={`cursor-default inline-flex items-center justify-center ${
												isAdmin
													? 'text-navy'
													: isTeacher
														? 'text-amber-600'
														: 'text-gray-400'
											}`}
										>
											<InfoIcon />
										</span>

										<span
											className={`absolute left-6 top-1/2 -translate-y-1/2 z-10 w-110 p-3 text-sm rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-white ${
												isAdmin
													? 'text-navy border-navy/20'
													: isTeacher
														? 'text-amber-900 border-amber-200'
														: 'text-gray-600 border-gray-200'
											}`}
										>
											{isAdmin
												? 'Tienes acceso total. Puedes gestionar puntos de interés (POIs), ver el historial de auditoría y configurar el sistema.'
												: isTeacher
													? 'Como profesor, puedes gestionar tus clases y ver la información de los puntos de interés.'
													: 'Puedes explorar el mapa y ver la información de los puntos de interés.'}
										</span>
									</span>
								</p>
							</div>
						</div>

						<hr className="my-4 border-gray-100" />
					</>
				)}

				{/* Solo montamos Unity cuando selectedCenter ya tiene valor */}
				{selectedCenter ? (
					<UnityViewer />
				) : (
					<div className="flex items-center justify-center h-40 text-gray-400 leading-relaxed">
						<p className="text-sm italic">Cargando centro...</p>
					</div>
				)}
			</div>
		</div>
	);
}
