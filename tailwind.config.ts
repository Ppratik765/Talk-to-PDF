import type { Config } from "tailwindcss";

const config: Config = {
  // ... content and theme sections remain the same ...
  plugins: [
    require('@tailwindcss/typography'), // <--- ADD THIS
  ],
};
export default config;