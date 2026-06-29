# Research Foundation for a Bulletproof Data-Discipline Manual (GlobalGrid2050)

## TL;DR

- The disciplines GlobalGrid2050 learned the hard way map cleanly onto established, named frameworks: the DAMA/Wang–Strong data-quality dimensions (test on the real grain, not proxies), Chad Sanderson’s data contracts (schema-on-write enforcement), Maxime Beauchemin’s functional data engineering (idempotent whole-partition overwrite), Netflix’s Write-Audit-Publish pattern (validate before publish), and IV&V / four-eyes / reproducible-builds (the builder cannot be the sole judge — only an independent rebuild detects shared-assumption corruption).
- The single most important principle: **exact-equality assertions belong only on true invariants (uniqueness keys, schema, settled-history canaries); growing quantities (row/file counts, MB) must be floors or anomaly bands** — this is the assertion-vs-monitor distinction, and conflating them is exactly what broke the predecessor monolith’s hardcoded 319-file / 45 MB checks.
- For a solo+AI team, the consensus is to keep a minimal proven workflow set, gate every commit on fail-loud CI (`set -euo pipefail`), capture a per-run audit/lineage manifest (OpenLineage run/job/dataset facets), snapshot citable releases (DOI/DVC), and adopt the data-mesh “data as a product / DRY-for-data” discipline (one source of truth per dataset) while avoiding over-decomposition.

## Key Findings

1. **Data quality dimensions are standardized and each maps to a concrete test.** The DAMA UK six (accuracy, completeness, consistency, timeliness, validity, uniqueness) and the academic Wang & Strong (1996) framework give a citable taxonomy. The decisive lesson is to test the *real key/grain*, not proxies.
1. **Data contracts = schema-on-write enforcement that fails loudly.** Sanderson’s contract spec (schema + business logic + SLA), enforced in CI/CD, plus pinned schemas and explicit compatibility modes (Confluent’s BACKWARD default; ODCS v3.1.0 as a standard).
1. **Invariants vs monitors is the core discipline.** Exact assertions on invariants; floors/bands/ML anomaly detection on moving quantities.
1. **Idempotency via whole-partition overwrite (Beauchemin).** Pure tasks, immutable partitions, rebuild-from-source.
1. **Write-Audit-Publish (Netflix, 2017).** Stage → validate → publish only on pass; translatable to git branches/staging dirs.
1. **Separation of duties / IV&V.** The builder must not be the sole judge; only independent verification catches shared-assumption blind spots.
1. **Fail-fast CI.** `set -euo pipefail`, blocking gates, data-diff regression testing.
1. **Data mesh / domain decomposition.** Domain ownership, data as a product, DRY-for-data; avoid over-splitting.
1. **Provenance & reproducibility.** OpenLineage facets, run manifests, DOI/DVC snapshots.
1. **Governance for solo+AI.** Minimal workflow set, human decision-maker, docs as deliverable.

## Details

### Area 1 — Canonical data quality dimensions and how to test them

The DAMA UK Working Group (2013) and DAMA-DMBOK (2nd ed., 2017) define six primary dimensions: accuracy, completeness, consistency, timeliness, validity, uniqueness.  In 2020 the Data Management Association (DAMA) developed a list of 65 dimensions and subdimensions, ranging from “Ability” to “Identifiability” to “Volatility” (DATAVERSITY, “Data Quality Dimensions,” dataversity.net) — useful context that the “big six” are a deliberately small, operational subset of a much larger taxonomy.

The academic anchor is Wang & Strong, “Beyond Accuracy: What Data Quality Means to Data Consumers,” *Journal of Management Information Systems* 12(4):5–33, Spring 1996 (DOI 10.1080/07421222.1996.11518099). Per the authors’ MIT TDQM primary text, “the final second survey questionnaire included 118 data quality attributes,” consolidated into 15 dimensions across four categories: intrinsic DQ (data have quality in their own right), contextual DQ (quality must be considered within the task at hand), representational DQ, and accessibility DQ. “Fitness for use” is the operative definition, and it is context-dependent — the same dataset can be high quality for one use and inadequate for another.

Mapping to automated tests:

- **Uniqueness** → `COUNT(DISTINCT key) = COUNT(*)` on the real composite key. This is precisely the test that caught GlobalGrid2050’s duplicate-row bug; row counts, file counts, and green CI all missed it.
- **Completeness** → not-null on required columns; partition/period coverage (e.g., every settlement period present).
- **Validity** → type/range/enum checks (dbt `accepted_values`, Pandera `Check.isin`).
- **Consistency** → cross-table referential checks (dbt `relationships`).
- **Timeliness** → freshness (max timestamp vs now).
- **Accuracy** → reconciliation against an authoritative source (hardest; usually proxied).

Tooling: dbt ships four generic tests (`unique`, `not_null`, `accepted_values`, `relationships`)  with `severity: warn|error`, each compiling to SQL returning pass/fail. Great Expectations is Python-first “Expectations” with detailed reports (steeper learning curve for small teams). Pandera validates dataframes with `DataFrameSchema`/ `DataFrameModel`, supporting `coerce`, `strict`, `unique`, and `lazy=True` (collect all failures), plus a PyArrow backend — well-suited to a DuckDB/PyArrow stack. Soda uses SodaCL declarative checks (accessible to non-engineers). Deequ (AWS, Spark) does “unit tests for data” at scale, premised on catching errors *before* downstream consumption. Experts agree these are complementary, not competitive — choose by stack fit, not a single “best” tool.

### Area 2 — Data contracts and schema-on-write

Chad Sanderson (former head of data at Convoy; “The Rise of Data Contracts”; book *Data Contracts: Developing Production-Grade Pipelines at Scale*, O’Reilly, with Mark Freeman and B.E. Schmidt) defines a contract as two parts: **spec + enforcement/validation mechanism**. The spec covers three enforceable aspects — schema (column names, data types, variables), business logic, and SLAs. Sanderson’s prescription: the spec “should be defined in code, stored in a central repository, and version-controlled,” preferably YAML (translatable to Protobuf/Avro/JSON Schema), with enforcement “as upstream/left as possible” in CI/CD as preventative checks (blocking or informational). This is the “shift-left” movement — the data industry’s DevSecOps analogue, using automation to make producers account for downstream needs. Contracts are best initially defined by consumers (who have expectations) but ultimately owned by producers.

**Schema-on-write** (validate before storing; reject nonconforming data — the “bouncer at the club”) vs **schema-on-read** (store raw, apply schema at query — the “warehouse”). Schema-on-write is rigid but safe; schema-on-read is flexible but risks “data swamps.” For a *trusted published product*, schema-on-write is correct: pin the schema and fail on drift.

The **Open Data Contract Standard (ODCS)**, maintained by Bitol under the Linux Foundation AI & Data (originally PayPal’s data-mesh contract template),  is current at **v3.1.0, released December 8, 2025** (Apache 2.0; media type `application/odcs+yaml;version=3.1.0`). Per Bitol’s announcement it is “a real standard supported by a Technical Steering Committee of 16 people from 14 different companies in Europe, America, and Asia” (Dr. Simon Harrer). A contract YAML has 11 sections including Fundamentals, Schema (logical + physical types), Data Quality (plain text, SQL, or predefined attributes such as `rowCount`, `unique`, `freshness`), and a Service-Level Agreement section (v3.1.0 adds executable SLAs).

**Schema compatibility semantics** (Confluent Schema Registry; default is BACKWARD — see <https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html>):

- **BACKWARD**: “consumers using the new schema can read data produced with the last schema”; allows adding optional fields and removing fields; **upgrade consumers first**.
- **FORWARD**: “data produced with a new schema can be read by consumers using the last schema”; allows adding fields and removing optional fields; **upgrade producers first**.
- **FULL**: both backward and forward compatible — add/remove optional fields only; upgrade order independent.
- **NONE**: “New schema can be any valid schema” — no checking.
- **TRANSITIVE** variants check against *all* prior versions, not just the last. (For Kafka Streams only BACKWARD is supported; for Protobuf, BACKWARD_TRANSITIVE is best practice.)

For GlobalGrid2050: pin the Parquet schema as a contract; on monthly update, fail loudly if column names/types drift. Choose a compatibility posture explicitly — for an append-only settled-history product, FORWARD/FULL on additive columns is the safe stance.

### Area 3 — Invariants vs monitors

This is the precise principle behind GlobalGrid2050’s “snapshot vs invariant” lesson. An **invariant** is a property that must hold for every valid version of the dataset forever — uniqueness of the key, schema/types, a settled-history canary value that must never change once final. These get **exact-equality assertions**. A **moving quantity** (row count, file count, total MB, latest timestamp) legitimately grows; asserting exact equality on it (the hardcoded 319 files / 45 MB) guarantees a future false failure when source data legitimately grows. Moving quantities get **floors** (≥ last known), **bands** (within X% / σ of trend), or **ML anomaly detection**.

Tool support: dbt tests are assertions (pass/fail); dbt-expectations and Elementary add anomaly monitors and volume/freshness baselines. Monte Carlo coined “data observability,” mirroring software observability, with **five pillars — freshness, volume, schema, distribution, lineage ** — using ML to learn normal patterns and auto-tune thresholds rather than hard-coding rules (reducing alert fatigue vs static thresholds). Elementary is an open-source dbt-native package storing test-result history and adding anomaly detection inside the warehouse; Anomalo focuses on content “unknown-unknowns.” The community split: assertions for known-knowns/invariants; monitors/observability for unknown-unknowns and moving quantities. They are complementary layers, not substitutes — a row-count *floor* is an assertion; a row-count *trend deviation* is a monitor.

### Area 4 — Idempotency and functional data engineering

Maxime Beauchemin (creator of Apache Airflow and Superset), “Functional Data Engineering — a modern paradigm for batch data processing” (Medium), is the canonical source. He writes: “Thinking of partitions as immutable blocks of data and systematically overwriting partitions is the way to make your tasks functional. A pure task should always fully overwrite a partition as its output.”  Tasks should be pure and idempotent so that “re-running a task is safe and won’t lead to double-counting or any other form of bad state.” Two principles (per the widely cited “Functional Data Engineering — A Blueprint”): **reproducibility** (every task deterministic and idempotent) and **re-computability** (rebuild the desired state from source after logic changes or bugs — e.g., create ARR_v2 and recompute from the start of the date partition).

For GlobalGrid2050 this is the direct antidote to the duplicate-compounding failure: **whole-partition overwrite + key dedup** means re-runs converge to the correct state rather than accreting duplicate rows. Hive-style `dataset=/year=/month=` partitioning makes each partition the immutable unit of overwrite.

### Area 5 — Write-Audit-Publish and staging

WAP originated at Netflix (2017 talk “Whoops, the numbers are wrong! Scaling data quality @ Netflix”).  Three stages: **Write** to an isolated branch/snapshot; **Audit** with data-quality checks; **Publish** (fast-forward to main) only if checks pass, else discard the branch. Apache Iceberg (created at Netflix) implements it natively via branching and the `spark.wap.branch` config — write to a hidden snapshot, audit, then `fast_forward("main", "wap_staging")` on pass or `remove_branch` on fail. lakeFS/Nessie/Dremio/AWS Glue Data Quality and Bauplan (“git-for-data”) provide equivalents. WAP is explicitly analogous to CI/CD staging→prod and to blue-green deployment.

Translation to git+Parquet+Actions: write the new/updated partitions to a **staging path or branch**, run the full invariant + contract suite against it, and only `git commit`/merge to the published path/branch on green. This makes corruption impossible to publish silently — it can only turn CI red.

### Area 6 — Separation of duties / independent verification

**Independent Verification & Validation (IV&V)** is the formal practice: an entity organizationally and (ideally) financially separate from the developers evaluates correctness. NASA’s Shuttle program and DoD/government IT define up to three levels of independence — technical, managerial, financial — with the principle that “IV&V provides objectivity by reporting independently to an organization that is separate from the development organization.” The **four-eyes principle** and code review embody the same idea at smaller scale.

The deepest evidence comes from **reproducible builds** (reproducible-builds.org; Debian; the SLSA framework, which includes verified reproducible builds at its highest assurance level). The core insight: publishing source is *insufficient* because the build pipeline sits between audited code and the running artifact; only an *independent rebuild* producing bit-for-bit identical output (verified by cryptographic hash) proves no tampering. As reproducible-builds.org puts it, this creates “an independently-verifiable path from source to binary code,” enabling “crowdsourced verification” that reduces dependence on any single trusted builder. (Published reproducibility rates are high but version-specific — for example, reproducible-builds.org states “94% of packages in Debian are reproducible in our tests” — so cite the live dashboard for current figures rather than a fixed percentage.)

This is the structural justification for GlobalGrid2050’s builder/auditor split. The builder AI’s in-workflow checks passed green while data was corrupt because the checks **shared the builder’s assumptions**; only an independent external clone testing the real data law (`distinct-key = row-count`) caught it. A self-audit has a structural blind spot: it cannot test assumptions it does not know it is making. **The auditor must be a separate agent, testing from an independent clone, with independently written checks** — never sharing a code module with the builder’s validation.

### Area 7 — Fail-fast / defensive CI

`set -euo pipefail` is the canonical Unix fail-fast idiom: `-e` exits on any non-zero command; `-u` errors on undefined variables (catching typos like a misspelled variable name); `-o pipefail` propagates failure from any stage of a pipe (without it, `grep some-string /non/existent/file | sort` returns exit 0 and masks the error). The philosophy (Aaron Maxwell’s widely cited “unofficial bash strict mode”): “have it fail explicitly and immediately, rather than create subtle bugs that may be discovered too late.”  Bash style guides advise “Always use set -eo pipefail. Fail fast and be aware of exit codes. Use `|| true` on programs you intentionally let exit non-zero.” Watch `set -e` side effects (e.g., arithmetic `((i++))` returning non-zero can abort a script). **Caveat: GitHub Actions’ default shell pipefail behavior has been reported as inconsistent with its documentation (actions/runner issue #1955), so set it explicitly in every workflow step.**

**Data-diff regression testing** (Datafold `data-diff`, open source + Cloud) compares datasets value-by-value in CI, catching “value-level issues that traditional schema tests and row-count checks miss”  — null shifts, broken joins, silent schema changes. **Git scraping** (Simon Willison, coined Oct 2020; adopted by GitHub as “Flat Data” in 2021) is the technique of snapshotting a data source to a git repo via scheduled Actions, giving a free, time-stamped historical record. The known pitfall — which GlobalGrid2050 hit at scale — is that “you’ll end up with a lot of Git commits over time depending on how often your job runs,” producing commit/history bloat (the monolith’s auto-commits firing multiple times per hour).

### Area 8 — Data mesh / domain decomposition

Zhamak Dehghani (Thoughtworks, coined 2019; *Data Mesh*, O’Reilly) defines four principles (per her Martin Fowler article): **domain-oriented decentralized data ownership and architecture, data as a product, self-serve data infrastructure as a platform, and federated computational governance.** A data product is “the smallest unit of architecture that encapsulates all the structural elements needed for sharing that data” (an “architecture quantum”). This justifies separating **generation/nodes** (GB electricity time-series) from **interconnector flows/edges** into distinct domain repos. **DRY-for-data:** don’t re-source the same rows into multiple products — the interconnectors edge-list is *derived once* from FUELINST, never re-scraped, eliminating divergence between products.

Critiques are significant and well-documented. Data mesh “presumes an organization organized in cross-functional teams along the seams of business capabilities”; for small/solo setups the academic gray-literature review flags **data duplication** (domains copying source data, increasing cost), **inconsistent definitions** (“data swamp all over again”), and over-decomposition. Consensus: decompose along *stable domain seams*, keep **one source of truth per dataset**, and avoid splitting beyond what genuine ownership boundaries justify — treat mesh as a decomposition heuristic, not dogma.

### Area 9 — Provenance, lineage, audit trails, reproducibility

**OpenLineage** (LF AI & Data graduate project) is the open standard: a generic model of **Run, Job, Dataset** entities — datasets/jobs identified by `namespace`+`name`, runs by a UUID `runId` — enriched by **Facets**. Key facets: job `sourceCodeLocation`  (captures git SHA), run `nominalTime` / `parent` / `errorMessage` / `sql`, dataset `schema`, and output `outputStatistics` (“the size of the output written to a dataset (row count and byte size)”). Metadata is **additive ** across START/COMPLETE/FAIL events. Consistent naming is essential — inconsistent namespaces produce disconnected lineage nodes.

For a pipeline meant to run **unattended for years and be independently reproducible/forkable**, capture per run an audit JSON containing: git SHA of the pipeline code, source URL/version, run timestamps (nominal + actual), row and partition counts written, output byte size, schema hash, and the **pass/fail result of every invariant check**. **DVC** (Data Version Control) versions data alongside git (human-readable `.dvc` metafiles committed to git as placeholders; content in remote storage; `dvc checkout` restores by git tag) and is itself citable (Zenodo DOI 10.5281/zenodo.11266562).  **Zenodo** issues a distinct DOI per version, enabling citable, reproducible snapshots and credit attribution for forkable open data.

### Area 10 — Governance for solo + AI

The monolith’s ~180 workflows and constant auto-commits are the anti-pattern: workflow proliferation plus history bloat. The cross-source consensus for small/solo+AI teams:

- Keep a **minimal, proven workflow set** — ideally one historical backfill + one scheduled updater per repo.
- A **human decision-maker** owns merges and schema/contract changes; AI assistants build and audit but do not unilaterally approve irreversible or schema-level changes.
- **Documentation is a deliverable**: README, CHANGELOG, data definitions/dictionary, and a runbook.
- **No unattended commit without verification** — every automated commit must pass the same blocking gates as a human PR.
- Governance should be **automated/policy-driven (contracts-as-code)** rather than approval-driven, but with a human in the loop for irreversible changes. As Sanderson frames it, “Policies don’t scale when they live in wikis or checklists… but they do scale when they’re encoded directly into CI/CD.”

## Recommendations

**Stage 1 — Codify the laws (immediately).** Write the manual as numbered laws, each with rationale + concrete test + failure mode prevented. Minimum set:

1. **Test the grain:** `COUNT(DISTINCT key)=COUNT(*)` on the real composite key (prevents the duplicate-row bug that green CI, row counts, and file counts all missed).
1. **Exact assertions only on invariants** (key, schema, settled-history canary); **floors/bands on moving quantities** (prevents the 319-file / 45 MB breakage on legitimate growth).
1. **Idempotent whole-partition overwrite + dedup** (prevents duplicate compounding on re-runs).
1. **Independent auditor:** separate agent, separate clone, independently written checks (prevents the self-audit shared-assumption blind spot).
1. **Fail loud:** `set -euo pipefail`, non-zero exit turns CI red (prevents silent corruption); set pipefail explicitly in every Actions step.
1. **Write-Audit-Publish:** publish only on green; never commit unvalidated data.
1. **DRY-for-data:** one source of truth per dataset; derived products (interconnectors edge-list) reference/derive, never re-source.
1. **Minimal workflow set;** no unattended commit without passing gates.

**Stage 2 — Implement gates.** Pin schemas (Pandera `DataFrameSchema`/dbt). Define an ODCS-style contract YAML per dataset (schema + data quality + freshness + SLA), choosing an explicit compatibility posture (FORWARD/FULL on additive columns for append-only history). Add a CI job that, on a *fresh independent clone*, runs the invariant suite and a `data-diff` against the prior published snapshot. Capture an audit JSON per run (git SHA, source version, nominal+actual timestamps, row/partition counts, byte size, schema hash, per-check pass/fail) — modeled on OpenLineage run/job/dataset facets.

**Stage 3 — Snapshot & wire to UI.** Only after all gates pass: commit, tag, push a DOI snapshot (Zenodo) and/or DVC-track, then wire to the UI. Nothing reaches the UI that has not passed the published-data gate.

**Benchmarks that change the plan:**

- If a “moving quantity” assertion ever fails on *legitimate* growth → convert it to a floor/band immediately (it was misclassified as an invariant).
- If the auditor and builder ever share a code module for checks → split them (the independence guarantee is void).
- If workflow count creeps above the minimal set → consolidate before adding features.
- If a data-diff shows value-level changes in *settled* (canary) history → treat as corruption and block, regardless of green row counts.

## Caveats

- Several tool-comparison and dimension sources are vendor blogs (Atlan, Monte Carlo, Datafold, Estuary, Anomalo); their *framework* descriptions corroborate primary sources (DAMA, Wang & Strong, Confluent docs, Beauchemin, Dehghani) but their *product* claims are marketing and should not be cited as neutral.
- “Accuracy” is the hardest dimension to automate and is usually proxied; true accuracy requires an authoritative external reference, which GB electricity data (Elexon BMRS as the canonical source) partly provides for reconciliation.
- Data mesh is contested for small teams; treat domain decomposition as a heuristic, not dogma — the documented failure modes are duplication, inconsistent definitions, and over-splitting.
- Reproducible builds aim at *bit-for-bit* identity; for Parquet, byte-identical output across environments can require controlling zstd compression settings, row ordering, and embedded metadata. **Semantic (key-level / value-level) reproducibility** — verified via data-diff on a fresh clone — is the pragmatic target for this pipeline.
- ODCS version: the authoritative Bitol sources confirm v3.1.0 (Dec 2025) as current; some third-party references (e.g., Wikipedia “3.0.2”) are outdated.
- GitHub Actions pipefail default behavior has been reported as inconsistent with its docs; always set it explicitly rather than relying on the default shell.
