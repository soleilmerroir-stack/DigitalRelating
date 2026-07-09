/**
 * ExchangeShare.jsx
 * Phryne · Care Exchange Profile — Sharing UI
 *
 * WHAT THIS DOES
 * Lets a member create a scoped share link for a specific peer exchange.
 * They control which of the three sections (communication, status, knowledge)
 * the link reveals. The link calls get_shared_profile() — a security-definer
 * Supabase function — so the recipient never sees the owner's user_id or
 * raw scores, only the text blocks the owner has toggled on.
 *
 * HOW TO USE
 * Import into CareProfile.jsx and mount at the #exchange-share-mount div:
 *
 *   import ExchangeShare from './ExchangeShare';
 *   <ExchangeShare userId={user?.id} toggles={toggles} />
 *
 * DEPENDENCIES
 * npm install qrcode.react
 *
 * The SharedProfileView component at the bottom of this file handles the
 * recipient's read-only view — mount it at /shared/:token in your router.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

const SECTION_LABELS = {
  communication: { label: 'Communication', color: C.cyan },
  status:        { label: 'Status',         color: C.amber },
  knowledge:     { label: 'Knowledge',      color: C.purple },
};

// ── Helpers ──────────────────────────────────────────────────
function buildShareUrl(token) {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base}/shared/${token}`;
}

async function createShare(userId, shareToggles) {
  const { data, error } = await supabase
    .from('exchange_shares')
    .insert({
      owner_id:             userId,
      share_communication:  shareToggles.shareable_communication ?? true,
      share_status:         shareToggles.shareable_status ?? true,
      share_knowledge:      shareToggles.shareable_knowledge ?? true,
      // No expiry by default — member can revoke manually
    })
    .select('share_token')
    .single();
  if (error) throw error;
  return data.share_token;
}

async function revokeShare(token) {
  const { error } = await supabase
    .from('exchange_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('share_token', token);
  if (error) throw error;
}

async function loadActiveShares(userId) {
  const { data, error } = await supabase
    .from('exchange_shares')
    .select('id, share_token, created_at, share_communication, share_status, share_knowledge, revoked_at')
    .eq('owner_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

// ── QR code — lightweight, no external dep version ───────────
// Dynamically import qrcode.react only if available; fall back to text URL.
let QRCode = null;
try {
  const mod = await import('qrcode.react').catch(() => null);
  if (mod) QRCode = mod.QRCodeSVG || mod.default;
} catch (_) {}

function ShareQR({ url }) {
  if (!QRCode) {
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, wordBreak: 'break-all', padding: '10px 0' }}>
        {url}
      </div>
    );
  }
  return (
    <QRCode
      value={url}
      size={140}
      bgColor={C.surface}
      fgColor={C.cyan}
      style={{ borderRadius: 6, display: 'block' }}
    />
  );
}

// ── Section toggle chip ───────────────────────────────────────
function ScopeChip({ id, active }) {
  const { label, color } = SECTION_LABELS[id];
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 4,
      marginRight: 6,
      fontSize: 10,
      fontFamily: 'monospace',
      letterSpacing: 1,
      textTransform: 'uppercase',
      background: active ? color + '22' : 'transparent',
      border: `1px solid ${active ? color : C.border}`,
      color: active ? color : C.muted,
    }}>
      {active ? '✓ ' : ''}{label}
    </span>
  );
}

// ── Active share card ────────────────────────────────────────
function ShareCard({ share, onRevoke }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const url = buildShareUrl(share.share_token);
  const date = new Date(share.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '16px 20px',
      marginBottom: 12,
    }}>
      {/* Scope chips */}
      <div style={{ marginBottom: 10 }}>
        <ScopeChip id="communication" active={share.share_communication} />
        <ScopeChip id="status"        active={share.share_status} />
        <ScopeChip id="knowledge"     active={share.share_knowledge} />
      </div>

      {/* Date */}
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginBottom: 12 }}>
        Created {date}
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleCopy} style={btnStyle(C.cyan)}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
        <button onClick={() => setShowQR(v => !v)} style={btnStyle(C.purple)}>
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
        <button onClick={() => onRevoke(share.share_token)} style={btnStyle(C.pink, true)}>
          Revoke
        </button>
      </div>

      {/* QR */}
      {showQR && (
        <div style={{ marginTop: 14, padding: 14, background: C.bg, borderRadius: 6, display: 'inline-block' }}>
          <ShareQR url={url} />
          <div style={{ marginTop: 8, fontSize: 10, color: C.muted, fontFamily: 'monospace', maxWidth: 200, wordBreak: 'break-all' }}>
            {url}
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(color, ghost = false) {
  return {
    background: ghost ? 'transparent' : color + '22',
    border: `1px solid ${color}55`,
    borderRadius: 5,
    color,
    padding: '7px 14px',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
  };
}

// ── Main ExchangeShare component ─────────────────────────────
export default function ExchangeShare({ userId, toggles }) {
  const [shares,  setShares]  = useState([]);
  const [creating, setCreating] = useState(false);
  const [error,   setError]   = useState(null);

  const reload = useCallback(() => {
    if (!userId) return;
    loadActiveShares(userId).then(setShares).catch(e => setError(e.message));
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const handleCreate = async () => {
    if (!userId) return;
    setCreating(true);
    setError(null);
    try {
      await createShare(userId, toggles);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (token) => {
    await revokeShare(token).catch(e => setError(e.message));
    reload();
  };

  // Which sections will this new share expose?
  const activeCount = [
    toggles.shareable_communication,
    toggles.shareable_status,
    toggles.shareable_knowledge,
  ].filter(Boolean).length;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 14 }}>
        Share with a peer
      </div>

      {/* Create new share */}
      <div style={{
        padding: '18px 20px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          Creates a one-time link with the sections you have toggled on.
          {' '}Your peer sees only those sections — never your scores or identity.
          You can revoke it any time.
        </p>

        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>New link will include: </span>
          <ScopeChip id="communication" active={toggles.shareable_communication} />
          <ScopeChip id="status"        active={toggles.shareable_status} />
          <ScopeChip id="knowledge"     active={toggles.shareable_knowledge} />
        </div>

        {activeCount === 0 ? (
          <p style={{ fontSize: 12, color: C.amber, margin: 0 }}>
            Toggle at least one section on before creating a share link.
          </p>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              ...btnStyle(C.pink),
              background: creating ? 'transparent' : C.pink + '33',
              fontWeight: 700,
              padding: '10px 20px',
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating…' : 'Create share link'}
          </button>
        )}

        {error && (
          <p style={{ marginTop: 10, fontSize: 12, color: C.pink }}>
            {error}
          </p>
        )}
      </div>

      {/* Active shares */}
      {shares.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 10 }}>
            Active links ({shares.length})
          </div>
          {shares.map(s => (
            <ShareCard key={s.id} share={s} onRevoke={handleRevoke} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SharedProfileView ────────────────────────────────────────
// The read-only view the recipient sees at /shared/:token
// Add to your router:
//   import { SharedProfileView } from './ExchangeShare';
//   <Route path="/shared/:token" element={<SharedProfileView />} />

export function SharedProfileView() {
  const token = window.location.pathname.split('/shared/')[1]?.split('/')[0];
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!token) { setError('No share token found.'); setLoading(false); return; }
    supabase.rpc('get_shared_profile', { p_token: token })
      .then(({ data: d, error: e }) => {
        if (e || d?.error) {
          setError(d?.error || e?.message || 'Share not found or expired.');
        } else {
          setData(d);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const sections = data ? [
    { id: 'communication', label: 'Communication', sub: 'factors to consider', color: C.cyan,   icon: '◈', text: data.communication },
    { id: 'status',        label: 'Status',         sub: 'needs and conditions', color: C.amber,  icon: '◉', text: data.status },
    { id: 'knowledge',     label: 'Knowledge',       sub: 'what they hold and know', color: C.purple, icon: '◆', text: data.knowledge },
  ].filter(s => s.text) : [];

  return (
    <div style={{
      background: C.bg, minHeight: '100vh', color: C.txt,
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      padding: '0 0 60px',
    }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 24px 18px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
          VHE · Care Exchange Profile
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.txt }}>Shared with you</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {loading && (
          <div style={{ padding: '40px 0', color: C.muted, fontFamily: 'monospace', fontSize: 13 }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ padding: '32px 0' }}>
            <div style={{ padding: '18px 20px', background: C.surface, borderRadius: 8, border: `1px solid ${C.pink}44` }}>
              <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && sections.length === 0 && (
          <div style={{ padding: '32px 0', color: C.muted, fontSize: 13 }}>
            This person hasn't included any sections in this share.
          </div>
        )}

        {sections.map(s => (
          <div key={s.id} style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: s.color, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 }}>
              {s.icon} {s.label} <span style={{ color: C.muted }}>— {s.sub}</span>
            </div>
            <div style={{
              background: C.surface,
              border: `1px solid ${s.color}33`,
              borderRadius: 8,
              padding: '18px 20px',
              fontSize: 14,
              color: C.txt,
              lineHeight: 1.75,
            }}>
              {s.text}
            </div>
          </div>
        ))}

        {!loading && !error && (
          <div style={{ marginTop: 32, padding: '14px 18px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface }}>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.65 }}>
              <span style={{ color: C.cyan, fontFamily: 'monospace' }}>AI · infrastructure only</span>
              {' '}— this text was generated from quiz scores. It is a starting point, not a complete picture.
              {data?.analysis_generated_at && (
                <> Generated {new Date(data.analysis_generated_at).toLocaleDateString()}.</>
              )}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * INTEGRATION STEPS (Step 3)
 * ──────────────────────────
 *
 * 1. Install QR code library (optional but recommended):
 *      npm install qrcode.react
 *
 * 2. Add routes to your router (src/App.jsx or similar):
 *      import ExchangeShare from './ExchangeShare';
 *      import { SharedProfileView } from './ExchangeShare';
 *
 *      <Route path="/shared/:token" element={<SharedProfileView />} />
 *
 * 3. In CareProfile.jsx, replace the #exchange-share-mount comment with:
 *      import ExchangeShare from './ExchangeShare';
 *      // inside render, where the comment is:
 *      <ExchangeShare userId={user?.id} toggles={toggles} />
 *
 * 4. Add VITE_APP_URL to your .env:
 *      VITE_APP_URL=https://your-phryne-app.onrender.com
 *    This ensures share links point to production, not localhost.
 *
 * 5. The /shared/:token route is public (no auth required).
 *    Supabase RLS allows anonymous access via the get_shared_profile()
 *    security-definer function. No changes to Supabase policies needed.
 *
 * REVOCATION
 * Share links can be revoked by the owner at any time from their
 * active shares list. Revoked links return an error to the recipient.
 * There is no way for the recipient to revoke — sovereignty is one-directional.
 *
 * NFC INTEGRATION (future)
 * Once the NFC safety check-in architecture is wired in, you can
 * write the share URL to an NFC tag via the Web NFC API:
 *
 *   const ndef = new NDEFReader();
 *   await ndef.write({ records: [{ recordType: 'url', data: shareUrl }] });
 *
 * This lets a member tap their phone to share their care profile
 * without opening a browser or handing over a device.
 */
