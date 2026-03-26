import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { searchKnowledgeBase } from "./tools.js";

// Create a memory saver for persisting conversation history
const checkpointer = new MemorySaver();

export async function runAgent({ sessionId = "default", message }) {
  try {
    const model = new ChatOllama({
      model: "qwen3.5:2b",
      temperature: 0,
      think: false,
    });

    const agent = createAgent({
      model,
      tools: [searchKnowledgeBase],
      checkpointer,
      systemPrompt:
        `You are a helpful AI assistant with access to a knowledge base. When users ask questions,
         search the knowledge base using the available tools to find relevant information. Be concise and accurate.`,
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
