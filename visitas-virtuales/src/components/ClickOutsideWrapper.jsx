import { useEffect, useRef } from 'react';
export default function ClickOutsideWrapper({ children, onClickOutside }) {
	const wrapperRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				onClickOutside();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClickOutside]);

	return <div ref={wrapperRef}>{children}</div>;
}
