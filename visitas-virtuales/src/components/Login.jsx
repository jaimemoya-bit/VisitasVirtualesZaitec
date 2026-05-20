import { useState } from 'react';
import '@/assets/Login.css';
import { useAuth } from '@/hooks/useAuth.js';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from './Input';
import {
	AlertCircle,
	ArrowLeft,
	Compass,
	Eye,
	LucideEyeOff,
} from 'lucide-react';
import Button from './Button';

export default function Login() {
	const [errors, setErrors] = useState([]);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState(
		localStorage.getItem('rememberedEmail') || '',
	);
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const origin = location.state?.from;

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (rememberMe && email) {
			localStorage.setItem('rememberedEmail', email);
		} else {
			localStorage.removeItem('rememberedEmail');
		}
		setIsLoading(true);
		setErrors([]);
		const formData = new FormData(event.currentTarget);
		const emailValue = formData.get('email')?.toString().trim() ?? '';
		const passwordValue = formData.get('password')?.toString() ?? '';
		const payload = JSON.stringify({
			email: emailValue,
			password: passwordValue,
		});

		try {
			// Autenticar usuario y obtener token de acceso
			const response = await fetch('/api/users/auth', {
				method: 'POST',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
				},
				body: payload,
			});

			let responseData = null;
			try {
				responseData = await response.json();
			} catch {
				responseData = {};
			}

			const { details, accessToken, message } = responseData;

			if (!response.ok) {
				//Antes solo añadía details al error, ahora también el mensaje general
				setIsLoading(false);
				if (details && Array.isArray(details) && details.length > 0) {
					const errorMessages = details.map((item) => {
						const text = item?.message || item?.msg || 'Error desconocido';
						return text.charAt(0).toUpperCase() + text.slice(1);
					});
					setErrors(errorMessages);
					return;
				}

				if (typeof message === 'string' && message.trim()) {
					setErrors([message.trim()]);
					return;
				}

				setErrors(['Error desconocido al iniciar sesión']);
				return;
			}

			if (!accessToken) {
				setIsLoading(false);
				setErrors(['No se recibió token de acceso']);
				return;
			}

			if (rememberMe) {
				localStorage.setItem('rememberedEmail', emailValue);
			} else {
				localStorage.removeItem('rememberedEmail');
			}

			setIsLoading(false);
			await login(accessToken);
			// Redirigir a la ruta de origen o a la selección de centros si no hay origen
			if (origin && origin !== '/login' && origin !== '/') {
				navigate(origin, { replace: true });
			} else {
				navigate('/centros', { replace: true });
			}
		} catch (error) {
			console.error('Error al iniciar sesión:', error);
			setIsLoading(false);
			setErrors(['Error de red al iniciar sesión']);
		}
	};

	return (
		<main className="main-content flex flex-col items-center justify-center min-h-screen p-4 space-y-6">
			<div className="space-y-1">
				<h2 className="text-2xl font-semibold tracking-tight leading-tight">
					Visitas Virtuales
				</h2>
				<h3 className="text-slate-500 leading-relaxed">
					Inicia sesión para continuar
				</h3>
			</div>
			<section className="login-section space-y-6 w-full! lg:max-w-md p-8 rounded-lg bg-slate-50 outline-slate-100 outline shadow-sm">
				<form onSubmit={handleSubmit} className="space-y-6">
					{errors && errors.length > 0 && (
						<div className="error-message flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded outline outline-red-200">
							<AlertCircle className="h-4 w-4 shrink-0" />
							{errors.length === 1 ? (
								<span>{errors[0]}</span>
							) : (
								<ul>
									{errors.map((err, idx) => (
										<li key={idx}>{err}</li>
									))}
								</ul>
							)}
						</div>
					)}
					<Input
						type="text"
						name="email"
						id="email"
						placeholder="Correo electrónico"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						autoComplete="username"
						disabled={isLoading}
						required
					/>
					<Input
						type={showPassword ? 'text' : 'password'}
						name="password"
						placeholder="Contraseña"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					>
						<button
							type="button"
							slot="suffix"
							onClick={() => setShowPassword(!showPassword)}
							className="bg-transparent! border-none p-1! flex items-center text-slate-400! hover:text-slate-600! focus:outline-none cursor-pointer"
						>
							{showPassword ? (
								<Eye className="h-5 w-5" />
							) : (
								<LucideEyeOff className="h-5 w-5" />
							)}
						</button>
					</Input>
					<div className="max-w-fit">
						<label className="remember-label">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(event) => setRememberMe(event.target.checked)}
								disabled={isLoading}
							/>
							<span>Recordar correo</span>
						</label>
					</div>
					<Button
						type="submit"
						disabled={isLoading}
						variant="primary"
						className="w-full"
					>
						{isLoading ? 'Cargando...' : 'Iniciar Sesión'}
					</Button>
				</form>
				<div className="flex items-center gap-4 mt-4 w-full">
					<Button
						variant="outline"
						size="normal"
						type="button"
						onClick={() => navigate('/')}
						className="w-full"
					>
						<ArrowLeft size={18} className="mr-1" />
						Volver a inicio
					</Button>
					<Button
						variant="outline"
						size="normal"
						type="button"
						onClick={() => navigate('/centros')}
						className="w-full"
					>
						<Compass size={18} className="mr-1" />
						Explorar centros
					</Button>
				</div>
			</section>
		</main>
	);
}
