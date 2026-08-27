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
  throw new Error(`Invalid port value: "${rawPort}"`);
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

    if (!html.includes('/postseason-checkpoint-event.js')) {
      scripts.push('    <script src="/postseason-checkpoint-event.js"></script>');
    }

    if (!html.includes('/postseason-ui.js')) {
      scripts.push('    <script src="/postseason-ui.js"></script>');
    }

    if (!html.includes('/postseason-polish.js')) {
      scripts.push('    <script src="/postseason-polish.js"></script>');
    }

    if (!html.includes('/postseason-game-presentation.js')) {
      scripts.push('    <script src="/postseason-game-presentation.js"></script>');
    }

    if (!html.includes('/postseason-game-canonical-bridge.js')) {
      scripts.push('    <script src="/postseason-game-canonical-bridge.js"></script>');
    }

    if (!html.includes('/postseason-event-polish.js')) {
      scripts.push('    <script src="/postseason-event-polish.js"></script>');
    }

    if (!html.includes('/pregame-sim-reset.js')) {
      scripts.push('    <script src="/pregame-sim-reset.js"></script>');
    }

    if (!html.includes('/postseason-stats.js')) {
      scripts.push('    <script src="/postseason-stats.js"></script>');
    }

    if (!html.includes('/league-postseason.js')) {
      scripts.push('    <script src="/league-postseason.js"></script>');
    }

    if (!html.includes('/playoff-leaders.js')) {
      scripts.push('    <script src="/playoff-leaders.js"></script>');
    }

    if (!html.includes('/full-stats-scopes.js')) {
      scripts.push('    <script src="/full-stats-scopes.js"></script>');
    }

    if (!html.includes('/team-leader-scopes.js')) {
      scripts.push('    <script src="/team-leader-scopes.js"></script>');
    }

    if (!html.includes('/team-profile-stat-scopes.js')) {
      scripts.push('    <script src="/team-profile-stat-scopes.js"></script>');
    }

    if (!html.includes('/player-stat-scopes.js')) {
      scripts.push('    <script src="/player-stat-scopes.js"></script>');
    }

    if (!html.includes('/player-profile-postseason.js')) {
      scripts.push('    <script src="/player-profile-postseason.js"></script>');
    }

    if (!html.includes('/home-postseason-awareness.js')) {
      scripts.push('    <script src="/home-postseason-awareness.js"></script>');
    }

    if (!html.includes('/home-postseason-polish.js')) {
      scripts.push('    <script src="/home-postseason-polish.js"></script>');
    }

    if (!html.includes('/championship-checkpoint.js')) {
      scripts.push('    <script src="/championship-checkpoint.js"></script>');
    }

    if (!html.includes('/awards-ceremony.js')) {
      scripts.push('    <script src="/awards-ceremony.js"></script>');
    }

    if (!html.includes('/awards-calendar-event.js')) {
      scripts.push('    <script src="/awards-calendar-event.js"></script>');
    }

    if (!html.includes('/league-awards-history.js')) {
      scripts.push('    <script src="/league-awards-history.js"></script>');
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
