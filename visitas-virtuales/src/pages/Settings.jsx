import { useAuth } from '@/hooks/useAuth';
import CenterImageForm from '@/components/settings/CenterImageForm.jsx';
import { LayoutGrid, User } from 'lucide-react';
import UserProfileForm from '../components/settings/UserProfileForm';
import SettingsItemWrapper from '../components/settings/SettingsItemWrapper.jsx';

export default function Settings() {
	const { isAdmin } = useAuth();

	return (
		<div className="max-w-3xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
			<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
				<div className="bg-navy p-8 text-white">
					<h1 className="text-2xl font-semibold tracking-tight leading-tight">
						Configuración
					</h1>
				</div>
				<div className="flex flex-col divide-y divide-slate-200">
					<div className="px-4 py-6 space-y-8">
						<SettingsItemWrapper
							title="Perfil de Usuario"
							icon={<User className="w-5 h-5" strokeWidth={2.5} />}
						>
							<UserProfileForm />
						</SettingsItemWrapper>
						{isAdmin && (
							<SettingsItemWrapper
								title="Gestión de centros"
								icon={<LayoutGrid className="w-5 h-5" strokeWidth={2.5} />}
							>
								<CenterImageForm />
							</SettingsItemWrapper>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
