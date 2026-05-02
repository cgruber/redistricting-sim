<!--COMPRESSED v1; source:2026-05-02-design-009-character-reaction-visual-style.md-->
§META
date:2026-05-02 researcher:Claude(Sonnet 4.6) topic:character-reaction-art-style-audio
tags:design,art,audio,result-screen,animation status:draft

§ABBREV
ts=thoughts/shared pb=partisan-boss la=legal-authority bb=bipartisan-broker
ra=reform-arbiter na=neutral-admin

§SUMMARY
Result screen reactions come from stakeholder characters (boss,judge,commissioner) who react to the
player's submitted map. 5 character types across 10 scenarios. Recommendation: inline SVG + CSS
pass/fail class toggle + @keyframes. AI-generated SVG (Claude primary, other multimodal fallback).
CC0 audio preferred; AI-generated audio as fallback.

§ROSTER
| type | scenarios | pass | fail |
|---|---|---|---|
| $pb | 002 003 004(Ken) 009(Cat) | fist pump / flag wave | head in hands |
| $la | 005 | gavel bang (approval), scales balanced | gavel bang (reject), scales tipped |
| $bb | 006 | handshake | crossed arms |
| $ra | 007 008 | thumbs up, balanced scales | thumbs down, head shake |
| $na | tutorial-001 tutorial-002 | checkmark nod | shrug |
note: 006 special case — 2 characters simultaneously (one per party); cheering party vs silent other

§OPTIONS
A pure-CSS: ruled out — no character personality
B inline-SVG+CSS-animation: RECOMMENDED — resolution-independent; hand-authorable; <8KB/char; no lib;
  AI-gen SVG viable; CSS @keyframes; pass/fail via class toggle
C pixel-art sprites: viable alt — retro charm; Aseprite workflow; integer CSS scaling; higher AI-gen overhead
D Lottie: ruled out — 40KB lib; AE tooling; overkill
E CSS+emoji: ruled out — GAME-052 placeholder; not the goal

§RECOMMENDATION
format: inline SVG + CSS .pass/.fail + @keyframes; 5 SVG files
style: flat minimal 2-3 colors/char; silhouette-readable at 160-200px; political-cartoon/board-game-token aesthetic
palette: $pb=party-gold/red $la=slate-blue $bb=split-half-and-half $ra=teal/green $na=muted-grey-blue
  all against dark game background
animation: 0.6-1.0s loopable; suppressed by prefers-reduced-motion
audio: preloaded MP3+OGG; 10 clips (5 types × pass/fail); target <100KB/clip
  source priority: (1)CC0 freesound.org/pixabay (2)AI-generated (3)CC-BY with attribution

§OPEN_QUESTIONS
1 pixel-art vs flat SVG — flat SVG more consistent with dark-HUD strategy aesthetic; pixel art adds retro-playful
2 006 two-character case — simultaneous split-screen vs sequential; simultaneous more expressive, doubles layout complexity
3 tutorial character — full $na animation vs skip for tutorials (lower emotional charge)
all 3 to be resolved during DESIGN-009 ticket work

§REFS
game/scenarios/*.json → narrative.character field (all 10 scenarios)
$ts/tickets/DESIGN-009-character-reaction-visual-style.md
$ts/tickets/GAME-060-character-sprite-assets.md
$ts/tickets/GAME-061-audio-clips.md
$ts/tickets/GAME-062-character-reaction-system.md
$ts/vision/game-vision.compressed.md → visual aesthetic
