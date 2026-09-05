# StudyForge Design Directions

## Direction 1 — Study Atelier
**Very Brief Intro:** An editorial learning workspace that combines quiet academic focus with the warmth of Nigerian print culture. Structured, tactile, and confident rather than gamified for its own sake.

**Probability:** 0.07

## Direction 2 — Signal Campus
**Very Brief Intro:** A high-energy student operating system with bright information bands, bold utility labels, and a clear focus on momentum and measurable progress. More expressive and kinetic than traditional education software.

**Probability:** 0.03

## Direction 3 — Quiet Library
**Very Brief Intro:** A calm, minimal study companion built around generous space, pale paper tones, soft graphite lines, and thoughtful reading rhythms. Reflective and premium, with progress treated as a private ritual.

**Probability:** 0.05

# Chosen Direction — Study Atelier

## Design Movement
Contemporary editorial design blended with West African modernism: archival study materials, screen-printed color blocking, index-card utility, and a restrained digital dashboard system.

## Core Principles
1. **Progress is visible, not noisy.** Every score, streak, and weak-topic signal should be easy to parse at a glance.
2. **Warm utility.** The interface should feel like a capable study desk: practical controls, tactile surfaces, and small moments of encouragement.
3. **Editorial hierarchy.** Headline scale, captions, dividers, and data labels should guide the eye like a well-designed magazine spread.
4. **Learning over leaderboard theatre.** Gamification supports repeat practice, but the main story is skill growth and confidence.

## Color Philosophy
Use deep ink navy as the grounding color for trust and concentration, paper sand as the primary surface to keep long sessions easy on the eyes, and a signature signal coral to mark actions, focus areas, and moments worth celebrating. Add muted sage for healthy progress and a small amount of gold for streak energy. The colors should feel printed and ownable, not neon or SaaS-blue.

## Layout Paradigm
An asymmetric workspace with a persistent left navigation rail, a flexible content canvas, and a narrow right-side “desk note” column on wide screens. Dashboard blocks should align to a strong baseline but vary in scale, like pinned study cards. Avoid a single centered hero; let the rail and content create a deliberate left-weighted composition.

## Signature Elements
- A small woven-knot mark used in the brand icon, active nav state, and empty-state illustrations.
- “Desk notes” in uppercase micro-labels with coral rules, echoing index cards and exam annotations.
- Progress bars with a short, squared-off coral cap rather than generic pill meters.

## Interaction Philosophy
Interactions should feel like turning a page or selecting a study card: clear hover lift, immediate pressed feedback, and no hidden complexity. Keep primary actions obvious, contextual, and phrased as invitations to practice. Use toasts for not-yet-built areas rather than dead buttons.

## Animation
Use 180–240ms ease-out transitions for hover, selection, and sidebar states. Stagger dashboard card entrances by 40ms, with a slight upward translate and opacity change. Progress bars should reveal once on entry, while tab changes should crossfade or slide by a few pixels. Respect `prefers-reduced-motion` and never animate layout dimensions.

## Typography System
Use **DM Serif Display** for high-level page titles and score numerals, paired with **Manrope** for navigation, labels, body copy, and data. Headings use tight tracking and sentence case; micro-labels use Manrope 11–12px, 700 weight, uppercase, and generous letter spacing. Numbers should have tabular alignment where possible.

## Brand Essence
StudyForge is the focused practice desk for Nigerian students preparing for high-stakes exams — personalized enough to show what to study next, simple enough to return to every day.

**Personality:** focused, warm, quietly ambitious.

## Brand Voice
Headlines sound direct and encouraging without hype. CTAs are active and specific; microcopy explains the next useful action in a human tone.

Example lines:
- “Turn today’s weak spot into tomorrow’s confidence.”
- “Pick up where your thinking left off.”

## Wordmark & Logo
The wordmark uses a sturdy lowercase grotesk with a custom bridged “f” and “g” relationship; the mark is a woven four-loop knot built from two interlocking strokes, symbolizing practice becoming pattern. The symbol should work independently as a favicon and app mark, with no text inside it.

## Signature Brand Color
**Signal Coral — `#F26A5B`**. It is warm, energetic, and unmistakable against ink navy and paper sand; use it for focused action rather than decoration.

## File Reminder
This direction is the source of truth for every visual decision in StudyForge. Ask before shipping: “Does this choice reinforce or dilute the Study Atelier philosophy?”
