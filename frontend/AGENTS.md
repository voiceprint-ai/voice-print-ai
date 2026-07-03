<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- React Compiler
- ESLint

## Frontend Rules
- Use TypeScript.
- Use the App Router inside `app/`.
- Do not create a `src/` directory.
- Use Tailwind CSS for styling, avoid adding css class.
- Keep components reusable and simple.
- Use the existing `.row` and `.global_container` layout classes for sections when appropriate.

## Important
Before making big changes, explain the plan first.
Do not delete existing files unless clearly necessary.
Follow the current folder structure.