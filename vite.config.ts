import rawPlugin from "vite-raw-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    rawPlugin({
      fileRegex: /\.wgsl$/,
    }), // For importing .wgsl files as string in JS, can be done by `import x from './shader.wgsl?raw'` (https://vitejs.dev/guide/assets#importing-asset-as-string) but i don't like it
  ],
});
