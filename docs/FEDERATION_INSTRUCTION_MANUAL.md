# GlobalGrid2050 Federation Instruction Manual

Status: living manual. Incomplete by design. Correct it whenever the federation learns more.

Anchor file: `anchor_AI_MUST_READ.md`

Doctrine file: `docs/DATA_DISCIPLINE_MANUAL.md`

## 1. Purpose

This manual explains how GlobalGrid2050 grows from one old monolith into many small repositories without losing truth, auditability or user trust.

The goal is not to create many repositories for fashion. The goal is to separate concerns so every dataset, UI, workflow and public page has a clear owner and a clear law.

## 2. Repo types

```text
homepage repo
  public gateway, catalogue, doctrine, federation systems map

data repo
  source-of-truth data product with declared grain, key, schema, source and audit

UI repo
  reader and renderer of data products; no hidden source-of-truth data ownership

source archive repo
  old monolith or historical reference; may be inspected and compared against but not bulk-copied

research repo or docs repo
  analysis, drafts, design notes; not a published data product unless promoted through data discipline
```

## 3. Current known repository map

```text
Ventusltd/globalgrid2050-hompage
  type: homepage repo
  role: gateway, doctrine, catalogue, federation map

Ventusltd/globalgrid2050
  type: source archive repo
  role: old monolith, source oracle, retirement archive

Ventusltd/data-gb-electricity
  type: data repo
  role: GB electricity generation and system prices in compact Parquet

Ventusltd/data-interconnectors
  type: data repo
  role: GB interconnector transfer flows in compact Parquet

Ventusltd/gb-electricity-ui
  type: UI repo
  role: GB electricity tracker and generation-history display layer
```

## 4. Single-line diagram rule

Draw the federation as if it were an electrical single-line diagram.

```text
source archive / API ---> data repo ---> UI repo ---> homepage catalogue
                         |              |
                         |              +-- reader only
                         |
                         +-- owns data law
```

The homepage may draw the diagram. It must not become the data product.

Data repos are like substations with protection rules.

UI repos are like loads fed from a known breaker.

A dependency without a label is an unsafe cable.

## 5. Cardinality rules

Every edge in the map should declare cardinality.

```text
one-to-one
  one source produces one data product

one-to-many
  one data repo feeds many UI repos or dashboards

many-to-one
  multiple source feeds create one harmonised data product

many-to-many
  only allowed through an explicit contract layer or semantic bridge
```

Hidden many-to-many dependencies are banned because they recreate the monolith in a distributed form.

## 6. Data law before chart law

Charts do not prove data.

The order is:

```text
data source declared
grain declared
key declared
schema declared
transformation method documented
Parquet or other product written
DuckDB/readback verification passed
audit report written
independent review possible
UI wiring only after proof
```

## 7. Parquet and DuckDB standard

For serious tabular time-series or graph-like metadata, the default backend pattern is:

```text
zstd Parquet as storage
DuckDB as local query and verification engine
full touched-partition rewrite
readback validation
JSON + Markdown audit report
```

Raw CSV, JSON or API response files may be temporary inputs or browser delivery products. They are not the source-of-truth data product unless explicitly declared and justified.

## 8. Federation systems map

The homepage repo should maintain a generated systems map with at least two tables:

```text
repo_nodes
repo_edges
```

`repo_nodes` records each repo as a node.

`repo_edges` records dependencies and cardinality.

The generated outputs should include:

```text
data/federation/system_map/nodes.parquet
data/federation/system_map/edges.parquet
reports/FEDERATION_SYSTEMS_MAP_LATEST.md
reports/json/FEDERATION_SYSTEMS_MAP_LATEST.json
```

This map is backend metadata. The public homepage can later read a simplified browser catalogue, but the backend federation map remains the auditable source.

## 9. Million repo scaling law

One million repos cannot be handled by one workflow that clones everything.

A million-repo federation can be tracked only by:

```text
registry-first design
no clone by default
API metadata collection
sharded traversal
incremental refresh
Parquet partitions
DuckDB rollups
failed-probe reports
clear ownership of each node and edge
```

A workflow can track one million repos if the work is split into shards and each shard writes a compact metadata partition. It cannot do it by cloning one million repos or reading every file every month.

Future scaling shape:

```text
data/federation/registry/repo_registry.parquet
 data partitioned by shard or owner

data/federation/system_map/nodes/year=YYYY/month=M/shard=N/data_0.parquet
 data from sharded metadata scans

data/federation/system_map/edges/year=YYYY/month=M/shard=N/data_0.parquet
 dependency edges from manifests and contracts

DuckDB query layer
 composes all shards into current map views
```

## 10. AI operating rules

AI must not invent federation structure silently.

AI must record what it knows, mark what is uncertain, and correct the anchor as better evidence arrives.

AI must avoid broad cross-repo changes without a named scope.

AI must report commits, files and audit numbers, not just reassurance.

## 11. What to correct next

This manual should be corrected when:

```text
a new repo enters the federation
a data contract changes
a UI starts consuming a data repo
a new source of truth is approved
a workflow is proven or retired
a source archive stops being authoritative
the federation map script learns a new edge type
```
