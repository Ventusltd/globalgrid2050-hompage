# FEDERATION BUILD INSTRUCTION SET

For ChatGPT. GlobalGrid2050 federation. Numbered, ordered steps. Do them one at a time with separate approvals. Do not lump them together.

## The law

Scope first. Audit second. Fire third. One repo at a time. Data before charts. Every workflow keeps its own audit log committed separately from code. No apply runs before its audit and Vikram's approval. No building before the contract exists.

Green is not proof. File count is not proof. Size is not proof. A chart loading is not proof. The proof is the declared data law tested on the declared key.

## Roles

Claude is the independent auditor. Claude clones read only and verifies each step's real result from outside before the next step fires. Claude has no write access.

ChatGPT is the builder and executor. ChatGPT scopes, audits, and applies only after Vikram approves. Never a direct commit that skips the gate.

Vikram decides. Vikram reads each scope, approves, and holds the trigger on each final commit.

## Before you start

Clone Ventusltd/globalgrid2050 and read it. It already proved this pattern. Study the gridbot workflows with audit and apply modes, and gridbot_generation_mwh_interconnector_split_v6 as the reference derivation method. Every one of those workflows wrote an audit report under data_science_protocol/audit_reports/ with a matching JSON under audit_reports/json/, and committed the report separately from the code. Replicate that audit-log discipline.

## Where every document lands

Federation governance lives in the homepage repo. Data contracts and scopes live in the data repo they describe. The UI repo only holds UI code and a dependencies file. The UI repo consumes data contracts. It never authors them. A data contract must never be committed into the UI repo.

## Step 0. Commit the governing process file. Repo: globalgrid2050-hompage

Commit CHARTS_UI_SCOPE_AUDIT_COPY_OLD_MAKE_NEW_PARQUETS.md under docs, as a documentation commit, separate from any code. Render its project map and its two checklists on the homepage below the to-do list so Vikram can monitor. This file governs everything that follows. Stop and confirm it is committed and rendered before moving on.

## Step 1. Audit and document the existing data. Repo: data-gb-electricity. Inspection only

Clone read only. Change nothing. Produce a data log named DATA_INVENTORY.md plus a matching JSON, recording exactly what data is present: every dataset FUELINST FUELHH prices, partition ranges by year and month, row counts, declared keys, and the verified clean state. Confirm the FUELINST interconnector INT rows are present and clean, because the interconnector derivation depends on them. Commit only the inventory report into data-gb-electricity. Stop and give Vikram the inventory.

## Step 2. Write the data contract and scope. Repo: data-interconnectors. Documents only, no build

Commit these into data-interconnectors, not the UI repo.

DATA_CONTRACT.md declares, before any data is produced:
- compound key periodStartUTC plus bmrsCode
- fields: periodStartUTC, bmrsCode, country, interconnectorName, signedMW, direction, grossMWh, netSignedMWh, intervalHours, source, methodVersion
- partition layout flows/dataset=fuelinst_interconnector/year=YYYY/month=M/
- zstd compression
- sign convention imports positive, exports negative
- the rule that interconnectors are flows and never sum into generation
- invariants the audit will test: total rows equal distinct periodStartUTC plus bmrsCode, zero null keys, all ten BMRS codes present where source exists

DATA_INTERCONNECTORS_SCOPE.md states how the FUELINST INT rows become per-cable flows, referencing the monolith gridbot_generation_mwh_interconnector_split_v6 as the proven method.

Build nothing. Commit only these documents into data-interconnectors. Stop and wait for Vikram to approve the contract and scope.

## Step 3. Fire the data-interconnectors build workflow. Repo: data-interconnectors. Only after Step 2 approved

Create the workflow with audit and apply modes, default mode audit, exactly as the monolith proved.

Audit mode reads the FUELINST source, runs the derivation in dry run, writes an audit log to reports/INTERCONNECTOR_BUILD_AUDIT_LATEST.md with a matching JSON under reports/json/, commits the report only, no data. Vikram reviews the audit.

Apply mode, only after the audit is reviewed, writes the Parquet, reads it back, asserts total rows equal distinct periodStartUTC plus bmrsCode, asserts zero null keys, asserts all ten codes present, fails loud and red on any breach. Apply commits the Parquet, the reports, and updates CHANGELOG.md and DEPENDENCIES.md in data-interconnectors.

This workflow keeps its own audit log, separate from the data. Stop after this and let the independent auditor verify before anything reads this data.

## Step 4. Faithful copy and dependencies. Repo: gb-electricity-ui

Following the CHARTS file five step migration, port the two monolith pages exactly as they are, the tracker and the generation history page, as the reference oracle. Preserve dependency structure. Copy no monolith data into the UI repo. The reference may point at the live monolith for comparison only. Commit this faithful copy. Write DEPENDENCIES.md recording that this repo depends on data-gb-electricity for generation and prices and data-interconnectors for flows. Wire no live data yet. Stop after this.

## Step 5. Build new charts alongside. Repo: gb-electricity-ui. Only after Steps 3 and 4

Build new charts as a second tab, reading the clean Parquet format: generation and prices from data-gb-electricity, interconnector flows from data-interconnectors, which only now exists because Step 3 built it. Old reference tab and new build tab side by side. Cannot start before Step 3 is proven, because the generation history page needs the interconnector data. Keep an audit log of the wiring.

## Step 6. Prove parity then delete the copy. Repo: gb-electricity-ui

Confirm the new charts match the old reference in structure and values. Only when parity is proven, delete the copied reference. Record the parity proof in CHANGELOG.md. Until parity is proven, the copy stays.

## Binding rules

Each numbered step is a separate scope with its own approval gate and its own audit log committed separately from code, named per the monolith pattern under a reports or audit_reports folder with a matching JSON. Do not run two steps as one workflow. Do not fire any apply before its audit and Vikram's approval.

Dependency order is fixed: process file before the work, data inventory before the contract, contract approved before the build, build proven before the charts, parity proven before the copy is deleted. Data before charts, always.

Send each step's audit log and run result, the actual numbers not a green tick, so the independent auditor can verify from a clean clone before the next step proceeds.
