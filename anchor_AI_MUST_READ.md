# anchor_AI_MUST_READ.md

AI READ FIRST.

This file is the fast anchor for every future AI session touching the GlobalGrid2050 federation. It is deliberately incomplete today. Correct it as more is proven. Do not wait for perfection before recording the operating law.

## Current known law

GlobalGrid2050 is no longer one monolith. It is becoming a federation of focused repositories connected by explicit data contracts, workflows and catalogue links.

The homepage repo is the public gateway, doctrine layer, catalogue layer and visual consumer of the systems map.

The dedicated data repo `Ventusltd/data-federation-map-for-globalgrid2050-all-repos` owns the backend federation systems map as a DuckDB and Parquet metadata product.

Data repos own data products. They must use declared grain, declared key, compact Parquet where appropriate, read-back verification and audit reports.

UI repos consume data products. They display, filter and format; they do not silently own or redefine data truth.

The old `Ventusltd/globalgrid2050` monolith is a retirement source archive and oracle. It can be inspected, compared against and ported from. It must not be bulk-copied into new repos.

## Current core repos

```text
Ventusltd/globalgrid2050-hompage                       gateway, doctrine, catalogue, visual map consumer
Ventusltd/data-federation-map-for-globalgrid2050-all-repos  federation systems map data product
Ventusltd/globalgrid2050                               old monolith source archive and oracle
Ventusltd/data-gb-electricity                          GB electricity generation and price Parquet data product
Ventusltd/data-interconnectors                         GB interconnector flow Parquet data product
Ventusltd/gb-electricity-ui                            UI reader for GB electricity tracker and generation-history pages
```

## Non-negotiable data rule

Green is not proof.

The proof is the declared data law tested on the declared key after the data has landed.

For Parquet data repos, the pattern is:

```text
fetch or derive fresh source
normalise rows
deduplicate by declared key
rewrite touched partitions fresh
write zstd Parquet
read back with DuckDB
test rows equal distinct keys
test null keys equal zero
write JSON and Markdown reports
commit only after checks pass
```

## Federation map rule

The federation must be drawn like an electrical single-line diagram.

Repos are buses or devices.

Data products are feeders.

Contracts are breakers.

UI repos are loads/readers.

Dependencies are labelled lines with cardinality:

```text
one-to-one
one-to-many
many-to-one
many-to-many
```

A repo can expand infinitely only if it obeys a law: every node has one declared concern, every edge has a declared purpose, every data edge has a source-of-truth owner, and every published dataset has a tested key.

## Million repo scaling answer

A million repos is possible only as a metadata federation, not as one workflow cloning a million repositories.

The scalable method is:

```text
registry or manifest first
GitHub API metadata, not clone by default
sharded traversal
incremental updates
DuckDB ingestion
Parquet snapshots
edge tables for dependencies
reports for changed nodes and failed probes
```

One workflow must never try to clone a million repos. The map builder must track registry rows and metadata shards, then write compact Parquet tables that can be queried by DuckDB.

## Read next

```text
docs/DATA_DISCIPLINE_MANUAL.md
docs/FEDERATION_INSTRUCTION_MANUAL.md
BACKEND_README_NOTES.md
Ventusltd/data-federation-map-for-globalgrid2050-all-repos/README.md
Ventusltd/data-federation-map-for-globalgrid2050-all-repos/DATA_CONTRACT.md
Ventusltd/data-federation-map-for-globalgrid2050-all-repos/scripts/build_federation_map.py
```

## Operating command

Before patching a repo, answer these questions:

```text
What repo am I in?
What is its one concern?
Is this data, UI, doctrine, catalogue, or source archive?
What is the declared source of truth?
What is the grain and key?
What file proves the last successful run?
Am I creating a clean edge or a hidden monolith?
```
