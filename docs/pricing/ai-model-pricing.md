# AI Model Pricing

**Source:** https://openai.com/api/pricing/

## Overview

The application uses the **GPT-4o** model via the OpenAI Assistants API. Below is the token-based pricing structure.

## Token Pricing (per 1M tokens)

| Token Type          | Cost per 1M Tokens |
| ------------------- | ------------------- |
| Input Tokens        | $3.75               |
| Cached Input Tokens | $1.875              |
| Output Tokens       | $15.00              |

## How Pricing Applies

- **Input tokens** are charged for every message sent to the model, including the system prompt, conversation history, and user input.
- **Cached input tokens** apply when repeated or previously seen context is reused across requests, charged at a 50% discount over standard input tokens.
- **Output tokens** are charged for every token the model generates in its response.

## Cost Considerations

- Each conversation thread accumulates input tokens as the message history grows.
- The system prompt (company context, guardrails, enrollment CTA) is injected on every run, contributing to input token usage.
- Longer assistant responses increase output token costs.
