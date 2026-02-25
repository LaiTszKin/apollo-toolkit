# Investigation Checklist

Use this checklist before finalizing conclusions.

## 1) Scope and data quality

- [ ] Confirm the exact incident window (start/end time and timezone).
- [ ] Confirm logs come from the correct service, environment, and version.
- [ ] Confirm log completeness (no ingestion gaps, rotated files missing, or sampling blind spots).

## 2) Signal extraction

- [ ] Collect all `ERROR` and `WARN` signatures within the window.
- [ ] Count frequency and burst periods for each signature.
- [ ] Identify leading indicators before the first hard failure.

## 3) Correlation

- [ ] Correlate events by trace/request/job/transaction ID.
- [ ] Correlate failures with deploys, config changes, and dependency incidents.
- [ ] Correlate user-facing symptoms with backend exceptions.

## 4) Code mapping

- [ ] Map stack traces/log callsites to concrete code locations.
- [ ] Verify execution path and guard conditions around the failing point.
- [ ] Check recent changes in related modules and configuration defaults.

## 5) Root-cause validation

- [ ] Confirm at least one reproducible or strongly evidenced causal chain.
- [ ] Rule out common alternatives (bad input, timeout, dependency outage, race condition, resource pressure).
- [ ] Mark unverified claims as hypotheses, not confirmed findings.

## 6) Impact and prioritization

- [ ] Define affected users/systems and blast radius.
- [ ] Estimate severity (critical/high/medium/low) using impact × frequency.
- [ ] Separate immediate containment steps from permanent fixes.

## 7) Preventive improvements

- [ ] Identify missing log fields needed for faster diagnosis.
- [ ] Suggest alert thresholds for early detection.
- [ ] Recommend observability gaps to close (metrics/traces/health checks).
