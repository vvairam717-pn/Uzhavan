import { GoogleGenAI, Type } from '@google/genai';
import type { LanguageCode } from '../src/types';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  ta: 'Tamil (தமிழ்) in clear, natural spoken rural Tamil script',
  en: 'English in clear, practical farmer-friendly prose',
  hi: 'Hindi (हिन्दी) in clear, natural Devanagari script',
};

export interface AssistantRequest {
  query: string;
  language: LanguageCode;
  district: string;
  crop: string;
  soilType: string;
}

export async function runAgriAssistant(req: AssistantRequest): Promise<{
  answer: string;
  actionSteps: string[];
  recommendedModule: string;
}> {
  const ai = getAiClient();
  const langLabel = LANGUAGE_LABELS[req.language] ?? LANGUAGE_LABELS.en;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Farmer District: ${req.district}
Primary Crop: ${req.crop}
Soil Type: ${req.soilType}
Farmer Question: ${req.query}`,
    config: {
      systemInstruction: `You are Uzhavan AI, a senior Tamil Nadu agricultural scientist and rural voice helpline advisor.
Respond strictly in ${langLabel}.
Keep guidance concise, actionable, safe, and grounded in Indian/Tamil Nadu agronomy (TNAU practices, drip fertigation, IPM, government schemes like PM-KISAN / Kuruvai Package, and e-NAM mandi selling).
Return a valid JSON object matching the schema.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: 'Direct, empathetic 2-4 sentence answer in the requested language.',
          },
          actionSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 concrete field action steps in the requested language.',
          },
          recommendedModule: {
            type: Type.STRING,
            description: 'One of: Crop Doctor, Marketplace, Mandi & Schemes, Weather, Finance.',
          },
        },
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  const parsed = JSON.parse(text) as {
    answer?: string;
    actionSteps?: string[];
    recommendedModule?: string;
  };

  return {
    answer: parsed.answer || 'Please consult your nearest Agricultural Extension Centre.',
    actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
    recommendedModule: parsed.recommendedModule || 'Crop Doctor',
  };
}

export interface DiagnoseRequest {
  crop: string;
  symptoms: string;
  soilNotes?: string;
  language: LanguageCode;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface DiagnosisResult {
  diseaseName: string;
  severity: 'Low' | 'Moderate' | 'High';
  confidence: string;
  organicTreatment: string;
  chemicalTreatment: string;
  prevention: string;
  soilOrFertilizerAdvice: string;
}

export async function runCropAndSoilDiagnosis(req: DiagnoseRequest): Promise<DiagnosisResult> {
  const ai = getAiClient();
  const langLabel = LANGUAGE_LABELS[req.language] ?? LANGUAGE_LABELS.en;

  const promptText = `Analyze this crop/soil issue for a farmer.
Crop: ${req.crop}
Observed Symptoms: ${req.symptoms || 'See attached image'}
Soil / Field Notes: ${req.soilNotes || 'Not specified'}
Respond strictly in ${langLabel}. Give safe dosages per litre of water and organic + chemical options.`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (req.imageBase64 && req.imageMimeType) {
    const cleanBase64 = req.imageBase64.includes(',')
      ? req.imageBase64.split(',')[1]
      : req.imageBase64;
    parts.push({
      inlineData: {
        mimeType: req.imageMimeType,
        data: cleanBase64,
      },
    });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts },
    config: {
      systemInstruction: `You are an expert plant pathologist and soil scientist serving Tamil Nadu farmers.
Inspect the leaf photo and/or symptoms accurately. Never invent non-existent chemicals; recommend standard TNAU-approved bio-controls and safe dosages.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diseaseName: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'Low, Moderate, or High' },
          confidence: { type: Type.STRING, description: 'e.g. 91%' },
          organicTreatment: { type: Type.STRING },
          chemicalTreatment: { type: Type.STRING },
          prevention: { type: Type.STRING },
          soilOrFertilizerAdvice: { type: Type.STRING },
        },
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  const parsed = JSON.parse(text) as Partial<DiagnosisResult>;
  const sev = parsed.severity === 'High' || parsed.severity === 'Low' ? parsed.severity : 'Moderate';

  return {
    diseaseName: parsed.diseaseName || 'Nutrient / Fungal Stress',
    severity: sev,
    confidence: parsed.confidence || '88%',
    organicTreatment: parsed.organicTreatment || 'Apply Neem Oil 3ml/L + Pseudomonas fluorescens 10g/L.',
    chemicalTreatment: parsed.chemicalTreatment || 'Consult AEC for targeted fungicide dosage.',
    prevention: parsed.prevention || 'Ensure proper field drainage and balanced potash nutrition.',
    soilOrFertilizerAdvice: parsed.soilOrFertilizerAdvice || 'Test soil pH and incorporate organic vermicompost.',
  };
}
