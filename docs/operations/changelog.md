# Changelog Operation

Date: 2026-06-25
Status: Initial lightweight system

## Fragment Directory

Use `.changes/` for changelog fragments. Each fragment should describe one production-meaningful change in
plain language.

This repo intentionally starts with fragments only. Aggregation can be added when release cadence exists.
Do not add release automation, validation gates, or template enforcement before a real release workflow needs it.

## When To Add A Fragment

Add a fragment for changes that affect public docs, runtime behavior, package metadata, operations, security,
CI, provider configuration, or user-visible behavior.

Docs-only foundation work can use a `docs:` fragment.
