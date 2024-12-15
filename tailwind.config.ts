import type { Config } from "tailwindcss";
import theme from "tailwindcss/defaultTheme";

export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		fontFamily: {
			sans: ["Jost", ...theme.fontFamily.sans]
		},
		extend: {}
	},

	plugins: []
} satisfies Config;
