# Dungeon of Echoes

A dark-fantasy, real-time dungeon crawler RPG that runs in the browser and installs to your phone's home screen.

- **5 classes:** Warrior, Mage, Rogue, Cleric and Ranger (with wolf and hawk pets)
- **Pets that fight:** companions move on the map, attack on their own (lunge/claw animation, the Imp shoots fire), take damage, get knocked out for 12 s and recover after combat. Rangers have a Wolf (+Hawk); anyone can get a charm pet: Wolf Pup Whistle, Spirit Owl Feather, Imp Sigil, Bone Hound Totem
- **Starting perk:** each new run opens with a pick of 3 random Common perks (rolled once, saved)
- **Boss perks (Endless):** after each boss, pick one perk from 3 offers rolled once and saved (reload won't reroll). The pool is 73 perks across Common, Uncommon, Rare, Epic and Legendary; rarer perks are stronger. Deeper floors weight toward rarer tiers, and every 10th-floor boss guarantees at least one Epic or better. Shared and class-specific perks for Warrior, Mage, Rogue, Cleric and Ranger. The starting pick is still 3 random Commons.
- **Echo Vault:** after every 10th-floor boss, store one item across runs (separate localStorage key `dungeon-of-echoes-vault-v1`, survives death); offered at the start of the next run
- **Story mode:** 10 floors, the Broodmother on floor 5 and the Echo Lord on floor 10
- **Endless mode:** infinite floors, a boss every 5, permadeath, tokens and per-class upgrade trees
- **Loot:** 120+ items, 8 sets (one 4-piece set per class with 2/3/4-piece bonuses), legendaries, cursed and unidentified gear, plus an item codex. Chance-based drops (monster 24%, elite 70% +25% second, chest 85% +12% second gear, boss 2 Epic+ gear + Identify + 50% extra); gold drops unchanged. Healing items are ~70% rarer in drops and chests (shop potions unchanged). Gear rolls random affixes (crit, lifesteal, thorns, elemental, HP/DEF…) scaled by floor and rarity
- **Ranged enemies:** Goblin Archer (floor 2+), Acid Spitter (floor 3+), Skeleton Archer (floor 6+), Hex Cultist (floor 7+) keep their distance and telegraph every shot; ★ elites from floor 3
- **In-world real-time combat:** fights happen right on the dungeon map (no arena screen): monsters aggro by sight and distance, chase you around corners, respect walls and give up if you break away; wind-up telegraphs, projectiles, boss AoE on the map and dodge rolls
- **Combat lockout:** while anything is fighting you, the bag, codex, help, full map, save-code screen, merchants and stairs are locked; a 🧪 potion quick-slot stays available
- **Limited merchant stock:** each gear piece sells once; common potions/scrolls have 3 in stock, uncommon 2, rarer 1. Empty slots show SOLD OUT. Stock is saved with the run (no restock on leave/reload); the next merchant floor rolls fresh wares. Endless token upgrades are unaffected. Regular wares top out at Rare; Epic/Legendary pieces only appear via at most 2 premium slots (never the same item twice), with a 1st-slot chance of 3% on floor 2, +3.5% per floor (10% on floor 4, 24% on floor 8, 50% cap from depth 16); a 2nd only if the 1st hit (same chance). Legendary share of premium rolls: 10% on floor 2 rising 3%/floor to 40%.
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
| Potion quick-slot (combat) | 🧪 button (shows count) | R or 4 | View / Select (in combat) |
| Bag (out of combat) | 🎒 button | I or B | Y |
| Full map (pauses, out of combat) | Tap the minimap | M | View / Select (exploring) |
| Help | ❓ button | H | R3 (exploring) |
| Trade with merchant (out of combat) | 💰 Trade | Enter / Space / E | A |
| Menus | Tap | Arrows + Enter, Esc = back, Q/E = tabs | D-pad + A, B = back, LB/RB = tabs |
| Pause / exit prompt (works mid-fight; confirming saves) | Back button | Esc | Start |

## Combat

Combat happens directly on the exploration map. Sleeping monsters wake within 4.5 tiles; awake monsters that can see you within 5.5 tiles join the fight, so several can pile in. Floor bosses wake when you step into their lair (about 5 tiles, line of sight), fight in place with their summons and ground AoE, and the stairs only appear once they are dead.

There is no Flee button: run. An enemy drops aggro after about 4 seconds without line of sight, more than 9 tiles away, or when you drag it well past its leash (11 tiles from home, 7 for bosses). It keeps its wounds and can be re-engaged; a boss that loses you returns to its lair and recovers fully, so it can't be chipped down from outside its leash. Smoke Bombs and the Shadowmeld perk still break off a fight instantly, but not against bosses.

While any monster is aggroed, the bag, codex, help, full map, save-code and title buttons, merchants and stairs are locked. They are greyed out, and pressing them shows "In combat". Movement, attacks, abilities, dodge, target switching and the potion quick-slot still work. The slot uses your first healing potion, or any combat consumable you mark with ☆ Quick-slot in the bag. The minimap stays visible but can't be opened. About 1.5 s after the last enemy dies or gives up, "Combat over" appears and everything unlocks. Saves taken mid-fight restore every enemy's position and HP.

### Difficulty (v6)

Enemy HP ×1.12 and damage ×1.1. Wind-ups and boss telegraphs are 10% shorter. Sleeping monsters notice you from 4.5 tiles (was 4). From floor 5 on, floors have more monsters (+1 per 3 floors after floor 2, cap 18). Out-of-combat regen ticks every 1.8 s (was 1.5 s). Healing-potion drops are 15% rarer. Bosses scale by the same factors.

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build into dist/
```

Pushing to `main` builds the site and deploys it through GitHub Actions (`.github/workflows/pages.yml`).
