import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  PhoneCall,
  PhoneIncoming,
  Send,
  ShieldAlert,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import type { BootstrapPayload, CropDiagnosisRecord, HelplineCall, LanguageCode } from '../types';
import type { Translations } from '../i18n/translations';
import { ResilientImage } from './ResilientImage';

interface AiVoiceAndCropDoctorProps {
  data: BootstrapPayload;
  language: LanguageCode;
  onCallLogged: (call: HelplineCall) => void;
  onDiagnosisAdded: (record: CropDiagnosisRecord) => void;
  t: Translations;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResult>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

export function AiVoiceAndCropDoctor({
  data,
  language,
  onCallLogged,
  onDiagnosisAdded,
  t,
}: AiVoiceAndCropDoctorProps) {
  const { farmerProfile, helplineCalls, diagnoses } = data;

  // Voice & AI Assistant state
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<{
    answer: string;
    actionSteps: string[];
    recommendedModule: string;
  } | null>(null);
  const [listening, setListening] = useState(false);

  // Missed call / callback state
  const [callbackPhone, setCallbackPhone] = useState(farmerProfile.phone);
  const [callbackType, setCallbackType] = useState<'Missed-Call Callback' | 'Scheduled Callback'>(
    'Missed-Call Callback'
  );
  const [callbackNote, setCallbackNote] = useState('');
  const [callbackStatus, setCallbackStatus] = useState('');
  const [callbackSaving, setCallbackSaving] = useState(false);

  // Crop & Soil Doctor state
  const [cropName, setCropName] = useState(farmerProfile.primaryCrop);
  const [symptoms, setSymptoms] = useState('');
  const [soilNotes, setSoilNotes] = useState(farmerProfile.soilType);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [useSampleLeaf, setUseSampleLeaf] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState('');
  const [latestDiag, setLatestDiag] = useState<{
    diseaseName: string;
    severity: string;
    confidence: string;
    organicTreatment: string;
    chemicalTreatment: string;
    prevention: string;
    soilOrFertilizerAdvice: string;
  } | null>(null);

  const quickPrompts: Array<{ label: string; text: string }> = [
    {
      label: 'Tamil Paddy Yellowing',
      text: 'தஞ்சாவூர் 40 நாள் நெல் பயிரில் இலைகள் மஞ்சளாக மாறுகின்றன. என்ன உரம் மற்றும் பூச்சிக்கொல்லி இட வேண்டும்?',
    },
    {
      label: 'Rain & Spray Timing',
      text: 'Heavy rain is expected on Friday in my district. Should I postpone top-dressing urea and neem spray?',
    },
    {
      label: 'Drip Subsidy Eligibility',
      text: 'How can a 3.5 acre Tamil Nadu farmer apply for 100% Micro-Irrigation drip subsidy and what documents are needed?',
    },
  ];

  function speakText(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function startVoiceInput() {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      setAiError('Voice dictation is not supported in this browser; please type your question below.');
      return;
    }
    setAiError('');
    const rec = new Recognition();
    rec.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    rec.start();
  }

  async function handleAskAssistant(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setAiError('Please enter or speak a farming question.');
      return;
    }
    setAiError('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          language,
          district: farmerProfile.district,
          crop: farmerProfile.primaryCrop,
          soilType: farmerProfile.soilType,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Assistant request failed');
      }
      setAiResult({
        answer: payload.answer,
        actionSteps: payload.actionSteps || [],
        recommendedModule: payload.recommendedModule || 'Crop Doctor',
      });
      if (payload.callLog) {
        onCallLogged(payload.callLog);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI Helpline.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleRequestCallback(e: FormEvent) {
    e.preventDefault();
    if (!callbackPhone.trim() || !callbackNote.trim()) {
      setCallbackStatus('Enter phone number and brief farming query.');
      return;
    }
    setCallbackSaving(true);
    setCallbackStatus('');
    try {
      const res = await fetch('/api/helpline/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: callbackPhone.trim(),
          district: farmerProfile.district,
          language,
          callType: callbackType,
          querySummary: callbackNote.trim(),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Callback request failed');
      onCallLogged(payload.call);
      setCallbackNote('');
      setCallbackStatus(`Saved! Tamil AI & Expert desk will call ${callbackPhone.trim()}.`);
    } catch (err) {
      setCallbackStatus(err instanceof Error ? err.message : 'Failed to schedule callback');
    } finally {
      setCallbackSaving(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUseSampleLeaf(false);
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPreviewUrl(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  }

  function handleLoadSampleLeaf() {
    setImageBase64('');
    setImageMimeType('');
    setUseSampleLeaf(true);
    setPreviewUrl('/src/assets/images/crop_leaf_sample_1795098382079.jpg');
    setCropName('Paddy (ADT-45)');
    setSymptoms('Elongated brown lesions with gray necrotic centers on upper paddy leaves');
  }

  async function handleRunDiagnosis(e: FormEvent) {
    e.preventDefault();
    if (!symptoms.trim() && !imageBase64 && !useSampleLeaf) {
      setDiagError('Upload a leaf/soil photo, load the sample leaf, or describe crop symptoms.');
      return;
    }
    setDiagError('');
    setDiagLoading(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: cropName,
          symptoms,
          soilNotes,
          language,
          imageBase64: imageBase64 || undefined,
          imageMimeType: imageMimeType || undefined,
          useSampleLeaf,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Diagnosis request failed');
      setLatestDiag(payload.diagnosis);
      if (payload.record) {
        onDiagnosisAdded(payload.record);
      }
    } catch (err) {
      setDiagError(err instanceof Error ? err.message : 'Diagnosis failed');
    } finally {
      setDiagLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Section: AI Voice Helpline + Missed Call Desk */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {t.aiAssistantTitle}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Toll-Free Keypad & Smartphone Helpline <span className="font-mono-tabular font-semibold text-neutral-800 dark:text-neutral-200">1800-425-8942</span> · Tamil / English / Hindi
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                24x7 Voice AI + Agronomist Handoff
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setQuery(item.text)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:border-emerald-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAskAssistant} className="space-y-3">
            <label htmlFor="ai-voice-query" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Speak or type your farming question ({language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'})
            </label>
            <textarea
              id="ai-voice-query"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., My paddy crop is 40 days old in Thanjavur and leaves show brown spots..."
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white transition-colors"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{aiLoading ? 'Consulting Uzhavan AI...' : 'Ask AI Advisor'}</span>
              </button>

              <button
                type="button"
                onClick={startVoiceInput}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  listening
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span>{listening ? 'Listening...' : 'Speak Question'}</span>
              </button>
            </div>
          </form>

          {aiError && (
            <div role="alert" className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
              {aiError}
            </div>
          )}

          {aiResult && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  AI Voice Response · Suggested: {aiResult.recommendedModule}
                </span>
                <button
                  type="button"
                  onClick={() => speakText(`${aiResult.answer} ${aiResult.actionSteps.join('. ')}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Read Aloud</span>
                </button>
              </div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">{aiResult.answer}</p>
              {aiResult.actionSteps.length > 0 && (
                <ul className="space-y-1.5 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/60">
                  {aiResult.actionSteps.map((step, idx) => (
                    <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                      <span className="font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                        0{idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Missed-Call Callback & Helpline Call History */}
        <div className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <PhoneIncoming className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>Missed-Call Callback (Keypad Phone Support)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Farmers without smartphones dial <span className="font-mono-tabular">1800-425-8942</span>; AI calls back in Tamil.
            </p>
          </div>

          <form onSubmit={handleRequestCallback} className="space-y-3">
            <div>
              <label htmlFor="cb-phone" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Mobile Number
              </label>
              <input
                id="cb-phone"
                type="tel"
                value={callbackPhone}
                onChange={(e) => setCallbackPhone(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label htmlFor="cb-type" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Callback Mode
              </label>
              <select
                id="cb-type"
                value={callbackType}
                onChange={(e) => setCallbackType(e.target.value as 'Missed-Call Callback' | 'Scheduled Callback')}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
              >
                <option value="Missed-Call Callback">Immediate Missed-Call Callback</option>
                <option value="Scheduled Callback">Schedule Expert Phone Call</option>
              </select>
            </div>
            <div>
              <label htmlFor="cb-note" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Topic / Emergency Note
              </label>
              <input
                id="cb-note"
                type="text"
                value={callbackNote}
                onChange={(e) => setCallbackNote(e.target.value)}
                placeholder="e.g., Stem borer attack on 3-acre Kuruvai paddy"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <button
              type="submit"
              disabled={callbackSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
              <span>{callbackSaving ? 'Scheduling...' : 'Request AI / Expert Callback'}</span>
            </button>
            {callbackStatus && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{callbackStatus}</p>
            )}
          </form>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              Recent Helpline Call History ({helplineCalls.length})
            </h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {helplineCalls.slice(0, 5).map((call) => (
                <div key={call.id} className="py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {call.querySummary}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {call.callType} · <span className="font-mono-tabular">{call.phone}</span> · {call.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Multimodal Crop Disease, Pest & Soil Report AI Analyzer */}
      <section className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{t.cropDoctorTitle}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Upload crop leaf photo or soil test card for instant AI diagnosis, organic treatment & fertilizer dosage
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSampleLeaf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Load Sample Paddy Leaf</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleRunDiagnosis} className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="diag-crop" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Crop Name
                </label>
                <input
                  id="diag-crop"
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label htmlFor="diag-soil" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Soil Type / pH Notes
                </label>
                <input
                  id="diag-soil"
                  type="text"
                  value={soilNotes}
                  onChange={(e) => setSoilNotes(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="diag-symptoms" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Leaf / Pest / Soil Symptoms
              </label>
              <textarea
                id="diag-symptoms"
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe spots, curling, yellowing, stem boring, or soil test NPK values..."
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label htmlFor="diag-file" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Upload Crop Photo or Soil Report Image
              </label>
              <label
                htmlFor="diag-file"
                className="flex items-center justify-center gap-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 cursor-pointer hover:border-emerald-600 text-xs text-neutral-600 dark:text-neutral-300"
              >
                <Upload className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Choose JPG / PNG photo from phone or gallery</span>
                <input
                  id="diag-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {previewUrl && (
              <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 h-44">
                <ResilientImage src={previewUrl} alt="Selected crop sample" className="w-full h-full object-cover" />
              </div>
            )}

            {diagError && (
              <div role="alert" className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {diagError}
              </div>
            )}

            <button
              type="submit"
              disabled={diagLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white transition-colors"
            >
              {diagLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{diagLoading ? 'Analyzing Leaf & Soil...' : 'Run AI Disease & Soil Diagnosis'}</span>
            </button>
          </form>

          <div className="lg:col-span-6 space-y-4">
            {latestDiag ? (
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                    {latestDiag.diseaseName}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      speakText(
                        `${latestDiag.diseaseName}. Organic treatment: ${latestDiag.organicTreatment}. Prevention: ${latestDiag.prevention}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Severity: <strong className="text-amber-700 dark:text-amber-400">{latestDiag.severity}</strong> · Confidence{' '}
                  <span className="font-mono-tabular">{latestDiag.confidence}</span>
                </p>
                <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <p>
                    <strong className="text-neutral-900 dark:text-neutral-100">Organic Control:</strong> {latestDiag.organicTreatment}
                  </p>
                  <p>
                    <strong className="text-neutral-900 dark:text-neutral-100">Targeted Treatment:</strong> {latestDiag.chemicalTreatment}
                  </p>
                  <p>
                    <strong className="text-neutral-900 dark:text-neutral-100">Soil & Fertilizer Advice:</strong> {latestDiag.soilOrFertilizerAdvice}
                  </p>
                  <p>
                    <strong className="text-neutral-900 dark:text-neutral-100">Prevention:</strong> {latestDiag.prevention}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Crop Health History ({diagnoses.length})
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Run a scan on the left or inspect previous field diagnoses verified by TNAU experts.
                </p>
              </div>
            )}

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              {diagnoses.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {rec.diseaseName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {rec.verifiedByExpert ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Expert Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                          <span className="text-amber-700 dark:text-amber-400">Pending Review</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {rec.crop} · Severity: {rec.severity} · Confidence {rec.confidence}
                  </p>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">{rec.organicTreatment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
