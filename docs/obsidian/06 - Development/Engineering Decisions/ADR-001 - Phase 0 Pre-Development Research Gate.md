---
title: ADR-001 - Phase 0 Pre-Development Research Gate
type: adr
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - decision
  - architecture
---

# ADR-001: Phase 0 Pre-Development Research Gate

## Status
`ACCEPTED` (Mandatory Project Rule)

## Date
2026-11-18

## Context
Scientific software frequently suffers from early architectural decay and catastrophic rewrites when implementation begins before mathematical boundaries, established algorithms, and library limitations are thoroughly investigated. Section 18 of the project charter establishes an absolute requirement: no production coding before technical discovery and approval.

## Problem Statement
How to prevent AI development agents (Claude and Gemini) from writing premature, flawed code based on superficial assumptions about complex scientific phenomena (quantum mechanics, protein folding, stiff kinetics).

## Decision
All production application implementation is frozen until:
1. All 18 research deliverables in `/project-management/research/` are fully articulated and peer-reviewed.
2. The Obsidian knowledge base is established under `/docs/obsidian/`.
3. Reference benchmark cases are documented with precise numerical tolerances.
4. Formal approval is signed by both Claude and Gemini in `RESEARCH_APPROVAL.md`.

## Consequences
- **Positive:** Guarantees that every algorithm implemented in Phase 1 has a verified mathematical and literature foundation.
- **Positive:** Avoids throwaway code and wasted agent tokens.
- **Negative:** Requires disciplined upfront investment in research before visible UI code is generated.

## Related Modules
- `/project-management/research/*`
- `docs/obsidian/00 - Home/Project Dashboard.md`
