/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			animation: {
				// Hemos definido 'spin-slow' usando la keyframe 'spin' que Tailwind ya trae
				'spin-slow': 'spin 3s linear infinite',
			},
		},
	},
	plugins: [],
};
