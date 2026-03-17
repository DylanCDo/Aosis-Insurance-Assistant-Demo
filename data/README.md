# Plan PDF Files

Drop your dental insurance plan PDF brochures into this folder before running the setup script.

Example:
- `cigna-dhmo.pdf`
- `cigna-dhmo-vision.pdf`

After adding PDFs, run:

```
npm run setup-assistant
```

This uploads all PDFs to OpenAI, creates a vector store and assistant, and prints the IDs to add to `.env.local`.
