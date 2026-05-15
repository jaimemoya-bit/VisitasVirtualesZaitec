export const setLocalStorageAccessToken = (accessToken) => {
	localStorage.setItem('accessToken', accessToken);
};

export const getLocalStorageAccessToken = () => {
	return localStorage.getItem('accessToken');
};

export const removeLocalStorageAccessToken = () => {
	localStorage.removeItem('accessToken');
};

export const isTokenExpired = (token) => {
	if (!token) return true;
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));

		const currentTime = Math.floor(Date.now() / 1000);

		return currentTime >= payload.exp - 10;
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		return true;
	}
};

export const getLocalStorageUser = () => {
	const user = localStorage.getItem('user');
	return user ? JSON.parse(user) : null;
};

export const setLocalStorageUser = (user) => {
	localStorage.setItem('user', JSON.stringify(user));
};

export const removeLocalStorageUser = () => {
	localStorage.removeItem('user');
};

export const clearAuthLocalStorage = () => {
	removeLocalStorageAccessToken();
	removeLocalStorageUser();
};
