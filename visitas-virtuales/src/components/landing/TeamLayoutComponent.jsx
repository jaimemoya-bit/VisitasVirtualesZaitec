import { Link } from 'react-router-dom';

function TeamLayoutComponent({ gitUrl, avatarUrl, nameDev, roleDev }) {
	return (
		<Link to={gitUrl}>
			<div className="flex flex-col items-center">
				<div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-navy p-1">
					<img
						src={avatarUrl}
						className="rounded-full object-cover w-full h-full"
						alt="Dev"
					/>
				</div>
				<h3 className="font-bold text-md">{nameDev}</h3>
				<p className="text-navy text-sm">{roleDev}</p>
			</div>
		</Link>
	);
}

export default TeamLayoutComponent;
