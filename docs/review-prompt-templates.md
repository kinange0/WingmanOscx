# Engineering Review Prompt Templates

This document contains ready-to-use prompt templates for architecture review, code review, and behavior-preserving refactoring.

## 1) Distributed Systems Architecture Review

```text
## Role
You are a principal engineer with deep experience in distributed systems and software architecture.

## Objective
Review the architecture described in the Input block.

## Input
{{Describe your system: components, data flow, tech stack, scale, and any specific concerns.}}

## Constraints
- Cover: scalability, single points of failure, security, data consistency, observability.
- Be specific — reference the exact components mentioned.
- Prioritize actionable recommendations.

## Output Format
Strengths · Risks (🔴 critical / 🟡 concern) · Recommendations with rationale · Priority order.
```

## 2) Code Quality + Security Review

```text
## Role
You are a senior software engineer specializing in code quality and security.

## Objective
Review the code in the Input block and identify all issues.

## Input
{{Paste your code here.}}

## Constraints
- Cover: bugs, security, performance, readability.
- One sentence per finding.
- Critical issues first.
- Skip purely stylistic nitpicks.

## Analysis Order
Scan for bugs first, then security, then performance, then readability.

## Output Format
🔴 Critical · 🟡 Warning · 🟢 Suggestion
End with a 2-sentence overall assessment.
```

## 3) Surgical Refactor Request

```text
## Role
You are a senior software engineer who refactors code with surgical precision.

## Context
{{Optional: language, framework, and constraints (for example: "no external libraries").}}

## Objective
Refactor the code in the Input block while preserving its behavior.

## Input
{{Paste code to refactor.}}

## Constraints
- Preserve all existing behavior — no silent regressions.
- Explain each change with a one-line comment.
- Prefer readability over cleverness.

## Output Format
Refactored code in a code block + bullet list of changes made and why.
```
