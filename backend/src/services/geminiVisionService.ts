import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleVisionService } from './googleVisionService';

export interface GeminiFoodDetectionResult {
  name: string;
  confidence: number;
  // Estimated macros as fallback
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  servingSize?: number;
  servingUnit?: string;
}

export class GeminiVisionService {
  /**
   * Detect food labels from a local image path using Google Gemini 1.5 Flash.
   */
  public static async detectFoodLabels(imagePath: string): Promise<GeminiFoodDetectionResult[]> {
    try {
      // Use GEMINI_API_KEY if available, fallback to GOOGLE_VISION_API_KEY
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        console.error('Gemini API key is missing in environment variables.');
        return [];
      }

      if (!fs.existsSync(imagePath)) {
        console.error(`Image file does not exist at path: ${imagePath}`);
        return [];
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Convert image to GenerativePart object
      const imageBuffer = fs.readFileSync(imagePath);
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg', // MimeType usually jpeg from phone uploads
        },
      };

      const prompt = `
You are an expert nutritionist and food recognition AI. 
Look at this image of food and identify the main, distinct food items present on the plate (e.g., 'Chicken Biryani', 'Raita', 'Idli', 'Sambar', 'Grilled Sandwich').
Do not return generic labels like 'Rice' or 'Alcoholic beverage' if it's clearly a specific dish.

Also, provide a rough estimation of the macronutrients for a standard 100g (or 100ml) serving of each item. This is a fallback in case our primary nutrition database fails.

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "name": "string (the specific name of the food/dish)",
    "confidence": number (from 0 to 100, representing how confident you are in this identification),
    "calories": number (estimated calories per 100g),
    "carbs": number (estimated carbs in grams per 100g),
    "protein": number (estimated protein in grams per 100g),
    "fat": number (estimated fat in grams per 100g),
    "fiber": number (estimated fiber in grams per 100g)
  }
]
No markdown wrapping, just the raw JSON array.
`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();

      // Clean up markdown if the AI mistakenly wrapped it
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

      const parsed: GeminiFoodDetectionResult[] = JSON.parse(text);
      
      // Sort by confidence
      return parsed.sort((a, b) => b.confidence - a.confidence);

    } catch (error: any) {
      console.error('Error in GeminiVisionService.detectFoodLabels, falling back to GoogleVisionService:', error.message || error);
      try {
        const fallbackResults = await GoogleVisionService.detectFoodLabels(imagePath);
        return fallbackResults.map(res => ({
          name: res.name,
          confidence: res.confidence
        }));
      } catch (fallbackError) {
        console.error('Fallback to GoogleVisionService also failed:', fallbackError);
        return [];
      }
    }
  }
}
