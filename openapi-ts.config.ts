import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'openapi.gen.json',
  output: {
    path: 'app/client',
    format: 'prettier',
  },
  plugins: [
    '@hey-api/typescript',
  ],
});
