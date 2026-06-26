# Audio Clip Inventory

Naming scheme: `{type}-{state}.mp3` + `{type}-{state}.ogg` for gender-neutral sounds (judge, party).  
Human characters (governor, commissioner, legislator): `{type}-{state}-m.mp3` / `{type}-{state}-f.mp3`.  
Gender is derived at runtime from the demographic code's last character (`wm`→m, `bf`→f, `naf`→f).

All clips normalized to −16 LUFS (EBU R128) via `ffmpeg -af loudnorm=I=-16:TP=-1.5:LRA=11`.  
OGG files use Opus encoding (libopus via ffmpeg). All clips CC0.

---

## Active game clips

### Human character voices (gendered — governor / commissioner / legislator)

Same source sounds used for all three human character types.

| Files | Source | Duration | Notes |
|---|---|---|---|
| `{type}-approve-m` | Freesound CC0 (anonymous male mumble) | ~0.9s | Male approve murmur |
| `{type}-approve-f` | andrutzab murmur pack (Freesound CC0), segment #21 | 1.8s | Female definite-yes murmur |
| `{type}-disapprove-m` | Freesound CC0 (anonymous male murmur) | ~0.6s | Male dissatisfied murmur |
| `{type}-disapprove-f` | andrutzab murmur pack (Freesound CC0), segment #03 | 1.3s | Female dissatisfied murmur |

Neutral voice variants (`{type}-neutral-m/f`) are stubs pending sourcing (see below).

### Judge (gender-neutral — gavel sounds)

| File | Source | Duration | Notes |
|---|---|---|---|
| `judge-approve` | BigSoundBank #1590 | 1.2s | Gavel 3 strikes |
| `judge-neutral` | BigSoundBank #1588 | 0.36s | Single gavel strike |
| `judge-disapprove` | BigSoundBank #1589 | 0.74s | Gavel 2 strikes |

### Party (gender-neutral — crowd sounds)

| File | Source | Duration | Notes |
|---|---|---|---|
| `party-approve` | BigSoundBank #2482 | 2.35s | Applause burst |
| `party-neutral` | BigSoundBank #3515 | 1.5s | Crowd ambient, trimmed from 108s |
| `party-disapprove` | — | — | Stub — see below |

### Commissioner (gender-neutral instrument sound — questionable; revisit)

| File | Source | Duration | Notes |
|---|---|---|---|
| `commissioner-neutral` | BigSoundBank #1588 | 0.36s | Single gavel strike (may not fit commissioner personality) |

BigSoundBank direct URL: `https://bigsoundbank.com/UPLOAD/mp3/NNNN.mp3` — CC0 entire catalog.

---

## Future sound candidates (candidates/ subdirectory)

| File | Source | Duration | Role | Notes |
|---|---|---|---|---|
| `candidates/f-interrogative-murmur18.mp3` | andrutzab murmur pack (Freesound CC0), segment #18 | 1.1s | Future: interrogative reaction | "Huh?" questioning sound |
| `candidates/f-approve-mhm-assent.mp3` | Reitanna Seishin "Hmm" (Freesound CC0) | ~1.0s | Future: assent/listening | "I'm listening" or agreement tone; not celebratory enough for approve |

---

## Stubs requiring manual download

These files are zero-byte placeholders. Download from Pixabay Sound Effects
(pixabay.com/sound-effects/) — search terms below. All Pixabay audio is CC0.

| File pair | Search term | Suggested feel |
|---|---|---|
| governor-neutral-m/f, legislator-neutral-m/f | "hmm thinking" or "pondering" | Short neutral "hmm" vocalization, 0.5–1.5s |
| commissioner-approve-m/f | "tada fanfare" or "short trumpet fanfare" | Celebratory sting, 1–2s |
| commissioner-disapprove-m/f | "sad trombone" or "wah wah fail" | Classic failure horn, 1–2s |
| party-disapprove | "crowd boo" or "audience disappointment" | Crowd negative reaction, 1–2s |

After downloading: convert OGG with `ffmpeg -i <input>.mp3 -c:a libopus -b:a 96k <output>.ogg`

---

## Processing notes

Trimming done with `tools/trim-audio.main.kts` (AIFF intermediate) or `ffmpeg -t <seconds>`.  
MP3 encoding: `ffmpeg -q:a 4` (VBR ~128kbps).  
OGG encoding: `ffmpeg -c:a libopus -b:a 96k`.
