export default function SettingsItemWrapper({ title, icon, children }) {
	return (
		<div>
			<div className="flex items-center gap-2 text-navy mb-4 ">
				{icon}
				<h2 className="font-bold uppercase tracking-wider text-sm">{title}</h2>
			</div>

			<div className="p-4 sm:p-6 outline outline-slate-100 rounded-lg bg-slate-50 shadow-sm/8">
				{children}
			</div>
		</div>
	);
}
