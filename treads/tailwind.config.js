/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "#fffaf3",
				foreground: "#1a1a1a",
				neon: {
					pink: "#ff5bd6",
					cyan: "#00eaff",
					purple: "#9b5cff",
				},
			},
			boxShadow: {
				neon: "0 0 10px rgba(0,234,255,0.6), 0 0 20px rgba(155,92,255,0.4)",
			},
		},
	},
	plugins: [],
};

