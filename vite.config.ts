import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * En desarrollo (`npm run dev`) sirve /api/estimate con la misma función que usa Vercel,
 * leyendo ANTHROPIC_API_KEY y APP_ACCESS_CODE de un archivo `.env.local`.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''));
      server.middlewares.use('/api/estimate', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request('http://localhost/api/estimate', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const { POST } = await server.ssrLoadModule('/api/estimate.ts');
        const response: Response = await POST(request);
        res.statusCode = response.status;
        res.setHeader('content-type', response.headers.get('content-type') ?? 'application/json');
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
});
