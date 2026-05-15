import { ChevronDown } from 'lucide-react';

export default function Select({
	name,
	options = [],
	value,
	defaultValue = '',
	onChange,
}) {
	return (
		<div className="relative">
			<select
				name={name}
				className="appearance-none mb-4 group flex w-full flex-row gap-2 items-center bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-200 focus-within:ring-4 focus-within:ring-navy/10 focus-within:border-navy p-2.25"
				defaultValue={defaultValue}
				value={value}
				onChange={onChange}
			>
				{options.map((opt) => (
					<option key={opt.id} value={String(opt.id)}>
						{opt.name}
					</option>
				))}
			</select>
			<ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
		</div>
	);
}
