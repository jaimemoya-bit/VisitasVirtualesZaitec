import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Añadimos Navigate
import TopHeader from './components/TopHeader';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Crud from './components/Crud';
import Dashboard from './pages/Dashboard.jsx';
import CenterSelectionPage from './pages/CenterSelectionPage.jsx';
import ListPois from './pages/ListPois.jsx';
import NewHistorial from './pages/NewHistorial.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import Viewer from './pages/Viewer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import './assets/App.css';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage.jsx';
import Settings from './pages/Settings.jsx';
import { useCenter } from './hooks/useCenter.js';

function App() {
	const { user } = useAuth();
	const { selectedCenter } = useCenter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const location = useLocation();

	// Detectamos si es la Landing para limpiar el diseño
	const isLanding =
		location.pathname === '/' ||
		location.pathname === '/login' ||
		location.pathname === '/centros';

	return (
		<div className="w-full flex bg-white min-h-screen">
			{/* Sidebar: SOLO para usuarios logueados y fuera de la Landing */}
			{user && !isLanding && (
				<Sidebar
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
				/>
			)}

			<div className="flex-col flex w-full h-screen relative">
				{/* Header: Se oculta en Landing. Landing y CenterSelectionPage tienen su propio header */}
				{!isLanding && (
					<TopHeader
						onMenuClick={() => setIsMobileMenuOpen(true)}
						isLog={!!user}
						onLogout={() => {}}
						userName={user?.username}
						userEmail={user?.email}
						userImg={
							user?.imageUrl ||
							`https://api.dicebear.com/9.x/identicon/svg?seed=${user?.email}`
						}
						role={user?.role}
					/>
				)}

				<main
					className={`flex-1 ${isLanding ? '' : 'overflow-x-hidden absolute inset-0 pt-16'}`}
				>
					<Routes>
						{/* 1. LANDING: Punto de entrada total */}
						<Route path="/" element={<LandingPage />} />

						{/* 2. ACCESO ADMIN/PROFE */}
						<Route path="/login" element={<Login />} />

						{/* 3. SELECCIÓN DE CENTROS: Pública para el invitado */}
						<Route path="/centros" element={<CenterSelectionPage />} />

						{/* 4. VIEWER (ESCENA UNITY): 
                               Accesible si hay un centro seleccionado (sea invitado o admin) */}
						<Route
							path="/viewer"
							element={
								selectedCenter ? <Viewer /> : <Navigate to="/centros" replace />
							}
						/>

						{/* 5. RUTAS SOLO PARA ADMIN/PROFE */}
						<Route
							path="/listpois"
							element={
								selectedCenter ? (
									<ProtectedRoute requiredRoles={['admin', 'teacher']}>
										<ListPois centerId={selectedCenter.id} />
									</ProtectedRoute>
								) : (
									<Navigate to="/centros" replace />
								)
							}
						/>
						<Route
							path="/crud"
							element={
								selectedCenter ? (
									<ProtectedRoute requiredRoles={['admin', 'teacher']}>
										<Crud />
									</ProtectedRoute>
								) : (
									<Navigate to="/centros" replace />
								)
							}
						/>
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute requiredRoles={['admin']}>
									<Dashboard />
								</ProtectedRoute>
							}
						/>

						<Route
							path="/settings"
							element={
								<ProtectedRoute requiredRoles={['admin', 'teacher']}>
									<Settings />
								</ProtectedRoute>
							}
						/>

						<Route
							path="/historial"
							element={
								<ProtectedRoute requiredRoles={['admin']}>
									<NewHistorial />
								</ProtectedRoute>
							}
						/>

						{/* 6. REDIRECCIÓN FINAL: Si se pierde, vuelve a la Landing */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</main>
			</div>
			<Toaster
				richColors
				position="bottom-right"
				visibleToasts={6}
				offset={24}
				closeButton={true}
			/>
		</div>
	);
}
export default App;
