import { useState, useEffect } from 'react';

const Historial = () => {
	const [commits, setCommits] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCommits = async () => {
			try {
				const response = await fetch(
					'https://api.github.com/repos/jaimemoya-bit/VisitasVirtualesZaitec/commits?sha=Web_Zaitec',
				);
				const data = await response.json();
				setCommits(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error('Error al cargar el historial:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchCommits();
	}, []);

	if (loading)
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
					<p className="italic text-gray-500 leading-relaxed">
						Obteniendo los últimos cambios...
					</p>
				</div>
			</div>
		);

	return (
		<div className="p-6 h-full overflow-y-auto bg-slate-50">
			<div className="flex flex-col mb-10 space-y-2 border-b border-slate-200 pb-6">
				<h1 className="text-3xl font-bold text-gray-800 tracking-tight leading-tight">
					Historial de Auditoría
				</h1>
				<div className="flex items-center gap-2">
					<p className="text-gray-500 italic leading-relaxed">
						Últimos cambios en el repositorio
					</p>
					<span className="bg-navy-100 text-navy text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
						Live
					</span>
				</div>
			</div>

			<div className="relative border-l-2 border-navy-200 ml-4 md:ml-6">
				{commits.map((item) => (
					<div key={item.sha} className="mb-10 ml-6 group">
						{/* Punto de la línea de tiempo con efecto hover */}
						<span className="absolute flex items-center justify-center w-4 h-4 bg-white border-2 border-navy rounded-full -left-2.25 group-hover:bg-navy transition-colors shadow-sm cursor-pointer"></span>

						<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
							<div className="flex flex-wrap justify-between items-center mb-3">
								<div className="flex items-center gap-2">
									<span className="text-xs font-bold text-navy bg-navy-50 px-2 py-1 rounded">
										{new Date(item.commit.author.date).toLocaleDateString()}
									</span>
									<span className="text-xs text-slate-400 font-medium">
										{new Date(item.commit.author.date).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
								</div>
								<span className="text-[10px] text-slate-300 font-mono">
									ID: {item.sha.substring(0, 7)}
								</span>
							</div>

							<h3 className="text-lg font-semibold text-slate-700 mb-4 leading-tight">
								{item.commit.message}
							</h3>

							<div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
								<div className="flex items-center gap-2">
									<img
										src={
											item.author?.avatar_url ||
											'https://github.com/identicons/j.png'
										}
										className="w-7 h-7 rounded-full border border-slate-200"
										alt="avatar"
									/>
									<span className="text-sm text-slate-700 font-semibold">
										{item.commit.author.name}
									</span>
								</div>

								<a
									href={item.html_url}
									target="_blank"
									rel="noreferrer"
									className="text-xs font-bold text-navy hover:text-navy-100 flex items-center gap-1"
								>
									DETALLES
									<svg
										className="w-3 h-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M14 5l7 7m0 0l-7 7m7-7H3"
										/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Footer de la lista */}
			<div className="text-center py-6">
				<p className="text-sm text-slate-400 italic leading-relaxed">
					Ultimos cambios del repositorio.
				</p>
			</div>
		</div>
	);
};

export default Historial;
