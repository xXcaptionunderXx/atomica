---
title: ADR-002 - GitHub as Single Source of Truth
type: adr
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - decision
  - architecture
---

# ADR-002: GitHub as Single Source of Truth

## Status
`ACCEPTED`

## Date
2026-11-18

## Context
Multiple independent AI coding agents (Claude and Gemini) collaborate on ATOMICA without shared ephemeral context windows or shared runtime memory. 

## Problem Statement
How to prevent documentation decay, lost decisions, conflicting implementations, and duplicated effort across disparate agent sessions.

## Decision
1. The GitHub repository is the sole, authoritative source of truth.
2. All important technical decisions, task board transitions, architectural contracts, and research documents must be committed to git.
3. No verbal agreement or chat reasoning is valid until reflected in `/project-management/` and `/docs/obsidian/`.
4. Git branches follow the convention `agent/<agent-name>/<feature>`. Force pushes to shared branches are prohibited.

## Consequences
- Every agent session begins by reading the repository state and task board.
- Context compaction or conversation truncation in any agent interface does not jeopardize project continuity.

## Related Modules
- `/project-management/AGENT_ROLES.md`
- `/project-management/TASK_BOARD.md`
- `/docs/obsidian/08 - Agent Collaboration/`
