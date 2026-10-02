# StudyNivo — Your Personal AI Study Coach

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

## Handoff and continuation

Read [`MANUS_SETUP.md`](MANUS_SETUP.md) first when importing this repository into another Manus account. Then read [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md); it records what is complete, what is intentionally unfinished, failed publication attempts, validation evidence, checkpoints, and the recommended next implementation phase. The original product specification is [`docs/برومبت.txt`](docs/برومبت.txt), and the implementation/design plan is [`docs/PLAN.md`](docs/PLAN.md).

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

Never commit secrets, `.env` files, `node_modules`, or `dist`. Preserve the Manus `origin` remote for Manus checkpoints; use a separate `github` remote when synchronizing the project to GitHub.
