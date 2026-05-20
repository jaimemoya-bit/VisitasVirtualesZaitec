import {
	getLocalStorageAccessToken,
	isTokenExpired,
	setLocalStorageAccessToken,
	clearAuthLocalStorage,
} from './authLocalStorage.js';

/** Wrapper para fetch que incluye el token de acceso en el header Authorization y maneja logout si la respuesta es 401/403 */
export async function fetchWithAuth(url, options = {}, logoutCallback) {
	const refreshAccessToken = async () => {
		try {
			const refreshResponse = await fetch('/api/users/auth/refresh', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
			});

			if (!refreshResponse.ok) return null;

			const refreshData = await refreshResponse.json();
			if (refreshData?.accessToken) {
				setLocalStorageAccessToken(refreshData.accessToken);
				return refreshData.accessToken;
			}
			return null;
		} catch {
			return null;
		}
	};

	let token = getLocalStorageAccessToken();

	if (!token || isTokenExpired(token)) {
		token = await refreshAccessToken();

		if (!token) {
			clearAuthLocalStorage();
			if (typeof logoutCallback === 'function') logoutCallback();
			return new Response(null, { status: 401 });
		}
	}

	const requestOptions = {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${token}`,
		},
	};

	let res = await fetch(url, requestOptions);

	if (res.status === 401 || res.status === 403) {
		const refreshedToken = await refreshAccessToken();
		if (refreshedToken) {
			res = await fetch(url, {
				...requestOptions,
				headers: {
					...requestOptions.headers,
					Authorization: `Bearer ${refreshedToken}`,
				},
			});
		} else {
			clearAuthLocalStorage();
			if (typeof logoutCallback === 'function') logoutCallback();
			return res;
		}
	}

	if (res.status === 401 || res.status === 403) {
		clearAuthLocalStorage();
		if (typeof logoutCallback === 'function') logoutCallback();
	}

	return res;
}

export default fetchWithAuth;
