/* global process */
import { defineConfig, loadEnv } from 'vite'; // Importamos loadEnv
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	// Cargamos las variables de entorno basadas en el modo (development, production, etc.)
	// El segundo argumento 'process.cwd()' le dice a Vite que busque en la raíz del proyecto
	const env = loadEnv(mode, process.cwd());

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
					target: env.VITE_API_URL,
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
