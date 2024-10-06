import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Exo-2", ...fontFamily.sans], // Exo 2 is now the sans font
      },
      colors: {

        'DarkGreen': "#003e29",
        'White': "#FFFFFF",
        'LightGreen': "#aae8ba"

        // '1E635F': '#1E635F',
        // 'F5FAFA': '#F5FAFA',
        // 'DAF2F1' : '#DAF2F1',
        // 'defafa' :'#defafa'
      },
      keyframes: {
        slideleft: {
          '0%': { transform: 'translateX(-100px)' },
          '10%': { transform: 'translateX(-90px)' },
          '20%': { transform: 'translateX(-80px)' },
          '30%': { transform: 'translateX(-70px)' },
          '40%': { transform: 'translateX(-60px)' },
          '50%': { transform: 'translateX(-50px)' },
          '60%': { transform: 'translateX(-60px)' },
          '100%': { transform: 'translateX(0px)' },
        },
      },
      animation: {
        'slideleft': 'slideleft',
      },
    },
  },
  plugins: [],
} satisfies Config;
