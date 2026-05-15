export const getLocalStorageSelectedCenter = () => {
	const centerData = localStorage.getItem('selectedCenter');
	return centerData ? JSON.parse(centerData) : null;
};

export const setLocalStorageSelectedCenter = (center) => {
	localStorage.setItem('selectedCenter', JSON.stringify(center));
};

export const removeLocalStorageSelectedCenter = () => {
	localStorage.removeItem('selectedCenter');
};

export const getLocalStorageAllCenters = () => {
	const centersData = localStorage.getItem('allCenters');
	return centersData ? JSON.parse(centersData) : [];
};

export const setLocalStorageAllCenters = (centers) => {
	localStorage.setItem('allCenters', JSON.stringify(centers));
};

export const removeLocalStorageAllCenters = () => {
	localStorage.removeItem('allCenters');
};
