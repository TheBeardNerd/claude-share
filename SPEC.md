# claude-share — Internal Specification

**Status:** Draft v0.2 (Open questions resolved)
**Date:** 2026-05-19

---

## 1. Problem Statement

Claude is deployed across the organization in multiple surfaces — Claude Code (CLI/IDE), Claude.ai (web), and embedded in internal workflows. Users in each department are independently discovering what Claude can do: writing their own prompts, building their own slash commands, finding their own ways to accelerate repetitive work.

None of that learning is shared. When someone builds a great agent for contract review or a skill for querying the stats database, it dies in their local `.claude` directory. The result is duplicated effort, inconsistent quality, and a ceiling on organizational velocity that rises with each new user rather than with the collective.

**claude-share** is an internal platform where anyone in the organization can publish, discover, and install reusable Claude artifacts — skills, commands, agents, and prompt templates — across Claude Code and Claude.ai.

---

## 2. Goals

- **G1 — Discovery:** Any employee can find Claude artifacts relevant to their role or workflow in under 60 seconds.
- **G2 — Contribution:** Anyone can submit an artifact; a maintainer reviews before it goes live.
- **G3 — Installability:** Technical users (Claude Code) can install in one command. Non-technical users can copy-paste with no friction.
- **G4 — Coverage:** Support all primary Claude surfaces — Claude Code (CLI) and Claude.ai (web).
- **G5 — Trust:** A review gate ensures quality and prevents security/privacy issues before anything is published.

## 2.1 Non-Goals (v1)

- Public / open-source marketplace
- Automated testing or sandboxing of submitted artifacts
- Integration with external package managers
- Real-time collaboration or co-authoring of artifacts
- Automated sync with Claude Code plugin infrastructure
- Analytics or usage telemetry (v2)
- Department-level maintainers (v2)
- AI-assisted PII scanning (v2)
- Microsoft Entra SSO (v2)

---

## 3. User Personas

### 3.1 The Browser (non-technical)
*Marketing coordinator, operations analyst, team admin*

Wants to know: "Is there something that already does what I need?" Comfortable with web UIs. Will copy-paste instructions. Does not use a terminal. May contribute prompt templates or document workflows others have shared verbally.

### 3.2 The Builder (technical)
*Developer, data engineer, IT*

Uses Claude Code daily. Wants one-command installs. Likely to contribute skills and agents. May also want to fork and customize existing artifacts locally.

### 3.3 The Maintainer
*Single platform owner (v1)*

Reviews all submissions before publish. Needs a simple review queue with approve/reject/request-changes. Should not need to manually edit files — review happens in the UI. Single-user queue in v1; no assignment or claiming logic needed.

### 3.4 The Explorer (emerging Claude user)
*Any department — just getting started with Claude*

Needs curated "start here" onboarding, examples by department or use case, and clear explanations of what each artifact type does.

---

## 4. Artifact Taxonomy

All artifacts share a common base schema and are differentiated by `type`. Each type maps to a specific surface and install method.

### 4.1 Claude Code Skills
- **What it is:** A YAML file dropped into `.claude/skills/` that extends Claude Code with a reusable callable behavior.
- **Format:** YAML with `name`, `description`, `trigger`, `content` fields.
- **Install:** CLI script or manual copy to `~/.claude/skills/` or project `.claude/skills/`.
- **Surface:** Claude Code (CLI / IDE)

### 4.2 Slash Commands
- **What it is:** A markdown or YAML file dropped into `.claude/commands/` that adds a `/command-name` shortcut in Claude Code.
- **Format:** Markdown or YAML with frontmatter (`name`, `description`, `args`).
- **Install:** CLI script or manual copy to `~/.claude/commands/`.
- **Surface:** Claude Code (CLI / IDE)

### 4.3 Agents
- **What it is:** A specialized subagent definition — a named agent persona with a system prompt, tool configuration, and invocation trigger.
- **Format:** YAML with `name`, `description`, `system_prompt`, `tools`, `model`.
- **Install:** CLI script or manual copy to `.claude/agents/`.
- **Surface:** Claude Code (CLI / IDE)

### 4.4 Prompt Templates
- **What it is:** A reusable prompt (or prompt scaffold) for any Claude surface. Not code — pure natural language, possibly with placeholder variables.
- **Format:** Markdown with frontmatter (`title`, `category`, `variables`, `surface`).
- **Install:** Copy-paste only. UI renders a fill-in-the-blanks form for variables.
- **Surface:** Claude Code, Claude.ai, any

### 4.5 Claude.ai Web Skills
- **What it is:** Skills configured in claude.ai projects (via `claude.ai/customize/skills`) — org-level or project-level capabilities exposed to web users.
- **Format:** Share link + description + setup instructions (web skills are not files — they are configured in the Claude.ai UI and shared via URL).
- **Install:** Follow setup instructions + one-click link to claude.ai skill configuration.
- **Surface:** Claude.ai (web)
- **Note:** Not installed via CLI. The artifact record stores the share URL, setup steps, and which claude.ai project(s) the skill applies to.

---

## 5. Core Features

### 5.1 Artifact Catalog (Browse & Search)

**Browse view:**
- Grid/list of published artifacts
- Filter by: `type` (skill / command / agent / prompt / web-skill), `surface`, `department`, `tags`
- Sort by: newest, most copied, recently updated

**Search:**
- Full-text search across name, description, tags, content
- Instant results (client-side for small catalogs; Supabase full-text search as catalog grows)

**Artifact detail page:**
- Name, description, author (anonymized — role/department, not PII), date published
- Type badge + surface badge
- Tags and department
- Full content (syntax-highlighted for YAML/markdown)
- Version history (version number, date, change note)
- Install instructions specific to type
- Copy-to-clipboard button
- Install button → CLI command (Code artifacts) or web setup link (web skills)
- Related artifacts

### 5.2 Submission Flow

Any authenticated employee can submit:

1. **Submit form:**
   - Select artifact type (drives which fields appear)
   - Name, short description, department (from seeded list), tags
   - Content (textarea with syntax highlighting, or file upload)
   - Optional: link to related doc, Slack thread, or context
   - Certification checkbox: "I confirm this does not contain personal data, credentials, or confidential client information"

2. **Server-side validation:**
   - Required field check
   - YAML parse check for Code artifact types
   - Regex PII scan: flags email addresses, phone numbers, API key patterns (e.g. `sk-...`, `Bearer ...`)
   - If PII flag is triggered: submission is held and maintainer is notified with flag detail

3. **Submitted state:**
   - Submitter sees "Under Review" status on their submission
   - Maintainer receives Slack webhook notification

### 5.3 Review Queue

Single-maintainer view:

- Inbox of pending submissions, oldest first
- Per-submission: rendered artifact preview, PII scan result, submitter's department/role
- Actions:
  - **Approve** — publishes immediately, creates first `ArtifactVersion` record
  - **Request Changes** — sends free-text note to submitter; artifact returns to draft state
  - **Reject** — sends reason to submitter; submitter can see the rejection note on their submission

### 5.4 Install Mechanic

**Copy-paste (all users):**
- "Copy" button on every artifact detail page copies raw content to clipboard
- For prompt templates: UI renders an in-page form for variable placeholders; "Copy completed prompt" copies the filled result

**CLI install (Claude Code users):**
- A single `install.sh` shell script (TypeScript compiled to shell, or pure shell calling the API)
- Install command shown on each artifact detail page:
  ```sh
  curl -fsSL https://[netlify-url]/install.sh | sh -s -- skill "artifact-slug"
  ```
- Script behavior:
  - Fetches artifact JSON from the public API
  - Determines type → resolves target directory (`~/.claude/skills/`, `~/.claude/commands/`, `.claude/agents/`)
  - If file already exists: prompts `File already exists at <path>. Overwrite? [y/N]`
  - Writes file on confirmation; exits cleanly on denial
  - Target directory is created if it does not exist

**Web skill setup (Claude.ai users):**
- Step-by-step instructions rendered on detail page
- "Open in Claude.ai" button links directly to `claude.ai/customize/skills`
- Notes on which claude.ai project to apply the skill to

### 5.5 Authentication

**v1:** Supabase Auth — email magic link, restricted to org email domain (`@grizzlies.com`)

**v2:** Microsoft Entra (Azure AD) SSO via BetterAuth

All routes require authentication. Supabase Row Level Security enforces read/write access at the database layer.

---

## 6. Data Model

TypeScript types are the source of truth; the Supabase schema is generated from them.

```
Artifact
├── id               uuid           PK
├── slug             text           UNIQUE, URL-safe
├── type             text           enum: skill | command | agent | prompt | web-skill
├── surface          text           enum: claude-code | claude-ai | both
├── status           text           enum: draft | pending_review | published | rejected
├── title            text
├── description      text           1–2 sentences
├── content          text           raw YAML / markdown / prompt body
├── tags             text[]
├── department       text           from seeded department list
├── metadata         jsonb          type-specific: { share_url?, variables?, model? }
├── submitted_by     text           role/department label — NOT name or email
├── reviewed_by      text           maintainer role label
├── current_version  integer        denormalized for fast reads
├── pii_flagged      boolean        set by server-side regex scan on submission
├── created_at       timestamptz
├── updated_at       timestamptz
└── published_at     timestamptz

ArtifactVersion
├── id               uuid           PK
├── artifact_id      uuid           FK → Artifact
├── version          integer        auto-incremented per artifact
├── content          text           snapshot of content at this version
├── metadata         jsonb          snapshot of metadata at this version
├── change_note      text           optional; provided by maintainer on approval
├── published_by     text           maintainer role label
└── created_at       timestamptz

ReviewNote
├── id               uuid           PK
├── artifact_id      uuid           FK → Artifact
├── body             text
├── action           text           enum: approved | changes_requested | rejected
└── created_at       timestamptz
```

**Privacy note:** `submitted_by` and `reviewed_by` store role/department labels, not names or email addresses. GDPR/TIPA data minimization is satisfied at the schema level. Email addresses for auth are managed by Supabase Auth and never written to artifact tables.

---

## 7. Department Taxonomy (Seeded List)

Pre-populated at launch. Maintainer can add/retire categories over time.

| Slug | Display Name |
|---|---|
| `basketball-ops` | Basketball Operations |
| `engineering` | Engineering & Technology |
| `marketing` | Marketing |
| `communications` | Communications & PR |
| `finance` | Finance |
| `legal` | Legal |
| `people-culture` | People & Culture |
| `ticket-sales` | Ticket Sales |
| `partnerships` | Partnerships |
| `media` | Media |
| `creative` | Creative |
| `it` | IT |
| `strategy` | Strategy & Analytics |
| `facilities` | Facilities & Operations |
| `general` | General / Cross-department |

---

## 8. Proposed Tech Stack

TypeScript is the standard across all layers.

### v1 (Development / Internal Launch)

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript | Standard across all layers |
| Frontend | Astro + TypeScript | Static-first, fast, minimal JS; ideal for content-heavy catalog |
| Database | Supabase (PostgreSQL) | Hosted Postgres, full-text search, JSONB, Row Level Security |
| Auth | Supabase Auth (magic link) | Domain-restricted to `@grizzlies.com` |
| Hosting | Netlify | Fast deploy previews; Netlify temp URL for v1 |
| Styling | Tailwind CSS | Fast iteration |
| Notifications | Slack webhook | Maintainer notified on new submission |

### v2 (Production / AWS Migration)

| Layer | v1 | v2 Target | Migration Notes |
|---|---|---|---|
| Database | Supabase | AWS RDS / Aurora Serverless | Standard Postgres schema — minimal friction |
| Auth | Supabase Auth | BetterAuth + Microsoft Entra | Plan session migration before user volume grows |
| Hosting | Netlify | AWS (CloudFront + S3 or ECS via CDK) | Reuse existing org CDK patterns |
| PII Scanning | Regex | Claude API-assisted (second pass) | Additive — does not replace regex |
| Frontend | Astro + TypeScript | Astro + TypeScript (no change) | Hosting-agnostic |

---

## 9. UX Flows

### Flow A: Non-technical user discovers and uses a prompt template
1. Lands on catalog → filters by type "Prompt Template" and department "Marketing"
2. Opens "Game recap social copy" template
3. Sees variable placeholders: `{opponent}`, `{score}`, `{key_player}`
4. Fills in the in-page form → clicks "Copy completed prompt"
5. Pastes into Claude.ai → done

### Flow B: Developer installs a Claude Code skill
1. Searches "stats" → finds "Query Stats API" skill
2. Clicks "Install" → sees generated command:
   ```sh
   curl -fsSL https://[netlify-url]/install.sh | sh -s -- skill "query-stats-api"
   ```
3. Runs in terminal → prompted if file exists; confirms → skill written to `~/.claude/skills/`
4. Opens Claude Code → skill immediately available

### Flow C: Employee submits a new artifact
1. Clicks "Submit" → selects type "Slash Command"
2. Fills name, description, department, tags, pastes YAML content
3. Checks PII certification → submits
4. Sees "Pending Review" confirmation
5. Maintainer gets Slack notification → reviews → approves
6. Submitter sees artifact published; rejection notes visible if rejected

### Flow D: Non-technical user sets up a Claude.ai web skill
1. Finds "Web Skill: Brand Voice" artifact
2. Reads step-by-step setup instructions on detail page
3. Clicks "Open in Claude.ai" → directed to `claude.ai/customize/skills`
4. Follows in-page steps to add skill to their claude.ai project

---

## 10. MVP Scope

The v1 release creates the core habit loop: submit → review → discover → use.

**In MVP:**
- [ ] Authenticated catalog page (browse + filter by type, department, surface)
- [ ] Full-text search
- [ ] Artifact detail page with copy-to-clipboard and version history
- [ ] Submit form (all 5 artifact types) with regex PII scan
- [ ] `ArtifactVersion` table — versioning on every approval
- [ ] Maintainer review queue (approve / request-changes / reject)
- [ ] Rejection notes visible to submitter
- [ ] CLI install script (`install.sh`) with conflict prompt
- [ ] Web skill detail view with setup instructions
- [ ] Prompt template variable fill-in form before copy
- [ ] Seeded department taxonomy
- [ ] Slack webhook notification to maintainer on new submission
- [ ] Email magic link auth restricted to `@grizzlies.com`

**Deferred to v2:**
- Usage/install analytics
- Ratings or comments
- Fork/customize flow (clone an artifact as a starting point)
- Automated YAML validation via Claude Code schema
- Department-level maintainers
- Public-facing artifact sharing
- AI-assisted submission
- Claude-assisted PII scanning (second pass)
- Microsoft Entra SSO / BetterAuth migration
- AWS hosting migration

---

## 11. Security & Compliance Notes

- **GDPR / TIPA:** Artifact records contain no PII. `submitted_by` and `reviewed_by` store role/department labels only. Email addresses for auth are managed by Supabase Auth and never written to artifact tables.
- **Content screening:** Submission requires a certification checkbox. Server-side regex scan flags common PII and credential patterns; human review is the primary control. Claude-assisted scanning added in v2.
- **Access control:** All routes require auth. Supabase Row Level Security enforces access at the DB layer (published artifacts readable by all authed users; pending/rejected visible only to submitter and maintainer).
- **New tool intake:** Supabase and Netlify must go through the IT intake process before use or purchase approval. This spec does not authorize procurement.
- **External content:** Artifacts referencing external services or URLs should be flagged in review.
- **Auth migration:** Plan Supabase Auth → BetterAuth migration before significant user volume accumulates; active sessions will require re-issuance.

---

## 12. Success Metrics (v2 instrumentation)

- **Adoption rate:** % of active Claude users who access claude-share at least once per month
- **Contribution rate:** Artifacts submitted per month
- **Install rate:** Copy/install events per artifact
- **Review turnaround:** Median time from submission to publish (target: < 48 hours)
- **Catalog depth:** Total published artifacts by type

---

## 13. Resolved Decisions Log

| # | Question | Decision |
|---|---|---|
| OQ1 | Auth provider | Email magic link (v1); Microsoft Entra via BetterAuth (v2) |
| OQ2 | Domain | Netlify temp URL (v1); resolve with IT for production |
| OQ3 | Artifact storage | DB only; `ArtifactVersion` table for full history and rollback |
| OQ4 | Department taxonomy | Seeded fixed list (Section 7); maintainer manages over time |
| OQ5 | Maintainers | Single maintainer in v1; simple queue, no assignment logic |
| OQ6 | Rejection visibility | Submitter sees rejection reason; can revise and resubmit |
| OQ7 | Install conflicts | Script prompts `Overwrite? [y/N]` — no silent overwrites |
| OQ8 | PII scanning | Regex in v1; Claude-assisted as additive second pass in v2 |
| OQ9 | Supabase account | Personal for v1; migrates to AWS in production |

---

*This spec is a living document. All content is internal and confidential.*
