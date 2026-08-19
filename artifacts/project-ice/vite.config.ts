import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const runtimeModulesPlugin = {
  name: 'project-ice-runtime-modules',
  transformIndexHtml(html: string) {
    const scripts: string[] = [];

    if (!html.includes('/career-persistence.js')) {
      scripts.push('    <script src="/career-persistence.js"></script>');
    }

    if (!html.includes('/season-lifecycle.js')) {
      scripts.push('    <script src="/season-lifecycle.js"></script>');
    }

    if (!html.includes('/season-lifecycle-migrations.js')) {
      scripts.push('    <script src="/season-lifecycle-migrations.js"></script>');
    }

    if (!html.includes('/postseason-cadence.js')) {
      scripts.push('    <script src="/postseason-cadence.js"></script>');
    }

    if (!html.includes('/schedule-open-day-fix.js')) {
      scripts.push('    <script src="/schedule-open-day-fix.js"></script>');
    }

    if (!html.includes('/postseason-trigger.js')) {
      scripts.push('    <script src="/postseason-trigger.js"></script>');
    }

    if (!html.includes('/postseason-ui.js')) {
      scripts.push('    <script src="/postseason-ui.js"></script>');
    }

    if (!html.includes('/postseason-polish.js')) {
      scripts.push('    <script src="/postseason-polish.js"></script>');
    }

    if (!html.includes('/dev-postseason-shortcut.js')) {
      scripts.push('    <script src="/dev-postseason-shortcut.js"></script>');
    }

    if (scripts.length === 0) {
      return html;
    }

    return html.replace(
      '</body>',
      `${scripts.join('\n')}\n  </body>`,
    );
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    runtimeModulesPlugin,
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
