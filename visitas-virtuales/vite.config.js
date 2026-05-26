/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	console.log('modo:', mode);
	console.log('VITE_API_URL:', env.VITE_API_URL);

	// TEMPORAL — fallback si loadEnv no lee el .env
	const API_URL = env.VITE_API_URL || 'http://localhost:8000';

	return {
		plugins: [react()],
		resolve: {
			alias: {
				'@': '/src',
				'@assets': '/src/assets',
			},
		},
		server: {
			proxy: {
				'/api': {
					target: API_URL,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
					configure: (proxy) => {
						proxy.on('proxyReq', (proxyReq, req) => {
							if (req.headers['authorization']) {
								proxyReq.setHeader(
									'Authorization',
									req.headers['authorization'],
								);
							}
						});
					},
				},
			},
			allowedHosts: ['app.visitasvirtuales.dedyn.io'],
		},
	};
});