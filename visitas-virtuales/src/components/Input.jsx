import { Children, isValidElement } from 'react';

export default function Input({
	name,
	value,
	onChange,
	type = 'text',
	placeholder = '',
	className = '',
	children,
	...props
}) {
	const baseStyles =
		'relative group flex w-full flex-row items-center bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-200 focus-within:ring-4 focus-within:ring-navy/10 focus-within:border-navy';

	const childArray = Children.toArray(children);

	// Identify if a child should be at the start (icon) or end (toggle)
	const prefix = childArray.find(
		(child) =>
			child.props?.slot === 'prefix' ||
			(isValidElement(child) && child.type !== 'button'),
	);
	const suffix = childArray.find(
		(child) => child.props?.slot === 'suffix' || child.type === 'button',
	);

	return (
		<div className={`${baseStyles} ${className}`}>
			{prefix && (
				<div className="pl-3 flex items-center justify-center pointer-events-none text-slate-400">
					{prefix}
				</div>
			)}

			<input
				{...props}
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				className={`w-full p-2 bg-transparent focus:outline-none ${prefix ? 'pl-2' : 'pl-3'} ${suffix ? 'pr-2' : 'pr-3'}`}
			/>

			{suffix && (
				<div className="pr-3 flex items-center justify-center">{suffix}</div>
			)}
		</div>
	);
}
