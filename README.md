# Dungeon of Echoes

A dark-fantasy, real-time dungeon crawler RPG that runs in the browser and installs to your phone's home screen.

- **5 classes:** Warrior, Mage, Rogue, Cleric and Ranger (with wolf and hawk pets)
- **Story mode:** 10 floors, the Broodmother on floor 5 and the Echo Lord on floor 10
- **Endless mode:** infinite floors, a boss every 5, permadeath, tokens and per-class upgrade trees
- **Loot:** 80+ items, sets, legendaries, cursed and unidentified gear, plus an item codex
- **Real-time combat:** wind-up telegraphs, projectiles, boss AoE and dodge rolls
- **Controls:** free analog movement (glide along walls) with a floating touch joystick, keyboard (WASD/arrows) or gamepad stick, plus action buttons
- **Map:** detailed per-biome tile art, a corner minimap and a full-screen map; pickups float above your hero
- **Layouts:** works in portrait and landscape and respects notches/safe areas
- **Saves:** autosaves to localStorage, with save codes to move progress between devices

## Play

Open the GitHub Pages site. On a phone, use your browser's **Add to Home Screen** to install it fullscreen.

To bring progress over from another copy of the game, export a save code there (💾 Save Code, or the 🏠 button copies one), then tap **📋 Paste save code** on the title screen here.

## Controls

| | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | Drag on the left half (floating joystick) | WASD / arrows (hold) | Left stick / D-pad |
| Attack | ⚔️ button (hold) | Space or J (hold), Enter | A / ✕ (hold) |
| Abilities | Ability buttons (cooldown rings) | 1 / 2 / 3 | X, Y, RB |
| Dodge roll | 💨 button | Shift or K | B / ○ |
| Switch target | Tap an enemy | Tab, Q / E | LB |
| Items | 🎒 button | I or B | View / Select (in combat) |
| Full map (pauses) | Tap the minimap | M | View / Select (exploring) |
| Help | ❓ button | H | R3 (exploring) |
| Flee | 🏃 button | F | |
| Trade with merchant | 💰 Trade | Enter / Space / E | A |
| Menus | Tap | Arrows + Enter, Esc = back, Q/E = tabs | D-pad + A, B = back, LB/RB = tabs |
| Pause / exit prompt | Back button | Esc | Start |

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build into dist/
```

Pushing to `main` builds the site and deploys it through GitHub Actions (`.github/workflows/pages.yml`).
