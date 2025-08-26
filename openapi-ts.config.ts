import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'openapi.gen.json',
  output: {
    path: 'app/client',
    format: 'prettier',
  },
  // We only use the typescript plugin for now.
  // In the future we may consider using some auto-generated
  // functions (such as tanstack-query) in lieu of the manual
  // and untyped hooks we currently use.
  plugins: ['@hey-api/typescript'],
});
