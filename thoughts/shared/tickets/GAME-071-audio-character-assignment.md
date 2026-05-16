---
id: GAME-071
title: Audio fine-tuning — per-scenario character/audio inventory and assignment
area: game, audio, content
status: open
created: 2026-05-15
last_updated: 2026-05-15
---

## Summary

The character reaction audio system (GAME-061 / GAME-062) is wired and functional, but
the audio choices and per-scenario character assignments need a content pass. The full-crowd
party cheer used as the generic pass/fail sound for non-character criteria is too intense
for a single criterion verdict. This ticket covers auditing every scenario to specify which
character types and demographics appear, and choosing appropriate sounds for each.

## Current State

- Governor criteria: gender-keyed murmur clips play on verdict (female murmur-03/-21; male TBD)
- Non-governor criteria: `party-approve` / `party-disapprove` (crowd cheer/boo) play on verdict
  — functional but the full crowd cheer is jarring for a single-row reveal
- `character_demographics` is set in scenario-002 only; other scenarios not audited
- Audio inventory in `game/web/assets/audio/INVENTORY.md` lists current clips and stubs
- Party neutral, governor-neutral-m/f, legislator-neutral-m/f remain as zero-byte stubs

## Goals / Acceptance Criteria

### Per-scenario character inventory
- [ ] For each scenario (001–006+), document which character types appear in success criteria
      (governor/commissioner/judge/legislator/party instigator, derived from `sc.character`)
- [ ] For each character type in each scenario, assign `character_demographics` if not set
      (determines demographic sprite + gender-keyed audio once GAME-062 sprite wiring is done)
- [ ] Ensure `instigator_character` is set correctly in all scenarios

### Audio clip selection
- [ ] Decide whether non-governor criteria should use party cheer/boo or a subtler sound
      (e.g., a single person's approval/disapproval rather than crowd; may require new clips)
- [ ] Audit governor approval/disapproval murmurs: male clips TBD — select or record male equivalents
- [ ] Evaluate whether commissioner/legislator need separate clip sets from governor,
      or whether governor murmurs can serve both (different demographic, same clip family)
- [ ] Decide whether judge and party types need character-specific clips or share a pool
- [ ] Document chosen clip → character-type mapping in INVENTORY.md

### Timing calibration
- [ ] Verify ROW_SETTLE_MS (currently 900ms) gives enough breathing room for all clip lengths
      (party cheer ~2s; murmurs ~1s — measure actual durations and adjust constant if needed)
- [ ] Consider per-clip-type settle time if clips vary significantly in length

### Stub resolution
- [ ] Replace zero-byte stub files for governor-neutral-m/f, legislator-neutral-m/f, party-disapprove
      with real clips or intentional silence (neutral stubs are not played in current flow,
      but keeping zero-byte files is fragile)

## References

- `game/web/assets/audio/INVENTORY.md` — current audio inventory, active clips, stubs, future candidates
- `game/web/src/main.ts` — `finalizeRow()` (audio play logic), `ROW_SETTLE_MS` constant
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — clip production history
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — character assignment and sprite wiring
- `thoughts/shared/tickets/GAME-070-audio-settings.md` — volume/mute settings panel
