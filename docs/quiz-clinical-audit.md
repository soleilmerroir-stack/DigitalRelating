# Quiz Clinical Audit
## Research Base, Question Logic & Scoring Accuracy
### cyborgdreamz · Relationship Ecosystem Quiz

---

## STRUCTURAL ERRORS (affect scoring accuracy directly)

### 1. Q40 and Q41 appear in TWO dimensions — double-counting
**Q40:** How connected are you to your somatic/body awareness?
**Q41:** How connected are you to your breath?

Both appear in **Identity & Body Stressors** AND **Somatic & Spiritual Importance**.
This means the same answers inflate BOTH dimension scores.

**Fix:** Remove Q40 and Q41 from Identity & Body Stressors. They belong in Somatic only.
Identity & Body should be stressors and navigation complexity — not somatic capacity.

---

### 2. Q33 appears in TWO dimensions — double-counting
**Q33:** How important is spirituality/sacredness and ritual for your play?

Appears in **Emotional Nurturance** AND **Somatic & Spiritual Importance**.

**Fix:** Remove from Emotional Nurturance. Belongs in Somatic only.

---

### 3. Q68 (consent confidence) is in the wrong dimension — and inverted incorrectly
**Q68:** How confident are you communicating consent and limits in real time?
Currently: Erotic & Sensual Importance, invert=true

With invert=true, the current scoring means:
- Very confident with consent → HIGH erotic score ← wrong
- Not confident with consent → LOW erotic score ← wrong

Consent confidence is NOT the same as erotic importance. A person with low consent confidence isn't
less erotically engaged — they're a safety concern. And high consent confidence shouldn't inflate
someone's erotic score.

**Fix:** Remove Q68 from Erotic dimension entirely. Keep it as a standalone SGBV flag in the payload
(which it already is via consent_score), not as a dimension component that affects the radar.

---

### 4. Q67 (shame in erotic life) in Mental Health — arguable placement
**Q67:** How much does shame influence what you're willing to share or explore erotically?
Currently: Mental Health Load

Shame is a clinical construct (Brown, 2010; Nathanson, 1992) but erotic shame specifically
is more accurately an identity/relational construct than a mental health symptom. It belongs either:
- As a standalone SGBV/erotic flag (it already is — shame_score in payload)
- In Erotic & Sensual (as it affects erotic engagement)
- In Identity & Body (as shame is often identity-rooted)

**Fix:** Move Q67 to Erotic & Sensual dimension, removing it from Mental Health Load.
Keep the shame_score flag in the payload for routing. This is clinically cleaner.

---

### 5. Emotional Nurturance has only 2 questions after fixing duplicates
After removing Q33 (duplication fix), Emotional Nurturance has:
- Q27: emotional nurturance importance
- Q28: co-regulation importance

Two questions make this dimension extremely sensitive to single answer variance.
One outlier answer shifts the whole dimension significantly.

**Fix:** Add 2-3 questions to Emotional Nurturance (see recommendations below).

---

## WEIGHTING ISSUES

### 6. Wildly unequal question counts per dimension
| Dimension | Questions | After fixes |
|-----------|-----------|-------------|
| Neurodivergence | 16 | 16 |
| Erotic & Sensual | 13 (incl. Q68) | 11 |
| Relational Architecture | 7 (incl. new Q69-71) | 10 |
| Mental Health Load | 10 (incl. Q67) | 9 |
| Identity & Body | 6 (incl. Q40-41 dupes) | 4 |
| Unmet Basic Needs | 7 | 7 |
| Somatic & Spiritual | 3 (correct after fixes) | 3 |
| Digital Relating | 6 | 6 |
| Emotional Nurturance | 2 (after Q33 fix) | 4-5 with additions |

The Neurodivergence dimension (16 questions) has 8x more data points than Emotional Nurturance (2).
This is fine clinically — ND traits need granular coverage — but it means ND scores are statistically
more stable while Emotional scores are volatile.

Equal weighting within each dimension (simple average) is appropriate as a non-diagnostic tool.
No changes recommended to the weighting formula, only to question counts per dimension.

---

### 7. Erotic dimension is heavily kink-weighted
Q18-Q23 are ALL kink-specific: power/control, top/initiator, pain, kink dynamics,
kink intensity, fetish. That's 6 out of 11 questions focused on kink.

Someone with high vanilla erotic engagement — high frequency, high sensual connection,
high comfort with partners, but low kink interest — scores LOWER on "Erotic & Sensual Importance"
than a low-frequency kink-focused person. The dimension is measuring kink interest more than
erotic importance broadly.

**Fix options:**
A) Rename dimension to "Erotic & Kink Importance" — more accurate to what's actually measured
B) Add 2-3 questions specifically about non-kink erotic engagement (intimacy, sensory pleasure,
   embodied presence in sex regardless of kink status)

---

## QUESTION-LEVEL ISSUES

### 8. Q43 — gender expansiveness framed as stressor
**Q43:** How expansive is your gender / gender identity? (cis = 0, expansive = 5)
Currently in: Identity & Body Stressors

Gender expansiveness is NOT inherently a stressor. Framing it this way implies that being
trans/non-binary/gender-expansive is a problem. What you're actually trying to measure is how
much gender identity requires navigation, accommodation, or complexity management in relationships.

**Fix — reframe the question:**
"How much does your gender identity require active navigation, accommodation, or explanation
in your relationships and dating contexts?"
lo: minimal navigation needed · hi: significant ongoing navigation

This captures the relational complexity without pathologizing expansiveness itself.

---

### 9. Q12 — substance use conflates use with dependency
**Q12:** How important / present is substance use in your daily life right now?

"Important / present" conflates recreational, harm-reduction, medicinal, and dependent use.
Someone using cannabis medicinally or in recreational community contexts is not the same
as someone in active dependency. The question is too broad to score meaningfully.

**Fix — separate into two questions OR reframe:**
"How much does substance use currently affect your relationships, capacity, or emotional regulation?"
lo: not at all · hi: significantly

This is clinically relevant regardless of the nature of the use.

---

### 10. Q58 — voice hearing conflates internal monologue with psychosis
**Q58:** Voice hearing (internal monologue, intrusive thoughts, external or internal voices)

Internal monologue is universal — everyone has it. Including it alongside external voices
conflates a universal experience with a clinical symptom.

**Fix — split or reframe:**
"How present are voices, sounds, or experiences that others don't seem to share or validate?"
lo: rarely · hi: frequently

This removes the conflation while preserving the ND/psychosis screening intent.

---

### 11. Q29 direction is ambiguous in Relational Architecture
**Q29:** How important is escalating / intertwining your lives in your relationships?
Currently in Relational Style Flexibility (renamed: Relational Architecture)

High score = high life intertwining. But life intertwining is a measure of DEPTH and COMMITMENT,
not flexibility. Someone deeply committed to one partner AND wanting collective living
would score both high on Q38 (multiple partners) AND high on Q29 (intertwining) — contradictory
in the context of relational flexibility.

**Fix:** Move Q29 to Emotional Nurturance (deep intertwining is an emotional nurturance need)
OR add clarifying language: "How important is deep life intertwining WITH EACH partner you have
(rather than maintaining separate lives)?"

---

## WHAT'S CLINICALLY SOLID ✓

**Q7-9, Q13-17 (Mental Health Load core):** Symptom-based questions with clear clinical grounding.
Intrusive thoughts, hypervigilance, dissociation, SI, depression, anxiety, OCD, psychosis —
all clinically validated constructs. Appropriate for a non-diagnostic screener.

**Q44-Q59 (Neurodivergence):** Well-constructed from Sonny Wise's Neurodiversity Smorgasbord.
Appropriate breadth, appropriate frequency-based framing, correct non-pathologizing framing.
Equal weighting across 16 traits is appropriate for a non-diagnostic screen.

**Q60-65 (Digital Relating):** Research-grounded throughout.
- Q60 (AI/parasocial reliance): Zhang et al., 2025; Muldoon & Parke, 2025
- Q62 (digital substitution): Fang et al., 2025 (RCT)
- Q63 (online approval/self): Joseph, 2025 (algorithmic self)
- Q65 (AI immediacy intolerance): Shamay-Tsoory & Kanterman, 2024 (loneliness signal)
Q61 invert=true is correct: easy vulnerability with humans = low digital relatiance.

**Q1-6 (Unmet Basic Needs core):** Community, basic needs, self-regulation gaps —
aligned with social determinants of health framework.

**Q18-23 (Erotic/Kink):** Appropriate for a sex-positive, non-shaming instrument.
Questions are specific and non-judgmental.

**Invert logic on Q24, Q37, Q61, Q66:** All correct.
- Q24 (commitment need → inverted = flexibility) ✓
- Q37 (gender importance → inverted = openness) ✓
- Q61 (human vulnerability ease → inverted = digital reliance) ✓
- Q66 (naming needs comfort → inverted = unmet needs) ✓

---

## RECOMMENDED FIXES — PRIORITY ORDER

**Priority 1 (scoring accuracy — fix before public launch):**
1. Remove Q40, Q41 from Identity & Body (keep in Somatic only)
2. Remove Q33 from Emotional Nurturance (keep in Somatic only)
3. Remove Q68 from Erotic dimension scoring (keep as SGBV flag only)
4. Move Q67 from Mental Health to Erotic dimension

**Priority 2 (clinical validity):**
5. Reframe Q43 (gender expansiveness → navigation complexity)
6. Reframe Q12 (substance use → relational/functional impact)
7. Reframe Q58 (voice hearing → separate from internal monologue)
8. Clarify or move Q29 (life intertwining)

**Priority 3 (dimension strengthening):**
9. Add 2-3 questions to Emotional Nurturance
10. Add Q69-Q71 (Relational Architecture new questions)
11. Consider renaming Erotic dimension to reflect kink-weighted content

---

## NEW QUESTIONS FOR EMOTIONAL NURTURANCE (draft)

Current: Q27 (nurturance importance) + Q28 (co-regulation importance)
Need 2-3 more:

**Proposed Q_EN1:** How important is being emotionally witnessed — seen and understood — in your
intimate and sexual relationships?
lo: not important · hi: essential

**Proposed Q_EN2:** How much do you need processing time and space after sexual or intimate
experiences?
lo: rarely needed · hi: always needed

**Proposed Q_EN3:** How important is verbal and emotional check-in during and after physical
intimacy?
lo: not important · hi: essential

Research basis: Johnson & Greenberg EFT (1985), Johnson, Simakhodskaya & Moran (2018) —
emotional responsiveness and accessibility as primary attachment needs in sexual relationships.
