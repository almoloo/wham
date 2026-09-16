# Wham — Bespoke Component Inventory

A brief for Claude Design. These are the **domain-specific** components Wham needs — the ones that carry product meaning and can't be lifted from a generic UI kit. Buttons, inputs, selects, dialogs, tabs, tooltips, and toast shells are assumed to exist as primitives and are **not** listed here, except where a component wraps one with product logic that changes its appearance or states.

---

## 0. Context for every component below

**Product:** Wham digitises the rotating savings circle (ROSCA — *sandogh*, *tanda*, *iqub*, *chama*, *susu*). A group of 4–20 people contributes a fixed amount each round; one member takes the whole pot each round; everyone gets a turn. Wham replaces the social trust that makes informal circles work with four mechanisms: a refundable deposit from every member, a discount-bidding auction for payout order, an on-chain AI underwriter that sizes each member's deposit individually, and a shared insurance pool.

**Audience:** People managing real household savings — diaspora communities sending money home, freelancers, small savers without easy access to formal credit. Many are not crypto-native. Several are using a wallet for the first time.

**Aesthetic direction:** Trustworthy, warm, modern banking — Wise, Monzo, Revolut. **Not** DeFi dashboard, not crypto-neon, not dark-mode-by-default, no glassmorphism, no gradient meshes. Generous whitespace, real hierarchy, one confident accent colour, restrained use of colour for status. On-chain transparency is presented as a *trust feature* — legible, calm, plainly labelled — never as technical flex.

**Tone rules that constrain the visuals:**
- Money amounts are the largest type on any surface that involves money.
- Warnings use a muted amber, never red, unless funds are actually being lost right now.
- Nothing is jokey except the payout-claimed success moment, where the name "Wham" is allowed to play.
- Nothing may look like a yield product. No charts that imply growth, no percentage-return framing, no "APY" visual language.

**Localisation:** English and Persian (فارسی). Every component must work in RTL. Money always renders in Latin numerals. Use logical CSS properties throughout.

**Shared visual conventions** these components all inherit:

| Convention | Rule |
|---|---|
| Money | Always 2 decimals, always with `USDC` unit label, tabular figures, never abbreviated on anything a user must pay |
| Risk bands | A / B / C / D — a four-step scale from calm green through neutral to muted amber. **Never red.** A "D" member is expensive, not evil. |
| Status | Every status chip carries a text label, never colour alone |
| Addresses | `0x7A3f…5A40` (4+4), always copyable, always paired with an identicon |
| Time | Relative under 7 days, absolute beyond; live countdown under 24h |
| Deltas | Signed, with explicit `+` / `−`, and a directional cue that isn't colour alone |

---

# 1. Identity & value display

### 1.1 `Amount`
The single most-used component in the product. Renders a token amount from a base-unit string.

**Anatomy:** numeral + unit label. Optional secondary line for a converted or contextual value.

**Variants by role, each a distinct type treatment:**
- `hero` — the pot, the payout, the deposit on a decision screen. Largest type on the page.
- `primary` — an amount inside a card or a row that the user is acting on.
- `inline` — an amount inside a sentence, matching body size but with tabular figures.
- `ledger` — right-aligned in tables, tabular, with a signed variant for in/out.

**Props that change appearance:** `signed` (renders `+` / `−` with a subtle directional treatment), `muted` (for amounts that are informational rather than actionable), `strikethrough` (for a gross amount being reduced, used in the pot breakdown).

**Design notes:** tabular figures are mandatory — amounts stack in tables and must align. Never abbreviate (`184.3K`) on any amount the user pays or receives; the compact variant exists **only** for marketing statistics. The unit label should be visually subordinate to the numeral but never so small it reads as decorative.

---

### 1.2 `MemberIdentity`
A person, shown consistently everywhere they appear.

**Anatomy:** deterministic identicon (seeded from wallet address, so the same person is visually recognisable across screens) + name + optional secondary line.

**Name resolution order:** ENS name → user-set display name → truncated address. Never show a bare address when a name exists.

**Sizes:** `xs` (inline in an activity row), `sm` (table rows), `md` (member lists), `lg` (profile headers).

**Modifiers:**
- `you` — a subtle marker when the member is the viewer. Not a badge; a quiet treatment change.
- `withBand` — appends a `RiskBandChip`.
- `withScore` — appends the reputation score.
- `linked` — the whole unit is a link to the public profile.

**Design notes:** the identicon does real work here. In an eight-member circle the user needs to distinguish people at a glance, and most will have no ENS name. Make the identicon geometry distinctive enough to be memorable at 24px, and make sure the generated palette stays within the banking aesthetic rather than producing arbitrary neon.

---

### 1.3 `StatusChip`
Small labelled state indicator, used for circle status, member status, round status, bid status, and obligation status. One component, one visual language, many vocabularies.

**States to design (grouped by semantic weight, not by which vocabulary they belong to):**

| Weight | Examples | Treatment |
|---|---|---|
| Neutral / informational | `forming`, `upcoming`, `pending` | Quietest treatment, low contrast fill |
| Positive / on track | `active`, `settled`, `paid`, `completed` | Calm confidence, not celebratory |
| In progress / attention | `bidding`, `funding`, `due soon` | Slightly raised contrast, draws the eye without alarm |
| Warning | `delinquent`, `overdue`, `outbid`, `covered` | Muted amber, still readable, still calm |
| Terminal negative | `defaulted`, `cancelled`, `unwinding` | The strongest treatment in the set — used rarely |
| Accent / good news | `paid out`, `payout ready`, `leading` | The one place the accent colour appears as a chip |

**Design notes:** these appear densely in tables, so the chip must survive at small size with a text label and remain distinguishable in greyscale. Resist giving each of the ~20 distinct status strings its own colour; map them onto the six weights above.

---

### 1.4 `RiskBandChip`
A one-letter band (A–D) with optional expanded label.

**Anatomy:** the letter in a rounded container, optionally followed by a short descriptor ("Band B — established wallet, short circle history").

**Design notes:** this is the most sensitive chip in the product. It is a judgement about a person's creditworthiness, displayed to other members of their savings circle. It must read as *neutral information*, not as a grade or a stigma. Four steps from calm-green to muted-amber with clearly different but non-hierarchical-feeling weights. Absolutely no red, no warning iconography, no downward arrows. A band D member is someone posting a larger deposit — that's all it means, and the visual should say only that.

---

### 1.5 `TierChip`
Starter / Standard / Trusted. A member's earned level, and a circle's required level.

**Anatomy:** small label, optionally with a subtle progression cue (a three-step indicator showing which of the three tiers this is).

**Two contexts, same component:** on a circle card it means "you need this tier to join"; on a profile it means "you have reached this tier". These should look identical — the tier is one concept — but the surrounding copy differs.

**Design notes:** should feel *earned*, not gamified. No stars, no gems, no XP language, no badges with wings. Think "account level at a bank" rather than "rank in a game."

---

### 1.6 `CountdownPill`
A live-updating time remaining indicator.

**Anatomy:** compact time string with an implicit urgency ramp.

**Behaviour:** `> 7 days` → static absolute date, no countdown. `1–7 days` → "in 4 days". `1–24 hours` → "in 6 hours", ticking each minute. `< 1 hour` → `mm:ss`, ticking each second. `expired` → a distinct settled state, not an alarm.

**Urgency ramp:** the visual weight increases as the deadline approaches, but the ramp must be gentle. A payment due in three hours is a *reminder*, not an emergency — the emergency framing belongs to the consequence copy, not the timer.

**Used by:** bid windows, seat reservations in the join flow, contribution deadlines, round settlement.

**Design notes:** must not jitter as digits change — fixed-width figures, reserved space. Also needs a non-animated fallback for reduced-motion.

---

# 2. Circle components

### 2.1 `CircleCard`
The browse-grid unit. A prospective member's first impression of a circle, and the component that has to make an unfamiliar financial instrument legible in about four seconds.

**Anatomy, in visual priority order:**
1. **Pot per round** — the largest element. This is what the user is here for.
2. Circle name + `TierChip` + `StatusChip`
3. Terms line: `{contribution} / round · {n} members · {frequency}`
4. Deposit line: "Your deposit: ~{amount}" when signed in, "Deposit from {multiplier}×" when not
5. `FillMeter` (see 2.2) with `{filled}/{target} members`
6. Start date, relative
7. Action area with a state-dependent CTA

**CTA states — six distinct treatments, all designed:**

| Condition | Treatment |
|---|---|
| Can join | Primary CTA, "Join circle" |
| Reputation too low | Disabled CTA reading "Needs a score of {n}", with a quiet link to the reputation page |
| Insufficient balance | Secondary CTA, "You'd need {amount}" — still clickable through to detail |
| Circle full | Muted, "Full — view circle" |
| Already a member | Distinct non-CTA treatment, "You're in this circle" |
| Not signed in | "Connect wallet to see your deposit" |

**Design notes:** the card is doing an unusual job — it must communicate an obligation (you will pay X, N times) with the same clarity as the benefit (you will receive Y once). Cards that only sell the pot will produce members who default. Give the total-commitment figure real presence, not fine print.

---

### 2.2 `FillMeter`
How full a forming circle is.

**Anatomy:** a segmented meter with one segment per seat, filled segments for confirmed members. Below or beside: `{filled}/{target} members`.

**Why segmented rather than a continuous bar:** an 8-member circle with 7 filled reads very differently from "88%". Discrete seats communicate scarcity honestly and let a user count the remaining places.

**States:** `filling` (default), `nearly full` (one or two seats left — a subtle emphasis, no countdown-clock urgency), `full`, `stalled` (a circle past its start date without quorum — a distinctly muted treatment).

---

### 2.3 `RoundTimeline`
The spine of a circle's detail page: all rounds, in order, with their state and outcome.

**Anatomy:** horizontal stepper on desktop, vertical on mobile. Each node carries:
- Round index
- Date range
- `StatusChip`
- Once settled: the winner's `MemberIdentity` (xs) and the discount they bid
- The current round is distinctly marked
- The viewer's own payout round, once determined, is marked differently again

**States per node:** `upcoming` (quiet, unfilled), `bidding` (active, with a `CountdownPill`), `funding` (active, with a contributions-received count like `5/8 paid`), `settled` (resolved, with winner), `covered` (settled with an insurance draw — a muted amber marker and a link to the claim).

**Interaction:** a settled node opens a round detail sheet showing the full `PotBreakdown` and the settlement transaction.

**Design notes:** this is the component that makes a rotating savings circle *comprehensible*. A user who has never seen a ROSCA should be able to look at this and understand "it goes around, and my turn is here." Length varies from 4 to 20 nodes — design both extremes. On mobile with 20 rounds it must not become an endless scroll; consider collapsing settled rounds behind a summary with the current and next rounds always expanded.

---

### 2.4 `PotBreakdown`
The arithmetic of one round's pot, shown as a visible calculation rather than a result.

**Anatomy:** a vertical waterfall of amounts:

```
Gross pot                    400.00 USDC
− Insurance skim (1.5%)        6.00 USDC
− Winning discount (8.5%)     34.00 USDC
─────────────────────────────────────────
Net payout                   360.00 USDC

Redistributed to 4 members still waiting:  8.50 USDC each
```

**Two contexts:** live (current round, discount is provisional and updates as bids change) and settled (final, with the winner named).

**Design notes:** the redistribution line is the mechanic that makes waiting worthwhile and it is routinely buried. Give it its own visual block below the rule — it should read as a second outcome, not as a footnote. When live, the discount row should update smoothly as the bid slider moves without the whole block reflowing.

---

### 2.5 `MemberTable`
Every member of a circle, with their standing.

**Columns:** `MemberIdentity` (with `you` marker) · `RiskBandChip` · reputation score · rounds paid · `StatusChip` · payout round (or "waiting").

**Row modifiers:**
- The viewer's own row is marked
- A `delinquent` member's row carries a warning treatment
- A `paid_out` member's row carries a distinct accent marker
- A `defaulted` member's row is the strongest treatment in the table

**Design notes:** the product's trust proposition requires showing delinquent members honestly. This is uncomfortable and the design must handle it with dignity — a member who missed a payment should be visible without being pilloried. Warning treatment on the status chip and a subtle row tint; no red rows, no alert icons, no shaming.

Needs a card-stack mobile variant — six columns will not survive 380px.

---

### 2.6 `CircleTermsTable`
The full terms of a circle as a plain two-column key/value table. Used on the circle detail page, in the join flow, and in the create-circle review step.

**Rows:** contribution & frequency · number of rounds · pot per round · your total in · your total out · deposit · insurance skim · max bid discount · start date.

**Design notes:** deliberately unstyled and document-like. This is the "here is exactly what you are agreeing to" surface, and it should feel like a statement of terms rather than marketing. The "your total in" and "your total out" rows are the ones people actually need — give them slightly more weight than the rest.

---

### 2.7 `CommitmentSummary`
A prose block that states the full obligation in sentences, used at the top of the join flow and in create-circle.

**Content shape:** *"Over 8 rounds you'll pay **400.00 USDC** in total, 50.00 USDC every 14 days. You'll receive one pot of up to **394.00 USDC**. Your **100.00 USDC deposit** is locked until the circle finishes and comes back in full if you don't miss a payment."*

**Design notes:** this is a designed prose component, not a copy slot — the emboldened figures inside the sentence need a typographic treatment that makes them scannable while the sentence stays readable. It is the last thing a hesitant user reads before committing, and it must not look like terms-and-conditions boilerplate.

---

### 2.8 `CircleProgressRow`
A dense list row for "my circles" — one circle, its state, and what the viewer owes.

**Anatomy:** name + `TierChip` · round `4 of 8` with a compact progress indicator · viewer's `StatusChip` · this round's obligation ("Paid ✓" or "50.00 USDC due 9 Oct") · deposit posted, with drawn amount if any · row action.

**Design notes:** built for scanning a list of 2–6 circles and immediately spotting the one that needs attention. Unlike `CircleCard` this is not a sales surface — it's a working list. Density over charm.

---

# 3. Bidding components

### 3.1 `BidComposer`
The discount-bidding instrument. The most novel interaction in the product and the one that most needs to be self-explanatory.

**Anatomy:**
1. Context header: round number, `CountdownPill` to bid close
2. Current leading bid: `MemberIdentity` + discount percentage, or "No bids yet"
3. **The slider** — 0% to the circle's max discount, stepped at 0.25%
4. **Live consequence panel** — three figures that update as the slider moves:
   - "You'd receive **360.00 USDC** instead of 394.00"
   - "You'd give up **34.00 USDC**"
   - "Each of the 4 members still waiting receives **8.50 USDC** extra"
5. Validation state
6. Action area: place / raise / withdraw

**States:** `no bid yet` · `you are leading` · `you have been outbid` (with the amount you'd need to beat) · `below leading bid` (invalid, with inline explanation) · `at max discount` (slider capped, explained) · `bidding closed` · `already paid out` (viewer ineligible, explained rather than hidden).

**Design notes:** the slider is an input primitive but this composite is entirely bespoke. Two hard requirements: (a) the consequence panel must update *live and smoothly* as the handle moves — the whole pedagogical value is in seeing the trade-off move; (b) the third line, the redistribution to waiting members, must have equal weight to the first two. Users bid selfishly; the interface should make the collective consequence visible without moralising.

The slider must work with keyboard arrows and must mirror correctly in RTL — sliders are where RTL layouts usually break.

---

### 3.2 `BidLadder`
The bid history for a round, ranked.

**Anatomy:** ordered rows, highest discount first: `MemberIdentity` · discount percentage · implied net payout · time placed · `StatusChip` (`leading` / `outbid` / `won` / `withdrawn`).

**Design notes:** the leading row gets a distinct treatment. The viewer's own bid is marked wherever it sits. Withdrawn bids stay visible but recede — the history is part of the transparency proposition. Needs a compact variant for the sticky action column and a full variant for the round detail sheet.

---

# 4. Agent components

These five carry the product's differentiator. They deserve the most design attention.

### 4.1 `MultiplierWaterfall`
The centrepiece. Shows how the underwriter arrived at one member's deposit multiplier, factor by factor.

**Anatomy:** a horizontal waterfall chart reading left to right:
- Starting bar: the circle's baseline multiplier (e.g. 1.50×)
- One bar per factor that fired, floating above or below, signed
- Ending bar: the final multiplier
- Below the chart, the resolved calculation: `50.00 USDC × 2.00× = 100.00 USDC deposit`

**Colour:** increases in muted amber, decreases in calm green, neutral factors in grey. **No red.** An increase is not a penalty; it is a larger refundable deposit.

**Design notes:** must handle 1 to 9 factors without becoming unreadable, and must degrade to a vertical layout on mobile. Each bar is labelled with the factor name and its signed basis-point effect. The bars should be hoverable/tappable to surface the corresponding `AgentFactorCard`.

This chart is the single image most likely to end up in the submission video. Make it beautiful and make it legible at a glance.

---

### 4.2 `AgentFactorCard`
One reason the underwriter adjusted a deposit.

**Anatomy:**
- Factor label ("Completed circles")
- Signed effect chip (`−30.00%` / `+25.00%` / `neutral`)
- **The explanation sentence**, rendered verbatim from the API in second person: *"You've finished 2 circles without missing a payment. That reduces your deposit."*
- Evidence rows: label / value / optional link (e.g. "Diaspora Circle #1 — 8/8 rounds on time →")

**Variants:** `full` (join flow, decision page) and `compact` (a collapsed list showing top 3 with "See all 5 factors").

**Design notes:** the explanation sentence is the hero, not the number. A nervous saver being asked for 300 USDC instead of 200 needs to read a sentence, not decode a chart. Give the sentence body-copy prominence and let the bps chip be secondary. Evidence links must look inspectable — the claim "you can check this" is the point.

---

### 4.3 `AgentIdentitySeal`
The ERC-8004 identity card, proving the underwriter is a real registered on-chain entity rather than a marketing claim.

**Anatomy:** agent ID · agent address (copyable, links to block explorer) · domain · registration date · registry contract link · decisions issued / resolved · **model badge**.

**The model badge is the critical element.** It reads "Rules-based v1.2.0" and must be prominent, not buried. It carries a tooltip explaining that the current underwriter scores on explicit published rules, is not a trained model, and that every decision is logged on-chain so a future learned model inherits the same public scorecard.

**Design notes:** should feel like a certificate or a verified credential — formal, slightly document-like, clearly distinct from the surrounding page. It is making a factual claim that can be checked, and it should look like it invites checking. Avoid anything that reads as a "verified" social-media badge; that shorthand implies a platform vouching, and here the *chain* is vouching.

---

### 4.4 `AgentHonestyPanel`
A prominent bordered callout on the agent page stating plainly what the agent is and isn't.

**Content:** that it scores on explicit published rules today; that it is not a trained model; that the team is not pretending otherwise three weeks into building; that the durable thing is the structure — every decision signed, timestamped, and resolved against a real outcome — and that a learned model will inherit the same public scorecard.

**Design notes:** this is a *strength* being displayed, not a disclaimer being discharged. It must not look like a legal warning, a cookie notice, or an error state. Something closer to an editorial pull-quote or an author's note — warm, confident, clearly written by a person. If it reads as defensive, the design has failed.

---

### 4.5 `CalibrationChart`
The underwriter's public scorecard: predicted versus realised default rate, per risk band.

**Anatomy:** grouped bars, one pair per band (A/B/C/D) — predicted rate beside realised rate. Below: decision count per band, calibration error, and collateral coverage rate.

**Caption, designed as part of the component:** *"Predicted rates come from the band assigned at join time. Realised rates come from what actually happened. A well-calibrated underwriter has these two bars close together."*

**Design notes:** the whole point is bar *proximity*, so the two bars in each pair must be visually paired unambiguously and the eye must be drawn to the gap between them. Handle the low-sample case honestly — a band with 13 decisions should visually indicate that it's a small sample rather than presenting a noisy rate with false confidence.

Must never look like a performance chart that goes "up and to the right." This is a calibration display, not a growth metric.

---

### 4.6 `DecisionProvenanceBlock`
The audit trail footer of a decision page.

**Anatomy:** decision ID · agent ID · model version · issued and expiry timestamps · attestation transaction hash (block explorer link) · attestation URI (raw JSON link) · a short note explaining that the on-chain hash is computed from the published record, so anyone can recompute it and verify the record wasn't edited afterwards.

**Design notes:** monospace, document-like, deliberately technical — this is the one place in the product where technical texture is appropriate, because its audience is someone actively verifying a claim. Should feel like the bottom of a certificate.

---

### 4.7 `RulePublicationTable`
The full published rule set on the agent page: factor · effect in basis points · trigger condition.

**Design notes:** nine rows, plain, reference-document styling. The design job is restraint — this is a specification being published, and dressing it up undermines the credibility it exists to establish. Increases and decreases should be distinguishable at a glance in the effect column.

---

# 5. Reputation components

### 5.1 `ScoreDial`
A member's reputation score, 0–1000.

**Anatomy:** a radial or arc indicator with the numeral centred, band chip beneath, optional 30-day delta.

**Design notes:** must not read as a credit score in the American consumer-credit sense — no traffic-light arc, no "poor / fair / good / excellent" labelling, no needle. The audience includes people specifically excluded by formal credit scoring, and reproducing that visual language would be tone-deaf. Aim for something closer to a progress arc: this is a record being built, not a verdict being delivered.

Needs `lg` (reputation page hero), `md` (public profile), and `sm` (dashboard strip) sizes.

---

### 5.2 `TierLadder`
The three tiers, what the viewer has reached, and what the next one costs.

**Anatomy:** three stacked or stepped blocks (Starter / Standard / Trusted). Each shows its requirements and its unlocks as a short list. Current tier is marked. The next tier carries a two-dimensional progress indicator — completed circles *and* clean rounds — plus a plain-language gap statement: "1 more completed circle and 6 more clean rounds."

**Design notes:** the two-dimensional progress is the tricky part; users need to see both requirements independently, since satisfying one doesn't help with the other. Locked tiers should be visible with their requirements shown, never hidden — the ladder is a growth loop and concealing the top rung defeats it.

---

### 5.3 `ReputationTimeline`
Score history as a vertical timeline.

**Anatomy:** dated entries, each with an event label ("Completed Steady Six"), a signed score delta, the resulting score, the circle it relates to, and a transaction link where one exists.

**Design notes:** positive and negative events need clearly different but non-judgemental treatments. A missed round is a fact in a record, not a scolding. The `circle_completed +120` entries are the emotional payoff of the whole product — give them a distinctly more substantial treatment than routine `+8` on-time entries.

---

### 5.4 `AttestationCard`
The soulbound reputation token.

**Anatomy:** token ID · mint transaction link · the statement *"This record is bound to your wallet. It can't be sold or transferred."* · a copy-link action for sharing the public profile.

**Design notes:** should feel like a credential worth showing someone. People will share this. Non-transferability is a feature and should be stated with a small lock-like affordance, but avoid making it look like DRM or a restriction — the framing is "this is genuinely yours and genuinely earned."

---

# 6. Money-movement components

### 6.1 `ApprovalBreakdown`
The two-step ERC-20 approval explained before the user signs anything.

**Anatomy:**
- Itemised table: deposit + first contribution = total
- Wallet balance line, with a shortfall state
- **The exactness statement:** *"You're approving exactly 500.00 USDC — the deposit plus your first contribution. Nothing more can be moved from your wallet by this circle."*
- Approval state indicator: needed / approving / approved

**Design notes:** the exactness statement is the trust anchor and must be visually prominent, not fine print. Wham approves exact amounts rather than unlimited allowances, which is a real safety choice, and the interface should get credit for it. The "already approved ✓" state needs to feel like a small relief, not a skipped step.

---

### 6.2 `TxLifecycleIndicator`
The state of a blockchain transaction, from simulation to confirmation.

**States, each visually distinct:** `checking` (simulating) · `awaiting signature` (waiting on the wallet) · `sending` · `confirming` · `confirmed` · `failed`.

**Anatomy:** state label + progress cue + transaction hash with block explorer link once broadcast + a "don't close this tab" reassurance during confirmation.

**Design notes:** the `awaiting signature` state is where new users get lost — they don't realise a wallet popup is waiting, especially on mobile where it's a separate app. That state needs the most explicit treatment in the set. The `failed` state must present the mapped user-facing message (never a raw revert string) and preserve a retry path.

Appears both inline in sheets and as a toast. Design both.

---

### 6.3 `TxToast`
The floating transaction notification.

**Anatomy:** compact state indicator + one-line description of what's happening + transaction hash link + dismiss.

**Design notes:** must be stackable — a user can approve and then transact in quick succession. Must not obscure a primary CTA on mobile. The success state has a moment of warmth; the failure state does not have a moment of alarm.

---

### 6.4 `PayoutClaimedMoment`
The single celebratory surface in the product: the success state after a member claims their pot.

**Anatomy:** the amount received, at hero scale · a brief celebratory treatment · **and, immediately below, the obligation reminder**: *"You still owe 50.00 USDC every round until the circle finishes. Your deposit stays locked until then."*

**Design notes:** this is the one place the name "Wham" is allowed to play — a genuine, warm moment of delight, because someone just received a lump sum they've been waiting for. But the reminder is the most default-preventing piece of copy in the entire product, and it cannot be relegated to a footnote or a dismissible tooltip. The design challenge is holding celebration and obligation in the same frame without either undercutting the other. Get this one right.

---

### 6.5 `NextActionCard`
The dashboard's hero: the one thing the user should do next.

**Variants, each fully designed:**
- **Payment due** — amount, circle, deadline, inline pay action
- **Payment overdue** — warning treatment plus the consequence: "50.00 USDC will be taken from your deposit on 9 Oct if this isn't paid"
- **Bid window open** — countdown, current leading bid, bid action
- **Payout ready** — accent treatment, "394.00 USDC is waiting for you", claim action
- **Deposit unlocked** — circle finished, withdraw action
- **All clear** — "You're all paid up. Next payment 9 Oct." A calm, satisfying resting state.

**Design notes:** the "all clear" state matters more than it seems. Most days, most users owe nothing, and a dashboard that looks empty or broken when nothing is due will feel unfinished. Design it as a deliberate, reassuring state.

The overdue variant is the only place in the product where warning treatment approaches urgency — and even there, the tone is "here's what happens and here's how to fix it," not alarm.

---

### 6.6 `PositionStrip`
Three figures summarising the user's overall standing: committed · deposit locked · received to date.

**Anatomy:** three `Amount` values with short labels and a one-line gloss each.

**Design notes:** must not look like a portfolio or a balance sheet. These are not returns. "Deposit locked" in particular needs a gloss making clear it's the user's own money, temporarily held, not spent.

---

# 7. Scheduling components

### 7.1 `ObligationRow`
One thing the user owes or expects, on one line.

**Anatomy:** date · circle name · obligation type · `Amount` · `StatusChip` · action.

**Type variants, visually distinguished:** contribution (solid) · bid window (outlined) · payout (accent) · deposit release (muted).

**Critical modifier — auto-deduct risk:** when an unpaid contribution is within 72 hours, the row carries a warning border and the line *"Auto-deducted from your deposit if unpaid."* This modifier is the whole reason the calendar exists.

---

### 7.2 `ObligationCalendar`
A month grid of every obligation across every circle.

**Anatomy:** standard month grid; each day cell carries obligation pills colour-coded by the four types above; day selection opens a side sheet listing that day's obligations with inline actions.

**Additional elements:** a month summary strip ("This month: 3 payments totalling 300.00 USDC · 1 payout expected"), a legend, and an "add to calendar" export action.

**Design notes:** cells will occasionally hold 3+ pills — design the overflow. On mobile the grid gives way to the list view by default. Times render in the user's timezone with a persistent footnote that deadlines are enforced on-chain in UTC; that footnote needs a permanent designed home, not an afterthought.

---

# 8. Trust & transparency components

### 8.1 `DefaultWaterfallDiagram`
The three layers between a missed payment and a member losing money.

**Anatomy:** a four-stage flow — *their deposit covers it* → *deposit exhausted, insurance pool covers the rest* → *members still waiting are made whole* → *defaulter's record is marked permanently*. Each stage is labelled, and the diagram is annotated with live figures: how many times each layer has actually been reached.

**Used on:** the landing page, the how-it-works page, and the insurance page.

**Design notes:** this diagram answers the single question every prospective member has — "what if someone doesn't pay?" — and it needs to be immediately readable without a legend. It should feel structural and reassuring rather than technical. Must work as a static image (it will be screenshotted) and must reflow sensibly to vertical on mobile.

---

### 8.2 `InsuranceReservesChart`
Pool reserves over time with claims overlaid.

**Design notes:** an area chart, but explicitly *not* a growth chart. The pool growing is a byproduct of activity, not a return being generated, and the visual must not imply otherwise. Claims overlay as discrete markers rather than a second area. The honest zero-claims state ("no claims have been paid yet — every default so far was covered by the defaulter's own deposit") needs its own designed empty state, because that's the *good* outcome and should read as such.

---

### 8.3 `ClaimsTable`
Every insurance claim ever paid, in full.

**Columns:** circle · round · shortfall · deposit drawn · pool paid · date · transaction link.

**Design notes:** completeness is the point — this is never "recent claims." At small row counts it should still feel deliberate rather than sparse. Design the 0-row, 1-row, and 40-row cases.

---

### 8.4 `ContractsCard`
The on-chain addresses for a circle or for the protocol.

**Anatomy:** labelled rows — circle contract, token, agent, insurance pool — each with a truncated address, a copy action, and a block explorer link.

**Design notes:** appears on public pages as a trust signal for technical visitors, so it should be present and inspectable but visually subordinate for everyone else. Document-like, monospace addresses, quiet.

---

### 8.5 `ActivityFeed`
Chronological circle or personal activity, derived from on-chain events.

**Anatomy per row:** event-type indicator · `MemberIdentity` (xs) · plain-language summary ("Bid a 8.5% discount for round 4") · optional `Amount` · relative timestamp · transaction link.

**Event types to differentiate:** joined · deposit posted · bid placed · bid withdrawn · contribution paid · round settled · payout claimed · deposit drawn · insurance drawn · deposit released · circle completed.

**Design notes:** the summaries are written in plain language, not event names — the feed should read as a narrative of what happened in the circle, comprehensible to someone who doesn't know what an event log is. The `deposit drawn` rows are the sensitive ones: factual, warning-weighted, never punitive.

---

# 9. Flow & shell components

### 9.1 `JoinStepper`
The four-step join flow chrome: review terms → your deposit → approve USDC → join.

**Anatomy:** step indicator with labels, current step marked, completed steps marked, plus a persistent `CountdownPill` from step 2 onward showing the seat-and-quote hold ("Your seat and quote are held for 12:40").

**Design notes:** this is the highest-stakes flow in the product and the stepper's job is to make it feel finite and safe — the user should always know how many steps remain and that nothing has been charged yet. The hold countdown must read as *informational reassurance*, not as pressure; it exists so the user isn't surprised when a quote expires, not to rush them. Design the expiry state, which needs to be recoverable and calm.

---

### 9.2 `DelinquencyBanner`
A page-top banner shown to a member who has missed a payment.

**Content shape:** what happened · what it cost · **what remains** · what happens if it runs out · the recovery action.

*"You missed round 3. 50.00 USDC was taken from your deposit. 50.00 USDC of deposit remains — if it runs out you'll be marked as defaulted and your record will show it permanently."*

**Design notes:** the hardest tone problem in the product. This person is probably having a difficult month. The banner must be unambiguous about consequences — softening it would be a disservice — while being entirely free of shaming. Muted amber, factual, and the recovery action must be the most prominent element in the banner. The remaining-deposit figure should be visually prominent, since it's the number that determines urgency.

---

### 9.3 `ChainGuardBanner`
A non-dismissible banner when the wallet is on an unsupported network.

**Content:** "Wham runs on Arbitrum. Switch network to continue." + switch action.

**Design notes:** must be clearly blocking without being frightening. Reads should continue rendering behind it; only writes are disabled. Not an error state — a network mismatch is routine and the tone should be matter-of-fact.

---

### 9.4 `AppShell`
The authenticated application chrome: sidebar navigation (dashboard, circles, calendar, reputation, activity, settings), the connected-wallet indicator, notification bell with unread count, and a testnet indicator with faucet link where applicable.

**Design notes:** the wallet indicator shows the connected address with its identicon and must make network and connection state legible at a glance. The testnet strip should be unmistakable but not garish — judges will be on Sepolia and should never wonder which network they're looking at.

---

### 9.5 `MarketingShell`
The public-page chrome: a lighter navigation (how it works, circles, the underwriter, insurance), a connect action, and a footer carrying the contract addresses and the honest-stats strip.

**Design notes:** should feel continuous with the app but noticeably lighter — a prospective member browsing circles shouldn't feel they've walked into someone's account.

---

### 9.6 `StatProofStrip`
The landing page's honest-numbers band: circles formed · active members · total paid out · **members who have lost money**.

**Design notes:** the last figure is the most persuasive element on the entire site and should be given more visual weight than the others, not equal weight. The strip must handle the case where that number is not zero — designing only for the flattering case would be exactly the kind of dishonesty the product is positioned against.

---

### 9.7 `EmptyState`
A designed empty state, needed in roughly a dozen places.

**Anatomy:** a short sentence explaining *why* it's empty, and exactly one action.

**Instances to design:** no circles match filters · no active circles · no completed circles ("Your first completed circle is what unlocks lower deposits") · no obligations this month · no reputation history yet · no claims ever paid (the *good* empty state) · no notifications · no bids yet on a round.

**Design notes:** never "No data." Each of these is a different moment with a different emotional register — "no claims ever paid" is reassuring, "no completed circles" is aspirational, "no circles match filters" is merely procedural. Treat them accordingly rather than reusing one illustration.

---

## Priority order for design

If time is constrained, build in this order:

1. `Amount`, `StatusChip`, `RiskBandChip`, `MemberIdentity` — everything depends on these
2. `CircleCard`, `RoundTimeline`, `PotBreakdown` — these make the product comprehensible
3. `MultiplierWaterfall`, `AgentFactorCard` — the differentiator, and the screenshot that ends up in the submission
4. `BidComposer` — the novel mechanic
5. `NextActionCard`, `JoinStepper`, `ApprovalBreakdown` — the money paths
6. `AgentIdentitySeal`, `AgentHonestyPanel`, `CalibrationChart` — the ERC-8004 story
7. `ScoreDial`, `TierLadder`, `DefaultWaterfallDiagram` — the trust and growth loops
8. Everything else
