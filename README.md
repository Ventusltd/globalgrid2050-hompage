# GlobalGrid2050 Homepage

This repository holds the lightweight public homepage shell for GlobalGrid2050.

It is deliberately small. The homepage is not a build system and does not need Jekyll, Node, Python, React or a database server.

## Current structure

```text
globalgrid2050-hompage/
├── index.html
├── assets/
│   ├── dashboard.css
│   └── dashboard.js
└── data/
    └── catalog.json
```

## Purpose

The homepage should stay as a thin dashboard shell:

- `index.html` holds the page frame, heading, search box, menu mount point and small-print disclaimer.
- `assets/dashboard.css` holds the visual style.
- `assets/dashboard.js` loads the catalogue, renders the menu and runs the search.
- `data/catalog.json` is the link catalogue.

This keeps the page maintainable when the catalogue grows to hundreds or thousands of entries.

## Editing rule

For normal dashboard updates, edit `data/catalog.json` only.

Do not add thousands of links directly into `index.html`.

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
          "tags": ["optional", "row", "search", "terms"]
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

No build step is required.

## Governance

Keep changes small and reversible:

1. Edit the catalogue or one small asset.
2. Test the homepage search and drawer behaviour.
3. Commit with a clear message.
4. Avoid broad rewrites unless explicitly approved.
