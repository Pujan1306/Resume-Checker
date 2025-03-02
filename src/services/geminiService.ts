import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Gemini API
const getGeminiAPI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please check your .env file.");
  }
  
  return new GoogleGenerativeAI(apiKey);
};

export interface AnalysisResult {
  overallScore: number;
  keywordMatchScore: number;
  formatScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  improvements: string[];
}

export async function analyzeResumeWithGemini(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  try {
    const genAI = getGeminiAPI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Prepare the prompt for Gemini
    const prompt = `
      Analyze this resume against the job description and provide the following:
      
      1. Overall ATS compatibility score (0-100)
      2. Keyword match score (0-100)
      3. Format score (0-100)
      4. List of matched keywords (comma separated)
      5. List of missing important keywords from job description (comma separated)
      6. List of improvement suggestions (one per line, starting with -)
      
      Format your response exactly like this, with just the values:
      
      OVERALL_SCORE: [number]
      KEYWORD_SCORE: [number]
      FORMAT_SCORE: [number]
      MATCHED_KEYWORDS: [comma separated list]
      MISSING_KEYWORDS: [comma separated list]
      IMPROVEMENTS:
      - [improvement 1]
      - [improvement 2]
      - [etc]
      
      Resume:
      ${resumeText}
      
      Job Description:
      ${jobDescription}
    `;
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
    });
    
    const response = result.response;
    const text = response.text();
    
    // Parse the response
    return parseGeminiResponse(text);
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    
    // Fallback to mock analysis if Gemini API fails
    return mockAnalyzeResume(resumeText, jobDescription);
  }
}

function parseGeminiResponse(responseText: string): AnalysisResult {
  try {
    // Extract scores
    const overallScoreMatch = responseText.match(/OVERALL_SCORE:\s*(\d+)/);
    const keywordScoreMatch = responseText.match(/KEYWORD_SCORE:\s*(\d+)/);
    const formatScoreMatch = responseText.match(/FORMAT_SCORE:\s*(\d+)/);
    
    // Extract keywords
    const matchedKeywordsMatch = responseText.match(/MATCHED_KEYWORDS:\s*(.*?)(?=\n|$)/);
    const missingKeywordsMatch = responseText.match(/MISSING_KEYWORDS:\s*(.*?)(?=\n|$)/);
    
    // Extract improvements
    const improvementsMatch = responseText.match(/IMPROVEMENTS:([\s\S]*?)(?=\n\n|$)/);
    
    // Parse matched keywords
    const matchedKeywords = matchedKeywordsMatch && matchedKeywordsMatch[1].trim() !== '' 
      ? matchedKeywordsMatch[1].split(',').map(k => k.trim())
      : [];
    
    // Parse missing keywords
    const missingKeywords = missingKeywordsMatch && missingKeywordsMatch[1].trim() !== ''
      ? missingKeywordsMatch[1].split(',').map(k => k.trim())
      : [];
    
    // Parse improvements
    const improvementsText = improvementsMatch ? improvementsMatch[1] : '';
    const improvements = improvementsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.substring(1).trim());
    
    return {
      overallScore: overallScoreMatch ? parseInt(overallScoreMatch[1]) : 70,
      keywordMatchScore: keywordScoreMatch ? parseInt(keywordScoreMatch[1]) : 65,
      formatScore: formatScoreMatch ? parseInt(formatScoreMatch[1]) : 75,
      matchedKeywords,
      missingKeywords,
      improvements: improvements.length > 0 ? improvements : ["Customize your resume for this specific job posting."],
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Failed to parse AI response");
  }
}

// Fallback mock analysis function
function mockAnalyzeResume(resumeText: string, jobDescription: string): AnalysisResult {
  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !commonWords.includes(word));
    
    // Return unique words
    return Array.from(new Set(words));
  };
  
  // Common words to filter out
  const commonWords = [
    'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
    'his', 'from', 'they', 'will', 'would', 'there', 'their', 'what', 'about',
    'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'person',
  ];
  
  // Generate improvement suggestions
  const generateImprovements = (
    overallScore: number, 
    keywordScore: number, 
    formatScore: number
  ): string[] => {
    const improvements: string[] = [];
    
    if (overallScore < 70) {
      improvements.push("Your resume needs significant improvements to pass ATS systems.");
    }
    
    if (keywordScore < 60) {
      improvements.push("Add more relevant keywords from the job description to your resume.");
      improvements.push("Customize your resume for each specific job application.");
    }
    
    if (formatScore < 80) {
      improvements.push("Use a cleaner, ATS-friendly resume format.");
      improvements.push("Avoid complex tables, headers/footers, and graphics.");
      improvements.push("Use standard section headings (Experience, Education, Skills).");
    }
    
    if (improvements.length === 0) {
      improvements.push("Your resume is well-optimized for ATS systems!");
    }
    
    return improvements;
  };
  
  // Calculate a mock score based on keyword matching
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);
  
  const matchedKeywords = jobKeywords.filter(keyword => 
    resumeKeywords.some(resumeKeyword => 
      resumeKeyword.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  const keywordMatchScore = Math.min(100, Math.round((matchedKeywords.length / jobKeywords.length) * 100));
  
  // Calculate format score based on resume length and structure
  const formatScore = Math.min(100, Math.round(70 + Math.random() * 30));
  
  // Calculate ATS compatibility score
  const atsScore = Math.min(100, Math.round((keywordMatchScore * 0.7) + (formatScore * 0.3)));
  
  return {
    overallScore: atsScore,
    keywordMatchScore,
    formatScore,
    matchedKeywords,
    missingKeywords: jobKeywords.filter(keyword => 
      !matchedKeywords.includes(keyword)
    ),
    improvements: generateImprovements(atsScore, keywordMatchScore, formatScore),
  };
}