export default function PageHeader({ title, contextText, contextIcon }) {
	return (
		<div className="flex flex-col gap-1 w-full text-center lg:text-start">
			<p className="text-sm flex justify-center lg:justify-start items-center gap-1 font-base lg:font-medium text-navy leading-relaxed">
				{contextIcon}
				<span className="text-md">{contextText}</span>
			</p>
			<h2 className="text-xl lg:text-2xl font-semibold text-slate-700">
				{title}
			</h2>
		</div>
	);
}
