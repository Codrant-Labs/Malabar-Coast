import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        coast: {
          ink: "#071310",
          deep: "#0d211b",
          ivory: "#efe6d4",
          paper: "#dfd3bc",
          brass: "#c79a52",
        },
      },
      fontFamily: {
        display: ['"Bodoni 72"', "Didot", '"Iowan Old Style"', "serif"],
        body: ['"Avenir Next"', '"Gill Sans"', '"Trebuchet MS"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
