// Add this for typescript to recognize .wgsl files as modules
declare module "*.wgsl" {
  const shader: string;
  export default shader;
}

/// <reference types="vite/client" />
