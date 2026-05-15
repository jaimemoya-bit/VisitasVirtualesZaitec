import { Link } from 'react-router-dom';
import tourImg from '../assets/tour360.jpg';
import proyectoImg from '../assets/proyecto360.jpg';
import informationImg from '../assets/information.jpg';
import accessImg from '../assets/access.jpg';
import Dav_logo from '../assets/Davante_logo_navy.png';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserDropdown from '../components/UserDropdown';
import Button from '@/components/Button.jsx';
import developers from '../assets/data/developers.json';
import TeamLayoutComponent from '../components/landing/TeamLayoutComponent';

const LandingPage = () => {
	const { isAdmin, isTeacher } = useAuth();
	const isStaff = isAdmin || isTeacher;
	const navigate = useNavigate();

	return (
		// Navbar
		<div className="flex flex-col">
			<nav
				className="sticky top-0 z-40 h-16 w-full flex items-center justify-between p-4 lg:py-4 lg:px-8 border-b border-transparent
                    bg-slate-50/80 backdrop-blur-xl
                    transition-all"
			>
				<Link to="/">
					<img src={Dav_logo} alt="Davante Logo" className="h-10" />
				</Link>
				<div className="flex flex-row gap-4">
					{isStaff ? (
						<UserDropdown />
					) : (
						<Button
							variant="primary"
							size="normal"
							type="button"
							onClick={() => navigate('/login')}
						>
							Iniciar sesión
						</Button>
					)}
				</div>
			</nav>

			{/* Header */}
			<header className="relative w-full h-150 text-center overflow-hidden ">
				<div
					className="absolute w-full h-150 bg-cover bg-center blur"
					style={{ backgroundImage: `url(${proyectoImg})` }}
				></div>
				<div className="relative flex flex-col items-center justify-center w-full h-full bg-black/40">
					<div className="flex flex-col gap-5 items-center md:w-200 p-5">
						<h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
							Bienvenido a Visitas Virtuales
						</h1>
						<p className="text-white text-lg font-medium leading-relaxed">
							Explora las instalaciones, aulas y espacios comunes de los mejores
							centros educativos a través de recorridos virtuales de alta
							definición.
						</p>
						<Button
							size="large"
							type="button"
							modifier="pill"
							onClick={() => navigate('/centros')}
						>
							Explorar centros
						</Button>
					</div>
				</div>
			</header>

			<section className="flex flex-col gap-16 pt-24 pb-16 px-8 max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row-reverse items-center gap-8">
					<div className="flex-1">
						<img
							src={tourImg}
							alt="Recorrido 360"
							className="w-full h-64 object-cover rounded-2xl shadow-xl"
						/>
					</div>
					<div className="flex-1 flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-slate-800">
							Recorridos 360 Realistas
						</h2>
						<p className="text-slate-600 leading-relaxed">
							Camina por pasillos, laboratorios y áreas deportivas como si
							estuvieras allí. Nuestra tecnología de alta definición captura
							cada detalle para una experiencia total inmersiva.
						</p>
					</div>
				</div>
				<div className="flex flex-col md:flex-row items-center gap-8">
					<div className="flex-1">
						<img
							src={informationImg}
							alt="Puntos de interés"
							className="w-full h-64 object-cover rounded-2xl shadow-xl"
						/>
					</div>
					<div className="flex-1 flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-slate-800">
							Puntos de Interés Interactivos
						</h2>
						<p className="text-slate-600 leading-relaxed">
							Haz clic en elementos clave durante tu visita para ver vídeos,
							mallas curriculares o fotos de proyectos destacados de cada aula.
						</p>
					</div>
				</div>
				<div className="flex flex-col md:flex-row-reverse items-center gap-8">
					<div className="flex-1">
						<img
							src={accessImg}
							alt="Sin horarios"
							className="w-full h-64 object-cover rounded-2xl shadow-xl"
						/>
					</div>
					<div className="flex-1 flex flex-col gap-4">
						<h2 className="text-2xl font-bold text-slate-800">Sin Horarios</h2>
						<p className="text-slate-600 leading-relaxed">
							Explora las instalaciones de nuestro centro en cualquier momento y
							desde cualquier dispositivo, ya sea tablet, móvil u ordenador. Sin
							importar dónde te encuentres ni el horario.
						</p>
					</div>
				</div>
			</section>

			<section className="flex justify-center w-full p-25 bg-gray-300/30 ">
				<div className="flex flex-col center gap-10 w-200 p-4 text-center">
					<h2 className="w-full text-center text-3xl font-bold text-gray-800 ">
						Equipo de desarrollo
					</h2>

					<div className="flex-wrap gap-10 grid grid-cols-5 justify-center">
						{developers.map((dev) => (
							<TeamLayoutComponent
								key={dev.id}
								gitUrl={dev.githubUrl}
								avatarUrl={dev.avatarUrl}
								nameDev={dev.name}
								roleDev={dev.role}
							/>
						))}
					</div>
				</div>
			</section>
		</div>
	);
};
export default LandingPage;
