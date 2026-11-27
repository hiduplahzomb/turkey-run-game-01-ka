# turkey-run-game-01-ka

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/hiduplahzomb/turkey-run-game-01-ka/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/hiduplahzomb/turkey-run-game-01-ka/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**GOBBLE DASH: Escape Before Dinner** — Tilly the turkey has 40 seconds to sprint 1000m through the Barn Yard, the Cornfield and the Pine Forest before the Thanksgiving dinner bell rings. Jump hay bales and fences, slide under the swinging carving knife, dash straight through the oven's fire, grab corn, pumpkin pie and golden feathers — while Farmer Bram closes in from behind with his pitchfork. Three stumbles and she is dinner.

This game was built from scratch for the make.fun competition **"Make the best turkey escape game"** (`turkey-run-game-01`). Every name, character and visual inside it is original work — it does not copy any commercial game. The game runs fully **offline** from static files, with no network requests and no outside libraries. The run is deterministic: the same seed always plays the same run, so the screenshots are real renders of the game's own code.

## 🎮 How to Play

1. **Run!** Tilly runs on her own — your job is the timing. The dinner countdown at the top is real: reach 1000m before it hits zero.
2. **Jump** with `Space`, `↑`, `W`, or a click/tap on the left half of the screen. Jump again mid-air for a double jump over tall fences and ovens.
3. **Dash** with `Shift`, `X`, or a click/tap on the right half. A dash smashes straight through a hay bale or fence (+25, and it raises your combo) and rebuilds the gap to Farmer Bram.
4. **Slide** with `↓` or `S` to duck under the swinging carving knife.
5. **Watch the gap.** Every stumble costs a life and lets Farmer Bram close 7m. At 0m — or when the dinner bell rings — Tilly is caught. Three zones, one escape: Barn Yard (0–333m), Cornfield (334–666m), Pine Forest (667–1000m).
6. **Collect:** corn +10, pumpkin pie +25, golden feather +50 and an instant dash refill. Combos build as you collect or smash without stumbling.

## ⌨️ Controls

| Key | Action |
|---|---|
| `Space` / `↑` / `W` / click left | Jump (press again mid-air: double jump) |
| `Shift` / `X` / click right | Dash (smashes obstacles, +25) |
| `↓` / `S` | Slide under the carving knife |
| `P` / `Esc` | Pause / resume |
| `Enter` / `Space` | Start / restart |
| `M` | — (no mute key; sounds are short synth blips) |

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no dependencies.

## Screenshots

Real renders of the game's own code (`?shot=` scenes, seed 1):

1. `1-climax.jpg` — mid-run in the Pine Forest, 920m in with 0:07 left on the 40-second dinner clock, Farmer Bram 26m behind, a fresh dash smash (COMBO x3, score 1155: 920m + 1 corn + 1 pie + 1 feather + 7 smashes − 1 stumble).
2. `2-title.jpg` — title screen.
3. `3-caught.jpg` — caught end screen.
4. `4-escaped.jpg` — escaped end screen.

## 📜 License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2wgaefze&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
