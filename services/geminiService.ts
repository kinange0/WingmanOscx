import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { Contact, Intensity, UserState, WingmanAdvice, MediaPart, IntelligenceModule, VibeMode } from "../types";

export class GeminiService {
  // Use a public getter to ensure we always have a fresh instance per call, 
  // following best practices for API key management and allowing external access for SOS protocols.
  public get ai(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private cleanJsonResponse(text: string): string {
    if (!text) return '{}';
    let cleaned = text.trim();
    
    // Extract JSON if wrapped in markdown or other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    
    return cleaned.trim();
  }

  private tryRepairJson(json: string): string {
    let repaired = json.trim();
    if ((repaired.match(/"/g) || []).length % 2 !== 0) {
      if (!repaired.endsWith('"')) repaired += '"';
    }
    const stack: string[] = [];
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '{' || char === '[') stack.push(char === '{' ? '}' : ']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) stack.pop();
      }
    }
    while (stack.length > 0) repaired += stack.pop();
    return repaired;
  }

  async scanPsychology(profileData: any, media?: MediaPart): Promise<any> {
    // Determine speaker label based on role; 'user' or 'user_input' is the user (ME), everything else is her (HER)
    const history = (profileData.history || []).map((m: any) => `${m.role === 'user' || m.role === 'user_input' ? 'ME' : 'HER'}: ${m.content}`).join('\n');
    const prompt = `
      TASK: Perform deep psychological analysis of the target based on the provided history and notes.
      TARGET NAME: ${profileData.name}
      NOTES: ${profileData.notes}
      LOGS: ${history}
      
      Return JSON with:
      - summary (Psychological Overview)
      - suggestion (Master Suggestion)
      - traits (Array of traits)
      - peakHours (Best time to contact)
      - reminders (Silent Monitors/Reminders)
      - interestLevel (0-100)
      - vibeStatus (green, yellow, or red)
    `;

    try {
      const contents = media 
        ? { parts: [{ text: prompt }, media] }
        : prompt;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    peakHours: { type: Type.STRING },
                    reminders: { type: Type.ARRAY, items: { type: Type.STRING } },
                    interestLevel: { type: Type.NUMBER },
                    vibeStatus: { type: Type.STRING }
                }
            }
        }
      });
      const text = response.text || '{}';
      const cleaned = this.cleanJsonResponse(text);
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        return JSON.parse(this.tryRepairJson(cleaned));
      }
    } catch (err) {
      console.error("Psycho Scan Error:", err);
      return {};
    }
  }

  async generateProfileSummary(contact: Contact): Promise<Partial<Contact>> {
    // Keep as fallback or alias
    return this.scanPsychology({
        name: contact.name,
        notes: contact.notes,
        history: contact.history
    });
  }

  async refreshStarters(contact: Contact, context?: string): Promise<{ starters: string[], forbiddenWords: string[] }> {
    // Fix: Updated comparison to include 'user_input' from corrected Message role union type
    const history = contact.history.slice(-15).map(m => `${m.role === 'user' || m.role === 'user_input' ? 'ME' : 'HER'}: ${m.content}`).join('\n');
    const prompt = `
      TASK: Generate 4 tactical conversation starters for ${contact.name}.
      MISSION OBJECTIVE: ${context || "Create curiosity and status."}
      TARGET NOTES: ${contact.notes}
      CHAT LOGS: ${history}
      
      STYLE: Use a mix of "AI Wingman Tactical" (military metaphors) and Bongo Elite Slang. 
      The starters should feel like elite operations being initialized.
      Ensure ${contact.name}'s name is used in most starters for personalization.
    `;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    starters: { type: Type.ARRAY, items: { type: Type.STRING } },
                    forbiddenWords: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
      });
      const text = response.text || '{}';
      const cleaned = this.cleanJsonResponse(text);
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        return JSON.parse(this.tryRepairJson(cleaned));
      }
    } catch (err) {
      console.error("Starter Refresh Error:", err);
      return { starters: [], forbiddenWords: [] };
    }
  }

  async processRequest(
    module: IntelligenceModule,
    contact: Contact,
    intensity: Intensity,
    userState: UserState,
    vibeMode: VibeMode,
    context: string,
    media?: MediaPart
  ): Promise<WingmanAdvice> {
    // Fix: Updated comparison to include 'user_input' from corrected Message role union type
    const history = contact.history.slice(-15).map(m => `${m.role === 'user' || m.role === 'user_input' ? 'ME' : 'HER'}: ${m.content}`).join('\n');
    
    const prompt = `
      PROTOCOL: ${module.toUpperCase()}
      MODE: ${userState.toUpperCase()}
      TARGET: ${contact.name}
      OBJECTIVE: ${context}
      HISTORY: ${history}
      
      CRITICAL: Return EXACTLY 3 options in the specific JSON format. Ensure the response is complete and not truncated.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }, ...(media ? [media] : [])] },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detailedSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vibe: { type: Type.STRING },
                    label: { type: Type.STRING },
                    reply: { type: Type.STRING },
                    why: { type: Type.STRING },
                    timingAdvice: { type: Type.STRING },
                    voiceNotePrompt: { type: Type.STRING },
                    isRecommended: { type: Type.BOOLEAN }
                  },
                  required: ["vibe", "label", "reply", "why", "timingAdvice", "isRecommended"]
                }
              },
              insight: { type: Type.STRING },
              subtext: { type: Type.STRING },
              intent: { type: Type.STRING },
              simpRadarStatus: { type: Type.STRING },
              latencyAdvice: { type: Type.STRING },
              realTalk: { type: Type.STRING },
              cringeCheck: { type: Type.STRING },
              detectedSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  interest: { type: Type.NUMBER },
                  investment: { type: Type.NUMBER }
                }
              }
            },
            required: ["detailedSuggestions", "insight"]
          }
        },
      });

      const rawText = response.text || '{}';
      const cleanedText = this.cleanJsonResponse(rawText);
      
      try {
        return JSON.parse(cleanedText) as WingmanAdvice;
      } catch (parseError) {
        const repaired = this.tryRepairJson(cleanedText);
        try {
          return JSON.parse(repaired) as WingmanAdvice;
        } catch (secondError) {
           throw secondError;
        }
      }
    } catch (error) {
      console.error("Neural Processing Error:", error);
      throw error;
    }
  }
}