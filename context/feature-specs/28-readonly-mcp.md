---
title: Read-only MCP stdio
type: feature
status: complete
summary: Expose bounded context queries over standard initialized JSON-RPC stdio
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Read-only MCP stdio

## TL;DR

- Goal: Expose bounded context queries over standard initialized JSON-RPC stdio.
- Boundary: Add ctx mcp with modern newline-delimited UTF8 JSON-RPC, initialize version negotiation, notifications/initialized, ping, tools/list and tools/call.

## What to build

Add ctx mcp with modern newline-delimited UTF8 JSON-RPC, initialize version negotiation, notifications/initialized, ping, tools/list and tools/call. Advertise readonly brief/status/facts/search only, strictly validate arguments, preflight non-secret project paths and symlinks, bound request/response payloads and execution. No arbitrary commands, shell, remote fetch or writes. stdout contains JSON lines only; Content-Length legacy framing is intentionally unsupported.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Supported versions | Explicit protocol identifiers 2025-03-26 and 2024-11-05; not live host verified |
| Tool payloads | Existing readonly CLI APIs and derived search API |
| Limits | 256KiB RPC messages, bounded tool subprocess timeout |

## Verification checklist

- [x] Initialize/list/search functional exchange over JSON-only newline stdout tested (not live host discovery proof)
- [x] Arbitrary tools/write args/malformed requests return bounded errors without files
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
