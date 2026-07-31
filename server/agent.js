import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { searchKnowledgeBase } from "./tools.js";

// Create a memory saver for persisting conversation history
const checkpointer = new MemorySaver();

export async function runAgent({ sessionId = "default", message }) {
  try {
    const model = new ChatOllama({
      model: "llama3.2:1b",
      temperature: 0,
    });

    const agent = createAgent({
      model,
      tools: [searchKnowledgeBase],
      checkpointer,
      systemPrompt:
        `You are an AI assistant that answers ONLY using information found in the knowledge base via the search_knowledge_base tool.

Rules:
- You MUST always call search_knowledge_base before answering any question.
- If the tool returns no relevant information or empty results, respond exactly: "Je n'ai trouvé aucune information à ce sujet dans la base de connaissances."
- Never use your own general knowledge to answer. Only use what the tool returns.
- Do not add information that is not explicitly present in the search results.`,
    });

    console.log(`🤖 Running agent for: "${message}"`);

    // Invoke here has an agentic behavior and it will decide to use the tool or not.
    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: message }],
      },
      {
        configurable: {
          thread_id: sessionId, // This maintains conversation history per session
        },
      }
    );

    // Extract the last message content
    const lastMessage = response.messages[response.messages.length - 1];
    const output = lastMessage?.content || "";

    console.log(`✅ Agent response: ${output.slice(0, 100)}...`);

    return { output };
  } catch (error) {
    console.error("❌ Error in runAgent:", error);
    throw error;
  }
}
