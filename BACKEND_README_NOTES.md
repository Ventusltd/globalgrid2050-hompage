# BACKEND_README_NOTES.md

Status: living backend notes. Incomplete. Correct as the federation learns.

AI READ FIRST: the backend of GlobalGrid2050 is the repo federation plus data law, not a server hidden behind the homepage.

## Current backend doctrine

The homepage repo is the gateway and doctrine layer.

The backend data layer is made of focused repositories, not one database server and not one monolith.

The current proven backend data style is:

```text
fresh source fetch or declared source port
normalisation by domain
zstd Parquet output
DuckDB rollups and readback verification
declared key tests
JSON and Markdown audit reports
small scheduled workflows
```

## Current backend repos

```text
data-gb-electricity
  GB electricity FUELINST, FUELHH and prices.
  Proven Parquet and DuckDB discipline.

data-interconnectors
  GB interconnector flows.
  Uses fresh Elexon FUELINST INT rows, Parquet, DuckDB rollups and monolith reconciliation.

gb-electricity-ui
  UI reader only.
  Must wait for clean data products before chart wiring.

globalgrid2050
  old monolith source archive and oracle.
  Do not bulk-copy it.
```

## Backend expansion law

Every new backend repo must answer:

```text
What is the one concern?
What is the source of truth?
What is the grain?
What is the key?
What is the schema?
What is the workflow?
What is the audit report?
What downstream repo consumes it?
```

If these are not answered, the repo is not yet a data product.

## Federation map target

The homepage repo should generate a backend systems map from registry files and GitHub metadata.

Minimum tables:

```text
repo_nodes
repo_edges
```

Minimum backend products:

```text
data/federation/system_map/nodes.parquet
data/federation/system_map/edges.parquet
reports/FEDERATION_SYSTEMS_MAP_LATEST.md
reports/json/FEDERATION_SYSTEMS_MAP_LATEST.json
```

## Million repo note

One million repos can be tracked only as metadata, not by cloning.

Use registry rows, API metadata, shards, Parquet partitions and DuckDB. Never build a workflow that clones every repo.
