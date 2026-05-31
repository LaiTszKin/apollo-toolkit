# Spec Quality Checklist

## Requirement Completeness

- [ ] Each requirement has a clear business value, not technical implementation detail
- [ ] Each requirement has a verifiable acceptance condition (BDD THEN is observable and specific)
- [ ] Requirements are internally consistent (no contradictions or overlaps)
- [ ] Out of Scope is clearly defined to prevent scope creep

## Error and Edge Cases

- [ ] Authorization boundaries are defined
- [ ] Data boundary conditions are defined
- [ ] External dependency anomalies are covered
- [ ] Abuse and adversarial scenarios are covered
- [ ] Failure handling and recovery are covered

## Uncertainty Management

- [ ] High-uncertainty requirements are marked as Exploratory
- [ ] Clarification Questions reflect items needing user confirmation
- [ ] Spike or prototype is suggested where warranted
