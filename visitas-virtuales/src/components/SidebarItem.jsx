import { NavLink, useLocation } from 'react-router-dom';

export default function NavButton({ item, isExpanded, onClick }) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<NavLink
			to={item.path}
			onClick={onClick}
			className={({ isActive }) => {
				// If standard isActive is true, OR if we are in an extra path (like /crud)
				const active =
					isActive ||
					item.extraActivePaths?.some((p) => currentPath.startsWith(p));

				return `flex w-full items-center rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 
                    ${active ? 'bg-white text-navy shadow-md font-bold' : 'hover:bg-navy-dark text-navy-100 hover:text-white'}
                    ${isExpanded ? 'justify-start gap-4' : 'lg:justify-center'}`;
			}}
		>
			<div className="shrink-0 flex items-center justify-center">
				{item.icon}
			</div>
			<span
				className={`font-medium duration-300 whitespace-nowrap overflow-hidden transition-all
                ${isExpanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0'}`}
			>
				{item.name}
			</span>
		</NavLink>
	);
}
