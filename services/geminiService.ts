import { GoogleGenAI, Type } from "@google/genai";
import { AILevelData } from "../types";

// Default fallback level if API fails or key is missing
const DEFAULT_LEVEL = [
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "....................................................................................................",
  "...................?????........................................................................",
  ".................#.......#..........................................................................",
  "....................................................................................................",
  ".........E.................................E.......................................F................",
  ".....T...T........................PTT..............................................|................",
  "################..############...#####...###################..#######...############################"
];

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateLevel(): Promise<AILevelData> {
    if (!this.ai) {
      console.warn("No API Key found, using default level.");
      return DEFAULT_LEVEL;
    }

    const prompt = `
      Generate a playable 2D platformer level map.
      Height: 14 rows.
      Width: 80 columns.
      Characters:
      '.' = Sky/Empty
      '#' = Ground Block
      'B' = Brick Block
      '?' = Question Block
      'T' = Hard Block (Steps)
      'P' = Pipe Body (just use 'P' for the pipe stack)
      'E' = Enemy (Goomba)
      'F' = Flag pole (at the end)
      '|' = Flag pole stick

      Rules:
      - The bottom row (index 13) should be mostly '#' (Ground), with some gaps (pits) for challenge.
      - Ensure jumps are possible. Max jump height is about 4 blocks.
      - Place enemies 'E' on the ground.
      - Place '?' and 'B' in the air reachable by jumping.
      - Create some stairs using 'T'.
      - Place a flag 'F' near the end.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The rows of the level map."
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response text");

      const json = JSON.parse(text);
      if (json.level && Array.isArray(json.level) && json.level.length > 0) {
        return json.level;
      }
      return DEFAULT_LEVEL;
    } catch (error) {
      console.error("Level generation failed:", error);
      return DEFAULT_LEVEL;
    }
  }
}

export const geminiService = new GeminiService();