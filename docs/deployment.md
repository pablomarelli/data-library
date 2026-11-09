# Homelab deployment

Public origin: https://data.pablomarelli.dev

The shared `pablomarelli/homelab-workflows` pipeline owns the injected GitHub workflows. Main pushes reserve a package version, then run lint, unit tests, the production build, and Playwright before publishing the matching container image. The deployment job updates `homelab-infra`; ArgoCD reconciles the cluster.

The Dockerfile builds with Node 24 and serves only `dist/` with unprivileged Nginx on port 8080. `/healthz` is the readiness and liveness endpoint. Hash routes need no server fallback. Missing datasets return 404. Fingerprinted assets use immutable caching; HTML and data require revalidation.

The workload has no database, persistent volumes, migrations, accounts, or runtime configuration. It runs as UID 101 with a read-only root filesystem and a writable temporary volume. The Kubernetes deployment uses rolling updates on the stateless worker node.

Repository configuration:

- `APP_NAMESPACE=data-library`
- `REPOS_TOKEN`: release commit access
- `INFRA_REPO_TOKEN`: infrastructure repository write access
- `DEPLOY_ENABLED=false` during initial image publication, then `true` after the infrastructure manifests exist

Data refresh stays explicit: run `npm run data:fetch`, `npm run data:build`, and the checks, then commit the source snapshots and published datasets. The image serves the committed snapshot without calling upstream providers.

For rollback, revert the application change and release again, or restore a previous published image in `homelab-infra`. Verify ArgoCD health and the public endpoint after reconciliation.
