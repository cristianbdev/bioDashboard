# Work Methodologies

## Planning

All implementation plans MUST include a dependency graph. Every task declares 'depends_on: [] with explicit task IDs 'T1, T2'.
After executing a plan, create a dedicated folder in `docs/plans/<plan-slug>/`, store the plan file inside that folder, and add a detailed implementation status markdown that records what was completed, what is still pending, validation performed, blockers, risks, and concrete next steps.

## Execution

Complete all tasks from a plan without stopping to ask permission between steps. Use best judgment, keep moving. Only stop to ask if you're about to make destructive/irreversible change or hit a genuine blocker.

## Design

- Always use global styles, DON'T use inline styles
- Keep in mind we use Tailwind 4
- All designs must give an excellent UX and UI for desktop and mobile, all responsive design.

## DO NOT:

- Never RUN the server for testing, assume the server is already running and accessible in 'http://localhost:3000/' just run it if it is not running.
- NEVER WRITE DOCUMENTATION (.md) which has not been explicitly requested by the user.