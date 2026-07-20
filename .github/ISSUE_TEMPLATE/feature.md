---
name: Feature
about: A unit of work to deliver — ideally one issue → one PR → merge
title: "[Feature] "
labels: ["type:feature"]
assignees: []
---

## Why

<!-- The user/charter value this delivers. Link to the charter objective or
     success measure it advances. -->

## What

<!-- A concise description of the change. For a user-facing capability, frame it
     as a user story:
     As a <role> I want <capability> so that <benefit>. -->

## Priority

<!-- MoSCoW — keep one. Add the matching label: priority:high (Must),
     priority:medium (Should), priority:low (Could). "Won't (this release)"
     means defer, don't file. -->

- **Must** / **Should** / **Could**

## Acceptance criteria

<!-- Measurable, testable conditions. Prefer concrete numbers/states over vague
     adjectives ("responds in <200ms", not "fast"). -->

- [ ] 
- [ ] 
- [ ] 

## Core architectural rule

<!-- Gatehouse's release gate: no request reaches a .NET service without passing
     through Oathkeeper, and no vendor can see another vendor's data. See
     CONTRIBUTING.md. Tick what applies; N/A only if this change touches neither
     a protected endpoint nor a vendor-scoped entity. -->

- [ ] Every protected endpoint this adds or touches is covered by an Oathkeeper access rule **and** a negative test proving a gateway-bypassing request is rejected
- [ ] Every vendor-scoped entity this adds or touches ships with a cross-vendor isolation test
- [ ] No authentication/authorization logic was added to a .NET service (decisions stay in Keto tuples + Oathkeeper policy)
- [ ] N/A — this change doesn't touch it

## Related issues / dependencies

<!-- Blocking or related issues by #number, and the milestone this belongs to. -->

## Notes / out of scope

<!-- Anything explicitly not part of this issue, or open questions. -->
