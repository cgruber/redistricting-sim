<!--COMPRESSED v1; source:2026-05-18-vra-legal-political-landscape.md-->
§META
date:2026-05-18 researcher:claude(web-search-researcher) branch:main repo:cgruber/redistricting-sim
topic:vra-legal-political-landscape
tags:VRA,voting-rights-act,racial-gerrymander,Bethune-Hill,Callais,Section2,Section5,Virginia,Louisiana,proxy-race,BISG
status:complete last_updated:2026-05-18

§ABBREV
S2=Section2 S5=Section5 BVAP=Black-Voting-Age-Population MMD=majority-minority-district
BH=Bethune-Hill Cal=Callais(Louisiana-v-Callais-2026) Mil=Allen-v-Milligan-2023
Shelby=Shelby-County-v-Holder-2013 Gingles=Thornburg-v-Gingles-1986
Shaw=Shaw-v-Reno-1993 Miller=Miller-v-Johnson-1995 Rucho=Rucho-v-Common-Cause-2019
RPV=racially-polarized-voting BISG=Bayesian-Improved-Surname-Geocoding

§SUMMARY
1965-2026 arc: Equal Protection Clause(prohibit racial classification) vs VRA(remedy racial discrimination in voting)
$Cal tips balance toward colorblind principle: reimports intent requirement into $S2
Combined with $Rucho(2019, partisan non-justiciable): both racial+partisan challenges now largely foreclosed
Virginia/$BH saga = clearest dual-failure zone for game scenarios

§SECTION5
$S5=preclearance: covered jurisdictions(mostly South+VA) must get federal pre-approval before any voting law change; burden on jurisdiction
$Shelby(2013,5-4,Roberts): S4(b) coverage formula unconstitutional(based on 1964-72 data, not current); $S5 not struck but inoperative; Congress hasn't passed new formula
Effect: TX,VA,others immediately free to change electoral laws without DOJ preapproval

§SECTION2
Nationwide+permanent; prohibits voting procedure that "results in" race-based denial/abridgement(1982: results not intent)
$Gingles framework: 3 preconditions→ (1)minority group sufficiently large+compact; (2)politically cohesive; (3)majority votes as bloc; then totality of circumstances

§CALLAIS_2026 [CRITICAL]
Background: LA 2022 map had 1 majority-Black district/6(Black=~⅓ population); courts found likely $S2 violation; LA drew 2nd majority-Black district 2024(Cleo Fields,D-6); separate plaintiffs challenged as racial gerrymander
Ruling(Apr 29 2026, 6-3, Alito): struck down LA's 2nd majority-Black district
3 key changes:
1. Illustrative maps tightened: challengers must show map fully achieves ALL state goals; sophisticated software raises plaintiff burden
2. Partisan explanation for bloc voting: Gingles prong 3 NOT satisfied if bloc voting "explained by partisan affiliation"; race+party collinearity in South makes this nearly unprovable
3. Intent required: $S2 violated "only when evidence supports strong inference that State intentionally drew districts to afford minority voters less opportunity because of their race"; re-imports intent standard 1982 amendments explicitly rejected
Aftermath: LA Republicans advanced map eliminating 2nd majority-Black district; AL pushed to lift $Mil order; Brennan Center: 15+ Black-held House seats at risk
$Rucho+$Cal = colorblind trap: racial gerrymandering labeled as partisan → no federal challenge possible from either direction

§ALLEN_MILLIGAN_2023
AL 2021 map: 1 majority-Black district/7(Black=~27%); SC 5-4(Roberts+Kavanaugh+3 liberals) reaffirmed $Gingles
AL's defiant 2023 revised map rejected; special master Remedial Plan 3: D7=51.9% BVAP, D2=48.7% BVAP
2024: 2 AL Democratic wins first time since 2008; brief reprieve before $Cal

§BETHUNE_HILL_VIRGINIA [KEY FOR GAME]
2011 VA maps: R-legislature drew 12 majority-Black districts with explicit 55% BVAP floor; cited S5 compliance; DOJ granted preclearance 2011
Theory: lower BVAP wouldn't produce majority-minority actual votes(turnout gap), so safety cushion needed
Litigation filed Dec 2014: 55% floor = race as predominant factor overriding compactness+county integrity
BH Round 1(Mar 1 2017, SC 6-2, Kennedy): district court used wrong standard; racial predominance claim doesn't require bizarre shapes first
On remand(Jun 2018, 2-1): 11 of 12 districts unconstitutional; mechanical 55% floor = dispositive evidence of racial predominance; VRA compliance defense failed(no strong basis in evidence floor was required; DOJ had precleared lower BVAP before)
Remedial maps: special master Grofman drew new 100-district maps; 2019 elections → Democrats won VA House majority first time since 1995
BH Standing case(Jun 17 2019, 5-4): VA House lacked standing; attorney general(D) is sole state representative in federal court; appeal dismissed; remedial maps locked in
TWO-FAILURE ZONE: BVAP too low→VRA violation | BVAP mechanically floored too high→racial gerrymander; narrow legally defensible middle path

§VIRGINIA_REDISTRICTING
2021: Independent Redistricting Commission created by 2020 constitutional amendment; deadlocked 8-8; VA Supreme Court appointed Trende(R)+Grofman(D) as special masters; maps adopted Dec 2021; Princeton "A" grade
2026: VA Dems passed constitutional amendment for congressional redistricting; VA Supreme Court struck down May 8 2026(procedural: required 2 successive General Assemblies, passed only 1); SC dismissed emergency appeal May 15 2026; 2022/2024 maps remain

§PROXY_RACE
Why: Shaw/$Miller says can't use race as predominant factor; $S2 requires measuring racial effects; many states don't collect race in voter registration
$BISG: Bayes rule combining surname frequency tables + block-level census demographics → probability distribution over race per voter; BIFSG adds first name; validated in redistricting; dominant RPV analysis method
Ecological inference methods: homogeneous precinct analysis | ecological regression(ER,can produce out-of-bounds) | ecological inference(EI,Gary King,constrained estimation,now standard in VRA litigation)
Geographic proxies: poverty rate, median income, language minority %, residential patterns, party registration/history; legal status murky; post-$Cal if state claims partisan motivation → racial effects much harder to challenge

§EDUCATIONAL_CONTRASTS
A. Two-edged VRA sword($BH): R legislature cited S5→DOJ preclearance→same maps struck as racial gerrymander; fail in two directions
B. Packing vs cracking($Mil): 1 Black-majority→remedy→1 strong+1 49% opportunity district; 49% rejected as insufficient; functional opportunity required not just formal majority
C. $Cal trap(LA 2024-26): what S2 required in 2024 = what 14A prohibits in 2026; same map remedied VRA violation→now unconstitutional
D. Colorblind trap($Rucho+$Cal): South: Black=Democratic; cracking D-vote=cracking Black precincts=racial labeled as partisan; neither racial nor partisan challenge survives
E. Commission failure(VA 2021): independent bipartisan commission deadlocked; academics drew maps; structure rules shape outcomes as much as member composition

§KEY_CASES
Gingles 1986 | Shaw 1993 | Miller 1995 | Shelby 2013 | Rucho 2019 | Milligan 2023 | Callais 2026 | BH 2017/2018 | BH-Standing 2019
