// One-time setup script: creates a vector store from pre-uploaded OpenAI file IDs,
// then creates an assistant pointing to that store.
//
// Usage:
//   npm run setup-assistant
// (requires OPENAI_API_KEY in .env.local)

import OpenAI from "openai";

// File IDs already uploaded to OpenAI Storage
const UPLOADED_FILE_IDS = [
  "file-GCtFr96gVSPLXs4BNs2aWS", // Cigna Dental DHMO + GVS Vision
  "file-GZxBSMSHdpPYLMU6THoXQZ", // Cigna Dental DHMO
];

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: OPENAI_API_KEY is not set.");
  console.error("Run with: npm run setup-assistant");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function main() {
  // 1. Create an empty vector store
  console.log("Creating vector store...");
  const vectorStore = await openai.vectorStores.create({
    name: "AOSIS Dental Plans",
  });
  console.log(`  Vector store created: ${vectorStore.id}`);

  // 2. Add the already-uploaded files and wait for indexing to finish
  console.log("  Attaching files and waiting for indexing...");
  const batch = await openai.vectorStores.fileBatches.createAndPoll(
    vectorStore.id,
    { file_ids: UPLOADED_FILE_IDS }
  );
  console.log(
    `  Indexed: ${batch.file_counts.completed} file(s)` +
    (batch.file_counts.failed > 0 ? `, ${batch.file_counts.failed} failed` : "")
  );

  // 3. Create the assistant
  console.log("Creating assistant...");
  const assistant = await openai.beta.assistants.create({
    name: "Aosis Smart Assistant",
    instructions: [
      "You are the Aosis Smart Assistant, a friendly and knowledgeable dental insurance specialist at AOSIS.",
      "Use the uploaded plan documents to answer questions accurately and specifically.",
      "When a user asks about coverage, pricing, or enrollment, answer from the plan documents first.",
      "Mention the enrollment link sparingly.",
      "Only share the enrollment link when users ask about enrolling, pricing, sign-up steps, or indicate they are ready to proceed: https://www.1enrollment.com/index.cfm?id=723679&cat=CIGNA%20DENTAL",
      "Be very brief by default: 1-3 short sentences.",
      "Only provide extra detail when the user asks for it.",
      "If you are not sure of an answer, say so and offer to connect the user with a licensed specialist.",
    ].join(" "),
    tools: [{ type: "file_search" }],
    model: "gpt-4o",
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
  });
  console.log(`  Assistant created: ${assistant.id}`);

  console.log("\n✅ Setup complete! Add the following to your .env.local file:\n");
  console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
  console.log(`OPENAI_VECTOR_STORE_ID=${vectorStore.id}`);
  console.log("\nThen restart your dev server: npm run dev\n");
}

main().catch((err) => {
  console.error("Setup failed:", err.message ?? err);
  process.exit(1);
});
