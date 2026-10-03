---
name: canny
category: build-and-judge
description: Definitive verification gate: assess task completion against strict acceptance invariants before deployment.
source: https://madewithjev.com/skills | https://charliehills.substack.com/p/the-top-20-jev-skills
---

# Canny

## Purpose
Definitive verification gate: assess task completion against strict acceptance invariants before deployment.

## Invariant Guarantees
- Zero synthetic dummy data; all operations require verified tokens or justified schemas.
- Strict Type-Safe primitives: JevChoice<T>, JevScore (0.0 - 1.0), and JevNoul.
- Sub-50ms single forward-pass decision execution.

## Preconditions
- System context verified against live environment constraints.
- Task inputs meet domain schema boundaries.

## Step-by-Step Execution Protocol
1. **Intake & Schema Validation**: Ingest input state into closed algebraic schema.
2. **System-1 Evaluation**: Execute single-pass evaluation across candidate choices.
3. **Confidence Scoring**: Compute probabilistic weight and threshold verification.
4. **Action Dispatch**: Trigger downstream tool call or state update.
5. **Post-Execution Audit**: Record telemetry in immutable audit ledger.
