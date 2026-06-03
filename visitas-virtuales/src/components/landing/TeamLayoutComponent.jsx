import { TbBrandLinkedin, TbBrandGithub } from 'react-icons/tb';

function TeamLayoutComponent({
	gitUrl,
	linkedinUrl,
	avatarUrl,
	nameDev,
	roleDev,
}) {
	return (
		<div className="flex flex-col items-center justify-between gap-1 min-h-20">
			<div className="w-22 h-22 rounded-full bg-slate-200 overflow-hidden border-2 border-navy p-0.75">
				<img
					src={avatarUrl}
					className="rounded-full object-cover w-full h-full"
					alt={nameDev}
				/>
			</div>
			<div className="flex flex-col items-center gap-1">
				<h3 className="font-bold text-md text-slate-800">{nameDev}</h3>
				<p className="text-navy text-sm font-base max-w-26 text-center">
					{roleDev}
				</p>
			</div>
			<div className="flex gap-4 p-1">
				{linkedinUrl && (
					<a
						href={linkedinUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`${nameDev} on LinkedIn`}
						className="p-1 text-slate-500 hover:text-[#0A66C2] transition-colors cursor-pointer"
					>
						<TbBrandLinkedin size={20} />
					</a>
				)}
				{gitUrl && (
					<a
						href={gitUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`${nameDev} on GitHub`}
						className="p-1 text-slate-500 hover:text-[#181717] transition-colors cursor-pointer"
					>
						<TbBrandGithub size={20} />
					</a>
				)}
			</div>
		</div>
	);
}

export default TeamLayoutComponent;
