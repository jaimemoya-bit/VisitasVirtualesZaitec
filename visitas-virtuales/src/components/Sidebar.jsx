import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.js';
import {
	Home,
	Menu,
	LayoutDashboard,
	Building2,
	MapPin,
	ClipboardCheck,
	X,
	Compass,
} from 'lucide-react';
import logo1 from '@/assets/logo1.svg';
import SidebarItem from './SidebarItem';
import { useWindowSize } from '@/hooks/useWindowSize.js';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const { isAdmin, isTeacher } = useAuth();
	const windowSize = useWindowSize();

	// Definimos todos los items y marcamos cuáles son solo para Admin
	const allMenuItems = [
		{
			id: 'landing',
			name: 'Inicio',
			icon: <Home size={22} strokeWidth={1.6} />,
			path: '/',
			adminOnly: false,
		},
		{
			id: 'viewer',
			name: 'Visita 360°',
			icon: <Compass size={22} strokeWidth={1.6} />,
			path: '/viewer',
			adminOnly: false,
		},
		isAdmin || isTeacher
			? {
					id: 'gestion-pois',
					name: 'Gestión de POIs',
					icon: <MapPin size={22} strokeWidth={1.6} />,
					path: 'listpois',
					extraActivePaths: ['/crud'], // Para marcar activo también en /crud
					adminOnly: false,
				}
			: null,
		// Items solo para ADMIN
		{
			id: 'dashboard',
			name: 'Dashboard',
			icon: <LayoutDashboard size={22} strokeWidth={1.6} />,
			path: '/dashboard',
			adminOnly: true,
		},
		{
			id: 'auditoria',
			name: 'Auditoría',
			icon: <ClipboardCheck size={22} strokeWidth={1.6} />,
			path: '/historial',
			adminOnly: true,
		},
	];

	// Mostrar botón "Selección de Centro" solo en móvil o tablet
	windowSize.width < 1024
		? allMenuItems.splice(2, 0, {
				id: 'seleccion-centro',
				name: 'Selección de Centro',
				icon: <Building2 size={22} strokeWidth={1.6} />,
				path: '/centros',
			})
		: null;

	// Filtramos la lista: si no es admin, quitamos los que tengan adminOnly: true
	const menuItems = allMenuItems.filter(
		(item) => item && (!item.adminOnly || isAdmin),
	);

	return (
		<>
			{/* OVERLAY: Capa oscura móvil */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}

			{/* SIDEBAR PRINCIPAL */}
			<aside
				className={`fixed inset-y-0 ${isExpanded ? 'min-w-[256px]' : ''} left-0 z-50 flex h-screen flex-col bg-navy text-white shadow-lg transition-all duration-300 lg:relative
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isExpanded ? 'w-64' : 'lg:w-20'}`}
			>
				{/* Cabecera */}
				<div className="flex flex-col items-center gap-2 border-b border-white/20 p-6 relative">
					<button
						className="absolute top-4 right-4 lg:hidden p-1 hover:bg-navy-dark rounded"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						<X size={20} />
					</button>
					<img
						src={logo1}
						alt="Icono"
						className="h-12 w-12 object-contain rounded-lg cursor-pointer"
					/>
					<span
						className={`font-bold text-xl tracking-widest whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : ' lg:opacity-0 lg:invisible'}`}
					>
						DAVANTE
					</span>
				</div>

				{/* Lista de Navegación filtrada */}
				<nav className="flex-1 px-4 py-6 space-y-3">
					{menuItems.map((item) => (
						<SidebarItem
							key={item.id}
							item={item}
							isExpanded={isExpanded}
							onClick={() => {
								if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
							}}
						/>
					))}
				</nav>
				{/* Pie: Botón colapsar */}
				<div className="hidden lg:block border-t border-white/20 p-4">
					<div className="flex items-center justify-center">
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="hover:bg-navy-dark p-2 rounded-full cursor-pointer transition-colors"
							title="Expandir/Contraer"
						>
							<Menu size={24} strokeWidth={1.6} />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
};

export default Sidebar;
