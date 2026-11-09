# Repository Guidelines

## Project Structure & Module Organization

Firefly is an Astro 7 site with Svelte islands and TypeScript configuration. Main source code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, reusable UI in `src/components`, styles in `src/styles`, content in `src/content`, helpers in `src/utils`, and Markdown/HTML plugins in `src/plugins`. Site configuration is split across `src/config` with matching type definitions in `src/types`; prefer imports from `@/config` when available. Static files served directly belong in `public`, source-managed images in `src/assets`, docs in `docs`, and automation in `scripts`.

## Build, Test, and Development Commands

Use npm with Node.js 24. Commit `package-lock.json` and install with `npm ci`.

- `npm run dev` or `npm run start`: run the local Astro dev server.
- `npm run check`: run Astro diagnostics.
- `npm run type-check`: run TypeScript with `--noEmit`.
- `npm run format`: format `src` with Biome.
- `npm run lint`: run Biome checks and safe fixes on `src`.
- `npm run build`: generate icons, LQIPs, the Astro build, font subsets, and Pagefind search output in `dist`.
- `npm run preview`: preview the production build locally.
- `npm run new-post`: scaffold a new content post.

## Coding Style & Naming Conventions

Biome is the formatter and linter. It uses tabs for indentation and double quotes for JavaScript/TypeScript strings. Keep Astro and Svelte components in `PascalCase` (`PostCard.astro`, `Search.svelte`), config modules in `camelCase` ending with `Config.ts`, and utilities in descriptive kebab case such as `date-utils.ts`. Keep `src/types` aligned with `src/config`. Avoid unrelated formatting churn.

## Testing Guidelines

Tests use Node.js built-in test runner (`npm test`). Before submitting changes, run `npm run check`, `npm run type-check`, and `npm run build` for rendering, content, or generated asset work. For visual or interactive changes, verify with `npm run dev` or `npm run preview` and include screenshots in the PR. Name future tests near the feature they cover, using the local file name as the stem.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching the current history: `feat: ...`, `fix: ...`, and `chore: ...`. Keep commits and PRs focused on one concern. PRs should include a concise summary, linked issues when relevant, validation commands run, and screenshots for UI changes. Discuss major features or design changes in an issue or discussion before implementation.

## Security & Configuration Tips

Do not commit secrets, tokens, or service keys in config files. Keep deployment-specific settings in the target platform environment, and review generated files such as `dist`, `src/constants/lqips.json`, and `src/constants/icons.ts` before committing them.

## Current Site Scope

Keep only the current Firefly site and documentation. Do not restore legacy URL aliases, migration backups, demo pages, or historical migration notes. Main content is in src/content/posts; current images are in public/images/posts and public/images/gallery. commentPath is a Waline identity only, never a public route. Validate before removing dependency/build caches for source-only delivery.
