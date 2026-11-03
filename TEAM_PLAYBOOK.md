# Team playbook: how to actually pass

## Read this first: Git is 30 points and the biggest risk
The rules say a **big upload near the deadline**, **all commits from one person**, and **commits made for someone else** get severe deductions. An inactive member gets **0**. So the old plan ("finish everything today, Ijan pushes the base, everyone pastes one file") is dangerous.

- Each person must make **several real commits from their own laptop** across the whole project period, not one per person.
- **Do not fake or backdate commits, and never commit for a teammate.** It is dishonest and graders will compare Git history with who can explain the code.
- If you are late, spread the work over the days you really have. Each commit should be a genuine step (schema, model, controller, route, screen, fix).
- **Not counted at all:** squash-merged PRs, `Co-authored-by`, and edits made in the GitHub web editor.

## One-time setup (everyone)
```bash
git config user.name "Your Name"
git config user.email "the-email-linked-to-YOUR-github"   # check this on every borrowed PC
git config user.email                                       # verify
```
Ijan: create the repo, push the base (this project's shared files), then in GitHub Settings -> Branches protect `main` (require a pull request). Add the 5 teammates as collaborators.
Ijan base commit(s): `package.json`, `.env.example`, `.gitignore`, `config/`, `utils/`, `middleware/`, `server.js` (split into 3-4 commits: `chore:`, `feat:`).

## Daily workflow
```bash
git checkout main && git pull origin main
git checkout -b feature/<name>-<purpose>        # e.g. feature/gemina-trust-score
# work, then commit small and often:
git add <files> && git commit -m "feat: add recomputeTrust with tier thresholds"
git push origin feature/<name>-<purpose>
# open a Pull Request, a DIFFERENT person reviews it, merge with "Create a merge commit" (NEVER "Squash")
```
Prefixes: `feat:`  `fix:`  `refactor:`  `docs:`

## Merge order (matters, other slices call these)
1. Ijan: base + core (users, auth, `middleware/auth.js`, `core.js`, `index.html`)
2. Cabugnason: `auditModel.js` and `notificationModel.js` FIRST (everyone calls `Audit.log` / `Notify.create`), then chat and workflow
3. Ib-Ib (zones) and Dinglasan (listings)
4. Espiritu (meetups; needs zones + listings)
5. Gemina (reviews; needs completed meetups)
`server.js` mounts a route file only if it exists, so the app still starts while branches are being merged.

## Suggested commit plan per member (5-8 commits each, spread over several days)
Split each member's files like this. Every bullet is its own commit on your own branch.

- **Ijan:** repo base; `schema/01_core.sql` + seed; `userModel`; `authController` + routes (register/login); JWT `middleware/auth.js`; admin routes (list/update/deactivate); `core.js` + `index.html`; README ownership matrix.
- **Ib-Ib:** `schema/02_zones.sql` + seed; `zoneModel` read + LEFT JOIN report; create with operating hours (transaction); update + deactivate; controller validation + routes; `zones.js` screen.
- **Dinglasan:** `schema/03_listings.sql` + seed; `listingModel` RIGHT JOIN report; create/update; owner check (403) + soft delete; images endpoint; `listings.js` screen.
- **Espiritu:** `schema/04_meetups.sql` + seed; INNER JOIN report; `assertSlotAvailable` (open hours); capacity + double-booking rules; create with transaction + zone lock; reschedule (PUT); status transitions (PATCH) + check-in; `meetups.js` screen.
- **Cabugnason:** `schema/05_chats.sql` + seed; `auditModel`; `notificationModel`; chat CRUD; FULL OUTER JOIN audit report; `workflowModel` auto-expiry + route + timer in `server.js`; `chats.js` screen.
- **Gemina:** `schema/06_reviews.sql` + seed; leaderboard LEFT JOIN; create review with rules; `recomputeTrust`; update/delete + recompute; validation + routes; `reviews.js` screen.

Everyone: review at least one teammate's PR (rotate: Ijan -> Ib-Ib -> Dinglasan -> Espiritu -> Cabugnason -> Gemina -> Ijan).
Weekly check on up-to-date `main`: `git shortlog -sne --no-merges HEAD` (6 people: fair share about 17%, under 8% is a red flag).

## Before the deadline (Section 9 checklist)
- [ ] Your own commits, from your own machine, spread over time; PRs merged with a merge commit
- [ ] You are filled in on the ownership matrix in README (GitHub username column)
- [ ] `npm install`, import `database/bentahub_full.sql`, `npm start`, and **click through every screen** with seeded data
- [ ] `.env` is NOT committed; `.env.example` is
- [ ] Everything you want graded is merged into `main` before the code deadline (1 week before finals week)

## Defense prep (90 points are individual)
Expect: "explain this file" (git blame), "change this join / add a field / return a different status code" live, and questions on normalization and status codes. Practice these live edits on **your own** slice without notes:
- Add a column (e.g. `listings.condition`) to schema + model + controller + screen.
- Change your join (e.g. make your LEFT JOIN an INNER JOIN and explain which rows disappear).
- Return 404 vs 400 vs 409 and say why.

Everyone must be able to explain in about 2 minutes: the ER diagram, one request end to end (screen -> route -> controller -> model -> DB), and the unique feature.

**Demo script (group, 12 min):** log in as `ijan` -> create listing -> book meetup (201) -> book clashing meetup (**409**) -> confirm, check in, complete -> review as `gemina`/buyer -> leaderboard changes -> run expiry workflow -> audit report (FULL OUTER, SYSTEM row) -> show Network tab for one call -> ER diagram + MVC in one minute. Keep screenshots as plan B.

## Per-person quick answers
- **Why LEFT JOIN for zones?** We want every zone, even ones with 0 meetups.
- **Why RIGHT JOIN for listings?** Start from listings so uncategorized ones are not lost.
- **Why UNION for FULL OUTER?** MySQL has no FULL OUTER JOIN; LEFT JOIN UNION RIGHT JOIN gives the same rows.
- **Why soft delete?** Other tables (meetups, reviews, audit) still reference the row.
