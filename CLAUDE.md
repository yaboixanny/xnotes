# X Note — Project Context

## Stack
- React 18 + Vite 5
- Supabase (Auth + PostgreSQL)
- @dnd-kit/core, @dnd-kit/sortable (drag and drop)
- Netlify (deployment)
- No CSS modules — all styles in `src/index.css`

## Supabase
- Project URL: https://gpfnhxlajolihxljmhgj.supabase.co
- Table: `notes`
- Columns: `id`, `user_id`, `headline`, `broad_notes`, `quick_notes` (jsonb), `checklist` (jsonb), `timeline` (jsonb), `kanban` (jsonb), `section_order` (jsonb), `category` (text, default 'General'), `created_at`, `updated_at`
- RLS enabled — users can only access their own rows

## Deployment
- GitHub: https://github.com/yaboixanny/xnotes.git
- Netlify: https://loquacious-panda-27ab1c.netlify.app/
- Env vars needed in Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Conventions
- Autosave with 1.5s debounce — no manual save/discard buttons
- Draft backup in localStorage under key `note-draft-{id}`
- Light mode default, dark mode toggle stored in localStorage
- Landing page always dark (scoped under `.lp` CSS class)
- Categories: General, Projects, Clients, Travel, Personal, Work

## Reference files
- `.claude/SKILL.md` — frontend design skill: distinctive, production-grade UI. Read this before any UI/design work.
