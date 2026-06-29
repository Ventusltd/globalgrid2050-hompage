# AI READ FIRST

Before touching any GlobalGrid2050 repository, read:

`docs/DATA_DISCIPLINE_MANUAL.md`

This homepage repo is the federation doctrine and catalogue layer.

The manual is the governing source for data discipline across all GlobalGrid2050 repos.

Do not patch, port, backfill, schedule, publish, snapshot or wire UI data until you have read the manual and the local README and CHANGELOG of the target repo.

Green is not proof.

File count is not proof.

Size is not proof.

A chart loading is not proof.

The proof is the declared data law tested on the declared key.

Current federation pattern:

`data-gb-electricity` owns GB electricity generation, prices and related GB electricity time-series.

`data-interconnectors` owns interconnector transfer-flow data.

UI repos consume data from those data repos. They do not own the data.

This repo points people and AI sessions to the doctrine and the catalogue.
