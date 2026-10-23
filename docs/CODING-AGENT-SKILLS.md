# Coding Agent Skills Playbook

End-to-end workflow: planning to deployment. Which skill when, in what order, with commands.

Reusable across projects. Adapt the stack list to your project.

---

## Phase 0: Setup (one-time per repo)

**Skill:** `setup-matt-pocock-skills`

Configures the issue tracker, triage labels, and doc layout. Creates:
- `docs/agents/issue-tracker.md` (tracker config)
- `GLOSSARY.md` (shared domain language)
- `docs/adr/` (architecture decision records)

**Run:**
```
/setup-matt-pocock-skills
```

Answers it needs:
1. Issue tracker (GitHub, GitLab, local files, or custom)
2. Triage labels you apply to tickets
3. Where to save docs (default: `docs/`)

**After this, never skip Phase 1.**

---

## Phase 0.5: Library Docs (before proposing code)

**Tool:** Context7 MCP

Fetches current official documentation for any library, framework, SDK, API, CLI tool, or cloud service. Use before writing code that touches a dependency, even familiar ones. Training data goes stale; docs don't.

**When to use:**
- Any prompt touching a library, framework, SDK, API, CLI tool, or cloud service
- API syntax, configuration, version migration, library-specific debugging, setup instructions
- Before proposing code that uses a dependency

**When NOT to use:**
- Refactoring (no new API surface)
- Writing scripts from scratch (pure stdlib)
- Debugging business logic
- Code review
- General programming concepts

**How:**
1. `resolve-library-id` with the library name + what to look up (unless user gives exact `/org/project` ID)
2. Pick best match by: exact name, description relevance, code snippet count, source reputation, benchmark score
3. `query-docs` with the selected library ID + what to look up. One concept per call. Combined queries dilute ranking and return shallow results.
4. Answer using the fetched docs, not training data

**Examples:**
```
# User asks about Prisma 7 migration
resolve-library-id("prisma", "prisma 7 datasource migration prisma.config.ts driver adapter")
# Returns /prisma/prisma

query-docs("/prisma/prisma", "prisma 7 datasource url removed prisma.config.ts driver adapter migration")
# Returns current docs with exact migration steps

# User asks about Next.js 16 App Router
resolve-library-id("next.js", "app router server actions")
# Returns /vercel/next.js

query-docs("/vercel/next.js", "app router server actions body size limit")
```

**Rules:**
- Prefer this over web search or training-data recall, even for familiar libraries
- Version-specific advice: verify against the user's installed version when it matters
- If the question spans multiple distinct concepts (routing + auth + caching), make a separate `query-docs` call per concept
- Context7 fetches docs; it does not replace judgment

---

## Phase 1: Align (before writing code)

**Skill:** `grill-with-docs`

Interviews you relentlessly about the change. Builds shared language. Writes `GLOSSARY.md` terms and ADRs inline. Catches ambiguity before code exists.

**Run:**
```
/grill-with-docs
```

It will:
- Ask one question at a time until every branch of the design tree is resolved
- Add domain terms to `GLOSSARY.md`
- Record non-obvious decisions as ADRs in `docs/adr/`
- Update `GLOSSARY.md` and ADRs as understanding shifts

**Gate:** Do not start Phase 3 until open questions are settled.

**Fallback** (non-code planning, or no repo yet): `/grill-me` does the same interview without the docs/ADRs.

---

## Phase 2: Spec (when the change is big or multi-session)

**Skill:** `to-spec`

Turns the grilled conversation into a spec and publishes it to the issue tracker. No interview; synthesizes what was already discussed.

**Run:**
```
/to-spec
```

Use when:
- Work spans multiple sessions
- Work is complex enough to need a written contract
- Multiple people or agents will touch the change

Skip when: the change is small enough that grilling settled everything.

---

## Phase 3: Implement (the build)

**Skill:** `implement`

Builds the work described by a spec or set of tickets. Drives TDD at pre-agreed seams. Closes with code-review before committing.

**Run:**
```
/implement
```

It will:
- Break the spec into ordered, testable slices
- At each seam, run TDD (red-green-refactor)
- At pre-agreed checkpoints, run code-review
- Commit after review passes

**Inside implement, two skills fire:**

### 3a. TDD

**Skill:** `tdd`

Red-green-refactor. One vertical slice at a time. Writes a failing test first, then fixes it.

**Run (standalone):**
```
/tdd
```

Use standalone when:
- Adding a feature test-first
- Fixing a bug test-first
- The change is small enough to skip the full implement flow

**Rules:**
- Write one failing test
- Write the minimum code to pass it
- Refactor without changing behavior
- Repeat for the next slice

### 3b. Code Review

**Skill:** `code-review`

Two-axis review of the diff since a fixed point (commit, branch, tag, merge-base):
- **Standards:** Does it follow the repo's coding standards? Fowler smell baseline?
- **Spec:** Does it faithfully implement the originating issue/spec?

Run as parallel sub-agents so neither pollutes the other.

**Run (standalone):**
```
/code-review
```

Use standalone when:
- Reviewing a branch before merge
- Reviewing a PR
- Reviewing work-in-progress changes
- Reviewing since a specific commit: name the target

---

## Phase 4: Debug (when things break)

**Skill:** `diagnosing-bugs`

Disciplined diagnosis loop. Builds a red feedback loop before theorizing. Gates phase by phase.

**Run:**
```
/diagnosing-bugs
```

It will:
1. Build a feedback loop that goes red on this bug
2. Minimize the reproduction
3. Hypothesize a cause
4. Instrument to confirm or deny
5. Fix
6. Add a regression test

Use when:
- A bug is hard to reproduce
- A performance regression has no obvious cause
- Something worked yesterday and broke today
- You keep guessing and getting it wrong

**Do not theorize before the loop goes red.**

---

## Phase 5: Ship

No single skill. Combination of:

### 5a. Final review

**Skill:** `code-review`

Run one final time against the merge-base:
```
/code-review
```

### 5b. Git workflow

**Built-in skill:** `git-workflow-and-versioning`

Auto-activates on commit/branch/PR. Structured commits, semantic versioning, changelog, PR body.

### 5c. PR body

**Skill:** `pr` (if installed; otherwise follow the pattern manually)

PR body shape:
- Summary: smallest visual that makes the change clear
- Before/after evidence that it works
- Merge-danger call: one-way or two-way door, plus blast radius

### 5d. Deployment checklist

**Built-in skill:** `shipping-and-launch`

Auto-activates when preparing to deploy. Pre-launch checklist, monitoring setup, staged rollout, rollback strategy.

### 5e. Retrospective

**Skill:** `retro` (if installed)

After merge, captures environment improvements (navigation, automated checks, coding standards, steering files). Not code changes. Most severe first.

---

## Always-On Skills (no invocation needed)

### Ponytail

**Skill:** `ponytail`

Active every response. The lazy ladder:

1. Does it need to exist? (YAGNI)
2. Already in this codebase? Use it.
3. Stdlib / platform feature? Use it.
4. Installed dependency? Use it. Never add one for a few lines.
5. Can it be one line? One line.
6. Only then: minimum code that works.

Never cuts: validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything explicitly requested.

Switch level:
```
/ponytail lite    # build what was asked, name the smaller option
/ponytail full    # default, the rules above
/ponytail ultra   # also push back on the request before building
/ponytail off     # turn off
```

### Graphify

**Skill:** `graphify`

Query the codebase knowledge graph instead of reading files.

**Build the graph (one-time + on change):**
```bash
graphify .                  # build graph
graphify . --code-only      # code only, no LLM key needed
graphify update .            # incremental rebuild after changes
```

**Query:**
```bash
graphify query "what connects auth to the database?"
graphify path "UserService" "DatabasePool"
graphify explain "APIRouter"
```

Every edge tagged `EXTRACTED` (explicit in source) or `INFERRED` (resolved by graphify).

### Built-in auto-activating skills

Fire on trigger, no invocation:

| Skill | When it fires |
|---|---|
| Context7 MCP | Any library/framework/SDK/API/CLI question. Fetches current docs before proposing code. |
| `security-and-hardening` | Input handling, auth, data storage, external integrations |
| `debugging-and-error-recovery` | Tests fail, builds break, unexpected errors |
| `git-workflow-and-versioning` | Committing, branching, PRs, releases |
| `code-simplification` | Refactoring for clarity without changing behavior |
| `shipping-and-launch` | Pre-deployment, monitoring, rollout |
| `observability-and-instrumentation` | Adding logging, metrics, tracing |
| `performance-optimization` | Core Web Vitals, N+1 queries, profiling |
| `ci-cd-and-automation` | Build/deploy pipelines, test runners in CI |
| `constraint-driven-development` | Quality bar as written contract, watching for weakened thresholds |

---

## Quick Reference: Flow at a Glance

```
Setup (once)        /setup-matt-pocock-skills
                          |
Library docs        Context7 (before any dependency touch)
                          |
Align                /grill-with-docs
                          |
Spec (if big)       /to-spec
                          |
Implement           /implement
  ├── /tdd              (each slice)
  └── /code-review      (at seams)
                          |
Debug (if broken)   /diagnosing-bugs
                          |
Ship                /code-review (final)
                    git commit + PR
                    /retro (if installed)
                          |
Always on            ponytail (what to write)
                    graphify (what exists)
                    built-ins (security, git, etc.)
```

---

## Quick Reference: Which Skill When

| Situation | First skill |
|---|---|
| Starting a new repo | `/setup-matt-pocock-skills` |
| Any library/framework/SDK question | Context7 (`resolve-library-id` → `query-docs`) |
| Vague request, need to sharpen | `/grill-with-docs` |
| Multi-session work needs a spec | `/to-spec` |
| Ready to build | `/implement` |
| Building one test-first slice | `/tdd` |
| Reviewing a diff or PR | `/code-review` |
| Hard bug, no obvious cause | `/diagnosing-bugs` |
| "What does X connect to?" | `graphify explain "X"` |
| "How do A and B relate?" | `graphify path "A" "B"` |
| "What touches checkout?" | `graphify query "checkout"` |
| Should this code exist? | ponytail (auto, the ladder) |
| Committing / branching | git-workflow (auto) |
| Security audit | security-and-hardening (auto) |
| Pre-deployment | shipping-and-launch (auto) |

---

## Setup Checklist for a New Project

1. Install skills (copy to `~/.config/opencode/skills/`):
   - ponytail, graphify (always-on)
   - setup-matt-pocock-skills, grill-with-docs, grilling, to-spec, implement, tdd, code-review, diagnosing-bugs (workflow)

2. Configure Context7 MCP server in your agent config (fetches library docs on demand).

3. Install graphify CLI:
   ```bash
   uv tool install graphifyy
   graphify install --platform opencode
   ```

3. Run setup:
   ```
   /setup-matt-pocock-skills
   ```

4. Build the graph:
   ```bash
   graphify . --code-only
   ```

5. Write a `DESIGN.md` (use the Stitch 9-section format: Visual Theme, Color Palette, Typography, Components, Layout, Depth, Do's/Don'ts, Responsive, Agent Prompts).

6. Write an `AGENTS.md` with: tech stack, commands, code conventions, design rules, product constraints, error messages, working practices.

7. Start every change with Context7 (if touching a dependency) → `/grill-with-docs`. Never skip.

---

## Pruning Rules

Skills rot. Audit every few weeks:

- **Redundant with AGENTS.md or DESIGN.md?** Delete. One source of truth.
- **Wrong stack?** Delete. shadcn/ui skills are dead weight if the project uses custom CSS.
- **Never invoked in 30 days?** Delete or demote. Skills have a cost: every loaded skill is tokens the model spends on every response.
- **Two skills do the same thing?** Keep one. Direction (what to do) beats filter (what not to do).

Keep the set small: 7-10 on-disk skills + built-ins. More is not better. More is noise.
