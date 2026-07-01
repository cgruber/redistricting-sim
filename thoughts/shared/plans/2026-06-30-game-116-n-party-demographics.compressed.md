<!--COMPRESSED v1; source:2026-06-30-game-116-n-party-demographics.md-->
§META
date:2026-06-30 author:Claude+CJG ticket:GAME-116 status:approved-ready

§GOAL
`pipeline/demographics-stage.ts` addDemographics hardcoded 2-party (primary=clamp(base+jitter), secondary=1−primary, emits 2 vote_shares; 3rd party ignored). Extend to N so multiparty scenarios (GAME-112 3-party tutorial-005) generate the generator=initial-state way. spec-types(DemographicsSpec.parties:string[], ZoneSpec.party_base:Record<string,number>) ALREADY N-capable — only the stage arithmetic is 2-party.

§CONSTRAINT
AC: regenerating existing 12 scenarios → BYTE-IDENTICAL vote_shares (2-party = N=2 special case). Forecloses "assign bases then renormalize to 1" (renorm perturbs: (base+jitter)/(1+jitter) ≠ base+jitter). Current algo shape = "primary gets base+jitter clamped; rest divide leftover(1−primary)". Byte-identity forces that shape for N.

§MODEL [RECORD OF CHOICE] — "primary carries jitter; rest split remainder"
per precinct/zone:
1. primaryShare = clamp(zone.party_base[parties[0]] + jitter, 0,1) — unchanged; SINGLE seeded jitter draw, SAME order (before turnout draw); no new PRNG draws → determinism kept
2. remainder = 1 − primaryShare
3. non-primary parties(parties[1..]) split remainder by party_base as WEIGHTS: weightSum=Σbase[other_i](missing→0); weightSum>0 → share_i=remainder×base_i/weightSum (unweighted→0); weightSum==0 → EQUAL: share_i=remainder/others.length
4. emit vote_shares over ALL parties (every key present, primary first then spec order)
N=2 reduction: existing specs author only primary(party_base:{ken:0.55}) → single other, weightSum==0 → ryu=remainder/1=(1−primary)×1.0. IEEE754 ×exactly-1.0 exact + 1/1===1.0 → BIT-identical to today's secondary=1−primary. Same key order → byte-identical JSON.
authoring convention(doc in code): non-primary party_base = WEIGHTS over remainder not absolute; author all N bases to sum ~1.0 w/ primary for literal numbers (3-party {ken:0.55,ryu:0.37,ind:0.08}→those ±primary jitter scaling ryu/ind proportionally); primary alone carries noise.
props: each share∈[0,remainder]⊆[0,1]; sum=primary+remainder=1 exact (no renorm); deterministic.

§SCOPE
addDemographics only. NO spec-types change (already N). NO assembler change (GAME-043 carries N parties+Party.color). Tests: add 3-party zone (3 shares sum 1.0, expected bases @jitter0, all keys present)+N=3 determinism; keep 2-party assertions as regression(they lock N=2 byte-identity). Empirical byte-identity: determinism tests + bit-identity proof are guard; optional regenerate 1 spec-yaml scenario+diff.

§RISKS
2-party drift→mitigated bit-identity(×exact1.0)+unchanged jitter-then-turnout PRNG order+existing 2-party tests. author confusion(weights vs absolute)→code comment+weights-sum-1 convention. scope creep→NO turnout/eligibility/metrics(112/113).

§REFS
demographics-stage.ts(addDemographics), spec-types.ts(DemographicsSpec,ZoneSpec), demographics-stage_test.ts. Related GAME-112/043/115/084
