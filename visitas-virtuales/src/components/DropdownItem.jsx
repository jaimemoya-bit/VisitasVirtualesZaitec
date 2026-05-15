import Button from './Button';

export default function DropdownItem({ children, className, onClick }) {
	return (
		<Button
			variant="ghost"
			size="small"
			onClick={onClick}
			className={`font-semibold x-4! py-5.25! px-4! w-full justify-start rounded-none! ${className}`}
		>
			{children}
		</Button>
	);
}
