/**
 * CareProfile.jsx
 * Phryne · Care Exchange Profile
 *
 * WHAT THIS DOES
 * Reads the member's stored quiz scores from Supabase, runs a single
 * Claude API call to generate three analysis blocks, stores the result
 * back to care_profiles, and displays the three sections with toggle
 * controls for selective sharing.
 *
 * HOW TO USE IN THE PHRYNE ROUTER
 * import CareProfile from './CareProfile';
 * // Add to your route config:
 * { path: '/profile/care', element: <CareProfile /> }
 *
 * ENVIRONMENT VARIABLES NEEDED (already in your Vite .env)
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_ANON_KEY
 * VITE_ANTHROPIC_API_KEY   ← new; add to Render env vars too
 *
 * DEPENDENCIES
 * @supabase/supabase-js   (already installed)
 * qrcode.react            (npm install qrcode.react)  — for Step 3 share UI
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Palette ─────────────────────────────────────────────────
const C = {
  bg:      '#0A0A16',
  surface: '#13131F',
  border:  '#2A2A40',
  pink:    '#FF2D78',
  cyan:    '#00E5FF',
  purple:  '#9D4EFF',
  amber:   '#FFB300',
  green:   '#39FF14',
  txt:     '#F2F2FA',
  muted:   '#9090B5',
};

// Section config — drives rendering and the AI prompt
const SECTIONS = [
  {
    id:    'communication',
    label: 'Communication',
    sub:   'factors to consider in peer exchange',
    color: C.cyan,
    icon:  '◈',
    dims:  ['communication', 'neurodivergence', 'activation'],
    shareKey: 'share_communication',
  },
  {
    id:    'status',
    label: 'Status',
    sub:   'needs and conditions that shape what works',
    color: C.amber,
    icon:  '◉',
    dims:  ['needs', 'mentalhealth', 'activation'],
    shareKey: 'share_status',
  },
  {
    id:    'knowledge',
    label: 'Knowledge & Terrain',
    sub:   'what I hold and know well',
    color: C.purple,
    icon:  '◆',
    dims:  ['erotic', 'emotional', 'relational', 'somatic'],
    shareKey: 'share_knowledge',
  },
];

// ── Prompt builder ───────────────────────────────────────────
function buildPrompt(profile) {
  const fmt = v => v != null ? `${v}/5` : 'not answered';
  const lean = v => v == null ? 'unknown'
    : v < 2 ? 'leaning Stuck Off (flat, lethargic, disconnected)'
    : v > 3 ? 'leaning Stuck On (wired, hypervigilant, flooded)'
    : 'relatively regulated';

  return `You are generating a care exchange profile for a peer mutual aid platform. This profile translates a person's self-assessment scores into plain, shame-free, non-pathologizing language they can choose to share with a peer before or during a care exchange. The platform is rooted in anti-oppressive, sex-worker-centered, non-extractive values. Tone is direct, warm, and politically grounded — never clinical, never prescriptive.

QUIZ SCORES (0–5 scale):
Status dimensions:
- Unmet Basic Needs: ${fmt(profile.score_needs)} (higher = more unmet)
- Mental Health Load: ${fmt(profile.score_mentalhealth)} (higher = more load)
- Neurodivergence & Access: ${fmt(profile.score_neurodivergence)} (higher = more present)
- Communication & Repair: ${fmt(profile.score_communication)} (higher = more strain)

Activation state:
- General baseline: ${lean(profile.activation_general)}
- In relational contexts: ${lean(profile.activation_relational)}

Relating dimensions (presence, not strain):
- Erotic & Kink: ${fmt(profile.score_erotic)}
- Emotional Nurturance: ${fmt(profile.score_emotional)}
- Relational Flexibility: ${fmt(profile.score_relational)}
- Somatic & Spiritual: ${fmt(profile.score_somatic)}
- Digital Relating: ${fmt(profile.score_digital)}

${profile.mh_origin_tags?.length
  ? `MH origin context: ${profile.mh_origin_tags.join(', ')}`
  : ''}
${profile.mh_manifestation_patterns?.length
  ? `Patterns present: ${profile.mh_manifestation_patterns.join(', ')}`
  : ''}

Generate exactly three sections. Each section is 2–4 sentences. Write in first person ("I tend to..."). Do not use clinical diagnosis language. Do not add caveats or disclaimers. Do not repeat the numeric scores. Write as if the person themselves is sharing context with a peer who cares about them.

Respond with valid JSON only — no markdown, no backticks, no preamble:
{
  "communication": "...",
  "status": "...",
  "knowledge": "..."
}

Guidance per section:
- communication: How this person tends to communicate under pressure, what supports repair and being heard, how their ND traits or activation state affect how they receive feedback or direction in a peer exchange.
- status: What conditions or needs being met make an exchange work well for them right now. What kinds of exchanges suit their current capacity. Pacing or access context if relevant.
- knowledge: Areas of lived depth and knowledge they bring — relational terrain they know well, erotic or somatic literacy, emotional capacity, without framing this as a service offering.`;
}

// ── API call ─────────────────────────────────────────────────
async function generateAnalysis(profile) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: buildPrompt(profile) }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Supabase helpers ─────────────────────────────────────────
async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('care_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // 116 = no rows
  return data;
}

async function saveAnalysis(userId, analysis) {
  const { error } = await supabase
    .from('care_profiles')
    .upsert({
      user_id:                userId,
      analysis_communication: analysis.communication,
      analysis_status:        analysis.status,
      analysis_knowledge:     analysis.knowledge,
      analysis_generated_at:  new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function updateShareToggles(userId, toggles) {
  const { error } = await supabase
    .from('care_profiles')
    .update(toggles)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Components ───────────────────────────────────────────────
function SectionCard({ section, text, toggled, onToggle, loading }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${toggled ? section.color + '55' : C.border}`,
      borderRadius: 10,
      padding: '24px 28px',
      marginBottom: 16,
      transition: 'border-color .2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <span style={{ color: section.color, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            {section.icon} {section.label}
          </span>
          <span style={{ color: C.muted, fontSize: 12 }}>{section.sub}</span>
        </div>
        {/* Share toggle */}
        <button
          onClick={() => onToggle(!toggled)}
          title={toggled ? 'Remove from shared view' : 'Include in shared view'}
          style={{
            background: toggled ? section.color + '22' : 'transparent',
            border: `1px solid ${toggled ? section.color : C.border}`,
            borderRadius: 20,
            padding: '5px 14px',
            color: toggled ? section.color : C.muted,
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'all .15s',
            whiteSpace: 'nowrap',
          }}
        >
          {toggled ? '✓ Sharing' : 'Not sharing'}
        </button>
      </div>

      {/* Analysis text */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        paddingTop: 14,
        color: loading ? C.muted : C.txt,
        fontSize: 14,
        lineHeight: 1.75,
        fontStyle: loading ? 'italic' : 'normal',
        minHeight: 60,
      }}>
        {loading ? 'Generating…' : (text || 'Not yet generated.')}
      </div>
    </div>
  );
}

function ScoreChip({ label, value, color }) {
  if (value == null) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: color + '18', border: `1px solid ${color}33`,
      borderRadius: 4, padding: '3px 10px', marginRight: 8, marginBottom: 8,
      fontSize: 11, fontFamily: 'monospace', color,
    }}>
      {label}: {value}/5
    </span>
  );
}

// ── Main component ───────────────────────────────────────────
export default function CareProfile() {
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [analysis, setAnalysis] = useState({ communication: null, status: null, knowledge: null });
  const [toggles,  setToggles]  = useState({ share_communication: true, share_status: true, share_knowledge: true });
  const [genState, setGenState] = useState('idle'); // idle | loading | done | error
  const [genError, setGenError] = useState(null);
  const [saved,    setSaved]    = useState(false);

  // Load session + profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      loadProfile(data.user.id)
        .then(p => {
          if (!p) return;
          setProfile(p);
          setAnalysis({
            communication: p.analysis_communication,
            status:        p.analysis_status,
            knowledge:     p.analysis_knowledge,
          });
          setToggles({
            share_communication: p.shareable_communication ?? true,
            share_status:        p.shareable_status ?? true,
            share_knowledge:     p.shareable_knowledge ?? true,
          });
        })
        .catch(console.error);
    });
  }, []);

  // Generate analysis
  const handleGenerate = useCallback(async () => {
    if (!profile || !user) return;
    setGenState('loading');
    setGenError(null);
    try {
      const result = await generateAnalysis(profile);
      setAnalysis(result);
      await saveAnalysis(user.id, result);
      setGenState('done');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      setGenError(e.message);
      setGenState('error');
    }
  }, [profile, user]);

  // Update share toggles
  const handleToggle = useCallback(async (sectionId, value) => {
    const key = `shareable_${sectionId}`;
    const updated = { ...toggles, [key]: value };
    setToggles(updated);
    if (user) {
      await updateShareToggles(user.id, { [key]: value }).catch(console.error);
    }
  }, [toggles, user]);

  // ── Render ─────────────────────────────────────────────────
  const hasScores = profile && (profile.score_needs != null);
  const hasAnalysis = analysis.communication || analysis.status || analysis.knowledge;
  const loading = genState === 'loading';

  return (
    <div style={{
      background: C.bg, minHeight: '100vh',
      color: C.txt, fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      padding: '0 0 80px',
    }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 24px 18px', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
          VHE · Care Exchange Profile
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>Your Exchange Profile</h1>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* Intro */}
        <div style={{ margin: '24px 0 20px', padding: '18px 20px', background: C.surface, borderRadius: 8, borderLeft: `3px solid ${C.pink}` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            This profile translates your quiz results into plain language you can share with a peer before or during an exchange. <strong style={{ color: C.txt }}>You control what gets shared.</strong> Each section can be toggled on or off independently. AI generates the text — you decide what goes out.
          </p>
        </div>

        {/* Score chips (informational, status only) */}
        {hasScores && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 10 }}>
              From your quiz
            </div>
            <ScoreChip label="Basic Needs" value={profile.score_needs} color={C.cyan} />
            <ScoreChip label="Mental Health Load" value={profile.score_mentalhealth} color={C.amber} />
            <ScoreChip label="ND & Access" value={profile.score_neurodivergence} color={C.green} />
            <ScoreChip label="Comms & Repair" value={profile.score_communication} color={C.pink} />
          </div>
        )}

        {/* No scores yet */}
        {!hasScores && (
          <div style={{ padding: '20px 24px', background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>
              No quiz scores found for your account. Complete the Relationship Ecosystem Quiz first — your results will be saved here automatically when you use your community access code.
            </p>
          </div>
        )}

        {/* Generate / Regenerate button */}
        {hasScores && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                background: loading ? C.surface : C.pink,
                color: loading ? C.muted : C.bg,
                border: loading ? `1px solid ${C.border}` : 'none',
                borderRadius: 6, padding: '12px 24px',
                fontFamily: 'monospace', fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, transition: 'all .15s',
              }}
            >
              {loading ? 'Generating…' : hasAnalysis ? 'Regenerate from quiz' : 'Generate profile'}
            </button>
            {saved && (
              <span style={{ color: C.green, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 }}>
                ✓ Saved
              </span>
            )}
            {genState === 'error' && (
              <span style={{ color: C.pink, fontSize: 12 }}>
                {genError || 'Generation failed. Try again.'}
              </span>
            )}
          </div>
        )}

        {/* Three analysis section cards */}
        {SECTIONS.map(sec => (
          <SectionCard
            key={sec.id}
            section={sec}
            text={analysis[sec.id]}
            toggled={toggles[`shareable_${sec.id}`] ?? true}
            onToggle={val => handleToggle(sec.id, val)}
            loading={loading}
          />
        ))}

        {/* Share entry point — rendered by ExchangeShare.jsx (Step 3) */}
        {hasAnalysis && (
          <div id="exchange-share-mount" style={{ marginTop: 32 }}>
            {/* ExchangeShare component mounts here */}
            {/* Import and render <ExchangeShare userId={user?.id} toggles={toggles} /> */}
          </div>
        )}

        {/* AI transparency note */}
        <div style={{ marginTop: 28, padding: '14px 18px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface }}>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.65 }}>
            <span style={{ color: C.cyan, fontFamily: 'monospace' }}>AI · infrastructure only</span>
            {' '}— this text was generated from your quiz scores. It is a starting point for your own description, not a substitute for it. Your peer receives what you choose to share.
          </p>
        </div>

      </div>
    </div>
  );
}

/**
 * INTEGRATION STEPS
 * ─────────────────
 *
 * 1. Run the SQL migration first (001_care_profiles.sql).
 *    Confirm care_profiles and exchange_shares tables exist in Supabase.
 *
 * 2. When a member completes the quiz with a Phryne community code,
 *    upsert their scores into care_profiles:
 *
 *    await supabase.from('care_profiles').upsert({
 *      user_id:                currentUser.id,
 *      score_needs:            quizScores.needs,
 *      score_mentalhealth:     quizScores.mentalhealth,
 *      score_neurodivergence:  quizScores.neurodivergence,
 *      score_communication:    quizScores.communication,
 *      score_erotic:           quizScores.erotic,
 *      score_emotional:        quizScores.emotional,
 *      score_relational:       quizScores.relational,
 *      score_somatic:          quizScores.somatic,
 *      score_digital:          quizScores.digital,
 *      activation_general:     quizScores.activation_general,
 *      activation_relational:  quizScores.activation_relational,
 *      mh_origin_tags:         quizScores.mh_origin_tags,
 *      mh_manifestation_patterns: quizScores.mh_manifestation_patterns,
 *    }, { onConflict: 'user_id' });
 *
 * 3. Add VITE_ANTHROPIC_API_KEY to your .env and Render environment.
 *    Render → Environment → Add environment variable.
 *
 * 4. Add route to your router:
 *    import CareProfile from './CareProfile';
 *    <Route path="/profile/care" element={<CareProfile />} />
 *
 * 5. Add <ExchangeShare /> (Step 3 file) to the mount point above.
 */
