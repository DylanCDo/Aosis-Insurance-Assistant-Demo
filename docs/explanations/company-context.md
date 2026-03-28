# Company Context Module

## File
- app/company-context.ts

## Purpose
The company context module centralizes business facts and response rules used by the assistant at runtime. It ensures answers stay aligned with approved product, pricing, contact, and policy details.

## Exports
### companyContext
A readonly object (`as const`) containing business context used to ground assistant responses.

### buildSalesSystemPrompt()
Builds the runtime instruction string passed to OpenAI runs as additional instructions.

## Data Structure
The `companyContext` object currently includes:

- companyName
- companySummary
- productName
- productSummary
- targetCustomers
- keyFeatures
- pricing:
  - dhmo
  - dhmoWithVision
  - includedExamples
- demoBooking:
  - cta
  - link
- enrollmentDetails:
  - ageRules
  - effectiveDateRule
  - process
  - assistance
- contact:
  - office
  - phone
  - contactLink
  - openHours
- benefitsExplanation
- networkDetails
- coverageInterests
- partners
- businessInfo:
  - address
  - phone
  - license
  - copyright
- policies:
  - knownLimits
  - whenUnsure

## Prompt-Building Rules
`buildSalesSystemPrompt()` prepends behavior instructions and appends full JSON context.

Current instruction goals:
- identity/persona: "the Aosis Smart Assistant"
- factual grounding: answer using provided company/product context
- response style: brief by default (1-3 short sentences)
- expansion behavior: only provide additional detail when asked
- formatting preference: short one-line bullets for pricing/coverage when useful
- CTA control: mention enrollment link sparingly and only on relevant intent

## Runtime Integration
Used in:
- app/actions.ts

Integration pattern:
1. User message is sent to OpenAI thread.
2. `buildSalesSystemPrompt()` output is passed as `additional_instructions` during run creation.
3. OpenAI response is constrained by both assistant config and this runtime context.

## Why This Module Matters
- Single source of truth for approved business copy
- Reduces accidental hallucination of pricing or terms
- Makes messaging updates easy without changing core chat logic

## Editing Guidelines
When updating this file:
1. Keep `policies.knownLimits` and `policies.whenUnsure` strict and explicit.
2. Keep pricing/contact details current and internally consistent.
3. Avoid adding speculative claims not supported by plan documents.
4. Preserve concise style instructions unless intentionally changing assistant tone.
5. Validate after edits to ensure app/actions.ts can still build and run prompts.

## Related Docs
- docs/system-design.md
- docs/explanations/chat-transcription.md
- docs/lib/transcript-store.md
