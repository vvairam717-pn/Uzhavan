import { useState, type FormEvent } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HeartPulse,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import type { BootstrapPayload, CommunityPost, Consultation } from '../types';
import type { Translations } from '../i18n/translations';

interface CommunityAndSupportViewProps {
  data: BootstrapPayload;
  onConsultationAdded: (cons: Consultation) => void;
  onCommunityPostAdded: (post: CommunityPost) => void;
  t: Translations;
}

export function CommunityAndSupportView({
  data,
  onConsultationAdded,
  onCommunityPostAdded,
  t,
}: CommunityAndSupportViewProps) {
  const { consultations, communityPosts, lessons, vetServices, emergencyContacts, farmerProfile } = data;

  const [activeTab, setActiveTab] = useState<'experts' | 'community' | 'vet-emergency' | 'learning'>('experts');

  // Expert question form
  const [specialist, setSpecialist] = useState<Consultation['specialistType']>('Crop Specialist');
  const [crop, setCrop] = useState(farmerProfile.primaryCrop);
  const [question, setQuestion] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning 08:00 AM – 10:00 AM');
  const [consSaving, setConsSaving] = useState(false);

  // Community post form
  const [postTitle, setPostTitle] = useState('');
  const [postTag, setPostTag] = useState('Paddy SRI');
  const [postContent, setPostContent] = useState('');
  const [postSaving, setPostSaving] = useState(false);

  async function handleSubmitConsultation(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setConsSaving(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: farmerProfile.name,
          district: farmerProfile.district,
          crop,
          specialistType: specialist,
          question: question.trim(),
          preferredTime,
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        onConsultationAdded(payload.consultation);
        setQuestion('');
      }
    } finally {
      setConsSaving(false);
    }
  }

  async function handleAddPost(e: FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setPostSaving(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: farmerProfile.name,
          district: farmerProfile.district,
          cropTag: postTag,
          title: postTitle.trim(),
          content: postContent.trim(),
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        onCommunityPostAdded(payload.post);
        setPostTitle('');
        setPostContent('');
      }
    } finally {
      setPostSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{t.communityTitle}</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Direct agronomist phone/text consultation, farmer forum, veterinary hospitals, Tamil lessons & disaster relief
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg self-start">
          {(
            [
              { id: 'experts', label: `Experts (${consultations.length})` },
              { id: 'community', label: `Community (${communityPosts.length})` },
              { id: 'vet-emergency', label: 'Vet & Emergency' },
              { id: 'learning', label: 'Tamil Learning' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expert Consultation */}
      {activeTab === 'experts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmitConsultation}
            className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4 self-start"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>Book Human Expert Consultation</span>
            </h2>
            <div>
              <label htmlFor="exp-spec" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Specialist Type
              </label>
              <select
                id="exp-spec"
                value={specialist}
                onChange={(e) => setSpecialist(e.target.value as Consultation['specialistType'])}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="Crop Specialist">Crop Specialist</option>
                <option value="Soil Expert">Soil Expert</option>
                <option value="Pest Control">Pest Control Specialist</option>
                <option value="Veterinary">Livestock / Veterinary</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="exp-crop" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Crop / Livestock
                </label>
                <input
                  id="exp-crop"
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="exp-time" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Call Slot
                </label>
                <select
                  id="exp-time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                >
                  <option>Morning 08:00 AM – 10:00 AM</option>
                  <option>Afternoon 02:00 PM – 04:00 PM</option>
                  <option>Evening 05:00 PM – 07:00 PM</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="exp-q" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Describe Your Question
              </label>
              <textarea
                id="exp-q"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about dosage, soil pH correction, or schedule a phone callback..."
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={consSaving}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Send className="w-4 h-4" />
              <span>{consSaving ? 'Submitting...' : 'Submit to Agriculture Expert'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {consultations.map((cons) => (
              <article
                key={cons.id}
                className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    {cons.farmerName} · {cons.district} · {cons.crop} · {cons.specialistType}
                  </span>
                  <span
                    className={`font-semibold ${
                      cons.status === 'Answered'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {cons.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cons.question}</p>
                {cons.expertResponse && (
                  <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {cons.expertName}
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                      {cons.expertResponse}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Community Forum */}
      {activeTab === 'community' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddPost}
            className="lg:col-span-5 bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-3 self-start"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>Share Farm Experience or Ask District Group</span>
            </h2>
            <div>
              <label htmlFor="com-title" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Post Title
              </label>
              <input
                id="com-title"
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g., Effective yellow sticky trap spacing for brinjal"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="com-tag" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Crop Group Tag
              </label>
              <input
                id="com-tag"
                type="text"
                value={postTag}
                onChange={(e) => setPostTag(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="com-body" className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Details
              </label>
              <textarea
                id="com-body"
                rows={3}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={postSaving}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {postSaving ? 'Publishing...' : 'Publish to Farmer Community'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {communityPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    {post.authorName} · {post.district} · {post.cropTag} · <span className="font-mono-tabular">{post.createdAt}</span>
                  </span>
                  {post.expertVerified && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Verified Story
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{post.title}</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{post.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Veterinary & Emergency */}
      {activeTab === 'vet-emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>Veterinary Hospitals & Livestock Care</span>
            </h2>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {vetServices.map((vet) => (
                <div key={vet.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{vet.hospitalName}</h3>
                    <span className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                      {vet.phone}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    {vet.doctorName} · {vet.district} · {vet.hours}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Specialty: {vet.specialty}</p>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
              <strong>Vaccination Reminder:</strong> Foot-and-Mouth Disease (FMD) & Lumpy Skin Disease booster camp runs every Monday at Panchayat Veterinary Dispensaries.
            </div>
          </div>

          <div className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>Emergency Disaster & Agriculture Offices</span>
            </h2>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {emergencyContacts.map((emg) => (
                <div key={emg.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{emg.officeName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {emg.role} · {emg.district} · {emg.availability}
                    </p>
                  </div>
                  <a
                    href={`tel:${emg.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    <span className="font-mono-tabular">{emg.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rural Learning Centre */}
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {lessons.map((les) => (
            <article
              key={les.id}
              className="bg-white dark:bg-[#141D18] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{les.category}</span>
                <span className="font-mono-tabular">{les.duration} · {les.level}</span>
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{les.title}</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{les.tamilTitle}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{les.summary}</p>
              <ul className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                {les.keyTakeaways.map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
