import fs from 'fs';
import axios from 'axios';

export class GoogleVisionService {
  private static readonly ALLOWED_FOODS = [
    'dosa',
    'idli',
    'rice',
    'curry',
    'sambar',
    'chutney',
    'bread',
    'egg',
    'chicken',
    'fish',
    'meat',
    'vegetable',
    'fruit',
    'snack',
    'grilled chicken',
    'fried rice',
    'biryani',
    'noodles',
    'pizza',
    'burger',
    'sandwich',
    'salad',
    'tea',
    'coffee',
    'milk',
    'juice'
  ];
  private static readonly IGNORED_LABELS = [
    'plate',
    'spoon',
    'bowl',
    'table',
    'kitchen',
    'dish',
    'cookware',
    'food',
    'ingredient',
    'cuisine',
    'recipe',
    'meal',
    'produce',
    'plant'
  ];

  /**
   * Detect food labels from a local image path using the Google Cloud Vision API REST endpoint.
   * Filters the returned labels to ensure they are food-related and not ignored non-food items.
   */
  public static async detectFoodLabels(imagePath: string): Promise<Array<{ name: string; confidence: number }>> {
    try {
      const apiKey = process.env.GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        console.error('Google Vision API key (GOOGLE_VISION_API_KEY) is missing in environment variables.');
        return [];
      }

      if (!fs.existsSync(imagePath)) {
        console.error(`Image file does not exist at path: ${imagePath}`);
        return [];
      }

      // Convert image to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Call Google Vision API annotation REST endpoint
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 5
                }
              ]
            }
          ]
        }
      );

      const responseData = response.data;
      const labelAnnotations = responseData?.responses?.[0]?.labelAnnotations;

      if (!labelAnnotations || !Array.isArray(labelAnnotations)) {
        console.warn('No label annotations returned from Google Vision API.');
        return [];
      }

      // Map and filter labels based on whitelist & blacklist
      return labelAnnotations
        .map((label: any) => ({
          name: label.description || '',
          confidence: (label.score || 0) * 100
        }))
        .filter((item) => {
          const nameLower = item.name.toLowerCase();

          const isAllowed = GoogleVisionService.ALLOWED_FOODS.some(
            keyword =>
              nameLower === keyword ||
              nameLower.includes(keyword)
          );

          const isIgnored = GoogleVisionService.IGNORED_LABELS.some(keyword =>
            nameLower.includes(keyword)
          );

          return isAllowed && !isIgnored && item.confidence >= 60;
        })
        .sort((a, b) => b.confidence - a.confidence);

    } catch (error: any) {
      console.error('Error in GoogleVisionService.detectFoodLabels:', error.message || error);
      return [];
    }
  }
}
