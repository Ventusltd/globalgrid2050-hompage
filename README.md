# GlobalGrid2050 Homepage

This repository holds the lightweight public homepage shell for GlobalGrid2050.

It is deliberately small. The homepage is not a build system and does not need Jekyll, Node, Python, React or a database server.

The public homepage should remain a clean template until new federated dashboard entries are intentionally added.

## Current structure

```text
globalgrid2050-hompage/
├── index.html
├── assets/
│   ├── dashboard.css
│   └── dashboard.js
├── data/
│   └── catalog.json
├── .github/
│   └── workflows/
│       └── pages.yml
├── .gitignore
├── .nojekyll
└── README.md
```

## Purpose

The homepage should stay as a thin dashboard shell:

- `index.html` holds the page frame, heading, introductory paragraph, search box, menu mount point and small-print disclaimer.
- `assets/dashboard.css` holds the visual style.
- `assets/dashboard.js` loads the catalogue, renders the menu and runs the search.
- `data/catalog.json` is the link catalogue.

This keeps the page maintainable when the catalogue grows to hundreds or thousands of entries.

## Current public dashboard state

The public page is intentionally a template.

The catalogue starts empty:

```json
{
  "schemaVersion": "dashboard_catalog.v1",
  "title": "GlobalGrid2050",
  "description": "Structured dashboard catalogue for GlobalGrid2050 links. Initial public catalogue intentionally empty.",
  "areas": []
}
```

Do not re-add old stale links from the original monolith by default. Every new dashboard link should represent a deliberate federation step.

## Editing rule

For normal dashboard updates, edit `data/catalog.json` only.

Do not add hundreds or thousands of links directly into `index.html`.

Do not put federation strategy wording on the public homepage unless explicitly approved. The homepage itself should stay clean and user-facing.

## Catalogue schema

The catalogue uses this pattern:

```json
{
  "schemaVersion": "dashboard_catalog.v1",
  "title": "GlobalGrid2050",
  "areas": [
    {
      "name": "Area name",
      "tags": ["optional", "search", "terms"],
      "children": [
        {
          "name": "Visible link title",
          "url": "./relative/path/",
          "note": "optional status note",
          "tags": ["optional", "row", "search", "terms"],
          "repo": "optional repo name",
          "status": "optional status"
        }
      ]
    }
  ]
}
```

Required fields:

- `areas[].name`
- `areas[].children[].name`
- `areas[].children[].url`

Optional fields:

- `tags`
- `note`
- `repo`
- `status`

The renderer includes `name`, `note`, `tags`, `repo` and `status` in the search index.

## Federation plan

GlobalGrid2050 is being split from one large source repository into smaller repositories divided by area of concern.

The purpose is not to duplicate the old monolith. The purpose is to create a maintainable hub-and-spoke system where each repo has one clear job and this homepage becomes the lightweight public dashboard.

### Target shape

```text
Homepage / dashboard repo
└── globalgrid2050-hompage
    ├── thin static homepage
    ├── searchable catalogue
    └── links to federated repos and live pages

App repos
├── app-solar-bess-topology
├── app-uk-energy-tracking
├── app-cable-tools
├── app-pricing-tools
├── app-planning-requirements
└── app-reference-knowledge

Data repos or external storage
├── data-energy-timeseries
├── data-grid-networks
├── data-context-layers
├── data-repd
└── object storage for large raw files, map tiles and regenerated bulk data
```

Naming can be adjusted later, but the rule is stable: one repo should have one clear concern.

### What belongs in this homepage repo

This repo should contain only:

- the homepage shell;
- dashboard CSS and JavaScript;
- the dashboard catalogue;
- small documentation needed to continue the federation work;
- lightweight GitHub Pages deployment configuration.

This repo should not contain:

- raw Elexon data;
- raw PV data;
- raw basemaps;
- large CSV archives;
- heavy GeoJSON;
- copied app directories from the old monolith;
- generated bulk outputs;
- unrelated project working files.

### Migration principle

Move by concern, not by convenience.

Each new repo should be created only when its scope is clear:

```text
one app or data domain
one README
one live Pages target if needed
one small catalogue entry in this homepage repo
one verification step
```

Do not bulk-copy the old source tree into new repos.

Do not clone the giant old source repository in a fresh AI session unless explicitly instructed. Prefer fetching specific files or directories through GitHub tooling, then migrate only the small, reviewed scope.

### Recommended migration order

#### Phase 0 — Freeze the homepage template

Status: mostly done.

The homepage repo now has a scalable catalogue structure. The public catalogue is empty, so new entries can be counted cleanly as federation proceeds.

Next actions:

1. Keep `index.html` stable.
2. Keep public dashboard entries at zero until a first federated repo is ready.
3. Use `data/catalog.json` as the only place to add dashboard entries.

#### Phase 1 — Move simple static work first

Move the simple tools and pages that do not depend on large file storage first.

Good first candidates:

- small static calculators;
- cable and conductor reference pages;
- pricing tools with compact data;
- knowledge/reference pages;
- small public documentation sections;
- self-contained HTML/JS tools with no large data dependency.

Reason:

- proves the repo federation pattern quickly;
- keeps early repos small;
- avoids blocking on storage architecture;
- gives the homepage real dashboard entries;
- reduces AI context and review burden.

Decision rule:

```text
If a module is mostly HTML/CSS/JS/Markdown and has no heavy data payload, it can move early.
```

#### Phase 2 — Audit large data separately

Large file storage should be solved as a parallel track, not by copying bulk into the homepage or app repos.

Data-heavy areas need audit first:

- Elexon half-hourly / 5-minute generation history;
- long price/carbon timeseries;
- PV Live history;
- REPD derived datasets;
- roads, rail, basemaps and heavy GeoJSON;
- any file approaching GitHub warning or practical browser limits.

Decision rule:

```text
If the module depends on raw time-series, raw basemaps or large generated data, do not migrate it as a normal app repo until the data-storage rule is decided.
```

Storage direction:

- commit compact reviewed facts where appropriate;
- regenerate raw bulk on demand where possible;
- keep heavy raw data out of app repos;
- use data repos only for compact versioned datasets;
- use object storage or releases for large raw files where required;
- keep the browser path small and fast.

#### Phase 3 — Move data-light apps into their own repos

After the simple static tools prove the pattern, migrate larger but still manageable app modules.

Each app repo should include:

```text
index.html or app entry point
assets/
data/ only if compact and app-specific
README.md
.github/workflows/pages.yml if Pages is needed
.nojekyll if plain static
```

Each completed app repo should then get one catalogue entry in this homepage repo.

#### Phase 4 — Move data-heavy apps only after storage rules are settled

Do not move the UK energy tracker or generation-history style modules until their data dependencies are understood.

For data-heavy apps, split the app from the data:

```text
app repo = UI and logic
data repo / object storage = compact facts, datasets, large files or regenerated outputs
homepage repo = link to the live app
```

The app should fetch compact data by URL rather than carrying raw bulk in the app repository.

#### Phase 5 — Add catalogue automation later

Manual catalogue entries are acceptable at the beginning.

When there are many federated repos, consider adding a generated catalogue process:

```text
repo manifest files → index builder → data/catalog.json → homepage dashboard
```

Do not automate this before the manual pattern is proven.

## Simple-first versus storage-first decision

The recommended path is:

```text
Move simple, data-light work first.
Audit and design large-file storage in parallel.
Do not move data-heavy apps until storage rules are clear.
```

Reason:

- simple repos prove the federation pattern immediately;
- the homepage starts gaining clean counted entries;
- large storage mistakes are avoided;
- the old monolith remains available as the source archive;
- heavy data can be handled deliberately rather than dragged into every new repo.

Do not let the large-file problem block every small migration. Also do not pretend the large-file problem is solved by repo splitting alone.

## New AI session continuation prompt

Use this prompt in a fresh context window:

```text
You are continuing the GlobalGrid2050 repo federation work.

Do not clone the old giant repository unless explicitly instructed.

Work from the lightweight homepage repo:
https://github.com/Ventusltd/globalgrid2050-hompage

Read README.md first.

The homepage is a template. Keep the public page clean: header, intro, search box, empty dashboard area, disclaimer.

The dashboard catalogue lives in data/catalog.json and currently starts empty.

Task: migrate one small data-light area of concern into its own repo or prepare the next small migration plan. Do not bulk-copy old stale links. Do not migrate raw large data. Do not rewrite the homepage shell unless required.

Allowed actions:
- inspect specific source files by GitHub path;
- create or update one small repo/component;
- add one verified catalogue entry only after the target exists;
- update README notes if the federation plan changes.

Forbidden actions:
- clone or copy the full old monolith by default;
- add old stale dashboard links in bulk;
- move raw Elexon/PV/basemap bulk data into this homepage repo;
- expose personal names without explicit approval;
- rewrite working files broadly.

Stop condition:
Produce one small reversible artefact, record the change, and stop for human review.
```

## Scaling rule

When `data/catalog.json` becomes too large for comfortable review, split it into smaller files under `data/catalog/`, for example:

```text
data/catalog/
├── solar-bess.json
├── uk-grid-tracking.json
├── cables.json
├── pricing.json
├── planning.json
├── reference.json
└── media.json
```

At that point, update `assets/dashboard.js` to load multiple catalogue files and merge them in the browser.

## Deployment

GitHub Pages can serve this repository as a plain static site from `main`.

No build step is required for the homepage itself.

If GitHub Pages is manually configured from the repo settings, the static page can be served directly. A workflow may exist for Pages deployment, but manual Pages configuration may still be required in GitHub settings.

## Governance

Keep changes small and reversible:

1. Edit the catalogue or one small asset.
2. Test the homepage search and drawer behaviour.
3. Commit with a clear message.
4. Avoid broad rewrites unless explicitly approved.
5. Add dashboard entries only when the linked repo or live page exists and has been checked.

The homepage repo is the dashboard shell. It is not the place to solve raw data storage, and it is not the place to park old monolith content.
