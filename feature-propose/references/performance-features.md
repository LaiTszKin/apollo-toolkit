# Performance Features Definition

## What it is

Performance features focus on speed, scalability, reliability, and efficiency, ensuring the system meets user expectations and operational targets.

## Classification rules

Classify a feature as Performance when most of the following are true:

1. It targets latency, throughput, resource usage, uptime, or fault tolerance.
2. User experience is degraded due to measurable performance/reliability issues.
3. It is driven by SLO/SLA, scaling limits, or operational risk.
4. Success can be validated with concrete technical metrics.

## What it is not

- New user-facing business workflows
- General UI enhancements without measurable performance effect
- Architectural rewrites without clear performance hypotheses

## PM check questions

- Which metric improves (for example: p95 latency, error rate, cost/request)?
- What threshold or target proves the feature is successful?
