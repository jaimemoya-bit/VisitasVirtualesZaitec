import Button from './Button';
import { MapPin } from 'lucide-react';

export default function CenterSelectButton({ centerName, onClick }) {
	return (
		<Button
			variant="outline"
			className="pl-2.5! rounded-lg! shadow-none! pr-3.75! pb-4.75! pt-5.25! h-11 hidden lg:flex gap-px leading-tight items-center justify-between"
			onClick={onClick}
		>
			<MapPin
				size={16}
				className="text-navy group-hover:scale-110 transition-transform"
				strokeWidth={2.25}
			/>
			<div className="flex flex-col items-center leading-none width-full">
				<span className="text-[10px] text-navy font-bold uppercase tracking-tight leading-tighter">
					Cambiar centro
				</span>
				<span className="text-sm font-semibold text-slate-700">
					{centerName}
				</span>
			</div>
		</Button>
	);
}
