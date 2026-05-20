import DropdownItem from './DropdownItem.jsx';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import ClickOutsideWrapper from './ClickOutsideWrapper.jsx';

export default function UserDropdown() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	if (!user) return null;
	const { email, role, imageUrl, username } = user;

	const handleLogoutClick = () => {
		logout();
		setIsOpen(false);
		navigate('/');
	};

	const handleMenuItemClick = (path) => {
		setIsOpen(false);
		navigate(path);
	};

	return (
		<ClickOutsideWrapper onClickOutside={() => setIsOpen(false)}>
			<div className="relative flex items-center gap-6">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="group flex items-center gap-4 focus:outline-none cursor-pointer"
				>
					<div className="flex flex-col items-end leading-tight">
						<h2 className="text-sm font-bold text-slate-700">{username}</h2>
						<span
							className={`px-1.75 py-0.75 rounded text-[11px] font-semibold ${
								role === 'admin'
									? 'bg-navy-muted text-navy'
									: role === 'teacher'
										? 'bg-amber-50 text-amber-700'
										: 'bg-transparent text-zinc-400 border-zinc-200'
							}`}
						>
							{' '}
							{role === 'admin'
								? 'Administrador'
								: role === 'teacher'
									? 'Profesor'
									: 'Invitado'}
						</span>
					</div>
					<div className="flex justify-center items-center gap-2">
						<div className="relative">
							<img
								src={
									imageUrl ||
									`https://api.dicebear.com/9.x/identicon/svg?seed=${email}`
								}
								alt="Imagen de perfil"
								className="w-10 h-10 rounded-full object-cover border-2 border-slate-50 group-hover:border-navy-200 transition-all"
							/>
							<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
						</div>
						<ChevronDown
							className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
						/>
					</div>
				</button>

				{/* Dropdown Menu */}
				{isOpen && (
					<div className="absolute outline py-px outline-slate-100 right-0 divide-y divide-slate-200 gap-3 top-full mt-2 w-56 bg-white rounded-xl shadow-lg/8 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="bg-slate-50/50 py-3.25 px-4">
							<p className="text-xs text-slate-500 font-medium">Conectado</p>
							<p className="text-sm font-bold text-slate-700 truncate">
								{email}
							</p>
						</div>
						{role === 'admin' || role === 'teacher' ? (
							<DropdownItem onClick={() => handleMenuItemClick('/settings')}>
								<Settings size={16} strokeWidth={2.25} />
								Configuración
							</DropdownItem>
						) : null}
						<DropdownItem
							onClick={handleLogoutClick}
							className="hover:bg-red-50! text-red-500!"
						>
							<LogOut size={16} strokeWidth={2.25} />
							Cerrar sesión
						</DropdownItem>
					</div>
				)}
			</div>
		</ClickOutsideWrapper>
	);
}
