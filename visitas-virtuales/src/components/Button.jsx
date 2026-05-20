import { Children, isValidElement } from 'react';

const Button = ({
	onClick,
	disabled = false,
	type = 'submit',
	variant = 'primary',
	modifier = '',
	size = 'normal',
	children,
	className = '',
}) => {
	const baseStyles = `group ${modifier === 'pill' ? '' : 'rounded-md'} transition-all min-w-fit flex items-center disabled:opacity-50 justify-center whitespace-nowrap disabled:cursor-not-allowed cursor-pointer shadow-sm duration-200 active:scale-95 select-none shadow-sm`;
	const variants = {
		primary: 'bg-navy text-white hover:bg-navy-dark',
		secondary: 'bg-slate-500 text-white hover:bg-slate-600',
		tertiary: 'bg-slate-100 text-slate-700 rounded-lg! hover:bg-slate-200',
		danger: 'bg-red-100 text-red-600 hover:bg-red-200',
		outline:
			'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50',
		'outline-hero':
			'bg-transparent border border-white text-white hover:bg-white/10',
		ghost: 'bg-transparent text-slate-700 hover:bg-slate-50 shadow-none!',
	};

	const modifiers = {
		pill: 'rounded-full',
		fullWidth: 'w-full',
	};
	const modifierClass = modifiers[modifier] || '';

	const childrenArray = Children.toArray(children);

	const iconIdx = childrenArray.findIndex(
		(child) =>
			isValidElement(child) &&
			(typeof child.type === 'function' ||
				typeof child.type === 'object' ||
				child.type === 'svg'),
	);

	const hasIcon = iconIdx !== -1;
	const iconOnly = hasIcon && childrenArray.length === 1;

	const sizes = {
		small: `text-sm h-9 ${iconOnly ? 'w-9 p-0' : 'px-3'} font-medium ${hasIcon ? 'pl-2.5 pr-3.25' : ''}`,
		normal: `text-sm sm:text-base h-10 ${iconOnly ? 'w-10 p-0' : 'px-4'} py-2 font-medium ${hasIcon ? 'pl-3.5 pr-4.25' : ''}`,
		large: `text-lg h-11 ${iconOnly ? 'w-11 p-0' : 'px-8'} py-2.25 font-medium ${hasIcon ? 'pl-7.5 pr-8.25' : ''}`,
	};

	const renderChildren = () => {
		if (iconOnly) return childrenArray[iconIdx];

		return childrenArray.map((child, idx) => {
			if (idx === iconIdx && isValidElement(child)) {
				const isStart = idx === 0;
				const marginClass = isStart
					? size === 'small'
						? 'mr-1.5'
						: 'mr-2'
					: size === 'small'
						? 'ml-1.5'
						: 'ml-2';

				return (
					<span
						key={idx}
						className={`inline-flex items-center shrink-0 ${marginClass}`}
					>
						{child}
					</span>
				);
			}
			return typeof child === 'string' ? <span key={idx}>{child}</span> : child;
		});
	};

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className} ${modifierClass}`}
		>
			{renderChildren()}
		</button>
	);
};

export default Button;
