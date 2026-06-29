# GlobalGrid2050 Data Discipline Manual — AI READ FIRST

This is the federation-wide trust manual for GlobalGrid2050.

Every new GlobalGrid2050 data repo, app repo, UI repo, workflow and AI session must treat this file as the first source of doctrine.

The short rule is simple: green is not proof. The only proof is that the data obeys its declared law at its declared grain.

## Why this manual exists

GlobalGrid2050 learned this discipline through a live failure case.

The old monolith grew to thousands of commits and around 180 workflows. It contained real audit instincts, but those checks were scattered across too many scripts, too many repair jobs, too many generated files and too many assumptions.

During the federation into smaller repos, several failures became visible.

A static Parquet package looked valid but carried doubled price rows.

A workflow went green while testing the wrong thing.

Old tripwire numbers such as a fixed file count and fixed total megabytes blocked correct growth.

A Python reader failed because a Hive partition directory name collided with a real in-file column.

A monthly updater existed but had never been proven end to end.

These failures are not embarrassments. They are training data. This manual records the rules that prevent them recurring.

## The federation architecture

The homepage repo is the doctrine and catalogue layer.

Data repos are source-of-truth products for specific domains.

UI repos are readers. They display data but do not own it.

The old monolith is a retirement source archive. It can be inspected and ported from, but it must not be bulk-copied into new repos.

Current core repos:

- `globalgrid2050-hompage`: public gateway, build board, federation doctrine and catalogue.
- `data-gb-electricity`: GB electricity generation, prices and related electricity time-series.
- `data-interconnectors`: interconnector transfer-flow data, separate from generation.
- future UI repo: GB electricity tracker and generation-history UI reading from the data repos.

## Mandatory README pointer for every federation repo

Every new repo must include an AI-visible pointer near the top of its README.

Recommended text:

`AI READ FIRST: This repository follows the GlobalGrid2050 Data Discipline Manual in Ventusltd/globalgrid2050-hompage/docs/DATA_DISCIPLINE_MANUAL.md. Do not patch, port, backfill, schedule, publish or wire UI data until you have read that manual, this README, this repo's CHANGELOG and this repo's source register. Green is not proof. File count is not proof. Size is not proof. The proof is the declared data law tested on the declared key.`

That pointer is not decoration. It is a guardrail for future AI sessions.

## Law 1 — Declare the grain before writing data

Every dataset must declare its grain before data is written.

Examples:

- GB FUELINST grain: one row per periodStartUTC plus fuelType.
- GB FUELHH grain: one row per time plus technology.
- GB prices grain: one row per periodStartUTC.
- Interconnector flow grain: one row per cable plus period.

No repo may claim data is clean until the grain is stated in the README or source register.

## Law 2 — Test the real data law, not a proxy

A green workflow is not proof.

A matching row count is not proof.

A matching file count is not proof.

A matching total megabytes value is not proof.

A chart rendering in the browser is not proof.

For a keyed dataset, the real proof is:

`total rows equals distinct keys`

For any required key field, the null-key count must be zero.

For a settled canary, the canary value must hold exactly.

For a schema contract, the actual schema must match the pinned schema.

Anything else is a monitor or a warning, not the proof of correctness.

## Law 3 — Exact assertions only belong on true invariants

Exact equality checks are powerful and dangerous.

Use exact equality only for things that must never change if the data is valid:

- duplicate key groups must be zero;
- null key fields must be zero;
- schema must equal the pinned schema;
- known settled canaries must hold;
- forbidden raw files must be absent.

Do not use exact equality for growing quantities:

- file count;
- row count across a living dataset;
- total megabytes;
- number of partitions;
- number of source files.

Growing quantities should be floors, bands or anomaly monitors. They can prove that something is suspicious. They do not define truth.

## Law 4 — Reproducible beats uploaded

A static upload is an assertion.

A pipeline that can be rerun and audited is evidence.

A derived dataset must be reproducible from its declared source.

The repo must record:

- source path or endpoint;
- source status;
- grain;
- key;
- schema;
- transformation rule;
- audit report;
- known limitations;
- failure history.

If the method is not documented, the data is not finished.

## Law 5 — Idempotent partition overwrite is the default

For file-based Parquet pipelines, the default safe write pattern is full touched-partition rewrite.

Do not append into a month partition and hope to deduplicate later.

Fetch or derive the full touched period.

Deduplicate by the declared key.

Remove the old touched partition directory.

Write the new partition.

Read it back.

Assert the key law again on the data that actually landed on disk.

If a run repeats, it should converge to the same semantic dataset rather than duplicate rows.

## Law 6 — Write, audit, publish

The mature pattern is Write-Audit-Publish.

Write to a staging area or working tree.

Audit before publishing.

Publish only if every invariant passes.

In a git-based data repo, the commit is the publish boundary. Bad data must fail before commit.

A later maturity step is to write to a staging directory and promote only after checks pass. Until then, readback validation before commit is the minimum acceptable standard.

## Law 7 — Schema is a contract

Published data products need schema-on-write discipline.

A pinned schema should exist for every serious dataset.

If an upstream API adds, removes, renames or changes the type of a field, the pipeline should fail loudly unless the contract has been deliberately changed.

Schema drift is not a cosmetic issue. It can silently corrupt downstream UI and analysis.

## Law 8 — Separation of domains is correctness, not tidiness

Generation is not interconnector flow.

Prices are not generation.

UI is not data ownership.

Research is not a published data product.

Do not blur domain boundaries for convenience.

Data products should be separated where their laws are different.

For example, GB domestic generation and interconnector flows must remain separate because generation is production inside the GB electricity system while interconnectors are cross-border transfer flows.

The UI may display both, but it must fetch them from the correct domain repos.

## Law 9 — One source of truth per dataset

Do not create competing sources for the same facts.

If interconnector flow data is derived from FUELINST interconnector rows, derive it once into `data-interconnectors` and make downstream consumers read that product.

Do not copy the same raw rows into multiple repos.

Do not let app repos become shadow data repos.

If a repo needs a dataset, it should point to the data product that owns it.

## Law 10 — The builder cannot be the sole judge

Internal workflow checks are necessary but not enough.

A builder can test the wrong thing and still go green.

An independent auditor must be able to clone the repo and test the real data law from the outside.

For the current operating model:

- ChatGPT can patch, write scripts, wire workflows and embed fail-loud checks.
- Claude or another independent agent can clone, inspect and verify the real law from a separate checkout.
- The human owner decides whether the evidence is sufficient.

This is separation of duties adapted to a solo founder plus AI workflow.

## Law 11 — Keep workflows few and proven

Do not recreate the monolith's workflow sprawl.

Each data repo should have the smallest viable workflow set:

- one historical backfill or port workflow, if needed;
- one scheduled updater, if needed;
- one audit or verification workflow, if needed.

Every workflow must have a clear purpose, a clear output and a clear failure mode.

Unattended workflows must fail loudly and must not commit unless the checks pass.

## Law 12 — Documentation is part of the deliverable

A data repo is not complete because files exist.

A data repo is complete only when the files, method and proof exist together.

Minimum documentation for a data product:

- README;
- DATA_SOURCES or source register;
- IMPLEMENTATION or derivation notes;
- CHANGELOG;
- audit report;
- schema or contract notes;
- known gaps.

The docs must be written before or alongside the data, not after memory fades.

## Law 13 — UI repos consume, never silently transform truth

UI repos may sort, filter, format and chart.

UI repos must not silently redefine the data law.

If a UI needs annual, monthly or per-cable summaries, those should preferably be produced by a data repo or documented transformation layer, not by opaque browser logic.

The UI should clearly know which data repo owns each dataset.

## Law 14 — Every run leaves an audit trail

Each serious data run should write a JSON audit report with:

- generated UTC timestamp;
- git SHA or script version if available;
- source inputs;
- target months or years;
- row counts;
- distinct key counts;
- duplicate key groups;
- null key rows;
- schema check result;
- canary result where applicable;
- partitions written;
- files changed;
- pass or fail.

A future auditor should be able to answer what changed and why without reading the whole workflow log.

## Law 15 — Snapshot only after proof

A release, DOI, Zenodo archive or long-lived tag should not preserve a dataset until the data law has been verified.

Do not make a permanent archive of a known defect.

The order is:

1. derive or fetch;
2. write;
3. read back;
4. audit;
5. independently verify;
6. commit or tag;
7. snapshot or wire to UI.

## GlobalGrid2050 AI operating protocol

For every new AI session touching repositories:

1. Read this manual.
2. Read the local README.
3. Read the local CHANGELOG.
4. Identify the source of truth.
5. Identify the grain and key.
6. Identify the invariants.
7. Patch only the smallest layer needed.
8. Commit small reversible changes.
9. Report audit numbers, not just status words.
10. Stop for human review before broad cross-repo changes.

## Anti-patterns banned by this manual

Do not bulk-copy the monolith.

Do not let app repos own raw bulk data.

Do not allow one repo to contain every concern.

Do not treat generated file count as truth.

Do not mark a run successful merely because it went green.

Do not create new workflows when an existing proven workflow can be extended safely.

Do not let AI self-certify its own output without evidence.

Do not mix domestic generation and interconnector flows into one generation total.

Do not wire unverified data into a public chart.

## One sentence doctrine

GlobalGrid2050 data is trusted only when its source, grain, schema, transformation, audit and independent verification are visible; everything else is a claim waiting to be tested.
