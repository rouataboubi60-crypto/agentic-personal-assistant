import { tool } from "langchain";
import { z } from "zod";
import Database from "better-sqlite3";

const db = new Database("./documents.db");

export const searchKnowledgeBase = tool(
  async ({ query }) => {
    console.log(`🔍 Agent is searching SQLite for: "${query}"`);

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) {
      return "No relevant information found in the knowledge base.";
    }

    const conditions = words.map(() => "(LOWER(content) LIKE ? OR LOWER(keywords) LIKE ?)").join(" OR ");
    const params = words.flatMap((w) => [`%${w}%`, `%${w}%`]);

    const stmt = db.prepare(`
      SELECT content, document_name FROM chunks
      WHERE ${conditions}
      LIMIT 5
    `);

    const results = stmt.all(...params);

    if (results.length === 0) {
      return "No relevant information found in the knowledge base.";
    }

    results.forEach((r, i) => {
      console.log(`Result ${i + 1} (${r.document_name}):`, r.content.slice(0, 200));
    });

    return results.map((r) => r.content).join("\n\n---\n\n");
  },
  {
    name: "search_knowledge_base",
    description:
      "Searches the internal knowledge base for technical info and documentation. Use this when you need to find information from uploaded PDF documents.",
    schema: z.object({
      query: z.string().describe("The search query to look up in the knowledge base"),
    }),
  }
);