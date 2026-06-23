<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Almanac handoff rules

- If this repo is being set up for an operator from scratch, read `OPERATOR_START_HERE.md`, `BOT_HANDOFF.md`, `README.md`, and `docs/operator-env-reference.md` before changing code or environment settings.
- Do not use the alpha tester's Vercel, Clerk, Google Cloud, Postgres, OAuth, or email setup unless the user explicitly says this is work on the alpha tester's existing deployment.
- Do not commit `.env`, `.env.local`, `.vercel`, `node_modules`, `.next`, `build`, `coverage`, `prisma/dev.db`, or `src/generated/prisma`.
- Start with local demo mode before hosted setup: `npm install`, copy `.env.example` to `.env`, `npm run db:init`, `npm run test`, `npm run dev`.
- Ask before creating paid resources, changing live production environment variables, or connecting real tenant, owner, lease, or financial files.
