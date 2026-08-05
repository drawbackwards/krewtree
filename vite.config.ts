import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { resolve } from 'path'

// Source-map upload runs only on builds that carry a Sentry auth token
// (Vercel Production/Preview). Locally there is no token, so the plugin is
// skipped and the build behaves exactly as before.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default defineConfig({
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: sentryAuthToken,
            // Maps are emitted 'hidden' (no sourceMappingURL comment) and
            // deleted after upload, so they reach Sentry but are never served.
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
          }),
        ]
      : []),
  ],
  server: {
    // Use EXPOSE_HOST=true to allow network access (e.g. for testing on device)
    host: process.env.EXPOSE_HOST === 'true' ? true : 'localhost',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@site': resolve(__dirname, './src/site'),
    },
  },
  build: {
    // Emit hidden source maps only when uploading to Sentry, so minified
    // stack traces resolve to real TS lines without shipping maps to users.
    sourcemap: sentryAuthToken ? 'hidden' : false,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app code changes every deploy, these
        // don't, so returning visitors keep them cached.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    passWithNoTests: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.worktrees/**',
      '.superpowers/**',
      '.claude/worktrees/**',
    ],
  },
})
