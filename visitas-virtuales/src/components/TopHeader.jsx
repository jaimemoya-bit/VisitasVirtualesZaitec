import '../assets/App.css';

import { Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import Button from './Button.jsx';
import CenterSelectButton from './CenterSelectButton.jsx';
import { useCenter } from '../hooks/useCenter.js';
import UserDropdown from './UserDropdown.jsx';
import Dav_logo from '../assets/Davante_logo_navy.png';

/* TopHeader: Barra superior de la app.
 * Logueado: Muestra nombre, rol, imagen y dropdown con opciones (configuración, logout).
 * Invitado: Muestra botón para iniciar sesión.
 * Si hay un centro seleccionado, muestra botón para cambiar de centro.*/
export default function TopHeader({ onMenuClick }) {
	const navigate = useNavigate();
	const { isAdmin, isTeacher } = useAuth();
	const isStaff = isAdmin || isTeacher;
	const { selectedCenter } = useCenter();
	return (
		<header
			className="sticky top-0 z-40 h-16 w-full flex items-center justify-between p-4 lg:py-4 lg:px-8  lg:justify-end bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60
                    shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] 
                    transition-all"
		>
			{isStaff ? (
				<Button
					variant="ghost"
					size="normal"
					className="lg:hidden"
					onClick={onMenuClick}
				>
					<Menu size={22} />
				</Button>
			) : null}
			{!isStaff ? (
				<Link to="/">
					<h1 className=" lg:flex gap-2 text-lg font-semibold text-slate-700 justify-center items-center uppercase tracking-tight leading-tight">
						<img src={Dav_logo} alt="Davante Logo" className="h-10" />
					</h1>
				</Link>
			) : null}
			<div
				className={`flex items-center ml-auto ${isStaff ? 'gap-6' : 'gap-4'}`}
			>
				{/* --- BOTÓN CAMBIAR CENTRO --- */}
				{selectedCenter && (
					<CenterSelectButton
						centerName={selectedCenter.name}
						onClick={() => navigate('/centros')}
					/>
				)}
				{/* --- DROPDOWN USUARIO / BOTÓN LOGIN --- */}
				{isStaff ? (
					<UserDropdown />
				) : (
					<div className="flex items-center gap-2">
						<Link to="/login">
							<Button variant="primary" size="normal" type="button">
								Iniciar sesión
							</Button>
						</Link>
					</div>
				)}
			</div>
		</header>
	);
}
