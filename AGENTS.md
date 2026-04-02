# About this Project

This project is a Dashboard that displays all results from the Kobolotbox application — a tool designed to evaluate biosecurity measures on aquaculture facilities. The dashboard fetches data from the Kobolotbox API using a project UID (since there may be multiple projects, but the assessment tool is the same for all of them and the data collected is identical) and presents it in a user-friendly format.

The authors of the assessment tool are the ones who commissioned this development. They use the dashboard as admin users, along with producers or facility managers (producer) and visitors (public).

# Obsidian Workflow

This project uses the Obsidian Project System which is a set of conventions for organizing and managing projects in Obsidian supported by the Obsidian Skills.

- Project path: `Proyectos/bioDashboard/`
- Master note: `bioDashboard - Project.md`
- Plans: `plans/<plan-slug>/plan.md` + `tasks/T*.md`
- Logs: `logs/plans/<plan-slug>/YYYY-MM-DD-session-NN.md`
- General log: `logs/project-log.md`
- Docs: `docs/architecture/`, `docs/decisions/`, `docs/specs/`, `docs/research/`

## Rules for Obsidian Workflow:
- Resolve vault context first with `obsidian vaults verbose` and `obsidian vault=<name> vault info=path`
- Pin every CLI command with `vault=<name>`
- Use the real project folder path for links/filters (`bioDashboard` in this vault), while keeping slug values canonical in frontmatter (`bio-dashboard`)
- Never write Obsidian artifacts to `./Proyectos` inside the repository unless that path is exactly the vault path
- Markdown + frontmatter = source of truth
- `.base` = dashboards only
- `.canvas` = visualization only
- Use canonical properties only
- Update Obsidian artifacts when planning, executing, or documenting meaningful work

# General Rules

## Design

- Always use global styles, DON'T use inline styles
- Keep in mind we use Tailwind 4
- All designs must give an excellent UX and UI for desktop and mobile, all responsive design.

## DO NOT:

- Never RUN the server for testing, assume the server is already running and accessible in 'http://localhost:3000/' just run it if it is not running.
- NEVER WRITE DOCUMENTATION (.md) which has not been explicitly requested by the user.
