#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data/federation/repo_registry.csv"
EDGES = ROOT / "data/federation/repo_edges.csv"
OUT = ROOT / "data/federation/system_map"
REPORTS = ROOT / "reports"
JSON_REPORTS = REPORTS / "json"
METHOD_VERSION = "federation_systems_map_v1_duckdb_parquet"


def utcnow() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def sql_path(path: Path) -> str:
    return str(path).replace("'", "''")


def build_map(registry: Path, edges: Path) -> dict[str, object]:
    if not registry.exists():
        raise FileNotFoundError(registry)
    if not edges.exists():
        raise FileNotFoundError(edges)

    OUT.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()

    registry_sql = sql_path(registry)
    edges_sql = sql_path(edges)
    nodes_parquet = sql_path(OUT / "nodes.parquet")
    edges_parquet = sql_path(OUT / "edges.parquet")

    con.execute(f"""
      COPY (
        SELECT
          repo_full_name AS node_id,
          repo_full_name,
          repo_name,
          repo_type,
          domain,
          status,
          source_of_truth,
          grain,
          key_fields,
          owns_data,
          serves_pages,
          notes,
          '{METHOD_VERSION}' AS methodVersion,
          '{utcnow()}' AS generatedUTC
        FROM read_csv_auto('{registry_sql}', all_varchar=true)
      ) TO '{nodes_parquet}' (FORMAT parquet, COMPRESSION zstd)
    """)

    con.execute(f"""
      COPY (
        SELECT
          from_repo || '::' || edge_type || '::' || to_repo AS edge_id,
          from_repo,
          to_repo,
          edge_type,
          cardinality,
          data_product,
          status,
          notes,
          '{METHOD_VERSION}' AS methodVersion,
          '{utcnow()}' AS generatedUTC
        FROM read_csv_auto('{edges_sql}', all_varchar=true)
      ) TO '{edges_parquet}' (FORMAT parquet, COMPRESSION zstd)
    """)

    return verify_outputs()


def verify_outputs() -> dict[str, object]:
    con = duckdb.connect()
    nodes = sql_path(OUT / "nodes.parquet")
    edges = sql_path(OUT / "edges.parquet")

    node_rows, node_keys = con.execute(f"SELECT count(*), count(DISTINCT node_id) FROM read_parquet('{nodes}')").fetchone()
    edge_rows, edge_keys = con.execute(f"SELECT count(*), count(DISTINCT edge_id) FROM read_parquet('{edges}')").fetchone()
    node_nulls = con.execute(f"SELECT count(*) FROM read_parquet('{nodes}') WHERE node_id IS NULL OR node_id = ''").fetchone()[0]
    edge_nulls = con.execute(f"SELECT count(*) FROM read_parquet('{edges}') WHERE edge_id IS NULL OR edge_id = ''").fetchone()[0]
    missing_node_edges = con.execute(f"""
      WITH n AS (SELECT node_id FROM read_parquet('{nodes}')),
           e AS (SELECT from_repo AS node_id FROM read_parquet('{edges}') UNION ALL SELECT to_repo AS node_id FROM read_parquet('{edges}'))
      SELECT count(DISTINCT e.node_id)
      FROM e LEFT JOIN n USING (node_id)
      WHERE n.node_id IS NULL
    """).fetchone()[0]

    duplicate_nodes = int(node_rows - node_keys)
    duplicate_edges = int(edge_rows - edge_keys)
    if node_nulls:
        raise RuntimeError(f"node null keys found: {node_nulls}")
    if edge_nulls:
        raise RuntimeError(f"edge null keys found: {edge_nulls}")
    if duplicate_nodes:
        raise RuntimeError(f"duplicate node keys found: {duplicate_nodes}")
    if duplicate_edges:
        raise RuntimeError(f"duplicate edge keys found: {duplicate_edges}")

    return {
        "nodeRows": int(node_rows),
        "nodeDistinctKeys": int(node_keys),
        "edgeRows": int(edge_rows),
        "edgeDistinctKeys": int(edge_keys),
        "nodeNullKeys": int(node_nulls),
        "edgeNullKeys": int(edge_nulls),
        "duplicateNodeKeys": duplicate_nodes,
        "duplicateEdgeKeys": duplicate_edges,
        "edgeEndpointNodesMissingFromRegistry": int(missing_node_edges),
    }


def write_reports(report: dict[str, object]) -> None:
    REPORTS.mkdir(exist_ok=True)
    JSON_REPORTS.mkdir(parents=True, exist_ok=True)
    (JSON_REPORTS / "FEDERATION_SYSTEMS_MAP_LATEST.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Federation Systems Map Latest",
        "",
        f"Generated UTC: `{report['generatedUTC']}`",
        f"Method: `{METHOD_VERSION}`",
        "",
        "## Verification",
        "",
        f"- Node rows: `{report['verification']['nodeRows']}`",
        f"- Edge rows: `{report['verification']['edgeRows']}`",
        f"- Duplicate node keys: `{report['verification']['duplicateNodeKeys']}`",
        f"- Duplicate edge keys: `{report['verification']['duplicateEdgeKeys']}`",
        f"- Node null keys: `{report['verification']['nodeNullKeys']}`",
        f"- Edge null keys: `{report['verification']['edgeNullKeys']}`",
        f"- Edge endpoint nodes missing from registry: `{report['verification']['edgeEndpointNodesMissingFromRegistry']}`",
        "",
        "## Scaling law",
        "",
        "The federation map is metadata. One million repositories must be tracked by registry rows, shards and Parquet metadata tables, not by cloning every repository.",
    ]
    (REPORTS / "FEDERATION_SYSTEMS_MAP_LATEST.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build GlobalGrid2050 federation systems map")
    parser.add_argument("--registry", default=str(REGISTRY))
    parser.add_argument("--edges", default=str(EDGES))
    args = parser.parse_args()

    verification = build_map(Path(args.registry), Path(args.edges))
    report = {
        "generatedUTC": utcnow(),
        "methodVersion": METHOD_VERSION,
        "registry": args.registry,
        "edges": args.edges,
        "outputs": {
            "nodes": str(OUT / "nodes.parquet"),
            "edges": str(OUT / "edges.parquet"),
        },
        "verification": verification,
        "scalingLaw": "registry plus shards plus Parquet plus DuckDB; never clone one million repos",
    }
    write_reports(report)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
