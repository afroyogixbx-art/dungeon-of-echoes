import { useState, useEffect, useRef, useCallback, useGrokTheme } from "./grok";
import type { ReactNode, CSSProperties, ChangeEvent, FocusEvent } from "./grok";

type ClassId = "warrior" | "mage" | "rogue" | "cleric" | "ranger";
type Slot = "weapon" | "armor" | "helmet" | "ring" | "amulet" | "consumable";
type GearSlot = Exclude<Slot, "consumable">;
type StatKey = "hp" | "mp" | "atk" | "def" | "crit" | "dodge" | "ls" | "fire" | "ice" | "holy" | "poison";
type Stats = Partial<Record<StatKey, number>>;
type Behav = "brute" | "swift" | "tank" | "caster" | "poisoner" | "drainer" | "boss";
type Screen = "map" | "combat" | "inventory" | "shop" | "upgrade" | "victory" | "dead" | "codex" | "help";
type Ui = "title" | "help" | "tree" | "codex" | "save";
type Mode = "story" | "endless";
type ActRes = "none" | "turn" | "end";

interface ItemT { id: string; name: string; icon: string; slot: Slot; r: number; minF: number; price: number; st?: Stats; cls?: ClassId[]; sp?: string; desc?: string; fx?: string; pw?: number; set?: string; cursed?: boolean; curse?: string; }
interface SetT { name: string; n: number; b2: Stats; bf: Stats; sp: string; desc: string; }
interface Ab { id: string; name: string; icon: string; mp: number; cd: number; desc: string; }
interface Base { hp: number; mp: number; atk: number; def: number; crit: number; dodge: number; }
interface ClassT { id: ClassId; name: string; icon: string; tag: string; base: Base; grow: { hp: number; mp: number; atk: number; def: number; crit: number }; abs: Ab[]; passive: string; start: string[]; }
interface Perk { id: string; name: string; icon: string; desc: string; tier: number; st?: Stats; gold?: number; }
interface MonT { id: string; name: string; icon: string; hp: number; atk: number; def: number; dodge: number; xp: number; gold: number; b: Behav; undead?: boolean; lo: number; hi: number; bio?: Biome; }
interface Room { x: number; y: number; w: number; h: number; }
interface MapMon { id: number; x: number; y: number; t: string; boss: boolean; awake: boolean; stun: number; fx?: number; fy?: number; }
interface Enemy { uid: number; spr?: string; name: string; icon: string; hp: number; max: number; atk: number; def: number; dodge: number; xp: number; gold: number; b: Behav; bk: string; undead: boolean; boss: boolean; stun: number; burnT: number; burnD: number; poisT: number; poisD: number; dead: boolean; x?: number; y?: number; atkT?: number; wind?: number; wm?: number; wk?: string; rt?: boolean; }
interface Combat { enemies: Enemy[]; target: number; monId: number; turn: number; boss: boolean; phase: number; charging: boolean; itemOpen: boolean; px?: number; py?: number; proj?: Proj[]; tele?: Tele[]; shots?: Shot[]; atkCd?: number; dashCd?: number; dashT?: number; dvx?: number; dvy?: number; iT?: number; tick?: number; grace?: number; bossT?: number; fleeCd?: number; }
interface Proj { id: number; x: number; y: number; vx: number; vy: number; dmg: number; from: number; life: number; c: string; }
interface Tele { id: number; x: number; y: number; r: number; t: number; max: number; dmg: number; from: number; kind: string; }
interface Shot { id: number; x1: number; y1: number; x2: number; y2: number; ts: number; c: string; }
interface Inp { jx: number; jy: number; kx: number; ky: number; gx: number; gy: number; atk: boolean; katk: boolean; gatk: boolean; stepT: number; monT: number; regT: number; alt: boolean; saveT: number; rT: number; slowT: number; shopL: boolean; vx: number; vy: number; idleT: number; }
interface Buffs { rage: number; holy: number; evade: number; shield: number; frenzy: number; fury: number; iron: number; defend: boolean; dotT: number; dotD: number; }
interface Inv { uid: number; id: string; ident: boolean; bon: Stats; freed: boolean; }
interface LogL { t: string; c: string; ts?: number; }
interface Fx { id: number; text: string; c: string; at: string; ts: number; }
interface Full { maxHp: number; maxMp: number; atk: number; def: number; crit: number; dodge: number; ls: number; fire: number; ice: number; holy: number; poison: number; sp: string[]; curses: string[]; }
interface Meta { tokens: number; best: number; owned: Record<string, string[]>; disc: string[]; }
interface TNode { id: string; tier: number; name: string; icon: string; desc: string; cost: number; req: string; st?: Stats; cap?: string; }
interface Game {
  screen: Screen; prev: Screen; mode: Mode; cls: ClassId; lvl: number; xp: number; hp: number; mp: number; gold: number;
  inv: Inv[]; eq: Partial<Record<GearSlot, Inv>>; floor: number; map: number[][]; seen: boolean[][];
  px: number; py: number; wx?: number; wy?: number; mons: MapMon[]; sx: number; sy: number; log: LogL[]; combat: Combat | null;
  cds: Record<string, number>; buffs: Buffs; perks: string[]; bonus: Stats; goldMult: number; inAb: boolean;
  usedUndying: boolean; usedShadow: boolean; usedPhoenix: boolean; shop: Inv[];
  offers: Perk[]; kills: number; sel: number; fx: Fx[]; turns: number; tokensEarned: number; stains?: number[]; rem?: string[]; hurtTs?: number; usedRes?: boolean; biome?: Biome; bannerTs?: number;
}

const W = 32, H = 32, R = 4, MAXINV = 24, STORY_END = 10;
const RAR = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const RCOL = ["#9aa0a6", "#22a55b", "#3b82f6", "#a855f7", "#f59e0b"];
const GEAR: GearSlot[] = ["weapon", "armor", "helmet", "ring", "amulet"];
const SLOT_ICON: Record<GearSlot, string> = { weapon: "⚔️", armor: "🛡️", helmet: "⛑️", ring: "💍", amulet: "📿" };
const SLOT_NAME: Record<Slot, string> = { weapon: "Weapon", armor: "Armor", helmet: "Helmet", ring: "Ring", amulet: "Amulet", consumable: "Consumable" };
const STAT_LABEL: Record<StatKey, string> = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", crit: "Crit%", dodge: "Dodge%", ls: "Lifesteal%", fire: "Fire", ice: "Ice", holy: "Holy", poison: "Poison" };
const HIDE = [0.1, 0.2, 0.4, 0.6, 0.85];
const IDFEE = [10, 25, 60, 120, 250];

function I(id: string, name: string, icon: string, slot: Slot, r: number, minF: number, price: number, st?: Stats, extra?: Partial<ItemT>): ItemT {
  return { id, name, icon, slot, r, minF, price, st, ...extra };
}
const MC: ClassId[] = ["mage", "cleric"];
const ITEMS: ItemT[] = [
  I("w_sword", "Rusty Sword", "🗡️", "weapon", 0, 1, 20, { atk: 4 }),
  I("w_dagger", "Bone Dagger", "🔪", "weapon", 0, 1, 20, { atk: 3, crit: 5 }),
  I("w_staff", "Apprentice Staff", "🪄", "weapon", 0, 1, 20, { atk: 3, mp: 10 }, { cls: MC }),
  I("w_bow", "Shortbow", "🏹", "weapon", 0, 1, 20, { atk: 4, crit: 3 }, { cls: ["ranger"] }),
  I("w_axe", "Iron Axe", "🪓", "weapon", 1, 1, 55, { atk: 7 }, { cls: ["warrior"] }),
  I("w_mace", "Blessed Mace", "🔨", "weapon", 1, 1, 55, { atk: 6, holy: 3 }, { cls: ["cleric", "warrior"] }),
  I("w_kris", "Venom Kris", "🔪", "weapon", 1, 1, 60, { atk: 5, crit: 8, poison: 3 }, { cls: ["rogue"] }),
  I("w_flame", "Flametongue", "⚔️", "weapon", 2, 2, 140, { atk: 10, fire: 6 }),
  I("w_frost", "Frostbrand Staff", "🪄", "weapon", 2, 2, 140, { atk: 9, mp: 25, ice: 6 }, { cls: ["mage"] }),
  I("w_long", "Longbow of the Glade", "🏹", "weapon", 2, 2, 140, { atk: 10, crit: 10 }, { cls: ["ranger"] }),
  I("w_great", "Greatsword of Ruin", "⚔️", "weapon", 3, 3, 320, { atk: 18, crit: 5 }, { cls: ["warrior"] }),
  I("w_quake", "Warhammer of Quakes", "🔨", "weapon", 3, 3, 320, { atk: 16, def: 4 }, { cls: ["warrior"] }),
  I("w_night", "Nightfall Daggers", "🗡️", "weapon", 3, 3, 320, { atk: 14, crit: 15, dodge: 5 }, { cls: ["rogue"] }),
  I("w_scepter", "Scepter of Dawn", "🔱", "weapon", 3, 3, 320, { atk: 12, holy: 10, mp: 30 }, { cls: ["cleric"] }),
  I("w_echo", "Echo Blade", "⚔️", "weapon", 4, 4, 800, { atk: 22, crit: 10, ls: 5 }, { sp: "doubleStrike", desc: "20% chance to strike twice." }),
  I("w_thunder", "Thunderfury", "⚡", "weapon", 4, 4, 850, { atk: 21, crit: 8 }, { sp: "chainShock", desc: "Attacks arc lightning to all other foes for 35%." }),
  I("w_winter", "Winter's Bite", "❄️", "weapon", 4, 4, 850, { atk: 18, ice: 12 }, { sp: "freezeHit", desc: "Attacks have a 25% chance to freeze." }),
  I("w_arch", "Staff of the Archmage", "🪄", "weapon", 4, 4, 800, { atk: 20, mp: 60, fire: 8, ice: 8 }, { cls: ["mage"], sp: "manaSave", desc: "Spells cost 30% less MP." }),
  I("w_wolf", "Wolfking's Bow", "🏹", "weapon", 4, 4, 800, { atk: 20, crit: 15 }, { cls: ["ranger"], sp: "petx2", desc: "Pet damage doubled." }),
  I("w_fang", "Shadowfang", "🗡️", "weapon", 4, 4, 800, { atk: 19, crit: 25 }, { cls: ["rogue"], sp: "critPoison", desc: "Critical hits inflict heavy poison." }),
  I("w_sanct", "Mace of Sanctity", "🔨", "weapon", 4, 4, 800, { atk: 18, holy: 12, mp: 40 }, { cls: ["cleric"], sp: "healBoost", desc: "Heal restores 50% more." }),
  I("a_tunic", "Padded Tunic", "👕", "armor", 0, 1, 20, { def: 3, hp: 10 }),
  I("a_robe", "Silk Robe", "👘", "armor", 0, 1, 20, { def: 2, mp: 20 }, { cls: MC }),
  I("a_leather", "Leather Jerkin", "🦺", "armor", 1, 1, 50, { def: 5, dodge: 3 }),
  I("a_chain", "Chainmail", "🛡️", "armor", 1, 1, 60, { def: 8 }),
  I("a_cloak", "Shadowweave Cloak", "🧥", "armor", 2, 2, 140, { def: 7, dodge: 8, crit: 4 }),
  I("a_plate", "Knight's Plate", "🛡️", "armor", 2, 2, 150, { def: 14, hp: 30 }, { cls: ["warrior", "cleric"] }),
  I("a_drake", "Drakescale Mail", "🐲", "armor", 3, 3, 330, { def: 16, hp: 40, fire: 4 }),
  I("a_aegis", "Aegis of Dawn", "☀️", "armor", 4, 4, 800, { def: 22, hp: 60 }, { sp: "regen", desc: "Regenerate 4% HP every combat turn." }),
  I("a_thorn", "Bulwark of Thorns", "🌵", "armor", 4, 4, 800, { def: 20, hp: 50 }, { cls: ["warrior"], sp: "thorns", desc: "Reflect 25% of damage taken." }),
  I("a_dragon", "Dragonheart Plate", "🐉", "armor", 4, 4, 850, { def: 24, hp: 50, fire: 6 }, { sp: "dotImmune", desc: "Immune to poison and burns." }),
  I("h_cap", "Leather Cap", "🧢", "helmet", 0, 1, 15, { def: 2 }),
  I("h_hood", "Thief's Hood", "🎩", "helmet", 1, 1, 50, { dodge: 5, crit: 3 }),
  I("h_helm", "Iron Helm", "⛑️", "helmet", 1, 1, 50, { def: 4, hp: 15 }),
  I("h_circlet", "Sage Circlet", "💠", "helmet", 2, 2, 130, { mp: 30, atk: 3 }),
  I("h_horned", "Horned Warhelm", "🪖", "helmet", 3, 3, 300, { def: 8, atk: 5, hp: 25 }),
  I("h_crown", "Crown of Echoes", "👑", "helmet", 4, 4, 800, { def: 10, hp: 40, mp: 40 }, { sp: "cdr", desc: "All ability cooldowns 1 turn shorter." }),
  I("r_copper", "Copper Ring", "💍", "ring", 0, 1, 15, { atk: 2 }),
  I("r_jade", "Jade Band", "💍", "ring", 1, 1, 50, { hp: 20, def: 2 }),
  I("r_thief", "Thief's Signet", "💍", "ring", 1, 1, 55, { crit: 6, dodge: 3 }, { cls: ["rogue"] }),
  I("r_ember", "Ember Ring", "🔥", "ring", 2, 2, 130, { fire: 6, atk: 3 }),
  I("r_frost", "Frost Loop", "❄️", "ring", 2, 2, 130, { ice: 6, def: 3 }),
  I("r_spell", "Spellweave Ring", "💍", "ring", 2, 2, 140, { mp: 25, fire: 4, ice: 4 }, { cls: ["mage"] }),
  I("r_vamp", "Vampire Signet", "🩸", "ring", 3, 3, 300, { ls: 8, atk: 5 }),
  I("r_void", "Ring of the Void", "🌀", "ring", 4, 4, 800, { ls: 12, atk: 8, crit: 8 }, { sp: "void", desc: "+15% damage dealt." }),
  I("r_etern", "Ring of Eternity", "♾️", "ring", 4, 4, 800, { mp: 40, hp: 30 }, { sp: "mpRegen", desc: "+6 MP every combat turn." }),
  I("m_tooth", "Wolf Tooth Charm", "🦷", "amulet", 0, 1, 15, { crit: 4 }),
  I("m_saint", "Saint's Medallion", "📿", "amulet", 1, 1, 50, { holy: 4, hp: 15 }),
  I("m_beads", "Prayer Beads", "📿", "amulet", 1, 1, 55, { mp: 20, holy: 3 }, { cls: ["cleric"] }),
  I("m_owl", "Owl Amulet", "🦉", "amulet", 2, 2, 130, { mp: 30, dodge: 4 }),
  I("m_viper", "Viper Fang Pendant", "🐍", "amulet", 2, 2, 130, { poison: 5, crit: 5 }),
  I("m_totem", "Hunter's Totem", "🦴", "amulet", 2, 2, 130, { atk: 4, crit: 8 }, { cls: ["ranger"] }),
  I("m_heart", "Heart of the Mountain", "💎", "amulet", 3, 3, 300, { hp: 60, def: 5 }),
  I("m_phoenix", "Phoenix Amulet", "🪶", "amulet", 4, 4, 800, { hp: 40 }, { sp: "phoenix", desc: "Once per floor, revive at 40% HP." }),
  I("s_iron_h", "Ironclad Helm", "⛑️", "helmet", 2, 2, 150, { def: 5, hp: 20 }, { set: "iron" }),
  I("s_iron_a", "Ironclad Plate", "🛡️", "armor", 2, 2, 180, { def: 12, hp: 25 }, { set: "iron" }),
  I("s_iron_r", "Ironclad Signet", "💍", "ring", 2, 2, 150, { def: 4, hp: 15 }, { set: "iron" }),
  I("s_shad_h", "Shadowstalker Hood", "🎭", "helmet", 2, 2, 150, { dodge: 5, crit: 4 }, { set: "shadow" }),
  I("s_shad_a", "Shadowstalker Cloak", "🧥", "armor", 2, 2, 170, { def: 6, dodge: 6 }, { set: "shadow" }),
  I("s_shad_r", "Shadowstalker Band", "💍", "ring", 2, 2, 150, { crit: 6, atk: 2 }, { set: "shadow" }),
  I("s_arc_w", "Arcanist's Wand", "🪄", "weapon", 3, 3, 300, { atk: 12, mp: 25 }, { set: "arc", cls: MC }),
  I("s_arc_h", "Arcanist's Circlet", "💠", "helmet", 3, 3, 280, { mp: 30, def: 3 }, { set: "arc", cls: MC }),
  I("s_arc_a", "Arcanist's Robe", "👘", "armor", 3, 3, 280, { mp: 35, def: 8 }, { set: "arc", cls: MC }),
  I("s_arc_m", "Arcanist's Pendant", "📿", "amulet", 3, 3, 280, { mp: 25, fire: 4, ice: 4 }, { set: "arc", cls: MC }),
  I("x_blood", "Bloodthirster", "🩸", "weapon", 4, 3, 500, { atk: 30, ls: 12 }, { cursed: true, curse: "c_bleed", desc: "Curse: lose 5% max HP every combat turn." }),
  I("x_agony", "Blade of Agony", "🗡️", "weapon", 3, 2, 350, { atk: 20, crit: 25 }, { cursed: true, curse: "c_frail", desc: "Curse: max HP reduced by 30%." }),
  I("x_mad", "Crown of Madness", "👑", "helmet", 3, 2, 350, { atk: 14, crit: 20 }, { cursed: true, curse: "c_fragile", desc: "Curse: take 40% more damage." }),
  I("x_leech", "Ring of the Leech King", "💍", "ring", 3, 2, 350, { hp: 80, def: 8 }, { cursed: true, curse: "c_halfheal", desc: "Curse: all healing halved." }),
  I("x_void", "Voidheart Amulet", "🖤", "amulet", 4, 3, 500, { mp: 80, fire: 10, ice: 10 }, { cursed: true, curse: "c_nomana", desc: "Curse: no MP regeneration." }),
  I("x_greed", "Gambler's Mail", "🎰", "armor", 3, 2, 350, { def: 25, dodge: 10, atk: -8 }, { cursed: true, curse: "c_greed", desc: "Curse: gold gains halved." }),
  I("c_hp1", "Minor Healing Potion", "🧪", "consumable", 0, 1, 15, undefined, { fx: "heal", pw: 35, desc: "Restore 35% HP." }),
  I("c_hp2", "Healing Potion", "🍷", "consumable", 1, 1, 35, undefined, { fx: "heal", pw: 60, desc: "Restore 60% HP." }),
  I("c_hp3", "Greater Healing Draught", "💖", "consumable", 2, 2, 80, undefined, { fx: "heal", pw: 100, desc: "Fully restore HP." }),
  I("c_mp1", "Mana Potion", "🔵", "consumable", 0, 1, 15, undefined, { fx: "mana", pw: 50, desc: "Restore 50% MP." }),
  I("c_mp2", "Elixir of Clarity", "💧", "consumable", 1, 1, 35, undefined, { fx: "mana", pw: 100, desc: "Fully restore MP." }),
  I("c_rej", "Rejuvenation Tonic", "🍹", "consumable", 2, 2, 70, undefined, { fx: "both", pw: 60, desc: "Restore 60% HP and MP." }),
  I("c_anti", "Antidote", "🌿", "consumable", 0, 1, 12, undefined, { fx: "cleanse", pw: 15, desc: "Cure poison/burn, heal 15%." }),
  I("c_bomb", "Fire Bomb", "💣", "consumable", 1, 1, 40, undefined, { fx: "bomb", desc: "Combat: fire damage to ALL enemies + burn." }),
  I("c_frost", "Frost Grenade", "🧊", "consumable", 2, 2, 70, undefined, { fx: "frost", desc: "Combat: ice damage to ALL, freeze 2 turns." }),
  I("c_smoke", "Smoke Bomb", "💨", "consumable", 1, 1, 30, undefined, { fx: "smoke", desc: "Combat: guaranteed escape (not bosses)." }),
  I("c_fury", "Scroll of Fury", "📜", "consumable", 1, 1, 40, undefined, { fx: "fury", desc: "Combat: +50% ATK for 3 turns." }),
  I("c_iron", "Scroll of Ironskin", "📃", "consumable", 1, 1, 40, undefined, { fx: "iron", desc: "Combat: +50% DEF for 3 turns." }),
  I("c_map", "Scroll of Revealing", "🗺️", "consumable", 0, 1, 20, undefined, { fx: "reveal", desc: "Map: reveal the whole floor." }),
  I("c_tele", "Scroll of Descent", "🌀", "consumable", 2, 2, 60, undefined, { fx: "tele", desc: "Map: teleport beside the stairs (or boss)." }),
  I("c_ident", "Scroll of Identify", "🔍", "consumable", 2, 1, 60, undefined, { fx: "ident", desc: "Identify every unidentified item in your bag." }),
  I("c_uncurse", "Scroll of Remove Curse", "🕯️", "consumable", 2, 1, 70, undefined, { fx: "uncurse", desc: "Lift curses from equipped items so they can be removed." }),
  I("c_might", "Elixir of Might", "🍺", "consumable", 3, 2, 200, undefined, { fx: "eatk", desc: "Permanently +3 ATK." }),
  I("c_life", "Elixir of Vitality", "🍯", "consumable", 3, 2, 200, undefined, { fx: "ehp", desc: "Permanently +25 max HP." }),
  I("c_tome", "Tome of Insight", "📕", "consumable", 3, 3, 250, undefined, { fx: "tome", desc: "Instantly gain a level." }),
];
const IT: Record<string, ItemT> = {};
for (const it of ITEMS) IT[it.id] = it;
const SETS: Record<string, SetT> = {
  iron: { name: "Ironclad", n: 3, b2: { def: 10 }, bf: { hp: 60 }, sp: "thorns15", desc: "2 pc: +10 DEF · 3 pc: +60 HP and reflect 15% damage" },
  shadow: { name: "Shadowstalker", n: 3, b2: { dodge: 8 }, bf: { crit: 12 }, sp: "critHeal", desc: "2 pc: +8% dodge · 3 pc: +12% crit, crits heal 5% HP" },
  arc: { name: "Arcanist's Regalia", n: 4, b2: { mp: 40 }, bf: { atk: 6 }, sp: "arcanist", desc: "2 pc: +40 MP · 4 pc: +6 ATK, abilities cost 25% less and deal +20% damage" },
};

const CLS: Record<ClassId, ClassT> = {
  warrior: { id: "warrior", name: "Warrior", icon: "🛡️", tag: "Unbreakable frontliner", base: { hp: 120, mp: 30, atk: 12, def: 6, crit: 5, dodge: 3 }, grow: { hp: 14, mp: 3, atk: 2, def: 1.5, crit: 0 }, passive: "Rage: gains 2 MP every time it is struck.", start: ["w_sword", "a_tunic"],
    abs: [{ id: "bash", name: "Shield Bash", icon: "🛡️", mp: 5, cd: 3, desc: "130% damage and stuns 1 turn." }, { id: "cleave", name: "Cleave", icon: "🪓", mp: 8, cd: 2, desc: "80% damage to ALL enemies." }, { id: "cry", name: "Battle Cry", icon: "📣", mp: 10, cd: 5, desc: "+50% ATK for 3 turns, heal 15%." }] },
  mage: { id: "mage", name: "Mage", icon: "🧙", tag: "Glass-cannon spellcaster", base: { hp: 70, mp: 80, atk: 11, def: 2, crit: 5, dodge: 5 }, grow: { hp: 7, mp: 10, atk: 2.3, def: 0.7, crit: 0 }, passive: "Staff strikes are weak but restore 6 MP. Faster MP regen.", start: ["w_staff", "a_robe"],
    abs: [{ id: "fireball", name: "Fireball", icon: "🔥", mp: 12, cd: 0, desc: "220% fire damage + burn 3 turns." }, { id: "nova", name: "Frost Nova", icon: "❄️", mp: 16, cd: 4, desc: "120% to ALL enemies, freezes 2 turns." }, { id: "arcane", name: "Arcane Shield", icon: "🔮", mp: 10, cd: 5, desc: "Absorb shield worth 40% of max MP." }] },
  rogue: { id: "rogue", name: "Rogue", icon: "🥷", tag: "Crits, poison and evasion", base: { hp: 85, mp: 35, atk: 11, def: 3, crit: 25, dodge: 15 }, grow: { hp: 9, mp: 4, atk: 2.2, def: 0.8, crit: 0.5 }, passive: "Born lucky: high crit and dodge. Backstab auto-crits on the opening turn or vs stunned foes.", start: ["w_dagger", "a_tunic"],
    abs: [{ id: "backstab", name: "Backstab", icon: "🗡️", mp: 8, cd: 2, desc: "220% damage; guaranteed crit on turn 1 or vs stunned." }, { id: "poison", name: "Poison Blade", icon: "🧪", mp: 8, cd: 3, desc: "100% damage + strong poison 4 turns." }, { id: "evade", name: "Evade", icon: "💨", mp: 6, cd: 4, desc: "Automatically dodge the next 2 attacks." }] },
  cleric: { id: "cleric", name: "Cleric", icon: "😇", tag: "Holy healer, undead slayer", base: { hp: 100, mp: 60, atk: 9, def: 5, crit: 5, dodge: 5 }, grow: { hp: 11, mp: 7, atk: 1.7, def: 1.2, crit: 0 }, passive: "Holy power: Smite deals 250% to undead; outlasts anything.", start: ["w_staff", "a_robe"],
    abs: [{ id: "heal", name: "Heal", icon: "✨", mp: 10, cd: 2, desc: "Restore 35% HP and cleanse poison/burn." }, { id: "smite", name: "Smite", icon: "⚡", mp: 10, cd: 0, desc: "180% holy damage (250% vs undead)." }, { id: "holy", name: "Holy Shield", icon: "🔆", mp: 12, cd: 5, desc: "Halve all damage taken for 3 turns." }] },
  ranger: { id: "ranger", name: "Ranger", icon: "🏹", tag: "Archer with a wolf companion", base: { hp: 90, mp: 40, atk: 10, def: 4, crit: 15, dodge: 10 }, grow: { hp: 10, mp: 5, atk: 2, def: 1, crit: 0.3 }, passive: "Wolf companion bites every turn for 45% ATK.", start: ["w_bow", "a_tunic"],
    abs: [{ id: "multi", name: "Multi-Shot", icon: "🏹", mp: 10, cd: 2, desc: "4 arrows at random foes, 70% each." }, { id: "trap", name: "Snare Trap", icon: "⛓️", mp: 8, cd: 4, desc: "Stun target 2 turns + bleed." }, { id: "frenzy", name: "Call of the Wild", icon: "📯", mp: 10, cd: 5, desc: "150% shot; pets deal triple for 3 turns." }] },
};
const CLASS_IDS: ClassId[] = ["warrior", "mage", "rogue", "cleric", "ranger"];

const CAPS: Record<ClassId, Perk[]> = {
  warrior: [
    { id: "undying", name: "Undying", icon: "⚰️", tier: 3, desc: "Once per floor, a lethal blow leaves you at 1 HP." },
    { id: "whirlwind", name: "Whirlwind", icon: "🌪️", tier: 3, desc: "Cleave hits ALL enemies for 120% and stuns them." },
    { id: "juggernaut", name: "Juggernaut", icon: "🗿", tier: 3, desc: "Take 15% less damage and reflect 35% of damage taken." },
  ],
  mage: [
    { id: "chain", name: "Chain Magic", icon: "⚡", tier: 3, desc: "Fireball chains to ALL enemies; Frost Nova deals +50%." },
    { id: "echo", name: "Arcane Echo", icon: "🔁", tier: 3, desc: "Fireball and Frost Nova have a 30% chance to cast twice for free." },
    { id: "archmage", name: "Archmage", icon: "🌌", tier: 3, desc: "All spells cost 50% MP and cooldowns are 1 turn shorter." },
  ],
  rogue: [
    { id: "shadowmeld", name: "Shadowmeld", icon: "🌫️", tier: 3, desc: "Once per floor, turn invisible to skip any non-boss fight." },
    { id: "deathmark", name: "Death Mark", icon: "🎯", tier: 3, desc: "+10% crit; crits deal 3x damage instead of 2x." },
    { id: "shadowstep", name: "Shadow Step", icon: "🌑", tier: 3, desc: "Open every fight with a free 150% critical strike that stuns." },
  ],
  cleric: [
    { id: "radiance", name: "Radiance", icon: "☀️", tier: 3, desc: "Every heal in combat also blasts ALL enemies for the amount healed." },
    { id: "sanctuary", name: "Sanctuary", icon: "🕊️", tier: 3, desc: "Regenerate 6% max HP every combat turn." },
    { id: "wrath", name: "Wrath of Heaven", icon: "🌩️", tier: 3, desc: "Smite strikes ALL enemies and stuns undead." },
    { id: "resurrect", name: "Divine Resurrection", icon: "🕯️", tier: 3, desc: "Once per floor, a lethal blow instead revives you at 50% HP." },
  ],
  ranger: [
    { id: "packleader", name: "Pack Leader", icon: "🪶", tier: 3, desc: "Gain a second pet: a Hawk that strikes every turn." },
    { id: "volley", name: "Arrow Volley", icon: "🌧️", tier: 3, desc: "Multi-Shot fires 2 arrows at EVERY enemy." },
    { id: "eagleeye", name: "Eagle Eye", icon: "👁️", tier: 3, desc: "+20% crit; crits ignore enemy defense." },
  ],
};
const UPG1: Perk[] = [
  { id: "vit", name: "Vitality", icon: "❤️", tier: 1, desc: "+25 max HP", st: { hp: 25 } },
  { id: "pow", name: "Power", icon: "⚔️", tier: 1, desc: "+3 ATK", st: { atk: 3 } },
  { id: "grd", name: "Guard", icon: "🛡️", tier: 1, desc: "+3 DEF", st: { def: 3 } },
  { id: "mind", name: "Mind", icon: "🔷", tier: 1, desc: "+20 max MP", st: { mp: 20 } },
  { id: "keen", name: "Keen Eye", icon: "🎯", tier: 1, desc: "+4% crit", st: { crit: 4 } },
  { id: "swift", name: "Swiftness", icon: "💨", tier: 1, desc: "+3% dodge", st: { dodge: 3 } },
];
const UPG2: Perk[] = [
  { id: "titan", name: "Titan's Blood", icon: "🏔️", tier: 2, desc: "+60 max HP, +4 DEF", st: { hp: 60, def: 4 } },
  { id: "berserk", name: "Berserker", icon: "🔥", tier: 2, desc: "+6 ATK, +5% crit", st: { atk: 6, crit: 5 } },
  { id: "leech", name: "Bloodthirst", icon: "🩸", tier: 2, desc: "+6% lifesteal", st: { ls: 6 } },
  { id: "sage", name: "Sage's Focus", icon: "📘", tier: 2, desc: "+40 max MP, +3 ATK", st: { mp: 40, atk: 3 } },
  { id: "fortune", name: "Fortune", icon: "💰", tier: 2, desc: "+50% gold from all sources", gold: 0.5 },
  { id: "prism", name: "Prismatic Edge", icon: "🌈", tier: 2, desc: "+5 fire and +5 ice damage", st: { fire: 5, ice: 5 } },
];

// ---- Endless upgrade trees (generated) ----
const TREE_LINES: Record<ClassId, string[]> = {
  warrior: ["Vitality|❤️|hp:15", "Power|⚔️|atk:2", "Guard|🛡️|def:2", "Battle Rage|🔷|mp:10", "Bloodlust|🩸|ls:2", "Iron Skin|🪨|def:3,hp:10", "Might|💪|atk:4", "Fortitude|🏔️|hp:35", "Flame Brand|🔥|fire:3", "Titan|🗿|hp:40,def:4", "Warlord|👑|atk:5,crit:3"],
  mage: ["Vitality|❤️|hp:10", "Arcana|🔮|atk:2", "Focus|🔷|mp:15", "Ward|🛡️|def:2,hp:8", "Precision|🎯|crit:2", "Frost Affinity|❄️|ice:3", "Fire Affinity|🔥|fire:3", "Wellspring|💧|mp:30", "Spellpower|✨|atk:4", "Archon|🌌|atk:5,mp:20", "Mana Skin|🫧|hp:30,def:3"],
  rogue: ["Vitality|❤️|hp:10", "Power|⚔️|atk:2", "Agility|💨|dodge:2", "Precision|🎯|crit:3", "Venom|🧪|poison:3", "Leech|🩸|ls:2", "Assassin|🗡️|atk:4", "Evasion|🌫️|dodge:3", "Lethality|☠️|crit:4", "Phantom|👤|dodge:3,crit:3", "Executioner|🪓|atk:6"],
  cleric: ["Vitality|❤️|hp:15", "Devotion|🔷|mp:12", "Guard|🛡️|def:2", "Holy Light|✨|holy:3", "Power|⚔️|atk:2", "Grace|🕊️|hp:10,mp:8", "Bastion|🏰|def:4", "Zeal|🔥|atk:4", "Radiant Soul|☀️|holy:5", "Saint|😇|hp:40,mp:20", "Templar|🔱|atk:4,def:4"],
  ranger: ["Vitality|❤️|hp:12", "Power|⚔️|atk:2", "Precision|🎯|crit:2", "Agility|💨|dodge:2", "Leech|🩸|ls:2", "Venom Tips|🧪|poison:3", "Marksman|🏹|atk:4", "Hunter's Eye|👁️|crit:4", "Survivalist|🏕️|hp:25,def:2", "Beastmaster|🐾|atk:5,crit:3", "Wind Runner|🌬️|dodge:3,hp:20"],
};
const ROMAN = ["I", "II", "III"];
const TCOST = [[1, 1, 1], [1, 2, 2], [2, 2, 3], [3, 3, 4]];
function parseSt(s: string): Stats { const o: Stats = {}; for (const p of s.split(",")) { const kv = p.split(":"); o[kv[0] as StatKey] = Number(kv[1]); } return o; }
function statText(s?: Stats): string {
  if (!s) return "";
  const ss: Stats = s;
  return (Object.keys(ss) as StatKey[]).map((k: StatKey) => `${(ss[k] ?? 0) >= 0 ? "+" : ""}${ss[k] ?? 0} ${STAT_LABEL[k]}`).join(", ");
}
const TREE: Record<ClassId, TNode[]> = { warrior: [], mage: [], rogue: [], cleric: [], ranger: [] };
for (const cid of CLASS_IDS) {
  TREE_LINES[cid].forEach((ln: string, li: number) => {
    const parts = ln.split("|");
    const tier = li < 9 ? Math.floor(li / 3) + 1 : 4;
    for (let r = 0; r < 3; r++) {
      const s = parseSt(parts[2]);
      TREE[cid].push({ id: `${cid}.${li}.${r}`, tier, name: `${parts[0]} ${ROMAN[r]}`, icon: parts[1], desc: statText(s), cost: TCOST[tier - 1][r], req: r > 0 ? `${cid}.${li}.${r - 1}` : "", st: s });
    }
  });
  for (const p of CAPS[cid]) TREE[cid].push({ id: `${cid}.cap.${p.id}`, tier: 5, name: p.name, icon: p.icon, desc: p.desc, cost: 5, req: "", cap: p.id });
}

// ---- multi-backend storage (feature-detected; the kit has no host persistence API) ----
const BK: { init: boolean; local: boolean; session: boolean; name: boolean; cookie: boolean; hash: boolean } = { init: false, local: false, session: false, name: false, cookie: false, hash: false };
let IDB: IDBDatabase | null = null;
let IDB_OK = false;
let IDB_READY: Promise<void> | null = null;
const IDBC: Record<string, string> = {};
const IDB_PEND: Record<string, string | null> = {};
let HASHC: Record<string, string> | null = null;
let HASH_T = 0;
let HASH_PEND = false;
function getLS(): Storage | null { try { return window.localStorage; } catch (e) { void e; return null; } }
function getSS(): Storage | null { try { return window.sessionStorage; } catch (e) { void e; return null; } }
function tryStore(s: Storage | null): boolean { if (!s) return false; try { const k = "__doe_t"; s.setItem(k, "1"); const ok = s.getItem(k) === "1"; s.removeItem(k); return ok; } catch (e) { void e; return false; } }
function nameObj(): Record<string, string> {
  try { const n = window.name; if (n.startsWith("DOE:")) { const o = JSON.parse(n.slice(4)) as unknown; if (typeof o === "object" && o !== null && !Array.isArray(o)) return o as Record<string, string>; } } catch (e) { void e; }
  return {};
}
function nameSet(k: string, v: string | null): void { try { const o = nameObj(); if (v === null) delete o[k]; else o[k] = v; window.name = "DOE:" + JSON.stringify(o); } catch (e) { void e; BK.name = false; } }
function cookieGet(k: string): string | null {
  try { for (const part of document.cookie.split("; ")) { const i = part.indexOf("="); if (i > 0 && part.slice(0, i) === k) return decodeURIComponent(part.slice(i + 1)); } } catch (e) { void e; }
  return null;
}
function cookieSet(k: string, v: string | null): void { try { document.cookie = `${k}=${v === null ? "" : encodeURIComponent(v)}; path=/; max-age=${v === null ? 0 : 31536000}; SameSite=None; Secure`; } catch (e) { void e; } }
function idbInit(): Promise<void> {
  if (IDB_READY) return IDB_READY;
  IDB_READY = new Promise<void>((res) => {
    try {
      const rq = window.indexedDB.open("dungeon-of-echoes", 1);
      rq.onupgradeneeded = (): void => { try { rq.result.createObjectStore("kv"); } catch (e) { void e; } };
      rq.onerror = (): void => res();
      rq.onblocked = (): void => res();
      rq.onsuccess = (): void => {
        try {
          const db = rq.result;
          const tx = db.transaction("kv", "readwrite"); const st = tx.objectStore("kv");
          st.put("1", "__doe_t");
          const ka = st.getAllKeys(); const va = st.getAll();
          tx.oncomplete = (): void => {
            const ks = ka.result; const vs = va.result as unknown[];
            for (let i = 0; i < ks.length; i++) { const kk = ks[i]; const vv = vs[i]; if (typeof kk === "string" && typeof vv === "string" && !(kk in IDB_PEND)) IDBC[kk] = vv; }
            IDB_OK = IDBC["__doe_t"] === "1"; IDB = IDB_OK ? db : null;
            if (IDB) for (const k of Object.keys(IDB_PEND)) idbPut(k, IDB_PEND[k]);
            res();
          };
          tx.onerror = (): void => res();
          tx.onabort = (): void => res();
        } catch (e) { void e; res(); }
      };
    } catch (e) { void e; res(); }
  });
  return IDB_READY;
}
function idbPut(k: string, v: string | null): void {
  if (v === null) delete IDBC[k]; else IDBC[k] = v;
  if (!IDB) { if (!IDB_OK) IDB_PEND[k] = v; return; }
  try { const st = IDB.transaction("kv", "readwrite").objectStore("kv"); if (v === null) st.delete(k); else st.put(v, k); } catch (e) { void e; }
}
function hashRead(): Record<string, string> {
  if (HASHC) return HASHC;
  HASHC = {};
  try {
    const h = window.location.hash;
    if (h.startsWith("#doe=")) {
      const c = decodeURIComponent(h.slice(5)); const body = c.startsWith("DOE1:") ? c.slice(5) : c;
      const bin = atob(body); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const o = JSON.parse(new TextDecoder().decode(bytes)) as { meta?: unknown; run?: unknown };
      if (o.meta) HASHC["dungeon-of-echoes-v2"] = JSON.stringify(o.meta);
      if (typeof o.run === "string") HASHC["dungeon-of-echoes-run-v1"] = o.run;
    }
  } catch (e) { void e; }
  return HASHC;
}
function bkInit(): void {
  if (BK.init) return;
  BK.init = true;
  BK.local = tryStore(getLS()); BK.session = tryStore(getSS());
  try { const n = window.name; if (n === "" || n.startsWith("DOE:")) { window.name = n; BK.name = window.name === n; } } catch (e) { void e; BK.name = false; }
  try { document.cookie = "doe_t=1; path=/; max-age=60; SameSite=None; Secure"; BK.cookie = document.cookie.includes("doe_t=1"); } catch (e) { void e; BK.cookie = false; }
  try { window.history.replaceState(window.history.state, "", window.location.hash || "#"); BK.hash = true; } catch (e) { void e; BK.hash = false; }
  hashRead();
  void idbInit();
}
function kvGet(k: string): string | null {
  bkInit();
  if (BK.local) { try { const v = getLS()?.getItem(k); if (v) return v; } catch (e) { void e; } }
  if (BK.session) { try { const v = getSS()?.getItem(k); if (v) return v; } catch (e) { void e; } }
  if (IDBC[k]) return IDBC[k];
  if (BK.name) { const v = nameObj()[k]; if (v) return v; }
  if (BK.cookie) { const v = cookieGet(k); if (v) return v; }
  const h = hashRead()[k];
  return h ? h : null;
}
function kvSet(k: string, v: string | null): boolean {
  bkInit();
  let local = false;
  if (BK.local) { try { const s = getLS(); if (s) { if (v === null) s.removeItem(k); else s.setItem(k, v); local = true; } } catch (e) { void e; } }
  if (BK.session) { try { const s = getSS(); if (s) { if (v === null) s.removeItem(k); else s.setItem(k, v); } } catch (e) { void e; } }
  idbPut(k, v);
  if (BK.name) nameSet(k, v);
  if (BK.cookie && (v === null || v.length < 3500)) cookieSet(k, v);
  if (HASHC) { if (v === null) delete HASHC[k]; else HASHC[k] = v; }
  HASH_PEND = true; if (Date.now() - HASH_T > 2000) hashWrite();
  return local || IDB_OK;
}
function hashWrite(): void {
  if (!BK.hash || !HASH_PEND) return;
  try { const code = exportCode(); if (code) window.history.replaceState(window.history.state, "", "#doe=" + code); HASH_T = Date.now(); HASH_PEND = false; } catch (e) { void e; BK.hash = false; }
}
function persistsAcrossVisits(): boolean { bkInit(); return BK.local || IDB_OK || BK.cookie; }
function storeReport(): string {
  bkInit();
  const f = (ok: boolean): string => ok ? "✓" : "✗";
  return `localStorage ${f(BK.local)} · IndexedDB ${f(IDB_OK)} · cookie ${f(BK.cookie)} (tokens/upgrades only) · sessionStorage ${f(BK.session)} · frame name ${f(BK.name)} · link hash ${f(BK.hash)}`;
}

// ---- persistence ----
const KEY = "dungeon-of-echoes-v2";
let META: Meta | null = null;
function meta(): Meta {
  if (META) return META;
  const d: Meta = { tokens: 0, best: 0, owned: {}, disc: [] };
  try {
    const s = kvGet(KEY);
    if (s) { const m = JSON.parse(s) as Partial<Meta>; d.tokens = Number(m.tokens) || 0; d.best = Number(m.best) || 0; d.owned = m.owned ?? {}; d.disc = Array.isArray(m.disc) ? m.disc : []; }
  } catch (e) { void e; }
  META = d; return d;
}
function saveMeta(): void { try { kvSet(KEY, JSON.stringify(meta())); } catch (e) { void e; } }
function owned(cid: ClassId): string[] { const m = meta(); if (!m.owned[cid]) m.owned[cid] = []; return m.owned[cid]; }
function discover(id: string): void { const m = meta(); if (!m.disc.includes(id)) { m.disc.push(id); saveMeta(); } }
function canBuy(cid: ClassId, n: TNode): boolean {
  const o = owned(cid);
  if (o.includes(n.id) || meta().tokens < n.cost) return false;
  if (n.req && !o.includes(n.req)) return false;
  if (n.tier > 1 && TREE[cid].filter((x: TNode) => x.tier === n.tier - 1 && o.includes(x.id)).length < 3) return false;
  return true;
}

const MONS: MonT[] = [
  { id: "rat", name: "Giant Rat", icon: "🐀", hp: 14, atk: 5, def: 0, dodge: 15, xp: 6, gold: 3, b: "swift", lo: 1, hi: 2 },
  { id: "slime", name: "Ooze", icon: "🟢", hp: 30, atk: 5, def: 6, dodge: 0, xp: 8, gold: 4, b: "tank", lo: 1, hi: 2 },
  { id: "goblin", name: "Goblin", icon: "👺", hp: 24, atk: 7, def: 2, dodge: 5, xp: 9, gold: 6, b: "brute", lo: 1, hi: 2 },
  { id: "bat", name: "Vampire Bat", icon: "🦇", hp: 16, atk: 5, def: 0, dodge: 20, xp: 7, gold: 3, b: "drainer", lo: 1, hi: 2 },
  { id: "skel", name: "Skeleton", icon: "💀", hp: 34, atk: 9, def: 4, dodge: 0, xp: 14, gold: 8, b: "brute", undead: true, lo: 2, hi: 3 },
  { id: "spider", name: "Cave Spider", icon: "🕷️", hp: 26, atk: 8, def: 2, dodge: 10, xp: 13, gold: 7, b: "poisoner", lo: 2, hi: 3 },
  { id: "kobold", name: "Kobold Shaman", icon: "🦎", hp: 24, atk: 10, def: 2, dodge: 5, xp: 15, gold: 9, b: "caster", lo: 2, hi: 3 },
  { id: "orc", name: "Orc Brute", icon: "👹", hp: 48, atk: 12, def: 5, dodge: 0, xp: 22, gold: 12, b: "brute", lo: 3, hi: 4 },
  { id: "wraith", name: "Wraith", icon: "👻", hp: 36, atk: 11, def: 3, dodge: 15, xp: 22, gold: 12, b: "drainer", undead: true, lo: 3, hi: 4 },
  { id: "elf", name: "Dark Elf", icon: "🧝", hp: 36, atk: 11, def: 4, dodge: 20, xp: 22, gold: 14, b: "swift", lo: 3, hi: 4 },
  { id: "golem", name: "Stone Golem", icon: "🗿", hp: 70, atk: 12, def: 14, dodge: 0, xp: 30, gold: 15, b: "tank", lo: 4, hi: 999 },
  { id: "necro", name: "Necromancer", icon: "🧟", hp: 44, atk: 14, def: 4, dodge: 5, xp: 32, gold: 18, b: "caster", undead: true, lo: 4, hi: 999 },
  { id: "basil", name: "Basilisk", icon: "🐍", hp: 52, atk: 13, def: 6, dodge: 5, xp: 30, gold: 16, b: "poisoner", lo: 4, hi: 999 },
  { id: "demon", name: "Demon", icon: "😈", hp: 70, atk: 17, def: 8, dodge: 5, xp: 42, gold: 22, b: "brute", lo: 5, hi: 999 },
  { id: "lich", name: "Lich", icon: "🦴", hp: 56, atk: 18, def: 6, dodge: 5, xp: 44, gold: 24, b: "caster", undead: true, lo: 5, hi: 999 },
  { id: "wyvern", name: "Wyvern", icon: "🐉", hp: 60, atk: 15, def: 7, dodge: 15, xp: 42, gold: 22, b: "swift", lo: 5, hi: 999 },
  { id: "shade", name: "Echo Shade", icon: "", hp: 34, atk: 12, def: 2, dodge: 20, xp: 22, gold: 11, b: "drainer", undead: true, lo: 3, hi: 999, bio: "crypt" },
];
const MON: Record<string, MonT> = {};
for (const m of MONS) MON[m.id] = m;

let UID = 1;
function rnd(n: number): number { return Math.floor(Math.random() * n); }
function pick<T>(a: T[]): T { return a[rnd(a.length)]; }
function shuffle<T>(a: T[]): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const tmp = b[i]; b[i] = b[j]; b[j] = tmp; } return b; }
function need(l: number): number { return 30 + l * l * 12; }
function tierOf(f: number): number { return Math.ceil(f / 2); }
function bossKind(f: number): string { return f % 10 === 0 ? "lord" : "brood"; }
type Biome = "warren" | "crypt";
function biomeOf(f: number): Biome { return bossKind(Math.max(1, Math.ceil(f / 5)) * 5) === "lord" ? "crypt" : "warren"; }
const BIOME: Record<Biome, { name: string; sub: string }> = {
  warren: { name: "Spider Warrens", sub: "The Broodmother's webbed caverns · webs entangle you" },
  crypt: { name: "Shadow Crypt", sub: "The Echo Lord's tomb · runes drain life and wake the dead" },
};
const FAV: Record<Biome, string[]> = { warren: ["spider", "rat", "bat", "slime", "goblin"], crypt: ["skel", "wraith", "necro", "lich", "demon", "shade"] };
function freshBuffs(): Buffs { return { rage: 0, holy: 0, evade: 0, shield: 0, frenzy: 0, fury: 0, iron: 0, defend: false, dotT: 0, dotD: 0 }; }
function log(g: Game, t: string, c: string = "sys"): void { g.log.unshift({ t, c, ts: Date.now() }); if (g.log.length > 60) g.log.pop(); }
function addFx(g: Game, text: string, c: string, at: string): void { g.fx.push({ id: UID++, text, c, at, ts: Date.now() }); if (g.fx.length > 12) g.fx.shift(); }
// floating pickup text above the hero (map and arena) instead of log lines
const GOLDC = "#ffcc4d", XPC = "#c79bff";
function gain(g: Game, text: string, color: string): void { addFx(g, text, color, "m"); }
function rarCol(inv: Inv): string { return inv.ident ? RCOL[IT[inv.id].r] : "#d8cfc0"; }

// ---- item instances ----
const NOUN: Record<string, string> = { "🪄": "Staff", "🏹": "Bow", "🔪": "Dagger", "🪓": "Axe", "🔨": "Mace", "🔱": "Scepter" };
function nounOf(it: ItemT): string {
  const m: Record<Slot, string> = { weapon: NOUN[it.icon] ?? "Sword", armor: "Armor", helmet: "Helm", ring: "Ring", amulet: "Amulet", consumable: "Item" };
  return m[it.slot];
}
function affix(b: Stats): string {
  const e: [StatKey, string][] = [["fire", "of Flames"], ["ice", "of Frost"], ["holy", "of Light"], ["poison", "of Venom"]];
  let best = "", bv = 0;
  for (const [k, s] of e) { const v = b[k] ?? 0; if (v > bv) { bv = v; best = s; } }
  return best;
}
function instName(inv: Inv): string { const it = IT[inv.id]; if (!inv.ident) return `Unidentified ${nounOf(it)} ???`; const a = affix(inv.bon); return a ? `${it.name} ${a}` : it.name; }
function instIcon(inv: Inv): string { const it = IT[inv.id]; return inv.ident || it.slot === "consumable" ? it.icon : SLOT_ICON[it.slot as GearSlot]; }
function priceOf(inv: Inv): number { return Math.round(IT[inv.id].price * (1 + 0.15 * Object.keys(inv.bon).length)); }
function sellOf(inv: Inv): number { return inv.ident ? Math.max(1, Math.floor(priceOf(inv) * 0.4)) : 12; }
function idFee(inv: Inv, f: number): number { return Math.round(IDFEE[IT[inv.id].r] * (1 + 0.1 * f)); }
function locked(inv: Inv): boolean { return !!IT[inv.id].cursed && !inv.freed; }
const UNIT: Record<StatKey, number> = { hp: 5, mp: 4, atk: 1, def: 1, crit: 1.2, dodge: 0.8, ls: 0.6, fire: 1, ice: 1, holy: 1, poison: 1 };
const NEGOK: StatKey[] = ["hp", "mp", "atk", "def", "crit", "dodge"];
function rollBonus(it: ItemT, f: number): Stats {
  const out: Stats = {};
  if (it.slot === "consumable") return out;
  const n = [rnd(2), 1 + rnd(2), 1 + rnd(2), 2 + rnd(2), 2 + rnd(2)][it.r];
  const keys = shuffle(Object.keys(UNIT) as StatKey[]);
  for (let i = 0; i < n; i++) {
    const k = keys[i];
    let v = Math.max(1, Math.round(UNIT[k] * (1 + tierOf(f) * 0.5) * (1 + it.r * 0.3) * (0.6 + Math.random() * 0.8)));
    if (NEGOK.includes(k) && Math.random() < (it.cursed ? 0.5 : 0.18)) v = -Math.max(1, Math.round(v * 0.8));
    out[k] = v;
  }
  return out;
}
function makeInst(id: string, f: number, roll: boolean): Inv {
  const it = IT[id];
  const hideP = it.cursed ? 0.9 : HIDE[it.r];
  const ident = !roll || it.slot === "consumable" || Math.random() >= hideP;
  return { uid: UID++, id, ident, bon: roll ? rollBonus(it, f) : {}, freed: false };
}
function addItem(g: Game, inv: Inv): void {
  if (g.inv.length >= MAXINV) { const p = sellOf(inv); g.gold += p; gain(g, `Bag full: sold ${instName(inv)} +${p} gold`, GOLDC); return; }
  if (inv.ident) discover(inv.id);
  g.inv.push(inv);
}
function identify(g: Game, inv: Inv): void {
  if (inv.ident) return;
  inv.ident = true; discover(inv.id);
  const it = IT[inv.id];
  log(g, `🔍 Identified: ${instName(inv)} (${RAR[it.r]})${it.cursed ? " — CURSED!" : ""}`, it.cursed ? "bad" : "loot");
}

function addStats(f: Full, s?: Stats): void {
  if (!s) return;
  f.maxHp += s.hp ?? 0; f.maxMp += s.mp ?? 0; f.atk += s.atk ?? 0; f.def += s.def ?? 0; f.crit += s.crit ?? 0; f.dodge += s.dodge ?? 0;
  f.ls += s.ls ?? 0; f.fire += s.fire ?? 0; f.ice += s.ice ?? 0; f.holy += s.holy ?? 0; f.poison += s.poison ?? 0;
}
function addBonus(g: Game, s: Stats): void { for (const k of Object.keys(s) as StatKey[]) g.bonus[k] = (g.bonus[k] ?? 0) + (s[k] ?? 0); }
function setCounts(g: Game): Record<string, number> {
  const sc: Record<string, number> = {};
  for (const k of GEAR) { const it = g.eq[k]; if (it) { const s = IT[it.id].set; if (s) sc[s] = (sc[s] ?? 0) + 1; } }
  return sc;
}
function full(g: Game): Full {
  const c = CLS[g.cls]; const l = g.lvl - 1;
  const f: Full = { maxHp: c.base.hp + c.grow.hp * l, maxMp: c.base.mp + c.grow.mp * l, atk: c.base.atk + c.grow.atk * l, def: c.base.def + c.grow.def * l, crit: c.base.crit + c.grow.crit * l, dodge: c.base.dodge, ls: 0, fire: 0, ice: 0, holy: 0, poison: 0, sp: [], curses: [] };
  addStats(f, g.bonus);
  for (const k of GEAR) {
    const it = g.eq[k];
    if (it) { const tt = IT[it.id]; addStats(f, tt.st); addStats(f, it.bon); if (tt.sp) f.sp.push(tt.sp); if (tt.curse) f.curses.push(tt.curse); }
  }
  const sc = setCounts(g);
  for (const sid of Object.keys(sc)) { const S = SETS[sid]; if (sc[sid] >= 2) addStats(f, S.b2); if (sc[sid] >= S.n) { addStats(f, S.bf); f.sp.push(S.sp); } }
  if (g.perks.includes("eagleeye")) f.crit += 20;
  if (g.perks.includes("deathmark")) f.crit += 10;
  if (f.curses.includes("c_frail")) f.maxHp *= 0.7;
  f.maxHp = Math.max(10, Math.round(f.maxHp)); f.maxMp = Math.max(0, Math.round(f.maxMp)); f.atk = Math.max(1, Math.round(f.atk)); f.def = Math.max(0, Math.round(f.def));
  f.crit = Math.max(0, Math.min(75, Math.round(f.crit))); f.dodge = Math.max(0, Math.min(50, Math.round(f.dodge))); f.ls = Math.max(0, Math.min(40, f.ls));
  return f;
}
function clamp(g: Game): void { const f = full(g); g.hp = Math.min(g.hp, f.maxHp); g.mp = Math.min(g.mp, f.maxMp); }
function goldGain(g: Game, n: number): number { const v = Math.round(n * g.goldMult * (full(g).curses.includes("c_greed") ? 0.5 : 1)); g.gold += v; return v; }

function rollRarity(t: number, minR: number): number {
  const w = [Math.max(8, 62 - 9 * t), 26, 8 + 3 * t, 2 + 1.6 * t, 0.4 + 0.7 * t];
  for (let i = 0; i < minR; i++) w[i] = 0;
  const sum = w.reduce((a: number, b: number) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i; }
  return 4;
}
function rollItem(f: number, minR: number, cls: ClassId, kind: "any" | "gear" | "cons"): string {
  const t = tierOf(f);
  const want = kind === "any" ? (Math.random() < 0.45 ? "cons" : "gear") : kind;
  for (let r = rollRarity(t, minR); r >= 0; r--) {
    const c = ITEMS.filter((i: ItemT) => i.r === r && i.minF <= t && (want === "cons") === (i.slot === "consumable"));
    if (c.length === 0) continue;
    let it = pick(c);
    if (it.cls && !it.cls.includes(cls) && Math.random() < 0.6) it = pick(c);
    return it.id;
  }
  return "c_hp1";
}

function poolFor(f: number, b?: Biome): MonT[] {
  const T = Math.min(5, tierOf(f)); const bb: Biome = b ?? biomeOf(f);
  const out: MonT[] = [];
  for (const m of MONS) {
    if (m.bio && m.bio !== bb) continue;
    const fav = FAV[bb].includes(m.id);
    if (fav && T >= m.lo - 1) { for (let k = 0; k < 4; k++) out.push(m); }
    else if (T >= m.lo && T <= m.hi) out.push(m);
  }
  return out.length ? out : MONS.slice(0, 4);
}
function mscale(m: MonT, f: number): number { let s = 1 + 0.1 * Math.max(0, Math.min(f, 10) - (2 * m.lo - 1)); if (f > 10) s *= 1 + 0.12 * (f - 10); return s; }
function mkEnemy(o: Partial<Enemy> & { name: string; icon: string; hp: number; atk: number; def: number; b: Behav }): Enemy {
  return { uid: UID++, max: o.hp, dodge: 5, xp: 10, gold: 5, bk: "", undead: false, boss: false, stun: 0, burnT: 0, burnD: 0, poisT: 0, poisD: 0, dead: false, ...o };
}
function makeEnemy(m: MonT, f: number): Enemy {
  const s = mscale(m, f);
  return mkEnemy({ spr: m.id, name: m.name, icon: m.icon, hp: Math.round(m.hp * s), atk: Math.round(m.atk * s), def: Math.round(m.def * (1 + (s - 1) * 0.6)), dodge: m.dodge, xp: Math.round(m.xp * s), gold: Math.round(m.gold * s), b: m.b, undead: !!m.undead });
}
function makeBoss(f: number): Enemy {
  if (bossKind(f) === "lord") {
    const s = 1 + 0.15 * Math.max(0, f - 10);
    return mkEnemy({ name: f === 10 ? "The Echo Lord" : `Echo Lord, Depth ${f}`, spr: "lord", icon: "👑", hp: Math.round(700 * s), atk: Math.round(28 * s), def: Math.round(15 * s), xp: Math.round(400 * s), gold: Math.round(350 * s), b: "boss", bk: "lord", undead: true, boss: true });
  }
  const s = 1 + 0.15 * Math.max(0, f - 5);
  return mkEnemy({ name: f === 5 ? "The Broodmother" : `Broodmother, Depth ${f}`, spr: "brood", icon: "🕸️", hp: Math.round(300 * s), atk: Math.round(16 * s), def: Math.round(7 * s), xp: Math.round(150 * s), gold: Math.round(150 * s), b: "boss", bk: "brood", boss: true });
}

function genFloor(g: Game): void {
  let rooms: Room[] = [];
  let map: number[][] = [];
  while (rooms.length < 6) {
    map = Array.from({ length: H }, () => Array<number>(W).fill(0));
    rooms = [];
    for (let i = 0; i < 400 && rooms.length < 10; i++) {
      const w = 4 + rnd(5), h = 4 + rnd(4);
      const x = 1 + rnd(W - w - 2), y = 1 + rnd(H - h - 2);
      if (rooms.some((r: Room) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
      rooms.push({ x, y, w, h });
    }
  }
  const cen = (r: Room): { x: number; y: number } => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });
  const c0 = cen(rooms[0]);
  let far = 1, fd = -1;
  for (let i = 1; i < rooms.length; i++) { const c = cen(rooms[i]); const d = Math.abs(c.x - c0.x) + Math.abs(c.y - c0.y); if (d > fd) { fd = d; far = i; } }
  const last = rooms[far]; rooms[far] = rooms[rooms.length - 1]; rooms[rooms.length - 1] = last;
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) map[y][x] = 1;
  const carve = (a: { x: number; y: number }, b: { x: number; y: number }): void => {
    const hf = Math.random() < 0.5;
    const ry = hf ? a.y : b.y, cx = hf ? b.x : a.x;
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) map[ry][x] = map[ry][x] || 1;
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) map[y][cx] = map[y][cx] || 1;
  };
  for (let i = 1; i < rooms.length; i++) carve(cen(rooms[i - 1]), cen(rooms[i]));
  for (let k = 0; k < 2; k++) carve(cen(pick(rooms)), cen(pick(rooms)));
  g.map = map;
  g.seen = Array.from({ length: H }, () => Array<boolean>(W).fill(false));
  g.px = c0.x; g.py = c0.y; g.wx = c0.x + 0.5; g.wy = c0.y + 0.5;
  const end = cen(rooms[rooms.length - 1]);
  g.sx = end.x; g.sy = end.y;
  g.mons = [];
  g.stains = []; g.rem = [];
  g.biome = biomeOf(g.floor); g.bannerTs = Date.now();
  if (g.floor % 5 === 0) g.mons.push({ id: UID++, x: end.x, y: end.y, t: bossKind(g.floor), boss: true, awake: true, stun: 0 });
  else map[end.y][end.x] = 2;
  const spot = (from: number, to: number): { x: number; y: number } | null => {
    for (let tries = 0; tries < 60; tries++) {
      const r = rooms[from + rnd(Math.max(1, to - from))];
      const x = r.x + rnd(r.w), y = r.y + rnd(r.h);
      if (map[y][x] !== 1 || (x === g.px && y === g.py)) continue;
      if (g.mons.some((m: MapMon) => m.x === x && m.y === y)) continue;
      if (Math.abs(x - end.x) + Math.abs(y - end.y) <= 1) continue;
      return { x, y };
    }
    return null;
  };
  g.shop = [];
  if (g.floor % 2 === 0 && g.floor % 10 !== 0) {
    let s: { x: number; y: number } | null = null;
    for (let tries = 0; tries < 120 && !s; tries++) {
      const r = rooms[1 + rnd(Math.max(1, rooms.length - 2))];
      if (!r || r.w < 3 || r.h < 3) continue;
      const x = r.x + 1 + rnd(r.w - 2), y = r.y + 1 + rnd(r.h - 2);
      if (map[y][x] !== 1 || (x === g.px && y === g.py) || Math.abs(x - end.x) + Math.abs(y - end.y) <= 1) continue;
      if (g.mons.some((mm: MapMon) => mm.x === x && mm.y === y)) continue;
      let open = 0;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as [number, number][]) if (map[y + oy][x + ox] !== 0) open++;
      if (open < 8) continue;
      s = { x, y };
    }
    if (!s) s = spot(1, rooms.length - 1);
    if (s) {
      map[s.y][s.x] = 4;
      const cons = shuffle(ITEMS.filter((i: ItemT) => i.slot === "consumable" && i.r <= 2 && i.minF <= tierOf(g.floor))).slice(0, 5);
      for (const c of cons) g.shop.push(makeInst(c.id, g.floor, false));
      for (let k = 0; k < 4; k++) { const id = rollItem(g.floor, k === 0 ? 2 : 1, g.cls, "gear"); if (!IT[id].cursed) { const inv = makeInst(id, g.floor, true); inv.ident = true; g.shop.push(inv); } }
      if (Math.random() < 0.5) g.shop.push(makeInst(rollItem(g.floor + 2, 3, g.cls, "cons"), g.floor, false));
    }
  }
  const chests = Math.min(8, 4 + Math.floor(g.floor / 3));
  for (let k = 0; k < chests; k++) { const s = spot(1, rooms.length); if (s) map[s.y][s.x] = 3; }
  const nh = Math.min(14, 5 + tierOf(g.floor));
  for (let k = 0, tries = 0; k < nh && tries < 500; tries++) {
    const x = 1 + rnd(W - 2), y = 1 + rnd(H - 2);
    if (map[y][x] !== 1 || Math.abs(x - g.px) + Math.abs(y - g.py) <= 2 || Math.abs(x - end.x) + Math.abs(y - end.y) <= 1) continue;
    map[y][x] = g.biome === "warren" ? 5 : 6; k++;
  }
  const pool = poolFor(g.floor, g.biome);
  const nm = Math.min(16, 6 + tierOf(g.floor));
  for (let k = 0; k < nm; k++) { const s = spot(1, rooms.length); if (s) g.mons.push({ id: UID++, x: s.x, y: s.y, t: pick(pool).id, boss: false, awake: false, stun: 0 }); }
  g.usedUndying = false; g.usedShadow = false; g.usedPhoenix = false; g.usedRes = false;
}
function reveal(g: Game): void {
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const x = g.px + dx, y = g.py + dy;
    if (x >= 0 && y >= 0 && x < W && y < H && dx * dx + dy * dy <= R * R + 1) g.seen[y][x] = true;
  }
}
function newGame(cls: ClassId, mode: Mode): Game {
  const c = CLS[cls];
  const g: Game = {
    screen: "map", prev: "map", mode, cls, lvl: 1, xp: 0, hp: 1, mp: 1, gold: 30, inv: [], eq: {}, floor: 1, map: [], seen: [], px: 0, py: 0, mons: [], sx: 0, sy: 0,
    log: [], combat: null, cds: {}, buffs: freshBuffs(), perks: [], bonus: {}, goldMult: 1, inAb: false, usedUndying: false, usedShadow: false, usedPhoenix: false,
    shop: [], offers: [], kills: 0, sel: -1, fx: [], turns: 0, tokensEarned: 0,
  };
  g.eq.weapon = makeInst(c.start[0], 1, false);
  g.eq.armor = makeInst(c.start[1], 1, false);
  discover(c.start[0]); discover(c.start[1]);
  for (const id of ["c_hp1", "c_hp1", "c_mp1", "c_anti"]) addItem(g, makeInst(id, 1, false));
  if (mode === "endless") {
    const o = owned(cls);
    for (const n of TREE[cls]) if (o.includes(n.id)) { if (n.st) addBonus(g, n.st); if (n.cap) g.perks.push(n.cap); }
  }
  genFloor(g); reveal(g);
  const f = full(g); g.hp = f.maxHp; g.mp = f.maxMp;
  log(g, mode === "story" ? `You enter the Dungeon of Echoes as a ${c.name}. Reach Floor ${STORY_END} and slay the Echo Lord.` : `∞ Endless run as a ${c.name}. ${g.perks.length ? `${g.perks.length} capstone(s) active. ` : ""}How deep can you go?`, "good");
  return g;
}

function descend(g: Game): void {
  g.floor++;
  if (g.mode === "endless") {
    const m = meta();
    if (g.floor > m.best) m.best = g.floor;
    if ((g.floor - 1) % 10 === 0) { m.tokens++; g.tokensEarned++; gain(g, `+1 Endless token (${m.tokens})`, XPC); }
    saveMeta();
  }
  genFloor(g); reveal(g);
  log(g, `${BIOME[biomeOf(g.floor)].name}: you descend to ${g.mode === "story" ? "Floor" : "Depth"} ${g.floor}${g.floor % 5 === 0 ? ` — ${bossKind(g.floor) === "lord" ? "the Echo Lord" : "the Broodmother"} lurks here!` : ""}.`, "good");
  g.screen = "map";
}
function makeOffers(g: Game): Perk[] {
  const caps = shuffle(CAPS[g.cls].filter((p: Perk) => !g.perks.includes(p.id)));
  const out: Perk[] = [];
  if (g.floor % 10 === 0) out.push(...caps.slice(0, 3));
  else if (caps.length > 0 && Math.random() < 0.2) out.push(caps[0]);
  const t2 = shuffle(UPG2), t1 = shuffle(UPG1);
  if (out.length < 3) out.push(t2[0]);
  let i = 0;
  while (out.length < 3) { out.push(t1[i]); i++; }
  return out;
}
function applyPerk(g: Game, p: Perk): void {
  if (p.tier === 3) g.perks.push(p.id);
  if (p.st) { addBonus(g, p.st); if (p.st.hp) g.hp += p.st.hp; if (p.st.mp) g.mp += p.st.mp; }
  if (p.gold) g.goldMult += p.gold;
  log(g, `${p.icon} Upgrade gained: ${p.name}.`, "good");
  g.screen = "map";
}

function gainXp(g: Game, n: number): void {
  g.xp += n;
  while (g.xp >= need(g.lvl)) {
    g.xp -= need(g.lvl); g.lvl++;
    const f = full(g);
    g.hp = Math.min(f.maxHp, g.hp + Math.round(f.maxHp * 0.3)); g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * 0.3));
    log(g, `⭐ Level up! You are now level ${g.lvl}.`, "good");
    addFx(g, `LEVEL ${g.lvl}!`, "good", "p");
  }
}
function healPlayer(g: Game, amt: number, combatHeal: boolean): number {
  const f = full(g); const before = g.hp;
  const real = f.curses.includes("c_halfheal") ? Math.round(amt * 0.5) : amt;
  g.hp = Math.min(f.maxHp, g.hp + real);
  const h = g.hp - before;
  if (h > 0) addFx(g, `+${h}`, "heal", "p");
  if (combatHeal && g.combat && g.perks.includes("radiance")) {
    const d = Math.max(4, amt);
    for (const e of alive(g.combat)) { e.hp -= d; addFx(g, `-${d}`, "loot", "e" + e.uid); }
    log(g, `☀️ Radiance sears all enemies for ${d}!`, "dmg");
  }
  return h;
}
function applyDot(g: Game, d: number, label: string): void {
  if (full(g).sp.includes("dotImmune")) { log(g, `Dragonheart Plate shrugs off the ${label}.`, "good"); return; }
  g.buffs.dotT = 3; g.buffs.dotD = Math.max(g.buffs.dotD, d);
  log(g, `You are ${label === "burn" ? "burning 🔥" : "poisoned ☠️"}!`, "bad");
}
function lethal(g: Game): void {
  if (g.hp > 0) return;
  const f = full(g);
  if (g.perks.includes("undying") && !g.usedUndying) { g.hp = 1; g.usedUndying = true; log(g, "🩸 UNDYING! You refuse to fall!", "good"); addFx(g, "UNDYING", "good", "p"); return; }
  if (f.sp.includes("phoenix") && !g.usedPhoenix) { g.hp = Math.round(f.maxHp * 0.4); g.usedPhoenix = true; log(g, "🪶 The Phoenix Amulet blazes — you rise again!", "good"); addFx(g, "REVIVE", "good", "p"); return; }
  if (g.perks.includes("resurrect") && !g.usedRes) { g.hp = Math.round(f.maxHp * 0.5); g.usedRes = true; log(g, "🕯️ Divine Resurrection! Holy light drags you back from death.", "good"); addFx(g, "REVIVE", "good", "p"); }
}
function die(g: Game): void {
  g.screen = "dead"; g.combat = null; g.hp = 0; log(g, "You have fallen...", "bad");
  if (g.mode === "endless") { const m = meta(); if (g.floor > m.best) m.best = g.floor; saveMeta(); log(g, "☠️ Permadeath: this Endless run is gone. Tokens, upgrades, best depth and codex are kept.", "bad"); }
  clearRun();
}

function alive(c: Combat): Enemy[] { return c.enemies.filter((e: Enemy) => !e.dead && e.hp > 0); }
function tgt(c: Combat): Enemy | undefined { const e = c.enemies[c.target]; if (e && !e.dead && e.hp > 0) return e; return c.enemies.find((x: Enemy) => !x.dead && x.hp > 0); }

function hitEnemy(g: Game, e: Enemy, mult: number, forceCrit: boolean, label: string, holy: boolean = false): number {
  if (e.hp <= 0) return 0;
  const f = full(g); const b = g.buffs;
  if (!forceCrit && Math.random() * 100 < e.dodge) { log(g, `${label}: ${e.name} dodges!`); addFx(g, "miss", "sys", "e" + e.uid); return 0; }
  const atk = f.atk * (b.rage > 0 || b.fury > 0 ? 1.5 : 1);
  const crit = forceCrit || Math.random() * 100 < f.crit;
  const def = crit && g.perks.includes("eagleeye") ? 0 : e.def;
  let d = atk * mult * (0.9 + Math.random() * 0.2) * 60 / (60 + def);
  d += (f.fire + f.ice + f.poison + f.holy * (e.undead ? 2 : 1)) * Math.min(1, mult);
  if (holy && e.undead) d *= 1.2;
  if (crit) d *= g.perks.includes("deathmark") ? 3 : 2;
  if (f.sp.includes("void")) d *= 1.15;
  if (g.inAb && f.sp.includes("arcanist")) d *= 1.2;
  const dmg = Math.max(1, Math.round(d));
  e.hp -= dmg;
  log(g, `${label} → ${e.name}: ${dmg}${crit ? " CRIT! 🩸 Blood sprays!" : ""}`, "dmg");
  addFx(g, `-${dmg}${crit ? "!" : ""}`, crit ? "loot" : "dmg", "e" + e.uid);
  if (f.ls > 0) healPlayer(g, Math.max(1, Math.round(dmg * f.ls / 100)), false);
  if (crit && f.sp.includes("critHeal")) healPlayer(g, Math.round(f.maxHp * 0.05), false);
  if (f.ice > 0 && e.hp > 0 && Math.random() < 0.1) stunE(g, e, 1);
  if (f.poison > 0) { e.poisT = Math.max(e.poisT, 3); e.poisD = Math.max(e.poisD, f.poison); }
  if (crit && f.sp.includes("critPoison")) { e.poisT = 4; e.poisD = Math.max(e.poisD, Math.round(f.atk * 0.4)); }
  return dmg;
}
function stunE(g: Game, e: Enemy, n: number): void {
  if (e.hp <= 0) return;
  if (e.boss) { if (Math.random() < 0.5) { e.stun = Math.max(e.stun, 1); log(g, `${e.name} is staggered!`); } else log(g, `${e.name} resists the stun.`); return; }
  e.stun = Math.max(e.stun, n); log(g, `${e.name} is stunned/frozen for ${n}.`);
}
function damagePlayer(g: Game, e: Enemy, raw: number, magic: boolean, verb: string): number {
  if (g.combat && (g.combat.iT ?? 0) > 0) { addFx(g, "dodge", "sys", "p"); return 0; }
  const f = full(g); const b = g.buffs;
  if (b.evade > 0) { b.evade--; log(g, `You evade ${e.name}'s attack!`); addFx(g, "EVADE", "sys", "p"); return 0; }
  if (Math.random() * 100 < f.dodge) { log(g, `You dodge ${e.name}.`); addFx(g, "dodge", "sys", "p"); return 0; }
  let def = magic ? f.def * 0.5 : f.def;
  if (b.iron > 0) def *= 1.5;
  let d = raw * (0.9 + Math.random() * 0.2) * 60 / (60 + def);
  if (b.defend) d *= 0.5;
  if (b.holy > 0) d *= 0.5;
  if (g.perks.includes("juggernaut")) d *= 0.85;
  if (f.curses.includes("c_fragile")) d *= 1.4;
  d = Math.max(1, Math.round(d));
  const total = d;
  if (b.shield > 0) { const a = Math.min(b.shield, d); b.shield -= a; d -= a; if (a > 0) log(g, `Arcane Shield absorbs ${a}.`); }
  g.hp -= d;
  log(g, `${e.name} ${verb} you for ${d}.`, "bad");
  addFx(g, `-${d}`, "bad", "p");
  if (d > 0) g.hurtTs = Date.now();
  const th = (f.sp.includes("thorns") ? 0.25 : 0) + (f.sp.includes("thorns15") ? 0.15 : 0) + (g.perks.includes("juggernaut") ? 0.35 : 0);
  if (th > 0 && e.hp > 0) { const r = Math.max(1, Math.round(total * th)); e.hp -= r; log(g, `Thorns reflect ${r} to ${e.name}.`, "dmg"); }
  if (g.cls === "warrior") g.mp = Math.min(f.maxMp, g.mp + 2);
  lethal(g);
  return d;
}

function resolveDeaths(g: Game): void {
  const c = g.combat; if (!c) return;
  for (const e of c.enemies) {
    if (e.dead || e.hp > 0) continue;
    e.dead = true; e.hp = 0; g.kills++;
    const gold = goldGain(g, e.gold * (0.8 + Math.random() * 0.4));
    gain(g, `+${e.xp} XP`, XPC); gain(g, `+${gold} gold`, GOLDC);
    gainXp(g, e.xp);
    const drops: Inv[] = [];
    if (e.boss) { for (let k = 0; k < 2; k++) drops.push(makeInst(rollItem(g.floor, 3, g.cls, "gear"), g.floor, true)); drops.push(makeInst("c_ident", g.floor, false)); }
    else if (Math.random() < 0.3) drops.push(makeInst(rollItem(g.floor, 0, g.cls, "any"), g.floor, true));
    for (const d of drops) { gain(g, `+ ${instName(d)}`, rarCol(d)); addItem(g, d); }
  }
  const t = c.enemies[c.target];
  if (!t || t.dead) { const i = c.enemies.findIndex((x: Enemy) => !x.dead); if (i >= 0) c.target = i; }
}
function winCombat(g: Game): void {
  const c = g.combat; if (!c) return;
  const deadMon = g.mons.find((m: MapMon) => m.id === c.monId);
  if (deadMon) (g.rem = g.rem ?? []).push(`${deadMon.y * W + deadMon.x}:${deadMon.t}`);
  g.mons = g.mons.filter((m: MapMon) => m.id !== c.monId);
  g.combat = null; g.buffs = freshBuffs(); g.cds = {};
  g.screen = "map";
  if (c.boss) {
    g.map[g.sy][g.sx] = 2;
    log(g, "The stairs 🔽 appear where the boss fell.", "good");
    if (g.mode === "story" && g.floor >= STORY_END) { g.screen = "victory"; return; }
    if (g.mode === "endless") { g.offers = makeOffers(g); g.screen = "upgrade"; return; }
    if (g.floor === 5) log(g, "The Broodmother is dead. Deeper halls await…", "good");
    return;
  }
  log(g, "Victory! The fight is over.", "good");
}
function checkWin(g: Game): boolean {
  resolveDeaths(g);
  if (g.combat && alive(g.combat).length === 0) { winCombat(g); return true; }
  return false;
}

function startCombat(g: Game, m: MapMon): void {
  const enemies: Enemy[] = [];
  if (m.boss) enemies.push(makeBoss(g.floor));
  else {
    enemies.push(makeEnemy(MON[m.t], g.floor));
    const pool = poolFor(g.floor);
    if (Math.random() < Math.min(0.6, 0.1 + 0.05 * g.floor)) enemies.push(makeEnemy(pick(pool), g.floor));
    if (Math.random() < Math.min(0.35, 0.025 * g.floor)) enemies.push(makeEnemy(pick(pool), g.floor));
  }
  g.combat = { enemies, target: 0, monId: m.id, turn: 0, boss: m.boss, phase: 1, charging: false, itemOpen: false };
  g.buffs = freshBuffs(); g.cds = {}; g.screen = "combat";
  log(g, m.boss ? `${enemies[0].name} blocks the way down!` : `⚔️ Ambushed by ${enemies.map((e: Enemy) => e.name).join(", ")}!`, "bad");
  if (g.perks.includes("shadowstep")) {
    const t = enemies[0];
    hitEnemy(g, t, 1.5, true, "🌑 Shadow Step");
    if (t.hp > 0) stunE(g, t, 1);
    checkWin(g);
  }
}

function mobAct(g: Game, e: Enemy): void {
  const c = g.combat; if (!c) return;
  const r = Math.random();
  switch (e.b) {
    case "brute": if (r < 0.25) damagePlayer(g, e, e.atk * 1.6, false, "SMASHES"); else damagePlayer(g, e, e.atk, false, "hits"); break;
    case "swift": damagePlayer(g, e, e.atk * 0.6, false, "slashes"); if (g.hp > 0) damagePlayer(g, e, e.atk * 0.6, false, "slashes"); break;
    case "tank": if (r < 0.3) damagePlayer(g, e, e.atk * 1.3, false, "slams"); else damagePlayer(g, e, e.atk * 0.9, false, "hits"); break;
    case "caster": {
      const hurt = alive(c).filter((x: Enemy) => x.hp / x.max < 0.6).sort((a: Enemy, b: Enemy) => a.hp / a.max - b.hp / b.max);
      if (hurt.length > 0 && r < 0.35) { const h = hurt[0]; const amt = Math.round(h.max * 0.3); h.hp = Math.min(h.max, h.hp + amt); log(g, `${e.name} heals ${h.name} for ${amt}.`, "bad"); }
      else damagePlayer(g, e, e.atk * 1.1, true, "blasts");
      break;
    }
    case "poisoner": { const d = damagePlayer(g, e, e.atk, false, "bites"); if (d > 0 && r < 0.45) applyDot(g, Math.round(e.atk * 0.3), "poison"); break; }
    case "drainer": { const d = damagePlayer(g, e, e.atk, false, "drains"); if (d > 0) e.hp = Math.min(e.max, e.hp + Math.round(d * 0.5)); break; }
    default: damagePlayer(g, e, e.atk, false, "hits");
  }
}
function summon(g: Game, boss: Enemy, n: number): void {
  const c = g.combat; if (!c) return;
  for (let k = 0; k < n; k++) {
    if (alive(c).length >= 5) break;
    const lord = boss.bk === "lord";
    c.enemies.push(mkEnemy({ spr: lord ? "shade" : "spiderling", name: lord ? "Echo Shade" : "Spiderling", icon: lord ? "👤" : "🕷️", hp: Math.round(boss.max * (lord ? 0.11 : 0.12)), atk: Math.round(boss.atk * (lord ? 0.6 : 0.5)), def: Math.round(boss.def * 0.4), dodge: 10, xp: Math.round(boss.xp * 0.06), gold: Math.round(boss.gold * 0.05), b: lord ? "drainer" : "poisoner", undead: lord, stun: 1 }));
  }
}
function broodMelee(g: Game, e: Enemy): void {
  const c = g.combat; if (!c) return;
  if (Math.random() < 0.4) { const d = damagePlayer(g, e, e.atk, false, "sinks Venom Fangs into"); if (d > 0) applyDot(g, Math.round(e.atk * 0.35), "poison"); }
  else { damagePlayer(g, e, e.atk * (c.phase === 2 ? 0.8 : 1), false, "bites"); if (c.phase === 2 && g.hp > 0) damagePlayer(g, e, e.atk * 0.8, false, "bites"); }
}
function lordMelee(g: Game, e: Enemy): void {
  const c = g.combat; if (!c) return;
  const atk = e.atk * (c.phase === 3 ? 1.35 : 1); const r = Math.random();
  if (c.phase === 3 && r < 0.35) { const d = damagePlayer(g, e, atk * 1.2, true, "Soul Drains"); if (d > 0) e.hp = Math.min(e.max, e.hp + Math.round(d * 0.6)); }
  else if (r < 0.3) damagePlayer(g, e, atk * 1.5, false, "rends with Echo Slash");
  else damagePlayer(g, e, atk, false, "strikes");
}
function bossPhase(g: Game, e: Enemy): void {
  const c = g.combat; if (!c) return;
  const ratio = e.hp / e.max;
  if (e.bk === "brood") { if (c.phase === 1 && ratio <= 0.5) { c.phase = 2; log(g, "⚠️ PHASE 2: The Broodmother shrieks — spiderlings pour out and acid rains faster!", "bad"); summon(g, e, 2); } return; }
  const ph = ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3;
  if (ph > c.phase) {
    if (ph >= 2 && c.phase < 2) { log(g, "🌘 PHASE 2: The Echo Lord splits its shadow — Echo Shades rise and shadow flame erupts!", "bad"); summon(g, e, 2); }
    if (ph === 3) { log(g, "🔥 PHASE 3: The Echo Lord ENRAGES! Watch for the CATACLYSM ring!", "bad"); summon(g, e, 1); }
    c.phase = ph;
  }
}
// ---------- REAL-TIME COMBAT ----------
const AW = 100, AH = 70;
const HELD = new Set<string>();
let NAV_T = 0;
// speed, reach, wind-up (s), cooldown (s)
const RTB: Record<string, [number, number, number, number]> = { brute: [13, 11, 0.75, 1.9], swift: [21, 9, 0.4, 1.25], tank: [9, 12, 0.85, 2.3], caster: [11, 50, 0.7, 2.3], poisoner: [17, 9, 0.5, 1.6], drainer: [14, 10, 0.6, 1.7] };
const ARATE: Record<ClassId, number> = { warrior: 0.62, mage: 0.6, rogue: 0.42, cleric: 0.6, ranger: 0.5 };
const ARNG: Record<ClassId, number> = { warrior: 17, mage: 62, rogue: 15, cleric: 18, ranger: 72 };
const ABR: Record<string, number> = { bash: 20, backstab: 19, poison: 19, smite: 62, fireball: 72, trap: 72, frenzy: 72, multi: 90 };
function clampN(v: number, a: number, b: number): number { return v < a ? a : v > b ? b : v; }
function eDist(c: Combat, e: Enemy): number { return Math.hypot((c.px ?? 0) - (e.x ?? 0), (c.py ?? 0) - (e.y ?? 0)); }
function nearP(c: Combat, r: number): Enemy[] { return alive(c).filter((e: Enemy) => eDist(c, e) <= r); }
function nearestIdx(c: Combat, r: number): number {
  let bi = -1, bd = r;
  c.enemies.forEach((e: Enemy, i: number) => { if (e.dead || e.hp <= 0) return; const d = eDist(c, e); if (d <= bd) { bd = d; bi = i; } });
  return bi;
}
function aimTarget(c: Combat, r: number): boolean {
  const cur = c.enemies[c.target];
  if (cur && !cur.dead && cur.hp > 0 && eDist(c, cur) <= r) return true;
  const i = nearestIdx(c, r); if (i >= 0) { c.target = i; return true; }
  return false;
}
function rtInit(g: Game): void {
  const c = g.combat; if (!c) return;
  if (c.px === undefined || c.py === undefined) { c.px = 16; c.py = AH / 2; }
  if (!c.proj) c.proj = [];
  if (!c.tele) c.tele = [];
  if (!c.shots) c.shots = [];
  if (c.grace === undefined) c.grace = 1;
  if (c.bossT === undefined) c.bossT = 3;
  const boss = c.enemies.find((e: Enemy) => e.boss);
  let k = 0;
  for (const e of c.enemies) {
    if (!e.rt) { e.rt = true; const m = e.boss ? 1.8 : 1.5; e.max = Math.round(e.max * m); e.hp = Math.round(e.hp * m); }
    if (e.x === undefined || e.y === undefined) {
      if (boss && !e.boss) { e.x = clampN((boss.x ?? 75) + (Math.random() * 24 - 12), 8, AW - 8); e.y = clampN((boss.y ?? AH / 2) + (Math.random() * 30 - 15), 8, AH - 8); }
      else { e.x = e.boss ? 76 : 64 + (k % 3) * 11; e.y = e.boss ? AH / 2 : 14 + ((k * 21) % (AH - 26)); }
    }
    if (e.atkT === undefined) e.atkT = 0.6 + Math.random() * 0.9;
    k++;
  }
}
function shot(g: Game, col: string): void {
  const c = g.combat; if (!c) return;
  const e = c.enemies[c.target]; if (!e) return;
  const s = c.shots ?? (c.shots = []);
  s.push({ id: UID++, x1: c.px ?? 0, y1: c.py ?? 0, x2: e.x ?? 0, y2: e.y ?? 0, ts: Date.now(), c: col });
  if (s.length > 8) s.shift();
}
function rtAttack(g: Game): void {
  const c = g.combat; if (!c || g.screen !== "combat" || (c.atkCd ?? 0) > 0 || (c.grace ?? 0) > 0) return;
  const r = ARNG[g.cls];
  if (!aimTarget(c, r)) { c.atkCd = 0.3; addFx(g, "too far", "sys", "p"); return; }
  c.atkCd = ARATE[g.cls];
  if (r > 30) shot(g, g.cls === "mage" ? "#b18cff" : "#e8d9a8");
  doAction(g, "attack", "");
  if (g.screen === "combat") checkWin(g);
}
function rtAbility(g: Game, id: string): void {
  const c = g.combat; if (!c || g.screen !== "combat") return;
  const r = ABR[id];
  if (r !== undefined && !aimTarget(c, r)) { log(g, "No enemy in range — move closer."); addFx(g, "out of range", "sys", "p"); return; }
  if (r !== undefined && r > 30) shot(g, "#ffd36b");
  combatAct(g, "ability", id);
}
function rtDodge(g: Game, mx: number, my: number): void {
  const c = g.combat; if (!c || g.screen !== "combat" || (c.dashCd ?? 0) > 0) return;
  let vx = mx, vy = my;
  if (Math.hypot(vx, vy) < 0.2) { const i = nearestIdx(c, 999); const e = i >= 0 ? c.enemies[i] : undefined; vx = e ? (c.px ?? 0) - (e.x ?? 0) : -1; vy = e ? (c.py ?? 0) - (e.y ?? 0) : 0; }
  const m = Math.hypot(vx, vy) || 1;
  c.dvx = vx / m; c.dvy = vy / m; c.dashT = 0.2; c.iT = 0.4; c.dashCd = g.cls === "rogue" ? 1.6 : 2.2;
}
function rtFlee(g: Game): void {
  const c = g.combat; if (!c || (c.fleeCd ?? 0) > 0) return;
  c.fleeCd = 3; combatAct(g, "flee", "");
}
function rtResolve(g: Game, e: Enemy, d: number, reach: number): void {
  const c = g.combat; if (!c) return;
  const kind = e.wk; e.wk = "";
  if (kind === "cast") {
    const hurt = alive(c).filter((x: Enemy) => x !== e && x.hp / x.max < 0.6);
    if (hurt.length > 0 && Math.random() < 0.35) { const h = hurt[0]; const amt = Math.round(h.max * 0.25); h.hp = Math.min(h.max, h.hp + amt); log(g, `${e.name} heals ${h.name} for ${amt}.`, "bad"); addFx(g, `+${amt}`, "heal", "e" + h.uid); return; }
    const dx = (c.px ?? 0) - (e.x ?? 0), dy = (c.py ?? 0) - (e.y ?? 0); const m = Math.hypot(dx, dy) || 1;
    (c.proj ?? (c.proj = [])).push({ id: UID++, x: e.x ?? 0, y: e.y ?? 0, vx: (dx / m) * 48, vy: (dy / m) * 48, dmg: e.atk * 1.1, from: e.uid, life: 2.5, c: e.undead ? "#b48cff" : "#ff7a3a" });
    return;
  }
  if (d > reach + 5) { addFx(g, "whiff", "sys", "e" + e.uid); return; }
  if (e.bk === "lord") lordMelee(g, e); else if (e.bk === "brood") broodMelee(g, e); else mobAct(g, e);
}
function bossSpecial(g: Game, e: Enemy, dt: number): void {
  const c = g.combat; if (!c || e.stun > 0) return;
  c.bossT = (c.bossT ?? 3) - dt;
  if (c.bossT > 0) return;
  const tl = c.tele ?? (c.tele = []);
  const at = (r: number, t: number, dmg: number, kind: string, x: number, y: number): void => { tl.push({ id: UID++, x, y, r, t, max: t, dmg, from: e.uid, kind }); };
  const px = c.px ?? 50, py = c.py ?? 35;
  if (e.bk === "brood") {
    at(12, 1.1, e.atk * 1.3, "acid", px, py);
    if (c.phase === 2) at(10, 1.4, e.atk * 1.1, "acid", clampN(px + (Math.random() * 30 - 15), 6, AW - 6), clampN(py + (Math.random() * 24 - 12), 6, AH - 6));
    log(g, "🕸️ The Broodmother spits acid — get out of the green ring!", "bad");
    c.bossT = c.phase === 2 ? 3.2 : 4.5; return;
  }
  const atk = e.atk * (c.phase === 3 ? 1.35 : 1);
  if (c.phase === 1) { at(11, 1.1, atk * 1.2, "flame", px, py); c.bossT = 5; return; }
  if (c.phase === 3 && !c.charging && Math.random() < 0.45) {
    c.charging = true; at(30, 2.2, atk * 2.4, "cata", e.x ?? 50, e.y ?? 35);
    log(g, "⚠️ The Echo Lord gathers a CATACLYSM — get out of the purple ring!", "bad"); c.bossT = 4.5; return;
  }
  at(12, 1.0, atk * 1.25, "flame", px, py); log(g, "🔥 Shadow flame gathers beneath you — move!", "bad");
  c.bossT = c.phase === 3 ? 2.8 : 3.5;
}
function rtStep(g: Game, dt: number, mx: number, my: number, atk: boolean): void {
  const c = g.combat; if (!c || g.screen !== "combat") return;
  rtInit(g);
  const f = full(g);
  c.dashCd = Math.max(0, (c.dashCd ?? 0) - dt); c.iT = Math.max(0, (c.iT ?? 0) - dt); c.atkCd = Math.max(0, (c.atkCd ?? 0) - dt); c.fleeCd = Math.max(0, (c.fleeCd ?? 0) - dt);
  for (const k of Object.keys(g.cds)) if (g.cds[k] > 0) g.cds[k] = Math.max(0, g.cds[k] - dt);
  let vx = mx, vy = my, sp = ARENA_SPD + f.dodge * 0.25;
  if ((c.dashT ?? 0) > 0) { c.dashT = Math.max(0, (c.dashT ?? 0) - dt); vx = c.dvx ?? 0; vy = c.dvy ?? 0; sp = 110; }
  const mag = Math.hypot(vx, vy); if (mag > 1) { vx /= mag; vy /= mag; }
  c.px = clampN((c.px ?? 16) + vx * sp * dt, 4, AW - 4); c.py = clampN((c.py ?? 35) + vy * sp * dt, 5, AH - 4);
  if ((c.grace ?? 0) > 0) { c.grace = Math.max(0, (c.grace ?? 0) - dt); return; }
  if (atk) { rtAttack(g); if (g.screen !== "combat") return; }
  c.tick = (c.tick ?? 0) + dt;
  if (c.tick >= 1.5) {
    c.tick -= 1.5;
    petPhase(g); if (checkWin(g)) return;
    endRound(g); if (g.screen !== "combat") return;
    if (checkWin(g)) return;
  }
  const px = c.px, py = c.py;
  const boss = c.enemies.find((e: Enemy) => e.boss && !e.dead && e.hp > 0);
  if (boss) { bossPhase(g, boss); bossSpecial(g, boss, dt); }
  for (const e of c.enemies) {
    if (e.dead || e.hp <= 0) continue;
    if (e.stun > 0) { e.stun = Math.max(0, e.stun - dt / 1.2); e.wind = 0; e.wk = ""; continue; }
    const P: [number, number, number, number] = e.boss ? (e.bk === "lord" ? [12, 17, 0.6, 1.5] : [10, 16, 0.7, 1.7]) : (RTB[e.b] ?? RTB.brute);
    const spd = P[0], reach = P[1];
    const ex = e.x ?? 50, ey = e.y ?? 35; const dx = px - ex, dy = py - ey; const d = Math.hypot(dx, dy) || 0.001;
    if ((e.wind ?? 0) > 0) {
      const w = (e.wind ?? 0) - dt; e.wind = w;
      if (w <= 0) { e.wind = 0; rtResolve(g, e, d, reach); if (g.hp <= 0) { die(g); return; } if (g.screen !== "combat") return; }
      continue;
    }
    const at = (e.atkT ?? 0) - dt; e.atkT = at;
    const caster = e.b === "caster";
    let mvx = 0, mvy = 0;
    if (caster) { if (d > 44) { mvx = dx / d; mvy = dy / d; } else if (d < 26) { mvx = -dx / d; mvy = -dy / d; } }
    else if (d > reach * 0.7) { mvx = dx / d; mvy = dy / d; }
    for (const o of c.enemies) {
      if (o === e || o.dead || o.hp <= 0) continue;
      const ox = ex - (o.x ?? 0), oy = ey - (o.y ?? 0); const od = Math.hypot(ox, oy);
      if (od < 10 && od > 0.01) { mvx += (ox / od) * 0.7; mvy += (oy / od) * 0.7; }
    }
    e.x = clampN(ex + mvx * spd * dt, 5, AW - 5); e.y = clampN(ey + mvy * spd * dt, 7, AH - 5);
    if (at <= 0 && d <= (caster ? 62 : reach + 3)) { e.wk = caster ? "cast" : "melee"; e.wm = P[2]; e.wind = P[2]; e.atkT = P[3] + Math.random() * 0.6; }
  }
  const pr = c.proj ?? [];
  for (const p of pr) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life > 0 && Math.hypot(p.x - px, p.y - py) < 4.5) {
      p.life = 0;
      const e = c.enemies.find((x: Enemy) => x.uid === p.from);
      if (e) damagePlayer(g, e, p.dmg, true, "blasts");
      if (g.hp <= 0) { die(g); return; }
    }
  }
  c.proj = pr.filter((p: Proj) => p.life > 0 && p.x > -5 && p.x < AW + 5 && p.y > -5 && p.y < AH + 5);
  const tl = c.tele ?? [];
  for (const tz of tl) {
    tz.t -= dt;
    const e = c.enemies.find((x: Enemy) => x.uid === tz.from);
    if (!e || e.dead || e.hp <= 0) { tz.t = -1; if (tz.kind === "cata") c.charging = false; continue; }
    if (tz.t > 0) continue;
    if (tz.kind === "cata") c.charging = false;
    if (Math.hypot(px - tz.x, py - tz.y) <= tz.r + 2) {
      const verb = tz.kind === "acid" ? "splashes acid on" : tz.kind === "cata" ? "💥 OBLITERATES" : "engulfs in shadow flame";
      const dd = damagePlayer(g, e, tz.dmg, true, verb);
      if (dd > 0 && tz.kind === "flame") applyDot(g, Math.round(e.atk * 0.25), "burn");
      if (dd > 0 && tz.kind === "acid") applyDot(g, Math.round(e.atk * 0.2), "poison");
      if (g.hp <= 0) { die(g); return; }
    } else addFx(g, "dodged!", "good", "p");
  }
  c.tele = tl.filter((tz: Tele) => tz.t > 0);
  if (g.screen === "combat") checkWin(g);
}
// ----- free (sub-tile) map movement -----
const PR = 0.3, MR = 0.3, MAP_SPD = 3.25, ARENA_SPD = 26;
function mSpd(m: MapMon): number { const b = MON[m.t]?.b; return 0.75 + (b && RTB[b] ? RTB[b][0] : 13) * 0.085; }
function solidT(g: Game, x: number, y: number): boolean { return x < 0 || y < 0 || x >= W || y >= H || g.map[y][x] === 0; }
function pushOut(g: Game, p: { x: number; y: number }, r: number): void {
  for (let it = 0; it < 4; it++) {
    let hit = false;
    for (let ty = Math.floor(p.y - r); ty <= Math.floor(p.y + r); ty++) for (let tx = Math.floor(p.x - r); tx <= Math.floor(p.x + r); tx++) {
      if (!solidT(g, tx, ty)) continue;
      const cx = clampN(p.x, tx, tx + 1), cy = clampN(p.y, ty, ty + 1);
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (d >= r) continue;
      hit = true;
      if (d > 1e-6) { p.x += dx / d * (r - d); p.y += dy / d * (r - d); }
      else {
        const l = p.x - tx, rr = tx + 1 - p.x, u = p.y - ty, dn = ty + 1 - p.y, mn = Math.min(l, rr, u, dn);
        if (mn === l) p.x = tx - r; else if (mn === rr) p.x = tx + 1 + r; else if (mn === u) p.y = ty - r; else p.y = ty + 1 + r;
      }
    }
    if (!hit) break;
  }
}
function slideMove(g: Game, p: { x: number; y: number }, vx: number, vy: number, dt: number, r: number): void {
  const n = Math.max(1, Math.ceil(Math.hypot(vx, vy) * dt / 0.08));
  for (let i = 0; i < n; i++) { p.x += vx * dt / n; p.y += vy * dt / n; pushOut(g, p, r); }
}
// nudge the player into a corridor/doorway lane when pushing into a wall almost aligned with an opening
function laneAssist(g: Game, p: { x: number; y: number }, mx: number, my: number, step: number): void {
  const hor = Math.abs(mx) > Math.abs(my) * 1.8, ver = Math.abs(my) > Math.abs(mx) * 1.8;
  if (!hor && !ver) return;
  const s = Math.sign(hor ? mx : my), along = hor ? p.x : p.y, across = hor ? p.y : p.x;
  const ahead = Math.floor(along + s * (PR + 0.1)), here = Math.floor(along);
  let best = -1, bd = 9;
  for (const c of [Math.floor(across) - 1, Math.floor(across), Math.floor(across) + 1]) {
    const open = hor ? !solidT(g, ahead, c) && !solidT(g, here, c) : !solidT(g, c, ahead) && !solidT(g, c, here);
    if (!open) continue;
    const d = Math.abs(c + 0.5 - across);
    if (d < bd && d < 0.95) { bd = d; best = c; }
  }
  if (best < 0 || bd < 0.01) return;
  const mv = Math.min(bd, step) * Math.sign(best + 0.5 - across);
  if (hor) p.y += mv; else p.x += mv;
  pushOut(g, p, PR);
}
function los(g: Game, ax: number, ay: number, bx: number, by: number): boolean {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 0.25);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidT(g, Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t))) return false; }
  return true;
}
let FLOW: { map: number[][]; x: number; y: number; d: Int16Array } | null = null;
function flowField(g: Game): Int16Array {
  if (FLOW && FLOW.map === g.map && FLOW.x === g.px && FLOW.y === g.py) return FLOW.d;
  const d = new Int16Array(W * H).fill(-1);
  const q: number[] = [g.py * W + g.px]; d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i - x) / W;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
      const nx = x + ox, ny = y + oy;
      if (solidT(g, nx, ny) || d[ny * W + nx] >= 0) continue;
      d[ny * W + nx] = d[i] + 1; q.push(ny * W + nx);
    }
  }
  FLOW = { map: g.map, x: g.px, y: g.py, d };
  return d;
}
function nearMerchant(g: Game, rad = 0.8): boolean {
  const x = g.wx ?? g.px + 0.5, y = g.wy ?? g.py + 0.5;
  for (let ty = g.py - 1; ty <= g.py + 1; ty++) for (let tx = g.px - 1; tx <= g.px + 1; tx++) {
    if (tx >= 0 && ty >= 0 && tx < W && ty < H && g.map[ty][tx] === 4 && Math.hypot(x - tx - 0.5, y - ty - 0.5) < rad) return true;
  }
  return false;
}
function touchTiles(g: Game, p: { x: number; y: number }, I: Inp): boolean {
  let nearShop = false;
  for (let ty = g.py - 1; ty <= g.py + 1; ty++) for (let tx = g.px - 1; tx <= g.px + 1; tx++) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
    const tile = g.map[ty][tx]; if (tile < 2) continue;
    const d = Math.hypot(p.x - tx - 0.5, p.y - ty - 0.5);
    if (tile === 4) {
      if (d < 0.8) nearShop = true;
      if (d < 0.5 && !I.shopL) { I.shopL = true; g.screen = "shop"; g.sel = -1; log(g, "💰 The merchant steps aside and grins: \"Take a look!\""); return true; }
      continue;
    }
    if (tile === 3 && d < 0.65) {
      g.map[ty][tx] = 1;
      const gold = goldGain(g, (10 + tierOf(g.floor) * 8) * (0.7 + Math.random() * 0.6));
      const inv = makeInst(rollItem(g.floor, g.floor >= 5 ? 1 : 0, g.cls, "any"), g.floor, true); addItem(g, inv);
      gain(g, `+${gold} gold`, GOLDC); gain(g, `+ ${instName(inv)}`, rarCol(inv));
    }
    if (tile === 5 && d < 0.55) {
      g.map[ty][tx] = 1; I.slowT = 2;
      for (const mm of g.mons) if (Math.hypot(mm.x - tx, mm.y - ty) <= 6) mm.awake = true;
      log(g, "🕸️ You tear through sticky webbing — entangled and slowed! The warren's dwellers close in.", "bad"); addFx(g, "WEBBED", "bad", "p");
    }
    if (tile === 6 && d < 0.55) {
      g.map[ty][tx] = 1;
      const dm = Math.max(1, Math.round(full(g).maxHp * 0.08));
      g.hp = Math.max(1, g.hp - dm); g.hurtTs = Date.now();
      for (const mm of g.mons) if (Math.abs(mm.x - tx) + Math.abs(mm.y - ty) <= 7) mm.awake = true;
      log(g, `🔮 A grave rune flares: -${dm} HP, and the dead stir nearby!`, "bad"); addFx(g, `-${dm}`, "bad", "p");
    }
    if (tile === 2 && d < 0.42) { descend(g); return true; }
  }
  if (!nearShop) I.shopL = false;
  return false;
}
function mapMonsters(g: Game, dt: number, p: { x: number; y: number }): boolean {
  let ch = false, fld: Int16Array | null = null;
  for (const m of g.mons) {
    if (m.fx === undefined || m.fy === undefined || Math.floor(m.fx) !== m.x || Math.floor(m.fy) !== m.y) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; }
    if (m.stun > 0) { m.stun = Math.max(0, m.stun - dt * 2); continue; }
    const d = Math.hypot(p.x - m.fx, p.y - m.fy);
    if (d < PR + MR + 0.05) { startCombat(g, m); return true; }
    if (m.boss) continue;
    if (!m.awake) { if (d <= 4) m.awake = true; else continue; }
    if (d > 14) continue;
    let tx = p.x, ty = p.y;
    if (!los(g, m.fx, m.fy, p.x, p.y)) {
      fld = fld ?? flowField(g);
      let bv = fld[m.y * W + m.x];
      if (bv < 0) continue;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
        const nx = m.x + ox, ny = m.y + oy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const v = fld[ny * W + nx];
        if (v >= 0 && v < bv) { bv = v; tx = nx + 0.5; ty = ny + 0.5; }
      }
    }
    const ex = tx - m.fx, ey = ty - m.fy, el = Math.hypot(ex, ey) || 1, sp = mSpd(m);
    const q = { x: m.fx, y: m.fy };
    slideMove(g, q, ex / el * sp, ey / el * sp, dt, MR);
    for (const o of g.mons) {
      if (o === m || o.fx === undefined || o.fy === undefined) continue;
      const sx = q.x - o.fx, sy = q.y - o.fy, sd = Math.hypot(sx, sy);
      if (sd > 1e-4 && sd < MR * 2) { q.x += sx / sd * (MR * 2 - sd) * 0.5; q.y += sy / sd * (MR * 2 - sd) * 0.5; }
    }
    pushOut(g, q, MR);
    m.fx = q.x; m.fy = q.y; m.x = Math.floor(q.x); m.y = Math.floor(q.y); ch = true;
  }
  return ch;
}
// constant-speed steering: speed eases toward the target quickly while the heading rotates toward the input,
// so turns and reversals stay at full speed instead of passing through zero
function steerVel(I: Inp, tx: number, ty: number, dt: number): void {
  const ACC = 40, ROT = 16;
  const cs = Math.hypot(I.vx, I.vy), ts = Math.hypot(tx, ty);
  if (ts < 1e-3) { const ns = Math.max(0, cs - ACC * dt); if (cs > 0) { I.vx *= ns / cs; I.vy *= ns / cs; } return; }
  const ns = cs < ts ? Math.min(ts, cs + ACC * dt) : Math.max(ts, cs - ACC * dt);
  if (cs < 0.3) { I.vx = (tx / ts) * ns; I.vy = (ty / ts) * ns; return; }
  const ca = Math.atan2(I.vy, I.vx), ta = Math.atan2(ty, tx);
  let da = ta - ca; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const st = ROT * dt, na = Math.abs(da) <= st ? ta : ca + Math.sign(da) * st;
  I.vx = Math.cos(na) * ns; I.vy = Math.sin(na) * ns;
}
// ---------- tile art: pre-rendered once per floor into an offscreen canvas ----------
const TS = 32, VT = 11;
function hrand(x: number, y: number, s: number): number {
  let h = (Math.imul(x + 101, 374761393) + Math.imul(y + 211, 668265263) + Math.imul(s + 7, 362437)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function rgbS(r: number, g: number, b: number, a = 1): string { return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`; }
interface Art { cv: HTMLCanvasElement; map: number[][]; baked: Int8Array; lights: [number, number, number][]; bio: Biome; }
let ART: Art | null = null;
function webCorner(c: CanvasRenderingContext2D, cx: number, cy: number, sx: number, sy: number, len: number, a: number): void {
  c.strokeStyle = `rgba(232,232,240,${a})`; c.lineWidth = 0.8; c.beginPath();
  for (let k = 0; k <= 4; k++) { const an = (k / 4) * Math.PI / 2; c.moveTo(cx, cy); c.lineTo(cx + sx * Math.cos(an) * len, cy + sy * Math.sin(an) * len); }
  for (let ring = 1; ring <= 3; ring++) {
    const rr = (ring / 3.4) * len;
    for (let k = 0; k <= 4; k++) { const an = (k / 4) * Math.PI / 2; const px = cx + sx * Math.cos(an) * rr, py = cy + sy * Math.sin(an) * rr; if (k === 0) c.moveTo(px, py); else c.lineTo(px, py); }
  }
  c.stroke();
}
function bones(c: CanvasRenderingContext2D, X: number, Y: number, r: (s: number) => number): void {
  c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const x = X + 6 + r(70 + i) * 20, y = Y + 6 + r(80 + i) * 20, an = r(90 + i) * Math.PI, l = 4 + r(95 + i) * 6;
    c.strokeStyle = "rgba(225,215,190,.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); c.stroke();
    c.fillStyle = "rgba(235,225,200,.9)"; c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.arc(x + Math.cos(an) * l, y + Math.sin(an) * l, 1.3, 0, 7); c.fill();
  }
}
function skull(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  c.fillStyle = "#d8cfb8"; c.beginPath(); c.arc(x, y, s, Math.PI, 0); c.lineTo(x + s * 0.7, y + s * 0.9); c.lineTo(x - s * 0.7, y + s * 0.9); c.closePath(); c.fill();
  c.fillStyle = "#1a1418"; c.beginPath(); c.arc(x - s * 0.4, y + s * 0.05, s * 0.28, 0, 7); c.arc(x + s * 0.4, y + s * 0.05, s * 0.28, 0, 7); c.fill();
  c.fillRect(x - s * 0.08, y + s * 0.35, s * 0.16, s * 0.25);
}
function candle(c: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  c.fillStyle = "#e9dfc4"; c.fillRect(x - 1.6, y - h, 3.2, h);
  c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + 0.6, y - h, 1, h);
  const gl = c.createRadialGradient(x, y - h - 2, 0, x, y - h - 2, 7); gl.addColorStop(0, "rgba(255,200,110,.75)"); gl.addColorStop(1, "rgba(255,160,60,0)");
  c.fillStyle = gl; c.fillRect(x - 8, y - h - 10, 16, 16);
  c.fillStyle = "#ffd77a"; c.beginPath(); c.ellipse(x, y - h - 2.2, 1.4, 2.6, 0, 0, 7); c.fill();
}
function bakeTile(c: CanvasRenderingContext2D, g: Game, x: number, y: number, bio: Biome, lights: [number, number, number][] | null): void {
  const X = x * TS, Y = y * TS, v = g.map[y][x];
  const r = (s: number): number => hrand(x, y, s + g.floor * 977);
  const war = bio === "warren";
  const sol = (ox: number, oy: number): boolean => solidT(g, x + ox, y + oy);
  c.save(); c.beginPath(); c.rect(X, Y, TS, TS); c.clip();
  if (v === 0) {
    const anyOpen = !sol(0, 1) || !sol(0, -1) || !sol(1, 0) || !sol(-1, 0) || !sol(1, 1) || !sol(-1, 1) || !sol(1, -1) || !sol(-1, -1);
    const j = (r(1) - 0.5) * 10;
    const tb = war ? [30, 36, 25] : [30, 24, 40];
    c.fillStyle = rgbS(tb[0] + j, tb[1] + j, tb[2] + j); c.fillRect(X, Y, TS, TS);
    if (!anyOpen) { c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(X, Y, TS, TS); c.restore(); return; }
    for (let i = 0; i < 7; i++) { c.fillStyle = `rgba(0,0,0,${0.12 + r(10 + i) * 0.2})`; c.fillRect(X + r(20 + i) * TS, Y + r(30 + i) * TS, 2 + r(40 + i) * 4, 1 + r(50 + i) * 2); }
    for (let i = 0; i < 3; i++) { c.fillStyle = war ? "rgba(150,180,110,.12)" : "rgba(170,140,220,.12)"; c.fillRect(X + r(60 + i) * TS, Y + r(65 + i) * TS, 3, 1); }
    const rim = war ? "rgba(170,205,120,.4)" : "rgba(195,160,255,.4)";
    c.fillStyle = rim;
    if (!sol(0, -1)) c.fillRect(X, Y, TS, 2);
    if (!sol(-1, 0)) c.fillRect(X, Y, 2, TS);
    if (!sol(1, 0)) c.fillRect(X + TS - 2, Y, 2, TS);
    if (!sol(0, 1)) {
      const fy = Y + Math.round(TS * 0.38), fh = Y + TS - fy;
      const gr = c.createLinearGradient(0, fy, 0, Y + TS);
      gr.addColorStop(0, war ? "#4d573a" : "#4b3e60"); gr.addColorStop(1, war ? "#20251a" : "#1f1828");
      c.fillStyle = gr; c.fillRect(X, fy, TS, fh);
      c.fillStyle = war ? "rgba(205,235,150,.5)" : "rgba(215,185,255,.5)"; c.fillRect(X, fy, TS, 1.5);
      if (war) {
        for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(0,0,0,${0.18 + r(100 + i) * 0.2})`; c.beginPath(); c.ellipse(X + r(110 + i) * TS, fy + 3 + r(120 + i) * (fh - 5), 3 + r(130 + i) * 5, 2 + r(140 + i) * 3, 0, 0, 7); c.fill(); }
        c.strokeStyle = "rgba(90,70,40,.7)"; c.lineWidth = 1; c.beginPath();
        const rx = X + r(150) * TS; c.moveTo(rx, fy); c.quadraticCurveTo(rx + 4, fy + fh * 0.5, rx - 2, Y + TS - 2); c.stroke();
      } else {
        const rows = 3, bh = fh / rows;
        for (let ri = 0; ri < rows; ri++) {
          const off = (ri % 2) * 8 + r(160 + ri) * 4;
          for (let bx = -16 + off; bx < TS; bx += 16) {
            const sh = (r(170 + ri * 5 + Math.round(bx)) - 0.5) * 16;
            c.fillStyle = rgbS(64 + sh, 52 + sh, 80 + sh); c.fillRect(X + bx + 1, fy + 2 + ri * bh, 14, bh - 1.5);
            c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(X + bx + 1, fy + 2 + ri * bh, 14, 1);
          }
        }
        if (r(180) < 0.35) { c.strokeStyle = "rgba(10,6,14,.8)"; c.lineWidth = 1; c.beginPath(); let cx = X + r(181) * TS, cy = fy + 2; c.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (r(182 + k) - 0.5) * 9; cy += fh / 4; c.lineTo(cx, cy); } c.stroke(); }
      }
      const d = r(7);
      if (!war && d < 0.13) {
        c.fillStyle = "#0c0810"; c.beginPath(); c.moveTo(X + 9, Y + TS - 3); c.lineTo(X + 9, fy + 9); c.arc(X + 16, fy + 9, 7, Math.PI, 0); c.lineTo(X + 23, Y + TS - 3); c.closePath(); c.fill();
        skull(c, X + 16, fy + 12, 3.6);
      } else if (!war && d < 0.26) {
        c.fillStyle = "#0c0810"; c.beginPath(); c.moveTo(X + 10, Y + TS - 3); c.lineTo(X + 10, fy + 9); c.arc(X + 16, fy + 9, 6, Math.PI, 0); c.lineTo(X + 22, Y + TS - 3); c.closePath(); c.fill();
        candle(c, X + 16, Y + TS - 4, 6); if (lights) lights.push([x + 0.5, y + 0.6, 1]);
      } else if (war && d < 0.12) {
        for (let i = 0; i < 3; i++) { const fx = X + 8 + r(190 + i) * 16, fyy = fy + 4 + r(195 + i) * (fh - 8); const gl = c.createRadialGradient(fx, fyy, 0, fx, fyy, 6); gl.addColorStop(0, "rgba(170,255,110,.8)"); gl.addColorStop(1, "rgba(120,255,80,0)"); c.fillStyle = gl; c.fillRect(fx - 6, fyy - 6, 12, 12); c.fillStyle = "#c8ff8a"; c.beginPath(); c.arc(fx, fyy, 1.6, 0, 7); c.fill(); }
        if (lights) lights.push([x + 0.5, y + 0.7, 2]);
      } else if (war && d < 0.3) {
        c.strokeStyle = "rgba(230,230,240,.45)"; c.lineWidth = 0.7; c.beginPath();
        for (let i = 0; i < 4; i++) { const sx = X + 4 + r(200 + i) * 24; c.moveTo(sx, fy); c.lineTo(sx + (r(205 + i) - 0.5) * 6, fy + 6 + r(210 + i) * (fh - 6)); }
        c.stroke();
      }
    }
    c.restore(); return;
  }
  // ----- floor -----
  if (war) {
    c.fillStyle = "#151a10"; c.fillRect(X, Y, TS, TS);
    const j = (r(1) - 0.5) * 10;
    const n = 3 + Math.floor(r(2) * 3);
    for (let i = 0; i < n; i++) {
      const cx = X + 4 + r(300 + i) * 24, cy = Y + 4 + r(310 + i) * 24, rx = 6 + r(320 + i) * 7, ry = 5 + r(330 + i) * 6, sh = (r(340 + i) - 0.5) * 14 + j;
      c.fillStyle = rgbS(44 + sh, 50 + sh, 34 + sh); c.beginPath(); c.ellipse(cx, cy, rx, ry, r(350 + i) * 3, 0, 7); c.fill();
      c.fillStyle = "rgba(255,255,230,.05)"; c.beginPath(); c.ellipse(cx - 1, cy - 1.5, rx * 0.7, ry * 0.5, r(350 + i) * 3, 0, 7); c.fill();
    }
    if (r(3) < 0.35) { c.strokeStyle = "rgba(5,8,3,.75)"; c.lineWidth = 1; c.beginPath(); let cx = X + r(360) * TS, cy = Y + r(361) * TS; c.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (r(362 + k) - 0.5) * 14; cy += (r(366 + k) - 0.5) * 14; c.lineTo(cx, cy); } c.stroke(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = r(370 + i) < 0.5 ? "rgba(110,150,60,.35)" : "rgba(0,0,0,.3)"; c.fillRect(X + r(380 + i) * TS, Y + r(390 + i) * TS, 1.5, 1.5); }
    const d = r(4);
    if (d < 0.06) {
      const ex = X + 8 + r(400) * 14, ey = Y + 8 + r(401) * 14;
      for (let i = 0; i < 4; i++) { const ox = ex + (r(402 + i) - 0.5) * 10, oy = ey + (r(406 + i) - 0.5) * 9; c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(ox + 1, oy + 1.5, 3.2, 4, 0, 0, 7); c.fill(); c.fillStyle = "#d9d4bb"; c.beginPath(); c.ellipse(ox, oy, 3, 3.8, 0, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(ox - 1, oy - 1.5, 0.9, 0, 7); c.fill(); }
      c.strokeStyle = "rgba(230,230,240,.35)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(ex - 8, ey - 6); c.lineTo(ex + 8, ey + 5); c.moveTo(ex + 7, ey - 7); c.lineTo(ex - 6, ey + 6); c.stroke();
    } else if (d < 0.12) bones(c, X, Y, r);
    else if (d < 0.16) { const gl = c.createRadialGradient(X + 16, Y + 16, 0, X + 16, Y + 16, 11); gl.addColorStop(0, "rgba(120,170,40,.45)"); gl.addColorStop(1, "rgba(120,170,40,0)"); c.fillStyle = gl; c.fillRect(X, Y, TS, TS); }
    const corners: [number, number, number, number, number, number][] = [[-1, 0, 0, -1, 0, 0], [1, 0, 0, -1, 1, 0], [-1, 0, 0, 1, 0, 1], [1, 0, 0, 1, 1, 1]];
    corners.forEach((k: [number, number, number, number, number, number], i: number) => {
      if (sol(k[0], k[1]) && sol(k[2], k[3]) && r(420 + i) < 0.7) webCorner(c, X + k[4] * TS, Y + k[5] * TS, k[4] ? -1 : 1, k[5] ? -1 : 1, 12 + r(430 + i) * 8, 0.45);
    });
  } else {
    c.fillStyle = "#120e17"; c.fillRect(X, Y, TS, TS);
    const j = (r(1) - 0.5) * 8;
    const pat = Math.floor(r(2) * 4);
    const sp = 0.4 + r(5) * 0.2;
    const slabs: [number, number, number, number][] = pat === 0 ? [[0, 0, 1, 1]] : pat === 1 ? [[0, 0, 1, sp], [0, sp, 1, 1 - sp]] : pat === 2 ? [[0, 0, sp, 1], [sp, 0, 1 - sp, 1]] : [[0, 0, sp, 0.5], [sp, 0, 1 - sp, 0.5], [0, 0.5, 1 - sp, 0.5], [1 - sp, 0.5, sp, 0.5]];
    slabs.forEach((s: [number, number, number, number], i: number) => {
      const sx = X + s[0] * TS + 1, sy = Y + s[1] * TS + 1, sw = s[2] * TS - 2, sh = s[3] * TS - 2, d = (r(500 + i) - 0.5) * 14 + j;
      c.fillStyle = rgbS(50 + d, 43 + d, 60 + d); c.fillRect(sx, sy, sw, sh);
      c.fillStyle = "rgba(255,240,255,.07)"; c.fillRect(sx, sy, sw, 1); c.fillRect(sx, sy, 1, sh);
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(sx, sy + sh - 1, sw, 1); c.fillRect(sx + sw - 1, sy, 1, sh);
      if (r(510 + i) < 0.3) { c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(sx + r(520 + i) * sw, sy + r(530 + i) * sh, 3 + r(540 + i) * 4, 2 + r(545 + i) * 3, 0, 0, 7); c.fill(); }
    });
    if (r(3) < 0.3) { c.strokeStyle = "rgba(8,5,12,.85)"; c.lineWidth = 1; c.beginPath(); let cx = X + r(560) * TS, cy = Y + r(561) * TS; c.moveTo(cx, cy); for (let k = 0; k < 3; k++) { cx += (r(562 + k) - 0.5) * 16; cy += (r(566 + k) - 0.5) * 16; c.lineTo(cx, cy); } c.stroke(); }
    for (let i = 0; i < 5; i++) { c.fillStyle = "rgba(200,190,220,.08)"; c.fillRect(X + r(570 + i) * TS, Y + r(580 + i) * TS, 1, 1); }
    const d = r(4);
    const nearWall = sol(0, -1) || sol(-1, 0) || sol(1, 0);
    if (d < 0.05) {
      c.save(); c.translate(X + 16, Y + 16); c.rotate(r(600) * 6.28);
      c.strokeStyle = "rgba(150,90,220,.35)"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.moveTo(0, -9); c.lineTo(7.8, 4.5); c.lineTo(-7.8, 4.5); c.closePath(); c.stroke(); c.restore();
    } else if (d < 0.1) bones(c, X, Y, r);
    else if (d < 0.13) skull(c, X + 10 + r(610) * 12, Y + 12 + r(611) * 10, 3.5);
    else if (nearWall && d < 0.24) {
      const cx = X + 8 + r(620) * 16, cy = Y + 14 + r(621) * 12;
      candle(c, cx, cy, 5 + r(622) * 4); if (r(623) < 0.6) candle(c, cx + 5, cy + 2, 3 + r(624) * 3);
      if (lights) lights.push([cx / TS, cy / TS - 0.2, 1]);
    }
  }
  // ambient occlusion from neighbouring walls
  const ao = (x0: number, y0: number, x1: number, y1: number, w: number, h: number, a: number): void => { const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h); };
  if (sol(0, -1)) ao(X, Y, X, Y + 11, TS, 11, 0.55);
  if (sol(-1, 0)) ao(X, Y, X + 7, Y, 7, TS, 0.4);
  if (sol(1, 0)) ao(X + TS, Y, X + TS - 7, Y, 7, TS, 0.4);
  if (sol(0, 1)) ao(X, Y + TS, X, Y + TS - 4, TS, 4, 0.3);
  // hazards
  if (v === 5) {
    const cx = X + 16, cy = Y + 16;
    c.strokeStyle = "rgba(238,238,248,.8)"; c.lineWidth = 1; c.beginPath();
    for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + r(700) * 0.4; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * 17, cy + Math.sin(an) * 17); }
    for (let ring = 1; ring <= 4; ring++) { const rr = ring * 3.6; for (let k = 0; k <= 8; k++) { const an = k * Math.PI / 4 + r(700) * 0.4; const px = cx + Math.cos(an) * rr, py = cy + Math.sin(an) * rr; if (k === 0) c.moveTo(px, py); else c.lineTo(px, py); } }
    c.stroke();
    c.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(X + 6 + r(710 + i) * 20, Y + 6 + r(715 + i) * 20, 0.9, 0, 7); c.fill(); }
  } else if (v === 6) {
    const cx = X + 16, cy = Y + 16;
    const gl = c.createRadialGradient(cx, cy, 2, cx, cy, 15); gl.addColorStop(0, "rgba(190,90,255,.45)"); gl.addColorStop(1, "rgba(120,40,200,0)"); c.fillStyle = gl; c.fillRect(X, Y, TS, TS);
    c.save(); c.translate(cx, cy); c.rotate(r(720) * 6.28);
    c.strokeStyle = "#c27bff"; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.moveTo(0, -10); c.lineTo(8.7, 5); c.lineTo(-8.7, 5); c.closePath(); c.moveTo(0, -4); c.lineTo(0, 4); c.moveTo(-3, 0); c.lineTo(3, 0); c.stroke();
    c.restore();
  }
  c.restore();
}
function artFor(g: Game): Art | null {
  const bio: Biome = g.biome ?? biomeOf(g.floor);
  if (ART && ART.map === g.map && ART.bio === bio) return ART;
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas"); cv.width = W * TS; cv.height = H * TS;
  const c = cv.getContext("2d"); if (!c) return null;
  const lights: [number, number, number][] = [];
  const baked = new Int8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { bakeTile(c, g, x, y, bio, lights); baked[y * W + x] = g.map[y][x]; }
  ART = { cv, map: g.map, baked, lights, bio };
  return ART;
}
function litT(g: Game, x: number, y: number): boolean { const dx = x - g.px, dy = y - g.py; return dx * dx + dy * dy <= R * R + 1; }
let VIEW_K = "", VIEW_T = 0;
function drawView(cv: HTMLCanvasElement, g: Game, force: boolean): void {
  const art = artFor(g); if (!art) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // tile art is 32px per tile, so more canvas pixels than ~1.4x that add no detail, only fill cost; CSS scales it up
  const cw = Math.min(Math.round(cv.clientWidth * dpr), Math.round(VT * TS * 1.4)); if (!cw) return;
  if (cv.width !== cw || cv.height !== cw) { cv.width = cw; cv.height = cw; force = true; }
  // redraw when the camera moves; otherwise only ~12 times a second for candle flicker
  const key = `${(g.wx ?? 0).toFixed(3)},${(g.wy ?? 0).toFixed(3)},${g.floor},${g.px},${g.py}`, tn = performance.now();
  if (!force && key === VIEW_K && tn - VIEW_T < 80) return;
  VIEW_K = key; VIEW_T = tn;
  const c = cv.getContext("2d"); if (!c) return;
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  const s = cw / VT, x0 = px - VT / 2, y0 = py - VT / 2;
  const ac = art.cv.getContext("2d");
  for (let ty = Math.max(0, Math.floor(y0)); ty <= Math.min(H - 1, Math.floor(y0 + VT)); ty++) for (let tx = Math.max(0, Math.floor(x0)); tx <= Math.min(W - 1, Math.floor(x0 + VT)); tx++) {
    if (art.baked[ty * W + tx] !== g.map[ty][tx] && ac) { bakeTile(ac, g, tx, ty, art.bio, null); art.baked[ty * W + tx] = g.map[ty][tx]; }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#07060a"; c.fillRect(0, 0, cw, cw);
  const sx0 = Math.max(0, x0), sy0 = Math.max(0, y0), sx1 = Math.min(W, x0 + VT), sy1 = Math.min(H, y0 + VT);
  if (sx1 > sx0 && sy1 > sy0) c.drawImage(art.cv, sx0 * TS, sy0 * TS, (sx1 - sx0) * TS, (sy1 - sy0) * TS, (sx0 - x0) * s, (sy0 - y0) * s, (sx1 - sx0) * s, (sy1 - sy0) * s);
  for (let ty = Math.floor(y0); ty <= Math.floor(y0 + VT); ty++) for (let tx = Math.floor(x0); tx <= Math.floor(x0 + VT); tx++) {
    const inb = tx >= 0 && ty >= 0 && tx < W && ty < H;
    const dx = (tx - x0) * s, dy = (ty - y0) * s;
    if (!inb || !g.seen[ty][tx]) { c.fillStyle = "#07060a"; c.fillRect(Math.floor(dx), Math.floor(dy), Math.ceil(s) + 1, Math.ceil(s) + 1); }
    else if (!litT(g, tx, ty)) { c.fillStyle = "rgba(6,4,10,.62)"; c.fillRect(Math.floor(dx), Math.floor(dy), Math.ceil(s) + 1, Math.ceil(s) + 1); }
  }
  c.globalCompositeOperation = "lighter";
  const now = performance.now() / 1000;
  art.lights.forEach((L: [number, number, number], i: number) => {
    if (L[0] < x0 - 1 || L[0] > x0 + VT + 1 || L[1] < y0 - 1 || L[1] > y0 + VT + 1) return;
    const lx = Math.floor(L[0]), ly = Math.floor(L[1]);
    if (lx < 0 || ly < 0 || lx >= W || ly >= H || !g.seen[ly][lx]) return;
    const f = 0.75 + 0.25 * Math.sin(now * (7 + (i % 5)) + i * 1.7) * Math.sin(now * 3.1 + i);
    const gx = (L[0] - x0) * s, gy = (L[1] - y0) * s, rad = s * (L[2] === 2 ? 1.1 : 1.5);
    const lg = c.createRadialGradient(gx, gy, 0, gx, gy, rad); lg.addColorStop(0, L[2] === 2 ? `rgba(140,255,90,${0.22 * f})` : `rgba(255,180,90,${0.3 * f})`); lg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = lg; c.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
  });
  c.globalCompositeOperation = "source-over";
}
function drawMini(cv: HTMLCanvasElement, g: Game, big: boolean): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cw = Math.round(cv.clientWidth * dpr); if (!cw) return;
  if (cv.width !== cw || cv.height !== cw) { cv.width = cw; cv.height = cw; }
  const c = cv.getContext("2d"); if (!c) return;
  const bio: Biome = g.biome ?? biomeOf(g.floor), war = bio === "warren";
  // the corner minimap follows the hero with a 16-tile window; the full map shows the whole floor
  const span = big ? W : 16, px0 = g.wx ?? g.px + 0.5, py0 = g.wy ?? g.py + 0.5;
  const ox = big ? 0 : clampN(px0 - span / 2, 0, W - span), oy = big ? 0 : clampN(py0 - span / 2, 0, H - span);
  const s = cw / span;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cw, cw);
  c.fillStyle = "rgba(6,5,10,.82)"; c.fillRect(0, 0, cw, cw);
  c.translate(-ox * s, -oy * s);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!g.seen[y][x]) continue;
    const v = g.map[y][x];
    if (v === 0) { if (!solidT(g, x, y + 1) || !solidT(g, x, y - 1) || !solidT(g, x + 1, y) || !solidT(g, x - 1, y)) { c.fillStyle = war ? "#3b4630" : "#3d3150"; c.fillRect(x * s, y * s, s, s); } continue; }
    c.fillStyle = litT(g, x, y) ? (war ? "#8b9b6a" : "#9a86b8") : (war ? "#5d6b47" : "#64557c");
    c.fillRect(x * s, y * s, s + 0.3, s + 0.3);
  }
  const dot = (x: number, y: number, col: string, r0: number): void => { c.fillStyle = col; c.beginPath(); c.arc(x * s, y * s, Math.max(1.5 * dpr, r0 * s), 0, 7); c.fill(); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!g.seen[y][x]) continue;
    const v = g.map[y][x];
    if (v === 2) { c.fillStyle = "#6dffa0"; c.fillRect((x + 0.1) * s, (y + 0.1) * s, s * 0.8, s * 0.8); c.strokeStyle = "#0a2a14"; c.lineWidth = Math.max(1, s * 0.12); c.strokeRect((x + 0.1) * s, (y + 0.1) * s, s * 0.8, s * 0.8); }
    else if (v === 4) dot(x + 0.5, y + 0.5, "#ffcc4d", 0.48);
    else if (v === 3 && big) dot(x + 0.5, y + 0.5, "#c98a3a", 0.3);
  }
  for (const m of g.mons) {
    if (!g.seen[m.y]?.[m.x]) continue;
    if (!(m.boss || litT(g, m.x, m.y))) continue;
    dot(m.fx ?? m.x + 0.5, m.fy ?? m.y + 0.5, m.boss ? "#ff3355" : "#ff6b6b", m.boss ? 0.6 : 0.38);
  }
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  c.strokeStyle = "#000"; c.lineWidth = Math.max(1, dpr);
  dot(px, py, "#fff2c8", 0.55); c.beginPath(); c.arc(px * s, py * s, Math.max(1.5 * dpr, 0.55 * s), 0, 7); c.stroke();
  if (!big) { c.strokeStyle = "rgba(255,230,180,.35)"; c.lineWidth = 1; c.strokeRect((px - VT / 2) * s, (py - VT / 2) * s, VT * s, VT * s); }
}
function worldTf(g: Game): string { const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5; return `translate(${(-(px - VT / 2) / W) * 100}%, ${(-(py - VT / 2) / H) * 100}%)`; }
function rtMap(g: Game, dt: number, mx: number, my: number, I: Inp): boolean {
  if (g.screen !== "map") return false;
  let ch = false;
  if (g.wx === undefined || g.wy === undefined || Math.floor(g.wx) !== g.px || Math.floor(g.wy) !== g.py) { g.wx = g.px + 0.5; g.wy = g.py + 0.5; ch = true; }
  const p = { x: g.wx, y: g.wy };
  I.slowT = Math.max(0, I.slowT - dt);
  const sp = MAP_SPD * (I.slowT > 0 ? 0.45 : 1);
  const mag = Math.hypot(mx, my);
  let tvx = 0, tvy = 0;
  if (mag > 0.12) { const k = (Math.min(1, mag) / mag) * sp; tvx = mx * k; tvy = my * k; I.idleT = 0; }
  else { I.idleT += dt; if (I.idleT < 0.05) { tvx = I.vx; tvy = I.vy; } }
  steerVel(I, tvx, tvy, dt);
  const vm = Math.hypot(I.vx, I.vy);
  if (vm > 0.01) {
    const ox = p.x, oy = p.y;
    slideMove(g, p, I.vx, I.vy, dt, PR);
    const got = ((p.x - ox) * I.vx + (p.y - oy) * I.vy) / vm;
    if (mag > 0.12 && got < vm * dt * 0.6) laneAssist(g, p, I.vx, I.vy, vm * dt);
    ch = true;
  }
  g.wx = p.x; g.wy = p.y;
  const tx = Math.floor(p.x), ty = Math.floor(p.y);
  if (tx !== g.px || ty !== g.py) { g.px = tx; g.py = ty; g.turns++; reveal(g); }
  if (touchTiles(g, p, I)) return true;
  if (mapMonsters(g, dt, p)) ch = true;
  if (g.screen !== "map") return true;
  I.regT += dt;
  if (I.regT >= 1.5) { I.regT = 0; const f = full(g); if (g.hp < f.maxHp || g.mp < f.maxMp) { rest(g); ch = true; } }
  return ch;
}
function navLayer(): HTMLElement {
  const ds = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  return ds.length > 0 ? ds[ds.length - 1] : document.body;
}
function navMove(dx: number, dy: number, first: boolean): void {
  const layer = navLayer();
  const els = Array.from(layer.querySelectorAll<HTMLElement>("button:not([disabled]), textarea")).filter((el: HTMLElement) => el.getClientRects().length > 0);
  if (els.length === 0) return;
  const cur = document.activeElement as HTMLElement | null;
  let best: HTMLElement | null = null;
  if (first || !cur || !els.includes(cur)) best = els[0];
  else {
    const r = cur.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let bs = Infinity;
    for (const el of els) {
      if (el === cur) continue;
      const q = el.getBoundingClientRect(); const ex = q.left + q.width / 2, ey = q.top + q.height / 2;
      const main = dx !== 0 ? (ex - cx) * dx : (ey - cy) * dy;
      if (main <= 2) continue;
      const cross = dx !== 0 ? Math.abs(ey - cy) : Math.abs(ex - cx);
      const s = main + cross * 2.2;
      if (s < bs) { bs = s; best = el; }
    }
    if (!best && dy !== 0) { const i = els.indexOf(cur); best = els[(i + dy + els.length) % els.length]; }
  }
  if (best) { best.focus({ preventScroll: true }); try { best.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { void e; } }
}
function petPhase(g: Game): void {
  const c = g.combat; if (!c || g.cls !== "ranger") return;
  const f = full(g);
  const pets: [string, number][] = [["Your wolf", 0.45]];
  if (g.perks.includes("packleader")) pets.push(["Your hawk", 0.4]);
  for (const [name, m] of pets) {
    const t = tgt(c); if (!t) return;
    const mult = m * (g.buffs.frenzy > 0 ? 3 : 1) * (f.sp.includes("petx2") ? 2 : 1);
    const d = Math.max(1, Math.round(f.atk * mult * 60 / (60 + t.def)));
    t.hp -= d;
    log(g, `${name} hits ${t.name} for ${d}.`, "dmg");
    addFx(g, `-${d}`, "dmg", "e" + t.uid);
  }
}
function endRound(g: Game): void {
  const c = g.combat; if (!c) return;
  const b = g.buffs;
  for (const e of alive(c)) {
    let d = 0;
    if (e.burnT > 0) { d += e.burnD; e.burnT--; }
    if (e.poisT > 0) { d += e.poisD; e.poisT--; }
    if (d > 0) { e.hp -= d; log(g, `${e.name} takes ${d} from burn/poison.`, "dmg"); addFx(g, `-${d}`, "loot", "e" + e.uid); }
  }
  const f = full(g);
  if (b.dotT > 0) { g.hp -= b.dotD; b.dotT--; log(g, `You suffer ${b.dotD} damage over time.`, "bad"); lethal(g); if (g.hp <= 0) { die(g); return; } }
  if (f.curses.includes("c_bleed")) { const d = Math.max(1, Math.round(f.maxHp * 0.05)); g.hp -= d; log(g, `🩸 The Bloodthirster drinks ${d} of your HP.`, "bad"); lethal(g); if (g.hp <= 0) { die(g); return; } }
  let rg = 0;
  if (f.sp.includes("regen")) rg += 0.04;
  if (g.perks.includes("sanctuary")) rg += 0.06;
  if (rg > 0) healPlayer(g, Math.round(f.maxHp * rg), false);
  b.rage = Math.max(0, b.rage - 1); b.holy = Math.max(0, b.holy - 1); b.frenzy = Math.max(0, b.frenzy - 1); b.fury = Math.max(0, b.fury - 1); b.iron = Math.max(0, b.iron - 1); b.defend = false;
  if (!f.curses.includes("c_nomana")) g.mp = Math.min(f.maxMp, g.mp + 2 + Math.round(f.maxMp * (g.cls === "mage" ? 0.05 : 0.03)) + (f.sp.includes("mpRegen") ? 6 : 0));
  c.turn++;
}
function cdSec(g: Game, ab: Ab): number { return Math.max(1, abCd(g, ab) * 1.5 + 0.6); }

function abCost(g: Game, ab: Ab): number {
  const sp = full(g).sp;
  let m = 1;
  if (sp.includes("manaSave")) m *= 0.7;
  if (sp.includes("arcanist")) m *= 0.75;
  if (g.perks.includes("archmage")) m *= 0.5;
  return Math.round(ab.mp * m);
}
function abCd(g: Game, ab: Ab): number { return Math.max(0, ab.cd - (full(g).sp.includes("cdr") ? 1 : 0) - (g.perks.includes("archmage") ? 1 : 0)); }
function runAbility(g: Game, id: string, label: string): void {
  const c = g.combat; if (!c) return;
  const f = full(g); const b = g.buffs; const t = tgt(c);
  g.inAb = true;
  switch (id) {
    case "bash": if (t) { hitEnemy(g, t, 1.3, false, label); stunE(g, t, 1); } break;
    case "cleave": { const ww = g.perks.includes("whirlwind"); for (const e of nearP(c, ww ? 34 : 26)) { hitEnemy(g, e, ww ? 1.2 : 0.8, false, label); if (ww) stunE(g, e, 1); } break; }
    case "cry": b.rage = 4; healPlayer(g, Math.round(f.maxHp * 0.15), true); log(g, "📣 Battle Cry! +50% ATK for 3 turns.", "good"); break;
    case "fireball": {
      const ts = g.perks.includes("chain") ? alive(c) : t ? [t] : [];
      for (const e of ts) { hitEnemy(g, e, 2.2, false, label); if (e.hp > 0) { e.burnT = 3; e.burnD = Math.max(e.burnD, Math.round(f.atk * 0.3)); } }
      break;
    }
    case "nova": { const m = g.perks.includes("chain") ? 1.8 : 1.2; for (const e of g.perks.includes("chain") ? alive(c) : nearP(c, 34)) { hitEnemy(g, e, m, false, label); stunE(g, e, 2); } break; }
    case "arcane": { b.shield += Math.round(f.maxMp * 0.4 + g.lvl * 4); log(g, `🔮 Arcane Shield absorbs the next ${b.shield} damage.`, "good"); break; }
    case "backstab": if (t) hitEnemy(g, t, 2.2, c.turn === 0 || t.stun > 0, label); break;
    case "poison": if (t) { hitEnemy(g, t, 1.0, false, label); if (t.hp > 0) { t.poisT = 4; t.poisD = Math.max(t.poisD, Math.round(f.atk * 0.45)); log(g, `${t.name} is badly poisoned.`); } } break;
    case "evade": b.evade = 2; log(g, "💨 You melt into the shadows: next 2 attacks will miss.", "good"); break;
    case "heal": { const amt = Math.round(f.maxHp * 0.35 * (f.sp.includes("healBoost") ? 1.5 : 1)); b.dotT = 0; const h = healPlayer(g, amt, true); log(g, `✨ You heal for ${h}.`, "heal"); break; }
    case "smite": {
      const wr = g.perks.includes("wrath");
      const ts = wr ? alive(c) : t ? [t] : [];
      for (const e of ts) { hitEnemy(g, e, e.undead ? 2.5 : 1.8, false, label, true); if (wr && e.undead) stunE(g, e, 1); }
      break;
    }
    case "holy": b.holy = 3; log(g, "🔆 Holy Shield: damage halved for 3 turns.", "good"); break;
    case "multi": {
      if (g.perks.includes("volley")) { for (const e of alive(c)) { hitEnemy(g, e, 0.7, false, label); hitEnemy(g, e, 0.7, false, label); } }
      else for (let k = 0; k < 4; k++) { const a = alive(c); if (a.length === 0) break; hitEnemy(g, pick(a), 0.7, false, label); }
      break;
    }
    case "trap": if (t) { stunE(g, t, 2); t.poisT = Math.max(t.poisT, 3); t.poisD = Math.max(t.poisD, Math.round(f.atk * 0.35)); log(g, `${t.name} is snared and bleeding.`); } break;
    case "frenzy": b.frenzy = 4; if (t) hitEnemy(g, t, 1.5, false, label); log(g, "📯 Call of the Wild! Pets deal triple damage.", "good"); break;
  }
  g.inAb = false;
}
function useAbility(g: Game, id: string): ActRes {
  const c = g.combat; if (!c) return "none";
  const ab = CLS[g.cls].abs.find((a: Ab) => a.id === id); if (!ab) return "none";
  if ((g.cds[id] ?? 0) > 0) { log(g, `${ab.name} is on cooldown.`); return "none"; }
  const cost = abCost(g, ab);
  if (g.mp < cost) { log(g, `Not enough MP for ${ab.name}.`); return "none"; }
  g.mp -= cost; g.cds[id] = cdSec(g, ab);
  runAbility(g, id, `${ab.icon} ${ab.name}`);
  if (g.perks.includes("echo") && (id === "fireball" || id === "nova") && Math.random() < 0.3 && alive(c).length > 0) {
    log(g, "🔁 Arcane Echo! The spell repeats!", "good");
    runAbility(g, id, `${ab.icon} ${ab.name} (echo)`);
  }
  return "turn";
}
function escape(g: Game, monStun: boolean): void {
  const c = g.combat; if (!c) return;
  const m = g.mons.find((x: MapMon) => x.id === c.monId);
  if (m && monStun) m.stun = 6;
  if (!monStun) g.mons = g.mons.filter((x: MapMon) => x.id !== c.monId);
  g.combat = null; g.buffs = freshBuffs(); g.cds = {}; g.screen = "map";
}
function liftCurses(g: Game): number { let n = 0; for (const k of GEAR) { const it = g.eq[k]; if (it && locked(it)) { it.freed = true; n++; } } return n; }
function useConsumable(g: Game, inv: Inv): ActRes {
  const t = IT[inv.id]; const f = full(g); const c = g.combat;
  const inCombat = !!c && g.screen === "combat";
  const pw = t.pw ?? 0;
  switch (t.fx) {
    case "heal": { const h = healPlayer(g, Math.round(f.maxHp * pw / 100), inCombat); log(g, `${t.icon} ${t.name}: +${h} HP.`, "heal"); break; }
    case "mana": { const before = g.mp; g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * pw / 100)); log(g, `${t.icon} +${g.mp - before} MP.`, "heal"); break; }
    case "both": healPlayer(g, Math.round(f.maxHp * pw / 100), inCombat); g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * pw / 100)); log(g, `${t.icon} You feel rejuvenated.`, "heal"); break;
    case "cleanse": g.buffs.dotT = 0; healPlayer(g, Math.round(f.maxHp * pw / 100), inCombat); log(g, `${t.icon} Cleansed.`, "heal"); break;
    case "bomb": case "frost": {
      if (!c || !inCombat) { log(g, "Save that for combat."); return "none"; }
      const d = t.fx === "bomb" ? 15 + g.floor * 6 : 10 + g.floor * 4;
      for (const e of alive(c)) {
        e.hp -= d; addFx(g, `-${d}`, "loot", "e" + e.uid);
        if (t.fx === "bomb") { e.burnT = Math.max(e.burnT, 2); e.burnD = Math.max(e.burnD, 3 + g.floor * 2); } else stunE(g, e, 2);
      }
      log(g, `${t.icon} ${t.name} hits all enemies for ${d}!`, "dmg");
      break;
    }
    case "smoke": {
      if (!c || !inCombat) { log(g, "Save that for combat."); return "none"; }
      if (c.boss) { log(g, "The boss sees through the smoke!"); return "none"; }
      g.inv = g.inv.filter((i: Inv) => i.uid !== inv.uid);
      log(g, "💨 You vanish in a puff of smoke!", "good");
      escape(g, true);
      return "end";
    }
    case "fury": case "iron": {
      if (!inCombat) { log(g, "Read it during combat."); return "none"; }
      if (t.fx === "fury") g.buffs.fury = 4; else g.buffs.iron = 3;
      log(g, `${t.icon} ${t.name} empowers you!`, "good");
      break;
    }
    case "reveal": {
      if (inCombat) { log(g, "No time to read maps now!"); return "none"; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.map[y][x] !== 0 || (y > 0 && g.map[y - 1][x] !== 0) || (y < H - 1 && g.map[y + 1][x] !== 0)) g.seen[y][x] = true;
      log(g, "🗺️ The floor's layout is revealed.", "good");
      break;
    }
    case "tele": {
      if (inCombat) { log(g, "You can't concentrate in combat!"); return "none"; }
      const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
      let ok = false;
      for (const [dx, dy] of dirs) {
        const x = g.sx + dx, y = g.sy + dy;
        if (g.map[y][x] === 1 && !g.mons.some((m: MapMon) => m.x === x && m.y === y)) { g.px = x; g.py = y; g.wx = x + 0.5; g.wy = y + 0.5; ok = true; break; }
      }
      if (!ok) { log(g, "The scroll fizzles — try again later."); return "none"; }
      reveal(g); log(g, "🌀 You are whisked across the floor!", "good");
      break;
    }
    case "ident": {
      const un = g.inv.filter((i: Inv) => !i.ident);
      if (un.length === 0) { log(g, "Nothing in your bag needs identifying."); return "none"; }
      for (const u of un) identify(g, u);
      break;
    }
    case "uncurse": {
      const n = liftCurses(g);
      if (n === 0) { log(g, "You wear nothing cursed."); return "none"; }
      log(g, `🕯️ The curse breaks! ${n} item(s) can now be removed.`, "good");
      break;
    }
    case "eatk": addBonus(g, { atk: 3 }); log(g, "🍺 You feel mighty: +3 ATK permanently.", "good"); break;
    case "ehp": addBonus(g, { hp: 25 }); g.hp += 25; log(g, "🍯 +25 max HP permanently.", "good"); break;
    case "tome": gainXp(g, Math.max(1, need(g.lvl) - g.xp)); break;
    default: return "none";
  }
  g.inv = g.inv.filter((i: Inv) => i.uid !== inv.uid);
  return "turn";
}
function doAction(g: Game, kind: string, arg: string): ActRes {
  const c = g.combat; if (!c) return "none";
  const f = full(g);
  if (kind === "attack") {
    const t = tgt(c); if (!t) return "none";
    const mage = g.cls === "mage";
    hitEnemy(g, t, mage ? 0.6 : 1, false, mage ? "🪄 Staff" : "⚔️ Attack");
    if (mage) g.mp = Math.min(f.maxMp, g.mp + 2);
    if (f.sp.includes("doubleStrike") && t.hp > 0 && Math.random() < 0.2) hitEnemy(g, t, 1, false, "⚔️ Echo Blade");
    if (f.sp.includes("freezeHit") && t.hp > 0 && Math.random() < 0.25) stunE(g, t, 1);
    if (f.sp.includes("chainShock")) for (const e of alive(c)) if (e !== t) { const d = Math.max(1, Math.round(f.atk * 0.35 * 60 / (60 + e.def))); e.hp -= d; addFx(g, `-${d}`, "dmg", "e" + e.uid); log(g, `⚡ Lightning arcs to ${e.name} for ${d}.`, "dmg"); }
    return "turn";
  }
  if (kind === "defend") { g.buffs.defend = true; const m = Math.round(f.maxMp * 0.1); g.mp = Math.min(f.maxMp, g.mp + m); log(g, `🛡️ You brace yourself (+${m} MP).`); return "turn"; }
  if (kind === "flee") {
    if (c.boss) { log(g, "There is no escape from this foe!"); return "none"; }
    if (Math.random() < 0.55 + f.dodge / 200) { log(g, "🏃 You escape!", "good"); escape(g, true); return "end"; }
    log(g, "You fail to escape!", "bad"); return "turn";
  }
  if (kind === "vanish") {
    if (c.boss) { log(g, "The boss sees through your shadow."); return "none"; }
    if (g.usedShadow) { log(g, "Shadowmeld already used this floor."); return "none"; }
    g.usedShadow = true; log(g, "🌫️ Shadowmeld! You slip past unseen.", "good"); escape(g, false); return "end";
  }
  if (kind === "ability") return useAbility(g, arg);
  if (kind === "item") { const inv = g.inv.find((i: Inv) => i.uid === Number(arg)); if (!inv) return "none"; c.itemOpen = false; return useConsumable(g, inv); }
  return "none";
}
function combatAct(g: Game, kind: string, arg: string): void {
  if (g.screen !== "combat" || !g.combat) return;
  doAction(g, kind, arg);
  if (g.screen === "combat") checkWin(g);
}

function rest(g: Game): void {
  if (g.screen !== "map") return;
  const f = full(g);
  g.hp = Math.min(f.maxHp, g.hp + Math.max(1, Math.round(f.maxHp * 0.03)));
  if (!f.curses.includes("c_nomana")) g.mp = Math.min(f.maxMp, g.mp + Math.max(1, Math.round(f.maxMp * 0.05)));
}
function equip(g: Game, uid: number): void {
  const inv = g.inv.find((i: Inv) => i.uid === uid); if (!inv) return;
  const t = IT[inv.id]; if (t.slot === "consumable") return;
  const slot = t.slot as GearSlot; const old = g.eq[slot];
  if (old && locked(old)) { log(g, `☠️ Your cursed ${IT[old.id].name} won't come off!`, "bad"); return; }
  identify(g, inv);
  if (t.cls && !t.cls.includes(g.cls)) { log(g, `Only ${t.cls.map((c: ClassId) => CLS[c].name).join("/")} can use ${t.name}.`, "bad"); return; }
  g.inv = g.inv.filter((i: Inv) => i.uid !== uid);
  if (old) g.inv.push(old);
  g.eq[slot] = inv; clamp(g);
  log(g, `Equipped ${t.icon} ${instName(inv)}.`, "good");
  if (locked(inv)) log(g, `☠️ It's cursed! ${t.name} binds to you. ${t.desc ?? ""}`, "bad");
}
function unequip(g: Game, slot: GearSlot): void {
  const it = g.eq[slot]; if (!it) return;
  if (locked(it)) { log(g, "☠️ It's cursed and won't come off. Use a Remove Curse scroll or a merchant.", "bad"); return; }
  if (g.inv.length >= MAXINV) { log(g, "Your bag is full."); return; }
  delete g.eq[slot]; g.inv.push(it); clamp(g);
  log(g, `Unequipped ${instName(it)}.`);
}

const HELP: [string, string][] = [
  ["🕹️ Controls (touch)", "Touch and drag anywhere on the LEFT half of the screen to spawn a floating joystick; hold it to keep moving (analog, 8 directions). Action buttons sit on the right: ⚔️ Attack (hold to keep swinging), your 3 abilities with cooldown rings, 💨 Dodge roll, 🎒 Item and 🏃 Flee. Tap the minimap (top-right of the dungeon view) for the full map, which pauses the game. Item pickups float above your hero. Menus, the bag and shops are normal taps. Works in portrait and landscape. You regenerate slowly while exploring."],
  ["⌨️ Keyboard", "Move: WASD or arrow keys (hold to keep moving). Combat: Space or J = attack (hold), Enter = attack once, 1/2/3 = abilities, Shift or K = dodge roll, I = item menu, F = flee, Tab or Q/E = switch target. Map: movement is free and analog (you glide along walls), M = full map, I or B = bag, Enter/Space/E = trade when next to a merchant, C = codex, H = help. Menus: arrows/WASD move the yellow highlight, Enter/Space selects, Q/E switch class tabs, Esc goes back. Esc on the map or in combat opens the exit prompt (the game pauses)."],
  ["🎮 Gamepad", "Left stick or D-pad moves. Combat: A/✕ attack (hold), B/○ dodge roll, X/□ ability 1, Y/△ ability 2, RB/R1 ability 3, LB/L1 switch target, View/Select item menu. Map: A trade with a merchant, Y bag, X codex, View/Select full map, R3 (right-stick click) help. Menus: D-pad/stick moves the highlight, A selects, B goes back, LB/RB switch class tabs. Start/Options pauses (exit prompt)."],
  ["🗺️ Exploring", "Fog of war lifts as you walk. 📦 chests hold gold and loot, 💰 is a merchant, 🔽 stairs take you down. Bosses guard the stairs on every 5th floor."],
  ["⚔️ Combat", "Real-time. Enemies chase you and attack on their own timers. A red ring growing around a monster is its wind-up: step out (or dodge roll through it) before it fills. Casters throw bolts you can sidestep; bosses drop acid pools, shadow flame and the Echo Lord's CATACLYSM ring. Standing still gets you killed. Your attack auto-targets the nearest foe in range (tap an enemy to pick one): Warrior, Rogue and Cleric must get close, Mage and Ranger shoot from afar. Abilities cost MP and have cooldowns. Burn, poison, buffs and pets tick every 1.5 s. The game pauses whenever a menu, shop or prompt is open, or the app is in the background."],
  ["✨ Abilities", "Each class has 3 abilities that cost MP and have cooldowns. MP regenerates every turn. Warriors gain MP when hit; Mages restore MP with staff strikes; Ranger wolves attack on their own."],
  ["💎 Items & rarities", "Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (gold). Drops roll random bonus stats: green lines are good, red lines are penalties. Some gear is class-only, and 3 sets (Ironclad, Shadowstalker, Arcanist) grant set bonuses."],
  ["🔍 Identification", "Some drops arrive as 'Unidentified ??? ' with no stats shown. Rarer items are hidden more often; cursed and legendary items almost always are. Equip to reveal (risky!), pay a merchant a fee based on true rarity, or read a Scroll of Identify."],
  ["☠️ Curses", "Cursed items give big bonuses with a nasty downside, and lock on once equipped. Free them with a Scroll of Remove Curse or the merchant's curse-lifting service, then unequip."],
  ["💰 Merchant", "Buy potions, scrolls and gear, sell loot, identify items, and lift curses. Merchants appear on even floors."],
  ["📖 Story", "10 floors. The Broodmother mini-boss waits on Floor 5 and the Echo Lord on Floor 10. Beat him to win."],
  ["∞ Endless", "☠️ PERMADEATH: Endless autosaves constantly and your run save is deleted the moment you die (revives like Undying, Divine Resurrection or the Phoenix Amulet trigger first). Tokens, upgrades, best depth and codex are kept. Infinite scaling floors with a boss every 5 floors. After each boss pick an in-run upgrade (class capstones every 10th floor). Your best depth is saved."],
  ["💾 Saving", "Your run autosaves after every move, fight and floor change; tap Continue on the title screen to resume. Tokens, upgrades, best depth and the codex are saved separately and survive death. Use 💾 Save Code to copy a backup code or paste one in on another device."],
  ["🪙 Tokens", "Every 10 Endless floors cleared earns 1 token, saved between runs. Spend them in Endless Upgrades: each class has a 36-node tree whose top tier holds game-changing capstones. Upgrades apply in Endless only."],
];

// ---- dark-fantasy SVG sprites (viewBox 64x64, scale to any size) ----
const BONE = "#ddd2b2", BONED = "#a3967a", BLOOD = "#7d0a10", BLOODB = "#b3141c", STEEL = "#8b94a3", STEELD = "#4a505c", STEELL = "#c3cad6", BLK = "#0d0a10";
function eye(x: number, y: number, c: string, r?: number): ReactNode {
  const rr = r ?? 1.5;
  return <g><circle cx={x} cy={y} r={rr * 2.6} fill={c} opacity={0.28} /><circle cx={x} cy={y} r={rr} fill={c} /><circle cx={x} cy={y} r={rr * 0.4} fill="#fff" opacity={0.85} /></g>;
}
function blot(x: number, y: number, r: number, c?: string): ReactNode {
  return <g fill={c ?? BLOODB} opacity={0.9}><circle cx={x} cy={y} r={r} /><circle cx={x + r * 0.9} cy={y + r * 0.5} r={r * 0.55} /><circle cx={x - r * 0.7} cy={y + r * 0.7} r={r * 0.4} /><rect x={x - r * 0.18} y={y} width={r * 0.36} height={r * 2.2} rx={r * 0.18} /></g>;
}
function shd(rx: number): ReactNode { return <ellipse cx={32} cy={60} rx={rx} ry={3} fill="#000" opacity={0.4} />; }
function pud(cx: number, cy: number, rx: number, ry: number, c: string, op?: number): ReactNode {
  return <g fill={c} opacity={op ?? 0.9}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /><circle cx={cx + rx * 0.8} cy={cy - ry * 0.6} r={ry * 0.5} /><circle cx={cx - rx * 0.9} cy={cy + ry * 0.5} r={ry * 0.35} /><circle cx={cx + rx * 1.1} cy={cy + ry * 0.9} r={ry * 0.25} /></g>;
}
const SPR: Record<string, () => ReactNode> = {
  warrior: () => (<g>{shd(16)}
    <path d="M20 26 L14 56 L30 54 Z" fill="#4a0d12" /><path d="M44 26 L50 56 L34 54 Z" fill="#3a0a0e" />
    <rect x="24" y="44" width="7" height="14" fill={STEELD} /><rect x="33" y="44" width="7" height="14" fill={STEELD} />
    <rect x="23" y="55" width="9" height="4" rx="1" fill="#2a2e36" /><rect x="32" y="55" width="9" height="4" rx="1" fill="#2a2e36" />
    <path d="M21 26 Q32 22 43 26 L41 46 Q32 49 23 46 Z" fill={STEEL} /><path d="M32 24 L32 47" stroke={STEELD} strokeWidth="1.2" /><path d="M24 36 Q32 39 40 36" stroke={STEELD} fill="none" strokeWidth="1" />
    <ellipse cx="20" cy="27" rx="6" ry="4.5" fill={STEELL} stroke={STEELD} /><ellipse cx="44" cy="27" rx="6" ry="4.5" fill={STEELL} stroke={STEELD} />
    <path d="M30 7 Q34 -1 41 4 Q36 4 33 9 Z" fill="#6e0d14" />
    <path d="M24 12 Q32 4 40 12 L40 24 Q32 27 24 24 Z" fill={STEEL} stroke={STEELD} />
    <rect x="26" y="15" width="12" height="2.2" fill="#120c0c" /><rect x="31" y="15" width="2" height="8" fill="#120c0c" />
    {eye(28.5, 16, "#ff4a2a", 1)}{eye(35.5, 16, "#ff4a2a", 1)}
    <rect x="49" y="4" width="5" height="34" fill={STEELL} stroke={STEELD} strokeWidth="0.8" /><path d="M49 4 L51.5 0 L54 4 Z" fill={STEELL} />
    <path d="M49.5 18 L53.5 20 L53.5 30 L50 26 Z" fill={BLOODB} opacity={0.85} />{blot(51.5, 11, 1.8)}
    <rect x="44" y="37" width="15" height="3" rx="1" fill="#5a4630" /><rect x="50" y="40" width="3" height="9" fill="#3b2a1c" /><circle cx="51.5" cy="50" r="2" fill="#8a6b3a" />
    <circle cx="49" cy="44" r="3.5" fill={STEEL} stroke={STEELD} />
    {blot(27, 33, 1.8)}{blot(38, 42, 1.4)}</g>),
  mage: () => (<g>{shd(15)}
    <path d="M32 8 L46 30 L50 58 L14 58 L18 30 Z" fill="#4a2366" /><path d="M32 8 L40 24 L38 58 L26 58 L24 24 Z" fill="#1d1426" opacity={0.55} />
    <path d="M14 58 L18 52 L22 58 L26 53 L30 58 L34 52 L38 58 L42 53 L46 58 L50 52 L50 58 Z" fill={BLOOD} opacity={0.85} />
    <path d="M20 26 Q20 8 32 5 Q44 8 44 26 Q38 22 32 22 Q26 22 20 26 Z" fill="#3a1c52" /><ellipse cx="32" cy="20" rx="8" ry="7" fill={BLK} />
    {eye(29, 20, "#5ff3ff", 1.1)}{eye(35, 20, "#5ff3ff", 1.1)}<path d="M30 25 L34 25 L32 28 Z" fill={BONED} opacity={0.6} />
    <rect x="20" y="36" width="24" height="2.5" fill="#2a1a10" /><circle cx="32" cy="37.2" r="1.8" fill={BONE} />
    <rect x="11" y="10" width="2.6" height="50" fill="#3b2a1c" /><path d="M12.3 12 Q6 6 9 2 M12.3 12 Q19 6 16 2" fill="none" stroke={BONED} strokeWidth="1.2" />
    <circle cx="12.3" cy="7" r="7" fill="#7cf0ff" opacity={0.25} /><circle cx="12.3" cy="7" r="3.2" fill="#9ff8ff" /><circle cx="12.3" cy="7" r="1.4" fill="#fff" />
    <circle cx="14" cy="34" r="2.8" fill="#b9ac8e" />{blot(40, 46, 1.6)}{blot(24, 50, 1.1)}</g>),
  rogue: () => (<g>{shd(15)}
    <path d="M18 22 Q32 14 46 22 L50 56 L40 50 L32 58 L24 50 L14 56 Z" fill="#1f1a24" />
    <rect x="25" y="42" width="6" height="15" fill="#2c2530" /><rect x="33" y="42" width="6" height="15" fill="#2c2530" />
    <path d="M24 24 L40 24 L39 44 L25 44 Z" fill="#3a2d26" /><path d="M24 30 L40 38" stroke="#5a3c22" strokeWidth="2" />
    <path d="M22 22 Q22 6 32 4 Q42 6 42 22 L38 26 L26 26 Z" fill="#141018" /><path d="M26 14 Q32 11 38 14 L38 20 L26 20 Z" fill="#0a070c" />
    <rect x="26" y="19" width="12" height="5" fill="#3d0b10" />{eye(29, 16.5, "#ff2a2a", 1)}{eye(35, 16.5, "#ff2a2a", 1)}
    <circle cx="18" cy="38" r="2.6" fill="#4a3a30" /><path d="M17 36 L9 22 L11 21 L19 35 Z" fill={STEELL} stroke={STEELD} strokeWidth="0.5" />
    <rect x="15" y="35" width="6" height="1.6" transform="rotate(-30 18 36)" fill="#5a4630" />
    <circle cx="46" cy="38" r="2.6" fill="#4a3a30" /><path d="M47 36 L55 22 L53 21 L45 35 Z" fill={STEELL} stroke={STEELD} strokeWidth="0.5" />
    <rect x="43" y="35" width="6" height="1.6" transform="rotate(30 46 36)" fill="#5a4630" />
    <path d="M10 22 L14 29 L16 28 L11 21 Z" fill={BLOODB} /><path d="M54 22 L50 29 L48 28 L53 21 Z" fill={BLOODB} />
    {blot(10.5, 23, 1.3)}{blot(53.5, 23, 1.3)}{blot(30, 36, 1.4)}</g>),
  cleric: () => (<g>{shd(16)}
    <path d="M32 12 L46 28 L48 58 L16 58 L18 28 Z" fill="#cfc6ae" /><path d="M26 24 L38 24 L37 58 L27 58 Z" fill="#6e1016" />
    <path d="M16 58 L20 53 L24 58 L28 54 L32 58 L36 53 L40 58 L44 54 L48 58 Z" fill="#5a4a38" opacity={0.7} />
    <circle cx="32" cy="34" r="8" fill="#ffd36b" opacity={0.15} /><circle cx="32" cy="34" r="5" fill="none" stroke="#e8c45a" strokeWidth="1.3" /><path d="M32 28 L32 40 M27 33 L37 33" stroke="#e8c45a" strokeWidth="1.6" />
    <path d="M23 20 Q23 6 32 5 Q41 6 41 20 L38 24 L26 24 Z" fill="#8f8775" /><ellipse cx="32" cy="16" rx="6" ry="6.5" fill="#a68f74" />
    <path d="M26 14.5 L38 14.5" stroke="#3a2a20" strokeWidth="1" />{eye(29.5, 16.5, "#ffd36b", 0.9)}{eye(34.5, 16.5, "#ffd36b", 0.9)}
    <path d="M29 21 Q32 22.5 35 21" stroke="#5a3a2a" fill="none" strokeWidth="0.8" /><path d="M27 18 L28.5 22" stroke={BLOODB} strokeWidth="0.8" />
    <rect x="45" y="18" width="2.4" height="22" fill="#4a3826" /><circle cx="46" cy="38" r="2.8" fill="#a68f74" />
    <circle cx="46.2" cy="15" r="5" fill={STEEL} stroke={STEELD} /><path d="M46.2 8 L46.2 22 M39.2 15 L53.2 15 M41.2 10 L51.2 20 M51.2 10 L41.2 20" stroke={STEELD} strokeWidth="1.6" />
    {blot(48, 12, 1.8)}{blot(44, 17, 1.2)}{blot(22, 48, 1.4)}
    <rect x="14" y="36" width="7" height="9" rx="1" fill="#3a1a12" stroke="#e8c45a" strokeWidth="0.6" /></g>),
  ranger: () => (<g>{shd(15)}
    <path d="M20 22 Q32 16 44 22 L46 54 L32 50 L18 54 Z" fill="#26341f" />
    <rect x="25" y="42" width="6" height="15" fill="#3a2e22" /><rect x="33" y="42" width="6" height="15" fill="#3a2e22" />
    <path d="M24 24 L40 24 L39 44 L25 44 Z" fill="#4a3a28" />
    <rect x="40" y="10" width="5" height="18" rx="1" transform="rotate(20 42 19)" fill="#3a2414" /><path d="M42 9 L44 4 M44.5 10 L47.5 5 M39.5 9 L40.5 3.5" stroke="#8a1a1a" strokeWidth="1.3" />
    <path d="M22 22 Q22 6 32 4 Q42 6 42 22 L38 25 L26 25 Z" fill="#1d2a17" /><path d="M26 14 Q32 11 38 14 L37 23 L27 23 Z" fill="#0b0f08" />
    {eye(29.2, 17, "#ffb02a", 1)}{eye(34.8, 17, "#ffb02a", 1)}
    <path d="M14 6 Q2 32 14 58" fill="none" stroke="#5a3b1f" strokeWidth="2.6" strokeLinecap="round" /><path d="M14 6 L22 32 L14 58" fill="none" stroke="#d8d0bc" strokeWidth="0.6" />
    <path d="M23 32 L2 32" stroke="#8a6b3a" strokeWidth="1.1" /><path d="M1 32 L4.5 30.4 L4.5 33.6 Z" fill={STEELL} />
    <circle cx="8" cy="32" r="2.4" fill="#5a4630" /><circle cx="22.5" cy="32" r="2.4" fill="#5a4630" />{blot(3, 33, 1)}{blot(32, 30, 1.3)}</g>),
  wolf: () => (<g>{shd(20)}
    <path d="M14 30 Q20 22 34 24 Q46 22 52 28 Q58 26 62 20 Q60 30 54 34 L54 48 L50 48 L49 38 Q40 40 30 39 L28 48 L24 48 L23 38 Q18 36 14 30 Z" fill="#3b3a40" />
    <path d="M24 24 L26 19 L28 24 L30 18 L32 24 L34 19 L36 24 Z" fill="#2a292e" />
    <path d="M4 30 L10 25 L14 18 L16 24 L22 22 Q24 32 18 36 L8 35 Z" fill="#4a4950" /><path d="M14 18 L16 11 L18 22 Z" fill="#2a292e" />
    {eye(13, 27, "#ffd23a", 1)}<path d="M4 31 L9 33 L8 35 L4 33 Z" fill="#1a1a1e" /><path d="M5 31 L6 33 M7 31 L8 33.5" stroke="#eee" strokeWidth="0.7" />
    {blot(7, 35, 1.4)}<path d="M36 28 L42 34 M38 27 L44 33" stroke={BLOODB} strokeWidth="0.9" /></g>),
  hawk: () => (<g>
    <path d="M32 26 Q18 10 2 14 Q12 18 10 22 Q16 22 16 26 Q22 26 24 30 Z" fill="#3a2c22" /><path d="M32 26 Q46 10 62 14 Q52 18 54 22 Q48 22 48 26 Q42 26 40 30 Z" fill="#3a2c22" />
    <path d="M32 26 L6 15 M32 26 L58 15" stroke="#5a4632" strokeWidth="0.7" />
    <path d="M28 44 L32 54 L36 44 Z" fill="#2a1f18" /><ellipse cx="32" cy="34" rx="7" ry="11" fill="#4a3826" /><path d="M27 32 Q32 36 37 32 L36 40 Q32 42 28 40 Z" fill="#c9b994" opacity={0.6} />
    <circle cx="32" cy="22" r="6" fill="#4a3826" />{eye(29.5, 21, "#ff9a1a", 0.9)}{eye(34.5, 21, "#ff9a1a", 0.9)}<path d="M30.5 24 L33.5 24 L32 28 Z" fill="#d9b04a" />
    <path d="M29 44 L27 48 M31 45 L30 49 M33 45 L34 49 M35 44 L37 48" stroke="#d9b04a" strokeWidth="0.9" />{blot(32, 49, 1.2)}</g>),
  rat: () => (<g>{shd(20)}
    <path d="M54 40 Q64 32 56 24" fill="none" stroke="#8a6a6a" strokeWidth="1.6" />
    <path d="M16 40 Q20 24 38 24 Q54 24 56 40 Q54 50 36 50 Q22 50 16 40 Z" fill="#4a3f3a" /><path d="M22 30 L24 25 L27 30 L30 24 L33 29 L36 23 L39 29 Z" fill="#3a302c" />
    <ellipse cx="44" cy="38" rx="3.5" ry="2.4" fill="#6e1a1a" /><path d="M42 37 L46 39" stroke={BONE} strokeWidth="0.8" />
    <path d="M4 40 Q8 32 18 32 L22 42 Q14 46 4 40 Z" fill="#5a4c44" /><circle cx="16" cy="30" r="3.5" fill="#6a4a4a" />
    {eye(12, 37, "#ff2a2a", 1.1)}<path d="M4 40 L8 42 M5.5 41 L6 44" stroke="#e8dcc0" strokeWidth="0.9" />{blot(6, 43, 1.3)}
    <path d="M22 49 L20 55 M30 50 L29 55 M42 50 L43 55 M50 48 L52 54" stroke="#3a302c" strokeWidth="2" /></g>),
  slime: () => (<g>
    <ellipse cx="32" cy="58" rx="24" ry="4" fill="#2f4a1a" opacity={0.6} />
    <path d="M8 56 Q6 34 20 24 Q32 14 44 24 Q58 34 56 56 Z" fill="#7d9e46" opacity={0.88} /><path d="M14 56 Q14 40 24 32 Q32 26 40 32 Q50 40 50 56 Z" fill="#4b6527" opacity={0.5} />
    <circle cx="30" cy="42" r="6" fill={BONE} opacity={0.75} /><rect x="27" y="46" width="6" height="3" fill={BONE} opacity={0.7} />
    <circle cx="28" cy="41.5" r="1.4" fill="#203010" /><circle cx="32" cy="41.5" r="1.4" fill="#203010" /><path d="M40 50 L47 45" stroke={BONE} strokeWidth="1.6" opacity={0.7} />
    {eye(24, 30, "#d8ff4a", 1.3)}{eye(37, 28, "#d8ff4a", 1.6)}
    <path d="M12 56 L12 61 M20 56 L20 60 M46 56 L46 62" stroke="#7d9e46" strokeWidth="2.4" strokeLinecap="round" /><circle cx="22" cy="25" r="2" fill="#c8ff8a" opacity={0.5} /></g>),
  goblin: () => (<g>{shd(14)}
    <rect x="25" y="44" width="5" height="13" fill="#3d4a2a" /><rect x="34" y="44" width="5" height="13" fill="#3d4a2a" />
    <path d="M22 30 Q32 26 42 30 L40 46 L24 46 Z" fill="#4a3a2a" /><path d="M24 46 L27 50 L30 46 L33 50 L36 46 L39 50 L40 46 Z" fill="#4a3a2a" />
    <path d="M22 18 L6 11 L20 24 Z" fill="#5e7a3a" /><path d="M42 18 L58 11 L44 24 Z" fill="#5e7a3a" /><ellipse cx="32" cy="20" rx="10" ry="9" fill="#5e7a3a" />
    <path d="M24 15 L30 18 M40 15 L34 18" stroke="#1a2010" strokeWidth="1.5" />{eye(28, 19.5, "#ff3a1a", 1.1)}{eye(36, 19.5, "#ff3a1a", 1.1)}
    <path d="M26 25 Q32 29 38 25 Z" fill="#1a0a0a" /><path d="M27 25 L28 27 L29 25 Z M31 25.5 L32 28 L33 25.5 Z M35 25 L36 27 L37 25 Z" fill={BONE} />
    <circle cx="44" cy="36" r="2.5" fill="#5e7a3a" /><rect x="43" y="24" width="2" height="12" fill="#3b2a1c" />
    <path d="M42 14 L54 12 L54 24 L44 25 Z" fill="#7a7468" stroke="#4a4438" strokeWidth="0.6" /><path d="M50 18 L54 16 L54 24 L49 24 Z" fill={BLOODB} opacity={0.85} />
    <circle cx="20" cy="36" r="2.5" fill="#5e7a3a" />{blot(48, 21, 1.2)}{blot(30, 36, 1.3)}</g>),
  bat: () => (<g>
    <path d="M32 26 Q20 12 2 18 Q8 22 6 28 Q12 26 14 32 Q18 28 22 34 Q26 28 32 34 Z" fill="#2a1830" /><path d="M32 26 Q44 12 62 18 Q56 22 58 28 Q52 26 50 32 Q46 28 42 34 Q38 28 32 34 Z" fill="#2a1830" />
    <path d="M32 26 L20 13 M32 26 L44 13 M32 27 L8 21 M32 27 L56 21" stroke="#4a3256" strokeWidth="0.8" />
    <path d="M26 23 L27 14 L30 21 Z" fill="#3a2440" /><path d="M38 23 L37 14 L34 21 Z" fill="#3a2440" /><ellipse cx="32" cy="32" rx="6" ry="9" fill="#3a2440" />
    {eye(29.5, 28, "#ff2a2a", 1)}{eye(34.5, 28, "#ff2a2a", 1)}<path d="M30 33 L31 36 L32 33 L33 36 L34 33 Z" fill={BONE} />{blot(31, 37, 1.1)}{blot(33.5, 38, 0.8)}</g>),
  skel: () => (<g>{shd(14)}
    <path d="M28 44 L26 58 M36 44 L38 58" stroke={BONE} strokeWidth="2.6" strokeLinecap="round" /><path d="M27 44 L37 44 L35 40 L29 40 Z" fill={BONED} />
    <rect x="31" y="24" width="2" height="18" fill={BONE} /><path d="M24 27 Q32 25 40 27 M24 31 Q32 29 40 31 M25 35 Q32 33 39 35" stroke={BONE} strokeWidth="1.8" fill="none" />
    <path d="M24 26 L19 37 M40 26 L46 36" stroke={BONE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M24 14 Q24 4 32 4 Q40 4 40 14 Q40 19 37 20 L37 23 L27 23 L27 20 Q24 19 24 14 Z" fill={BONE} />
    <ellipse cx="28.5" cy="13" rx="2.6" ry="3" fill={BLK} /><ellipse cx="35.5" cy="13" rx="2.6" ry="3" fill={BLK} />{eye(28.5, 13, "#ff3a2a", 1)}{eye(35.5, 13, "#ff3a2a", 1)}
    <path d="M31 16 L32 18.5 L33 16 Z" fill={BLK} /><path d="M28 21 L28 23 M30 21 L30 23 M32 21 L32 23 M34 21 L34 23 M36 21 L36 23" stroke={BLK} strokeWidth="0.6" />
    <path d="M36 5 L34 9 L37 11" stroke="#5a4a3a" strokeWidth="0.7" fill="none" />
    <rect x="45" y="12" width="3" height="24" fill="#7a6a58" transform="rotate(10 46 24)" /><rect x="41" y="34" width="10" height="2.2" fill="#4a3a2a" /><path d="M45 14 L48 16 L47 24 Z" fill={BLOOD} />
    <circle cx="18" cy="40" r="7" fill="#4a3a2a" stroke="#6a5a48" /><path d="M14 36 L22 44" stroke="#2a1e14" />{blot(30, 30, 1)}</g>),
  spider: () => (<g>{shd(22)}
    <g stroke="#2a2030" strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="M26 34 L14 24 L4 34" /><path d="M26 37 L12 34 L4 46" /><path d="M27 40 L14 44 L8 56" /><path d="M28 42 L20 50 L18 60" /><path d="M38 34 L50 24 L60 34" /><path d="M38 37 L52 34 L60 46" /><path d="M37 40 L50 44 L56 56" /><path d="M36 42 L44 50 L46 60" /></g>
    <ellipse cx="32" cy="24" rx="11" ry="10" fill="#2e2236" /><path d="M30 18 L34 18 L32 22 L34 26 L30 26 L32 22 Z" fill={BLOODB} />
    <ellipse cx="32" cy="38" rx="8" ry="7" fill="#3a2c44" />{eye(29, 36, "#9dff3a", 1)}{eye(35, 36, "#9dff3a", 1)}{eye(31, 33.5, "#9dff3a", 0.7)}{eye(33, 33.5, "#9dff3a", 0.7)}
    <path d="M29 43 Q28 47 30 48 M35 43 Q36 47 34 48" stroke={BONE} strokeWidth="1.4" fill="none" />{blot(32, 48, 1)}</g>),
  kobold: () => (<g>{shd(14)}
    <path d="M40 52 Q52 56 58 48" stroke="#5a4a2a" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="26" y="44" width="5" height="13" fill="#6a5a30" /><rect x="34" y="44" width="5" height="13" fill="#6a5a30" />
    <path d="M22 30 Q32 26 42 30 L42 48 L22 48 Z" fill="#4a2a20" /><path d="M22 48 L26 52 L30 48 L34 52 L38 48 L42 52 L42 48 Z" fill="#4a2a20" />
    <path d="M28 12 L30 5 L33 12 Z M34 12 L37 6 L38 13 Z" fill="#5a4a2a" /><path d="M24 22 Q26 12 36 12 Q42 14 40 24 Q36 28 28 27 L18 25 Q16 22 24 22 Z" fill="#7a6a38" />
    {eye(30, 18, "#b6ff3a", 1)}<path d="M18 25 L28 26" stroke="#2a1a10" strokeWidth="0.8" /><path d="M20 25 L21 27 M23 25.5 L24 27.5" stroke={BONE} strokeWidth="0.7" />
    <path d="M26 31 Q32 35 38 31" stroke={BONE} strokeWidth="1.4" fill="none" strokeDasharray="1.5 1" />
    <rect x="46" y="14" width="2.2" height="44" fill="#4a3826" /><circle cx="47" cy="9" r="7" fill="#8aff3a" opacity={0.15} />
    <circle cx="47" cy="11" r="4.2" fill={BONE} /><circle cx="45.6" cy="10.5" r="1" fill={BLK} /><circle cx="48.4" cy="10.5" r="1" fill={BLK} />
    <path d="M47 7 Q44 3 47 0 Q50 3 47 7 Z" fill="#8aff3a" opacity={0.85} /><circle cx="45" cy="36" r="2.5" fill="#7a6a38" />{blot(30, 40, 1.3)}</g>),
  orc: () => (<g>{shd(18)}
    <rect x="22" y="44" width="8" height="14" fill="#2e3a22" /><rect x="34" y="44" width="8" height="14" fill="#2e3a22" />
    <path d="M14 26 Q32 18 50 26 L46 48 L18 48 Z" fill="#4e6a34" /><path d="M18 30 L46 40" stroke="#3a2414" strokeWidth="3" />
    <circle cx="28" cy="34" r="1.6" fill="#6a7262" /><circle cx="38" cy="38" r="1.6" fill="#6a7262" /><rect x="18" y="44" width="28" height="5" fill="#3a2414" />
    <path d="M10 24 Q16 18 22 24 L20 30 L12 30 Z" fill={STEELD} /><path d="M12 22 L9 15 L15 21 Z M17 20 L18 13 L20 21 Z" fill={STEELD} />
    <path d="M24 22 Q22 8 32 8 Q42 8 40 22 Q36 26 32 26 Q28 26 24 22 Z" fill="#5e7a3a" /><path d="M25 14 L39 14" stroke="#1a2010" strokeWidth="2" />
    {eye(28.5, 16, "#ff2a1a", 1.1)}{eye(35.5, 16, "#ff2a1a", 1.1)}<path d="M27 22 L26 17 L29 21 Z M37 22 L38 17 L35 21 Z" fill={BONE} />
    <path d="M30 9 L31 13 L33 10" stroke={BLOODB} strokeWidth="0.8" fill="none" />
    <path d="M48 37 L54 8 L60 10 L53 38 Z" fill="#4a3220" /><path d="M54 12 L50 10 M57 16 L61 14 M53 20 L49 19 M57 25 L61 23" stroke={STEELL} strokeWidth="1.4" />
    <circle cx="50" cy="37" r="3.4" fill="#5e7a3a" /><circle cx="14" cy="36" r="3.4" fill="#5e7a3a" />{blot(56, 12, 2)}{blot(55, 22, 1.4)}{blot(22, 38, 1.4)}</g>),
  wraith: () => (<g>
    <path d="M32 6 Q48 8 50 30 Q52 44 56 58 L48 52 L44 60 L38 52 L32 62 L26 52 L20 60 L16 52 L8 58 Q12 44 14 30 Q16 8 32 6 Z" fill="#2a2a3e" opacity={0.85} />
    <path d="M32 10 Q44 12 44 26 L40 50 L24 50 L20 26 Q20 12 32 10 Z" fill="#3e3e5a" opacity={0.6} />
    <path d="M16 34 Q10 30 16 27 M48 34 Q54 30 48 27" stroke="#3e3e5a" strokeWidth="5" fill="none" />
    <path d="M14 34 L4 40 M14 34 L6 44 M14 34 L9 46 M50 34 L60 40 M50 34 L58 44 M50 34 L55 46" stroke={BONE} strokeWidth="1.2" />
    <ellipse cx="32" cy="22" rx="8" ry="9" fill={BLK} />{eye(28.5, 21, "#7cf0ff", 1.3)}{eye(35.5, 21, "#7cf0ff", 1.3)}
    <path d="M28 27 Q32 32 36 27" stroke="#7cf0ff" strokeWidth="0.8" fill="none" opacity={0.6} /><path d="M20 44 L44 46" stroke="#5a5a6a" strokeWidth="1.2" strokeDasharray="2 1.2" /></g>),
  elf: () => (<g>{shd(13)}
    <path d="M24 24 Q32 20 40 24 L42 56 L22 56 Z" fill="#241a30" /><path d="M28 24 L36 24 L35 44 L29 44 Z" fill="#3a2a4a" /><path d="M22 56 L26 50 L30 56 L34 50 L38 56 L42 50 L42 56 Z" fill="#160f1e" />
    <path d="M26 14 L18 10 L26 17 Z M38 14 L46 10 L38 17 Z" fill="#6a5a7a" /><ellipse cx="32" cy="15" rx="6" ry="7" fill="#6a5a7a" />
    <path d="M25 13 Q26 4 32 5 Q40 4 39 13 L41 30 L38 22 Q36 10 32 10 Q28 10 26 22 L23 30 Z" fill="#e8e4f0" />
    {eye(29.5, 15.5, "#c45aff", 1)}{eye(34.5, 15.5, "#c45aff", 1)}<path d="M30 20 L34 20" stroke="#2a1a30" strokeWidth="0.7" />
    <path d="M44 38 Q56 30 54 14 Q52 26 43 36 Z" fill={STEELL} stroke={STEELD} strokeWidth="0.5" /><path d="M54 16 Q53 22 50 26" stroke={BLOODB} strokeWidth="1.4" fill="none" />
    <circle cx="44" cy="38" r="2.2" fill="#6a5a7a" /><path d="M20 38 L12 46 L13 47 L21 39 Z" fill={STEELL} /><circle cx="20" cy="38" r="2.2" fill="#6a5a7a" />{blot(13, 46, 0.9)}{blot(30, 34, 1)}</g>),
  golem: () => (<g>{shd(22)}
    <rect x="20" y="44" width="9" height="15" rx="1" fill="#5a564e" /><rect x="35" y="44" width="9" height="15" rx="1" fill="#5a564e" />
    <path d="M14 22 L50 22 L48 46 L16 46 Z" fill="#6e6a60" /><path d="M6 22 L16 20 L16 42 L8 46 Z" fill="#5e5a52" /><path d="M58 22 L48 20 L48 42 L56 46 Z" fill="#5e5a52" />
    <rect x="4" y="44" width="10" height="9" rx="2" fill="#4e4a44" /><rect x="50" y="44" width="10" height="9" rx="2" fill="#4e4a44" />
    <path d="M18 22 L20 17 L24 22 Z M44 22 L42 17 L40 22 Z" fill="#3e4a2a" /><rect x="24" y="8" width="16" height="14" rx="2" fill="#7a766a" /><rect x="26" y="13" width="12" height="3" fill="#1a1410" />
    {eye(29, 14.5, "#ff8a1a", 1.1)}{eye(35, 14.5, "#ff8a1a", 1.1)}
    <circle cx="32" cy="32" r="5" fill="#ff8a1a" opacity={0.25} /><path d="M24 28 L30 32 L28 38 L34 42 M40 26 L36 32 L42 36" stroke="#ff8a1a" strokeWidth="1.2" fill="none" /><circle cx="32" cy="32" r="2.4" fill="#ffb04a" />
    <path d="M10 28 L14 34 M54 30 L50 36" stroke="#2a2620" strokeWidth="1" />{blot(8, 50, 1.4)}{blot(55, 49, 1.2)}</g>),
  necro: () => (<g>{shd(15)}
    <path d="M32 10 L46 30 L48 58 L16 58 L18 30 Z" fill="#1e1a14" /><path d="M16 58 L19 50 L23 58 L26 52 L30 58 L34 51 L38 58 L42 52 L46 58 Z" fill="#141008" />
    <path d="M26 40 Q24 50 28 56 M38 38 Q40 48 36 56" stroke={BLOODB} strokeWidth="2" fill="none" opacity={0.75} /><path d="M28 30 L36 30 L32 44 Z" fill="#6e0d14" />
    <path d="M20 28 Q20 8 32 6 Q44 8 44 28 Q38 24 32 24 Q26 24 20 28 Z" fill="#2a2418" />
    <path d="M26 14 Q32 11 38 14 L38 22 Q32 27 26 22 Z" fill="#7a8a5a" /><path d="M32 13 Q38 13 38 16 L38 22 Q35 25 32 25 Z" fill={BONE} /><circle cx="35" cy="17" r="1.8" fill={BLK} />
    {eye(29, 17, "#8aff3a", 1)}{eye(35, 17, "#8aff3a", 1)}<path d="M32 22 L38 22 M33.5 22 L33.5 24 M35.5 22 L35.5 24" stroke={BLK} strokeWidth="0.6" />
    <path d="M27 19 Q28 21 27 23" stroke={BLOODB} strokeWidth="1" fill="none" /><circle cx="28.5" cy="21.5" r="1.2" fill="#4a5a2a" />
    <path d="M12 40 L12 10" stroke="#3a2e22" strokeWidth="2.4" /><circle cx="12" cy="8" r="8" fill="#8aff3a" opacity={0.14} />
    <circle cx="12" cy="10" r="4" fill={BONE} /><circle cx="10.6" cy="9.5" r="1" fill="#2a3a10" /><circle cx="13.4" cy="9.5" r="1" fill="#2a3a10" />
    <path d="M12 6 Q9 2 12 0 Q15 2 12 6 Z" fill="#8aff3a" opacity={0.85} /><path d="M15 34 L11 32 M15 35 L10 35 M15 36 L11 38" stroke={BONE} strokeWidth="1.1" />
    <circle cx="50" cy="20" r="2.2" fill="#8aff3a" opacity={0.6} /><circle cx="54" cy="28" r="1.5" fill="#8aff3a" opacity={0.45} /></g>),
  basil: () => (<g>{shd(22)}
    <path d="M8 54 Q8 40 24 42 Q44 44 50 52 Q54 58 40 58 L16 58 Q8 58 8 54 Z" fill="#3e5a2a" /><path d="M14 50 Q30 46 44 54" stroke="#2a4018" strokeWidth="1.2" fill="none" strokeDasharray="2 1.5" />
    <path d="M40 50 Q50 40 44 28 Q40 18 30 16 L26 24 Q34 26 36 32 Q40 42 32 48 Z" fill="#4a6a32" /><path d="M38 46 Q44 38 40 30" stroke="#c9c28a" strokeWidth="2.4" fill="none" opacity={0.6} />
    <path d="M22 8 L20 2 L25 7 Z M27 8 L27 1 L30 8 Z" fill="#2a4018" /><path d="M16 14 Q22 6 32 10 Q36 14 32 20 Q24 24 14 20 Z" fill="#4a6a32" />
    {eye(24, 13, "#ffe23a", 1.3)}<path d="M14 18 L22 20" stroke="#1a2a10" strokeWidth="0.8" /><path d="M15 18 L15.5 22 M18 19 L18.5 23" stroke={BONE} strokeWidth="0.9" />
    <path d="M13 20 L9 22 L10 21 L6 24" stroke={BLOODB} strokeWidth="0.8" fill="none" />{blot(17, 24, 1)}<circle cx="15.5" cy="24" r="0.9" fill="#9dff3a" /></g>),
  demon: () => (<g>{shd(18)}
    <path d="M24 24 Q6 6 2 30 Q8 26 10 32 Q14 28 16 34 Q20 30 24 36 Z" fill="#3a0d10" /><path d="M40 24 Q58 6 62 30 Q56 26 54 32 Q50 28 48 34 Q44 30 40 36 Z" fill="#3a0d10" />
    <rect x="24" y="44" width="7" height="14" fill="#5a1212" /><rect x="33" y="44" width="7" height="14" fill="#5a1212" /><path d="M23 58 L21 61 L28 61 Z M41 58 L43 61 L36 61 Z" fill="#1a0a0a" />
    <path d="M20 26 Q32 20 44 26 L42 46 L22 46 Z" fill="#7a1a16" /><path d="M26 30 Q32 33 38 30 M26 35 Q32 38 38 35" stroke="#4a0a0a" strokeWidth="1" fill="none" />
    <path d="M26 12 Q18 8 18 0 Q22 6 28 9 Z M38 12 Q46 8 46 0 Q42 6 36 9 Z" fill={BONE} /><path d="M25 18 Q25 8 32 8 Q39 8 39 18 Q38 24 32 25 Q26 24 25 18 Z" fill="#8a1e18" />
    {eye(29, 15, "#ffb21a", 1.2)}{eye(35, 15, "#ffb21a", 1.2)}<path d="M28 20 L36 20 L32 23 Z" fill="#1a0505" /><path d="M29 20 L30 22 M34 20 L35 22" stroke={BONE} strokeWidth="0.7" />
    <path d="M20 30 L14 42 M44 30 L50 42" stroke="#7a1a16" strokeWidth="4" strokeLinecap="round" /><path d="M14 42 L11 46 M14 42 L14 47 M14 42 L17 46 M50 42 L47 46 M50 42 L50 47 M50 42 L53 46" stroke={BONE} strokeWidth="1" />
    {blot(13, 47, 1.3)}{blot(51, 47, 1.3)}<path d="M24 58 Q22 52 26 50 Q26 54 28 56 Z M40 58 Q42 52 38 50 Q38 54 36 56 Z" fill="#ff6a1a" opacity={0.6} /></g>),
  lich: () => (<g>{shd(15)}
    <path d="M32 14 L48 32 L52 60 L12 60 L16 32 Z" fill="#2a1838" /><path d="M12 60 L16 52 L20 60 L24 53 L28 60 L32 52 L36 60 L40 53 L44 60 L48 52 L52 60 Z" fill="#180e22" />
    <path d="M26 26 L38 26 L36 48 L28 48 Z" fill="#1a0a22" /><rect x="31.3" y="28" width="1.4" height="12" fill={BONE} />
    <path d="M28 30 Q32 29 36 30 M28 33 Q32 32 36 33 M28.5 36 Q32 35 35.5 36" stroke={BONE} strokeWidth="1.2" fill="none" /><path d="M30 40 L28 45 M34 41 L36 46" stroke={BLOODB} strokeWidth="1" />
    <path d="M25 18 Q25 8 32 8 Q39 8 39 18 Q39 21 36 22 L36 25 L28 25 L28 22 Q25 21 25 18 Z" fill={BONE} />
    <ellipse cx="29.3" cy="17" rx="2.3" ry="2.6" fill={BLK} /><ellipse cx="34.7" cy="17" rx="2.3" ry="2.6" fill={BLK} />{eye(29.3, 17, "#c27aff", 1.1)}{eye(34.7, 17, "#c27aff", 1.1)}
    <path d="M29 23 L35 23" stroke={BLK} strokeWidth="0.7" /><path d="M25 11 L26 4 L28.5 8 L30.5 2 L32 7 L33.5 2 L35.5 8 L38 4 L39 11 Z" fill="#9a8a3a" /><circle cx="32" cy="9" r="1" fill="#c27aff" />
    <path d="M16 34 L10 30 M48 34 L54 30" stroke={BONE} strokeWidth="1.4" /><circle cx="9" cy="28" r="4.5" fill="#a24aff" opacity={0.35} /><circle cx="9" cy="28" r="2" fill="#d8a8ff" />
    <circle cx="55" cy="27" r="6" fill="#a24aff" opacity={0.2} /><path d="M55 22 L58 27 L55 32 L52 27 Z" fill="#7a2aff" opacity={0.85} /></g>),
  wyvern: () => (<g>{shd(22)}
    <path d="M30 26 Q14 2 2 10 Q10 14 6 20 Q14 18 12 26 Q18 22 22 30 Z" fill="#2e2a3e" /><path d="M30 26 L4 10 M30 26 L8 20 M30 26 L13 26" stroke="#4a4462" strokeWidth="0.8" />
    <path d="M52 44 Q60 48 62 58 L58 54 L56 60 Q56 50 48 48 Z" fill="#3e4a32" /><path d="M62 58 L59 52 L64 54 Z" fill={BONE} />
    <path d="M18 46 Q22 30 36 30 Q50 30 52 44 Q50 52 36 52 Q24 52 18 46 Z" fill="#3e4a32" /><path d="M24 46 Q34 50 46 46" stroke="#a8a070" strokeWidth="2" fill="none" opacity={0.5} />
    <path d="M28 52 L26 58 M42 52 L44 58" stroke="#2e3a26" strokeWidth="3" /><path d="M23 58 L29 58 M41 58 L47 58" stroke={BONE} strokeWidth="1" />
    <path d="M38 28 Q52 0 62 6 Q56 12 60 16 Q52 16 54 22 Q48 20 46 30 Z" fill="#3a3550" /><path d="M40 30 L50 40" stroke={BLOODB} strokeWidth="1" />
    <path d="M22 36 Q14 26 18 18 L24 18 Q22 26 28 32 Z" fill="#3e4a32" /><path d="M10 18 Q14 10 24 12 L26 18 Q18 22 10 20 Z" fill="#4a5a3a" /><path d="M20 12 L24 5 L24 13 Z" fill={BONE} />
    {eye(19, 15, "#ff2a2a", 1.1)}<path d="M10 20 L18 20 M12 20 L12.5 22 M15 20 L15.5 22" stroke={BONE} strokeWidth="0.7" />{blot(12, 22.5, 1.2)}</g>),
  shade: () => (<g>
    <path d="M38 8 Q50 10 50 26 Q52 42 56 58" stroke="#7a4aff" strokeWidth="0.8" fill="none" opacity={0.3} />
    <path d="M32 6 Q44 8 44 24 Q46 40 50 58 Q40 50 32 60 Q24 50 14 58 Q18 40 20 24 Q20 8 32 6 Z" fill="#1a1028" opacity={0.92} />
    <path d="M32 6 Q44 8 44 24 Q46 40 50 58 M20 24 Q18 40 14 58" stroke="#7a4aff" strokeWidth="1" fill="none" opacity={0.6} />
    <path d="M20 30 L8 36 L6 44 M44 30 L56 36 L58 44" stroke="#1a1028" strokeWidth="3" fill="none" />{eye(28.5, 20, "#e8e0ff", 1.2)}{eye(35.5, 20, "#e8e0ff", 1.2)}</g>),
  brood: () => (<g>
    <g stroke="#c9c2d8" strokeWidth="0.4" opacity={0.35} fill="none"><path d="M0 0 L32 30 L64 0 M0 30 L64 30 M32 0 L32 30 M0 64 L32 30 L64 64" /><path d="M12 12 Q32 18 52 12 M6 22 Q32 28 58 22" /></g>
    {shd(28)}
    <g stroke="#1e1424" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M24 36 L10 18 L2 26" /><path d="M23 40 L6 34 L1 46" /><path d="M24 44 L8 50 L4 62" /><path d="M27 47 L18 56 L16 63" /><path d="M40 36 L54 18 L62 26" /><path d="M41 40 L58 34 L63 46" /><path d="M40 44 L56 50 L60 62" /><path d="M37 47 L46 56 L48 63" /></g>
    <g fill="#3a2a44"><circle cx="10" cy="18" r="1.6" /><circle cx="54" cy="18" r="1.6" /><circle cx="6" cy="34" r="1.6" /><circle cx="58" cy="34" r="1.6" /></g>
    <ellipse cx="32" cy="22" rx="17" ry="15" fill="#2a1c34" /><path d="M22 14 Q32 8 42 14 M20 22 Q32 18 44 22" stroke="#4a3256" strokeWidth="1.5" fill="none" />
    <path d="M29 16 L35 16 L32 22 L35 28 L29 28 L32 22 Z" fill={BLOODB} />
    <g fill="#d8d0b0" opacity={0.9}><ellipse cx="18" cy="26" rx="3.4" ry="2.6" /><ellipse cx="46" cy="27" rx="3.4" ry="2.6" /><ellipse cx="22" cy="31" rx="2.5" ry="2" /><ellipse cx="43" cy="32" rx="2.5" ry="2" /></g>
    <g fill="#9dff3a" opacity={0.55}><circle cx="18" cy="26" r="1" /><circle cx="46" cy="27" r="1" /></g>
    <ellipse cx="32" cy="42" rx="11" ry="9" fill="#3a2848" />
    {eye(27, 39, "#ff2a2a", 1.3)}{eye(37, 39, "#ff2a2a", 1.3)}{eye(29.5, 36, "#ff2a2a", 0.9)}{eye(34.5, 36, "#ff2a2a", 0.9)}{eye(25, 42.5, "#ff2a2a", 0.7)}{eye(39, 42.5, "#ff2a2a", 0.7)}{eye(31, 34, "#ff2a2a", 0.6)}{eye(33, 34, "#ff2a2a", 0.6)}
    <path d="M27 48 Q25 54 29 57 L29 52 Z M37 48 Q39 54 35 57 L35 52 Z" fill={BONE} />{blot(29, 57, 1.6)}{blot(35, 57.5, 1.4)}<path d="M32 50 L32 56" stroke="#7fd14a" strokeWidth="1.2" />
    <circle cx="50" cy="8" r="3.4" fill={BONE} /><circle cx="49" cy="7.6" r="0.8" fill={BLK} /><circle cx="51" cy="7.6" r="0.8" fill={BLK} /><path d="M50 11 L50 16" stroke="#c9c2d8" strokeWidth="0.5" />
    {blot(30, 46, 1.2)}{blot(20, 18, 1.4)}{blot(44, 16, 1)}</g>),
  lord: () => (<g>
    <ellipse cx="32" cy="34" rx="31" ry="29" fill="#4a2366" opacity={0.2} /><ellipse cx="32" cy="59" rx="26" ry="5" fill="#1a0f24" opacity={0.75} />
    <path d="M40 8 L56 22 L58 60 L22 60 L24 22 Z" fill="#7a4aff" opacity={0.12} />
    <path d="M16 20 L6 62 L12 58 L16 63 L22 58 L28 63 L32 58 L36 63 L42 58 L48 63 L52 58 L58 62 L48 20 Z" fill="#2a0a14" />
    <rect x="23" y="48" width="7" height="12" fill="#2e3038" /><rect x="34" y="48" width="7" height="12" fill="#2e3038" />
    <path d="M20 22 Q32 16 44 22 L42 48 L22 48 Z" fill="#3a3d48" /><path d="M28 28 L38 28 L36 40 L30 42 Z" fill="#1a0a10" />
    <path d="M29 31 Q33 30 37 31 M29.5 34 Q33 33 36.5 34 M30 37 Q33 36 36 37" stroke={BONE} strokeWidth="1.1" fill="none" /><path d="M28 28 L30 42" stroke={BLOODB} strokeWidth="1.2" />{blot(36, 40, 1.6)}{blot(24, 44, 1.2)}
    <path d="M12 22 Q18 14 24 22 L22 28 L14 28 Z" fill="#4a4e5a" /><path d="M13 20 L9 10 L16 18 Z M18 17 L18 7 L21 17 Z" fill="#4a4e5a" stroke="#2a2e36" strokeWidth="0.6" />
    <path d="M52 22 Q46 14 40 22 L42 28 L50 28 Z" fill="#4a4e5a" /><path d="M51 20 L55 10 L48 18 Z M46 17 L46 7 L43 17 Z" fill="#4a4e5a" stroke="#2a2e36" strokeWidth="0.6" />
    <path d="M25 18 Q25 6 32 6 Q39 6 39 18 L37 23 L27 23 Z" fill="#2e3038" /><path d="M27.5 11 Q32 9 36.5 11 L36 20 Q32 23 28 20 Z" fill={BONE} />
    <ellipse cx="30" cy="14" rx="1.8" ry="2.2" fill={BLK} /><ellipse cx="34" cy="14" rx="1.8" ry="2.2" fill={BLK} />{eye(30, 14, "#b84aff", 1.2)}{eye(34, 14, "#b84aff", 1.2)}
    <path d="M29.5 19 L34.5 19 M30.5 19 L30.5 20.5 M32 19 L32 21 M33.5 19 L33.5 20.5" stroke={BLK} strokeWidth="0.6" />
    <path d="M24 8 L25 0 L28 5 L30 0 L32 4 L34 0 L36 5 L39 0 L40 8 Z" fill="#8a7a2a" stroke="#4a3a10" strokeWidth="0.5" /><circle cx="32" cy="6" r="1.2" fill="#b84aff" />
    <rect x="50" y="8" width="4" height="39" fill="#5a5e6a" stroke="#2a2e36" strokeWidth="0.5" /><path d="M50 8 L52 2 L54 8 Z" fill="#5a5e6a" />
    <path d="M50 16 L54 18 L54 34 L50 30 Z" fill={BLOODB} opacity={0.85} />{blot(52, 12, 1.2)}
    <rect x="46" y="47" width="12" height="2.6" fill="#3a2a10" /><rect x="51" y="49.6" width="2" height="7" fill="#2a1a0a" /><circle cx="52" cy="57.5" r="1.5" fill="#b84aff" /><circle cx="52" cy="52" r="3" fill="#3a3d48" />
    <circle cx="16" cy="38" r="5" fill="#7a2aff" opacity={0.3} /><circle cx="16" cy="38" r="2.2" fill="#d8a8ff" />
    <circle cx="8" cy="14" r="2" fill="#b84aff" opacity={0.6} /><circle cx="5" cy="24" r="1.4" fill="#b84aff" opacity={0.45} /><circle cx="60" cy="40" r="1.6" fill="#b84aff" opacity={0.45} /></g>),
  stairs: () => (<g><rect x="6" y="6" width="52" height="52" rx="4" fill="#0a0806" /><rect x="9" y="10" width="46" height="9" fill="#5a5048" /><rect x="13" y="21" width="38" height="9" fill="#463e38" /><rect x="17" y="32" width="30" height="9" fill="#322c28" /><rect x="21" y="43" width="22" height="9" fill="#201c1a" /><circle cx="32" cy="50" r="10" fill="#b84aff" opacity={0.22} /></g>),
  chest: () => (<g>{shd(22)}<rect x="10" y="26" width="44" height="28" rx="2" fill="#4a2e18" stroke="#2a1a0c" strokeWidth="1.5" /><path d="M10 26 Q32 10 54 26 Z" fill="#5a3a1e" stroke="#2a1a0c" strokeWidth="1.5" /><rect x="10" y="30" width="44" height="3" fill="#6a6e78" /><rect x="18" y="19" width="3" height="35" fill="#6a6e78" /><rect x="43" y="19" width="3" height="35" fill="#6a6e78" /><rect x="29" y="30" width="6" height="8" rx="1" fill="#c9a23a" />{blot(40, 42, 2)}</g>),
  gold: () => (<g><ellipse cx="32" cy="50" rx="18" ry="6" fill="#6a4a10" /><ellipse cx="32" cy="46" rx="14" ry="6" fill="#b8861e" /><ellipse cx="26" cy="40" rx="7" ry="3" fill="#e0b03a" stroke="#8a6010" /><ellipse cx="38" cy="38" rx="7" ry="3" fill="#e0b03a" stroke="#8a6010" /><ellipse cx="32" cy="33" rx="7" ry="3" fill="#f0c84a" stroke="#8a6010" /><circle cx="35" cy="32" r="1.2" fill="#fff" opacity={0.8} /></g>),
  torch: () => (<g><rect x="30" y="30" width="4" height="18" fill="#3a2a1a" /><rect x="26" y="28" width="12" height="4" fill="#4a4e58" /><circle cx="32" cy="20" r="16" fill="#ff8a1a" opacity={0.22} /><path d="M32 28 Q24 20 30 10 Q31 16 34 14 Q40 20 32 28 Z" fill="#ff8a1a" /><path d="M32 27 Q28 22 31 16 Q33 20 34 19 Q36 23 32 27 Z" fill="#ffe08a" /></g>),
  web: () => (<g><g stroke="#d8d4e0" strokeWidth="1" fill="none" opacity={0.75}><path d="M4 4 L60 60 M60 4 L4 60 M32 2 L32 62 M2 32 L62 32" /><circle cx="32" cy="32" r="8" /><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="25" /></g><circle cx="21" cy="23" r="2.4" fill="#d8d4e0" opacity={0.7} />{blot(40, 40, 1.2)}</g>),
  rune: () => (<g><circle cx="32" cy="32" r="22" fill="#7a2aff" opacity={0.18} /><circle cx="32" cy="32" r="18" fill="none" stroke="#b84aff" strokeWidth="2" /><path d="M32 16 L44 42 L20 42 Z" fill="none" stroke="#b84aff" strokeWidth="1.8" /><circle cx="32" cy="34" r="3" fill="#e0b0ff" /></g>),
  eggs: () => (<g><path d="M12 46 Q32 56 52 46" stroke="#d8d4e0" strokeWidth="0.8" fill="none" opacity={0.6} /><g fill="#d8d0b0" stroke="#8a8270" strokeWidth="0.8"><ellipse cx="26" cy="40" rx="8" ry="6" /><ellipse cx="38" cy="38" rx="7" ry="5.5" /><ellipse cx="32" cy="30" rx="6" ry="5" /></g><g fill="#9dff3a" opacity={0.5}><circle cx="26" cy="40" r="2" /><circle cx="38" cy="38" r="1.6" /></g></g>),
  cocoon: () => (<g><path d="M32 4 L32 20" stroke="#d8d4e0" strokeWidth="0.8" /><ellipse cx="32" cy="36" rx="9" ry="16" fill="#d8d4e0" opacity={0.85} /><path d="M24 26 Q32 30 40 26 M23 34 Q32 38 41 34 M24 42 Q32 46 40 42" stroke="#a8a4b0" strokeWidth="1" fill="none" /><circle cx="32" cy="24" r="3" fill={BONE} />{blot(34, 50, 1.4)}</g>),
  wweb: () => (<g stroke="#d8d4e0" strokeWidth="1" fill="none" opacity={0.7}><path d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M0 0 L38 16 M0 0 L16 38" /><path d="M12 0 Q10 10 0 12 M24 0 Q20 20 0 24 M36 0 Q30 30 0 36" /></g>),
  wfungus: () => (<g><circle cx="30" cy="40" r="18" fill="#6aff6a" opacity={0.15} /><rect x="20" y="40" width="4" height="12" fill="#cfd8b0" /><ellipse cx="22" cy="40" rx="9" ry="5" fill="#6aff6a" opacity={0.85} /><rect x="38" y="44" width="3" height="9" fill="#cfd8b0" /><ellipse cx="39.5" cy="44" rx="6" ry="3.5" fill="#9dff3a" /></g>),
  candle: () => (<g><circle cx="32" cy="22" r="16" fill="#b84aff" opacity={0.2} /><rect x="22" y="36" width="20" height="4" fill="#3a3040" /><rect x="26" y="26" width="4" height="10" fill="#e8e0c8" /><rect x="34" y="28" width="4" height="8" fill="#e8e0c8" /><path d="M28 26 Q26 20 28 16 Q30 20 28 26 Z M36 28 Q34 22 36 18 Q38 22 36 28 Z" fill="#c27aff" /></g>),
  niche: () => (<g><path d="M18 50 L18 24 Q32 8 46 24 L46 50 Z" fill="#0d0a10" /><circle cx="32" cy="38" r="7" fill={BONE} /><circle cx="29.5" cy="37" r="1.6" fill={BLK} /><circle cx="34.5" cy="37" r="1.6" fill={BLK} /><rect x="29" y="43" width="6" height="3" fill={BONE} /></g>),
  tomb: () => (<g><rect x="14" y="16" width="36" height="34" rx="3" fill="#3a3448" stroke="#1a1522" strokeWidth="1.5" /><path d="M32 22 L32 40 M25 28 L39 28" stroke="#6a5a80" strokeWidth="2.4" /><path d="M14 30 L22 34 L18 42" stroke="#1a1522" strokeWidth="1" fill="none" /></g>),
  bonepile: () => (<g><g stroke={BONE} strokeWidth="2.6" strokeLinecap="round"><path d="M18 46 L30 40" /><path d="M34 48 L46 42" /><path d="M24 50 L40 50" /></g><circle cx="32" cy="38" r="6" fill={BONE} /><circle cx="30" cy="37.5" r="1.3" fill={BLK} /><circle cx="34" cy="37.5" r="1.3" fill={BLK} /></g>),
  gen: () => (<g>{shd(14)}<path d="M32 8 Q46 10 46 30 L48 56 L16 56 L18 30 Q18 10 32 8 Z" fill="#2a2030" />{eye(28, 22, "#ff2a2a", 1.1)}{eye(36, 22, "#ff2a2a", 1.1)}{blot(30, 40, 1.5)}</g>),
};
const REM: Record<string, () => ReactNode> = {
  gen: () => (<g>{pud(32, 38, 16, 9, "#5a080d")}{pud(30, 37, 9, 5, "#8f0d13")}</g>),
  rat: () => (<g>{pud(34, 40, 12, 7, "#5a080d")}<ellipse cx="30" cy="36" rx="8" ry="4.5" fill="#4a3f3a" /><path d="M38 36 Q46 32 50 38" stroke="#8a6a6a" strokeWidth="1.4" fill="none" /><path d="M24 38 L22 41 M28 39 L27 42" stroke="#3a302c" strokeWidth="1.4" /><path d="M28 34 Q31 37 34 34" stroke={BONED} strokeWidth="1" fill="none" /></g>),
  bat: () => (<g>{pud(32, 40, 10, 6, "#5a080d")}<path d="M22 36 Q28 30 32 36 Q36 30 42 36 Q36 40 32 38 Q28 40 22 36 Z" fill="#2a1830" /><circle cx="32" cy="37" r="2.4" fill="#3a2440" /></g>),
  slime: () => (<g><path d="M8 44 Q10 30 24 34 Q34 26 46 34 Q58 34 56 46 Q44 54 30 50 Q14 54 8 44 Z" fill="#7d9e46" opacity={0.6} /><path d="M16 44 Q22 38 32 40 Q44 38 48 44 Q38 48 28 47 Z" fill="#4b6527" opacity={0.55} /><circle cx="36" cy="42" r="4" fill={BONE} opacity={0.65} /><circle cx="20" cy="40" r="1.6" fill="#c8ff8a" opacity={0.6} /><circle cx="46" cy="40" r="1.1" fill="#c8ff8a" opacity={0.6} /></g>),
  goblin: () => (<g>{pud(32, 40, 14, 8, "#5a080d")}<path d="M14 30 L28 28 L28 36 L16 37 Z" fill="#7a7468" /><rect x="28" y="31" width="10" height="2" fill="#3b2a1c" transform="rotate(10 30 32)" /><path d="M40 40 L52 35 L45 45 Z" fill="#5e7a3a" /></g>),
  skel: () => (<g><g stroke={BONE} strokeWidth="3" strokeLinecap="round"><path d="M12 44 L26 38" /><path d="M36 50 L52 44" /><path d="M20 54 L30 52" /><path d="M46 30 L54 36" /></g><g fill={BONE}><circle cx="12" cy="44" r="2" /><circle cx="26" cy="38" r="2" /><circle cx="36" cy="50" r="2" /><circle cx="52" cy="44" r="2" /></g><path d="M24 46 Q32 42 40 46 M25 49 Q32 45 39 49" stroke={BONED} strokeWidth="1.6" fill="none" /><path d="M30 22 Q30 14 37 14 Q44 14 44 22 Q44 26 41 27 L41 29 L33 29 L33 27 Q30 26 30 22 Z" fill={BONE} /><circle cx="34.5" cy="21.5" r="1.8" fill={BLK} /><circle cx="39.5" cy="21.5" r="1.8" fill={BLK} /></g>),
  spider: () => (<g>{pud(32, 38, 15, 8, "#4f8a1e", 0.75)}<g stroke="#2a2030" strokeWidth="1.8" fill="none" strokeLinecap="round"><path d="M26 34 Q20 28 24 25" /><path d="M26 37 Q18 36 20 31" /><path d="M27 39 Q20 44 23 46" /><path d="M28 40 Q24 48 28 48" /><path d="M38 34 Q44 28 40 25" /><path d="M38 37 Q46 36 44 31" /><path d="M37 39 Q44 44 41 46" /><path d="M36 40 Q40 48 36 48" /></g><ellipse cx="32" cy="37" rx="7" ry="5" fill="#2e2236" /></g>),
  kobold: () => (<g>{pud(32, 40, 13, 7, "#5a080d")}<path d="M14 46 L32 37" stroke="#4a3826" strokeWidth="2" /><path d="M37 34 L48 29" stroke="#4a3826" strokeWidth="2" /><circle cx="47" cy="45" r="3" fill={BONE} /><path d="M18 30 Q26 25 30 31" stroke="#7a6a38" strokeWidth="2.4" fill="none" /></g>),
  orc: () => (<g>{pud(32, 40, 18, 10, "#5a080d")}{pud(30, 39, 10, 5, "#8f0d13")}<path d="M12 30 L34 24 L35 28 L13 34 Z" fill="#4a3220" /><path d="M18 28 L17 24 M24 26 L23 22 M30 25 L29 21" stroke={STEELL} strokeWidth="1.2" /><path d="M42 46 Q47 41 45 36" stroke={BONE} strokeWidth="2.4" fill="none" /></g>),
  wraith: () => (<g><path d="M18 46 Q22 30 32 36 Q40 24 46 40 Q52 48 40 50 Q30 54 18 46 Z" fill="#7cf0ff" opacity={0.2} /><path d="M30 40 Q34 30 30 22 Q38 28 36 16" stroke="#7cf0ff" strokeWidth="1.2" fill="none" opacity={0.45} /><path d="M26 44 L36 42 L34 48 L30 46 Z" fill="#2a2a3e" opacity={0.7} /></g>),
  shade: () => (<g><path d="M18 46 Q22 30 32 36 Q40 24 46 40 Q52 48 40 50 Q30 54 18 46 Z" fill="#7a4aff" opacity={0.22} /><path d="M30 40 Q34 30 30 22 Q38 28 36 16" stroke="#b84aff" strokeWidth="1.2" fill="none" opacity={0.45} /></g>),
  elf: () => (<g>{pud(32, 40, 14, 8, "#5a080d")}<path d="M14 34 Q28 26 42 30" stroke={STEELL} strokeWidth="2" fill="none" /><path d="M34 44 Q40 40 46 44 M35 47 Q41 43 47 47" stroke="#e8e4f0" strokeWidth="1" fill="none" /></g>),
  golem: () => (<g><ellipse cx="32" cy="46" rx="24" ry="8" fill="#2a2620" opacity={0.5} /><path d="M10 46 L18 38 L26 44 L22 52 Z" fill="#6e6a60" /><path d="M28 40 L38 33 L44 42 L36 48 Z" fill="#5e5a52" /><path d="M42 50 L50 42 L56 50 L48 55 Z" fill="#7a766a" /><rect x="24" y="48" width="8" height="6" fill="#4e4a44" /><circle cx="36" cy="41" r="2" fill="#ff8a1a" opacity={0.6} /></g>),
  necro: () => (<g>{pud(32, 42, 14, 7, "#5a080d")}<path d="M14 36 Q24 28 36 32 Q48 30 52 40 L46 46 L40 42 L34 48 L28 42 L20 46 Z" fill="#1e1a14" /><path d="M24 38 L30 40 M38 36 L42 40" stroke={BLOODB} strokeWidth="1.6" /><circle cx="28" cy="35" r="2.4" fill="#7a8a5a" /><circle cx="40" cy="37" r="1.8" fill="#6a7a4a" /><path d="M44 46 Q48 44 50 47" stroke={BONE} strokeWidth="1.6" fill="none" /><circle cx="24" cy="30" r="1.5" fill="#8aff3a" opacity={0.5} /></g>),
  basil: () => (<g>{pud(32, 42, 15, 8, "#2e4a14")}<path d="M16 40 Q20 30 32 32 Q44 34 44 42 Q40 48 30 46 Q24 44 28 40" stroke="#3e5a2a" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M16 40 L10 42 L15 44 Z" fill="#4a6a32" /></g>),
  demon: () => (<g><ellipse cx="32" cy="40" rx="20" ry="11" fill="#140a06" /><ellipse cx="32" cy="40" rx="13" ry="7" fill="#2a1208" /><ellipse cx="32" cy="40" rx="6" ry="3" fill="#ff5a1a" opacity={0.55} /><path d="M20 40 L14 38 M44 42 L50 44 M30 47 L28 51" stroke="#ff5a1a" strokeWidth="0.9" opacity={0.6} /><path d="M26 32 Q22 24 28 18 Q32 12 28 6 M38 32 Q42 26 38 20" stroke="#6a6060" strokeWidth="2.4" fill="none" opacity={0.4} /><path d="M44 44 Q50 40 48 34" stroke={BONE} strokeWidth="2" fill="none" /></g>),
  lich: () => (<g><ellipse cx="32" cy="44" rx="16" ry="6" fill={BONED} opacity={0.45} /><path d="M16 42 L17 34 L20 38 L22 33 L24 37 L26 32 L28 42 Z" fill="#9a8a3a" /><path d="M22 34 L23 41" stroke={BLK} strokeWidth="0.7" /><path d="M40 38 L44 34 L46 40 Z M48 42 L50 38 L52 43 Z" fill="#7a2aff" opacity={0.8} /><circle cx="36" cy="46" r="3.2" fill={BONE} /><circle cx="44" cy="30" r="4" fill="#a24aff" opacity={0.2} /></g>),
  wyvern: () => (<g>{pud(32, 42, 16, 9, "#5a080d")}<path d="M14 36 L24 22 L30 30 Z" fill="#2e2a3e" opacity={0.85} /><path d="M14 36 L30 30 L46 34 M30 30 L24 22 M30 30 L36 22" stroke={BONE} strokeWidth="1.8" fill="none" /></g>),
  brood: () => (<g>{pud(32, 38, 24, 14, "#4f8a1e", 0.7)}<g stroke="#1e1424" strokeWidth="2.6" fill="none" strokeLinecap="round"><path d="M20 30 Q10 22 14 16" /><path d="M18 38 Q6 38 8 30" /><path d="M20 44 Q12 52 18 54" /><path d="M44 30 Q54 22 50 16" /><path d="M46 38 Q58 38 56 30" /><path d="M44 44 Q52 52 46 54" /></g><ellipse cx="32" cy="34" rx="16" ry="12" fill="#2a1c34" /><path d="M24 26 L30 34 L26 42 M38 28 L34 36 L40 42" stroke={BLK} strokeWidth="1.5" fill="none" /><path d="M8 52 L12 46 L15 52 Z M50 54 L54 48 L57 54 Z M44 12 L48 8 L50 14 Z M14 12 L17 8 L19 13 Z" fill="#d8d0b0" /></g>),
  lord: () => (<g><ellipse cx="32" cy="40" rx="28" ry="15" fill="#2a1038" opacity={0.65} /><ellipse cx="32" cy="40" rx="16" ry="8" fill="#4a2366" opacity={0.5} /><path d="M40 26 Q48 24 52 30 L48 36 L42 34 Z" fill="#3a3d48" /><path d="M10 46 L28 44" stroke="#5a5e6a" strokeWidth="2.4" /><path d="M18 38 L19 30 L22 34 L24 29 L27 38 Z" fill="#8a7a2a" /><path d="M34 46 L36 39 L38 43 L40 38 L42 46 Z" fill="#8a7a2a" /><circle cx="30" cy="40" r="1.4" fill="#b84aff" /><circle cx="22" cy="26" r="1.6" fill="#b84aff" opacity={0.5} /></g>),
};
function remKey(k: string): string { return k === "spiderling" ? "spider" : k; }
function spr(k: string, size: number | string, st?: CSSProperties): ReactNode {
  const body = k === "spiderling" ? <g transform="translate(10 14) scale(0.7)">{SPR.spider()}</g> : (SPR[k] ?? SPR.gen)();
  return <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block", overflow: "visible", ...st }} aria-hidden="true">{body}</svg>;
}
function remSvg(k: string): ReactNode {
  return <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ display: "block" }} aria-hidden="true">{(REM[remKey(k)] ?? REM.gen)()}</svg>;
}
function sprOf(e: Enemy): string {
  if (e.spr) return e.spr;
  if (e.bk === "lord" || e.bk === "brood") return e.bk;
  if (e.name === "Echo Shade") return "shade";
  if (e.name === "Spiderling") return "spiderling";
  const m = MONS.find((x: MonT) => x.name === e.name || x.icon === e.icon);
  return m ? m.id : "gen";
}

// ---- gore visuals (stylized) ----
function bloodBg(seed: number): string {
  const a = 15 + (seed * 37) % 70, b = 15 + (seed * 53) % 70, c2 = 20 + (seed * 71) % 60;
  return `radial-gradient(circle at ${a}% ${b}%, rgba(150,0,0,.38) 0 9%, transparent 10%), radial-gradient(circle at ${100 - a}% ${c2}%, rgba(125,0,0,.3) 0 5%, transparent 6%), radial-gradient(circle at ${b}% ${100 - c2}%, rgba(140,0,0,.25) 0 3%, transparent 4%)`;
}
function enemyGore(e: Enemy): string {
  const L: string[] = [];
  const hurt = 1 - Math.max(0, e.hp) / Math.max(1, e.max);
  if (e.boss) L.push("radial-gradient(circle at 12% 18%, rgba(150,0,0,.4) 0 9%, transparent 10%)", "radial-gradient(circle at 86% 72%, rgba(120,0,0,.36) 0 13%, transparent 14%)", "radial-gradient(circle at 62% 12%, rgba(160,10,10,.3) 0 5%, transparent 6%)", "radial-gradient(circle at 30% 88%, rgba(110,0,0,.3) 0 7%, transparent 8%)", "linear-gradient(180deg, rgba(120,0,0,.38), transparent 24%)");
  if (e.undead) L.push("radial-gradient(circle at 22% 82%, rgba(110,140,60,.32) 0 16%, transparent 17%)", "radial-gradient(circle at 82% 28%, rgba(90,120,50,.28) 0 10%, transparent 11%)", "radial-gradient(circle at 50% 96%, rgba(70,95,40,.28) 0 20%, transparent 21%)", "radial-gradient(circle at 70% 60%, rgba(230,220,190,.18) 0 4%, transparent 5%)");
  if (hurt > 0.15) L.push(`radial-gradient(circle at ${30 + (e.uid * 17) % 40}% ${40 + (e.uid * 29) % 40}%, rgba(150,0,0,${(0.15 + hurt * 0.45).toFixed(2)}) 0 ${Math.round(6 + hurt * 14)}%, transparent ${Math.round(7 + hurt * 14)}%)`);
  return L.join(", ");
}

// ---- run save / backup ----
const RUN_KEY = "dungeon-of-echoes-run-v1";
let MEMRUN: string | null = null;
let STORE_OK: boolean | null = null;
let LAST_SAVE = false;
function storageOk(): boolean {
  STORE_OK = persistsAcrossVisits();
  return STORE_OK;
}
function copySync(text: string): boolean {
  let ok = false;
  let ta: HTMLTextAreaElement | null = null;
  try {
    const prev = document.activeElement as HTMLElement | null;
    ta = document.createElement("textarea");
    ta.value = text;
    ta.readOnly = false; ta.contentEditable = "true";
    Object.assign(ta.style, { position: "fixed", top: "0", left: "0", width: "2em", height: "2em", padding: "0", margin: "0", border: "none", outline: "none", boxShadow: "none", background: "transparent", color: "transparent", opacity: "0", fontSize: "16px", zIndex: "-1" });
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    try { const range = document.createRange(); range.selectNodeContents(ta); const sel = window.getSelection(); if (sel) { sel.removeAllRanges(); sel.addRange(range); } } catch (e) { void e; }
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy") === true;
    if (prev && typeof prev.focus === "function") prev.focus({ preventScroll: true });
  } catch (e) { void e; ok = false; }
  finally { if (ta && ta.parentNode) ta.parentNode.removeChild(ta); }
  return ok;
}
/** Must be called synchronously inside a tap handler (user gesture). */
function copyCode(text: string, done: (ok: boolean) => void): void {
  if (!text) { done(false); return; }
  let reported = false;
  const report = (ok: boolean): void => { if (reported) return; reported = true; done(ok); };
  const syncOk = copySync(text);
  let p: Promise<void> | null = null;
  try { if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") p = navigator.clipboard.writeText(text); } catch (e) { void e; p = null; }
  if (syncOk) { report(true); if (p) p.catch(() => undefined); return; }
  if (p) p.then(() => report(true), () => report(false)); else report(false);
}
let LEAVING = false;
let TRAP_OK = false;
function trapBack(): void { try { window.history.pushState({ doeTrap: Date.now() }, ""); TRAP_OK = true; } catch (e) { void e; TRAP_OK = false; } }
function clearRun(): void { MEMRUN = null; kvSet(RUN_KEY, null); hashWrite(); }
function saveRun(g: Game): boolean {
  if (g.screen === "dead" || g.screen === "victory") { clearRun(); return true; }
  let s = "";
  try { s = JSON.stringify({ uid: UID, g: { ...g, fx: [] } }); } catch (e) { void e; return false; }
  MEMRUN = s;
  return kvSet(RUN_KEY, s);
}
function rawRun(): string | null { return kvGet(RUN_KEY) ?? MEMRUN; }
function isObj(x: unknown): x is Record<string, unknown> { return typeof x === "object" && x !== null && !Array.isArray(x); }
function okInv(i: unknown): boolean { if (!isObj(i)) return false; const id = i.id; return typeof id === "string" && !!IT[id] && typeof i.uid === "number"; }
function normInv(i: Inv): Inv { return { uid: i.uid, id: i.id, ident: i.ident !== false, bon: isObj(i.bon) ? (i.bon as Stats) : {}, freed: i.freed === true }; }
function validRun(x: unknown): Game | null {
  if (!isObj(x)) return null;
  const g = x as unknown as Game;
  const num = (v: unknown): boolean => typeof v === "number" && isFinite(v);
  if (!CLASS_IDS.includes(g.cls) || (g.mode !== "story" && g.mode !== "endless")) return null;
  if (![g.floor, g.lvl, g.xp, g.hp, g.mp, g.gold, g.px, g.py, g.sx, g.sy].every(num)) return null;
  if (g.hp <= 0 || g.floor < 1 || g.lvl < 1) return null;
  if (!Array.isArray(g.map) || g.map.length !== H || !g.map.every((r: unknown) => Array.isArray(r) && r.length === W)) return null;
  if (!Array.isArray(g.seen) || g.seen.length !== H || !g.seen.every((r: unknown) => Array.isArray(r) && r.length === W)) return null;
  if (g.px < 0 || g.py < 0 || g.px >= W || g.py >= H || g.sx < 1 || g.sy < 1 || g.sx >= W - 1 || g.sy >= H - 1 || g.map[g.py][g.px] === 0) return null;
  if (!Array.isArray(g.inv) || !isObj(g.eq) || !Array.isArray(g.mons)) return null;
  if (typeof g.wx !== "number" || typeof g.wy !== "number" || !isFinite(g.wx) || !isFinite(g.wy) || Math.floor(g.wx) !== g.px || Math.floor(g.wy) !== g.py) { g.wx = g.px + 0.5; g.wy = g.py + 0.5; }
  g.inv = g.inv.filter((i: Inv) => okInv(i)).map(normInv).slice(0, MAXINV);
  for (const k of GEAR) { const v = g.eq[k]; if (v === undefined) continue; if (!okInv(v) || IT[v.id].slot !== k) delete g.eq[k]; else g.eq[k] = normInv(v); }
  g.mons = g.mons.filter((mm: MapMon) => isObj(mm) && num(mm.x) && num(mm.y) && num(mm.id) && (mm.boss === true || !!MON[mm.t])).map((mm: MapMon) => ({ ...mm, stun: num(mm.stun) ? mm.stun : 0, awake: mm.awake === true, fx: typeof mm.fx === "number" && Math.floor(mm.fx) === mm.x ? mm.fx : mm.x + 0.5, fy: typeof mm.fy === "number" && Math.floor(mm.fy) === mm.y ? mm.fy : mm.y + 0.5 }));
  g.shop = Array.isArray(g.shop) ? g.shop.filter((i: Inv) => okInv(i)).map(normInv) : [];
  g.log = Array.isArray(g.log) ? g.log.filter((l: LogL) => isObj(l) && typeof l.t === "string").slice(0, 60) : [];
  g.perks = Array.isArray(g.perks) ? g.perks.filter((p: unknown): p is string => typeof p === "string") : [];
  g.bonus = isObj(g.bonus) ? g.bonus : {};
  g.cds = isObj(g.cds) ? g.cds : {};
  g.buffs = isObj(g.buffs) ? { ...freshBuffs(), ...g.buffs } : freshBuffs();
  g.offers = Array.isArray(g.offers) ? g.offers.filter((p: Perk) => isObj(p) && typeof p.id === "string") : [];
  g.goldMult = num(g.goldMult) ? g.goldMult : 1;
  g.kills = num(g.kills) ? g.kills : 0; g.turns = num(g.turns) ? g.turns : 0; g.tokensEarned = num(g.tokensEarned) ? g.tokensEarned : 0;
  g.usedUndying = g.usedUndying === true; g.usedShadow = g.usedShadow === true; g.usedPhoenix = g.usedPhoenix === true; g.usedRes = g.usedRes === true;
  if (typeof g.hp !== "number" || !(g.hp > 0)) return null;
  g.biome = g.biome === "warren" || g.biome === "crypt" ? g.biome : biomeOf(g.floor); g.bannerTs = 0;
  g.fx = []; g.inAb = false; g.sel = num(g.sel) ? g.sel : -1; g.prev = (["map", "combat", "inventory", "shop"] as Screen[]).includes(g.prev) ? g.prev : "map"; g.hurtTs = 0;
  g.stains = Array.isArray(g.stains) ? g.stains.filter((v: unknown): v is number => typeof v === "number" && isFinite(v)) : [];
  g.rem = Array.isArray(g.rem) ? g.rem.filter((v: unknown): v is string => typeof v === "string" && /^\d+:[a-z]+$/.test(v)) : [];
  for (const n of g.stains) if (!g.rem.some((r: string) => r.startsWith(`${n}:`))) g.rem.push(`${n}:gen`);
  g.stains = [];
  const okScreens: Screen[] = ["map", "combat", "inventory", "shop", "upgrade", "codex", "help"];
  if (g.screen === "dead" || g.screen === "victory") return null;
  if (!okScreens.includes(g.screen)) g.screen = "map";
  if (g.screen === "upgrade" && g.offers.length === 0) g.screen = "map";
  const c = g.combat;
  if (g.screen === "combat") {
    if (!isObj(c) || !Array.isArray(c.enemies) || !c.enemies.some((e: Enemy) => isObj(e) && !e.dead && num(e.hp) && e.hp > 0)) { g.combat = null; g.screen = "map"; }
    else { c.itemOpen = c.itemOpen === true; if (!num(c.target)) c.target = 0; if (!num(c.turn)) c.turn = 0; if (!num(c.phase)) c.phase = 1; c.grace = 1.5; c.tele = Array.isArray(c.tele) ? c.tele : []; c.proj = Array.isArray(c.proj) ? c.proj : []; c.shots = []; }
  } else if (g.prev !== "combat") g.combat = null;
  if (g.prev === "combat" && (!isObj(g.combat) || !Array.isArray(g.combat.enemies))) { g.combat = null; g.prev = "map"; }
  if (g.screen === "shop" && !nearMerchant(g) && g.shop.length === 0) g.screen = "map";
  return g;
}
function parseRun(s: string | null): Game | null {
  if (!s) return null;
  try {
    const o = JSON.parse(s) as unknown;
    if (!isObj(o)) return null;
    const g = validRun(o.g);
    if (g && typeof o.uid === "number" && isFinite(o.uid)) UID = Math.max(UID, o.uid + 1);
    return g;
  } catch (e) { void e; return null; }
}
function b64enc(s: string): string { const bytes = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
function b64dec(s: string): string { const bin = atob(s.replace(/\s+/g, "")); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function codeFor(g: Game | null): string {
  try {
    const run = g && g.screen !== "dead" && g.screen !== "victory" ? JSON.stringify({ uid: UID, g: { ...g, fx: [] } }) : rawRun();
    return "DOE1:" + b64enc(JSON.stringify({ v: 1, meta: meta(), run }));
  } catch (e) { void e; return exportCode(); }
}
function exportCode(): string {
  try { return "DOE1:" + b64enc(JSON.stringify({ v: 1, meta: meta(), run: rawRun() })); } catch (e) { void e; return ""; }
}
function importCode(code: string): string {
  try {
    let c = code.trim();
    if (c.startsWith("DOE1:")) c = c.slice(5);
    if (!c) return "Paste a save code first.";
    const o = JSON.parse(b64dec(c)) as unknown;
    if (!isObj(o) || !isObj(o.meta)) return "❌ That code isn't a valid Dungeon of Echoes save.";
    const mm = o.meta;
    const nm: Meta = { tokens: Math.max(0, Math.floor(Number(mm.tokens)) || 0), best: Math.max(0, Math.floor(Number(mm.best)) || 0), owned: {}, disc: [] };
    if (isObj(mm.owned)) for (const cid of CLASS_IDS) { const a = mm.owned[cid]; if (Array.isArray(a)) nm.owned[cid] = a.filter((s: unknown): s is string => typeof s === "string" && TREE[cid].some((n: TNode) => n.id === s)); }
    if (Array.isArray(mm.disc)) nm.disc = mm.disc.filter((s: unknown): s is string => typeof s === "string" && !!IT[s]);
    let runMsg = " No saved run in the code.";
    const rg = typeof o.run === "string" ? parseRun(o.run) : null;
    META = nm; saveMeta();
    if (rg) { saveRun(rg); runMsg = ` Run restored: ${CLS[rg.cls].name}, ${rg.mode === "story" ? "Story floor" : "Endless depth"} ${rg.floor}.`; }
    else clearRun();
    return `✅ Imported: ${nm.tokens} token(s), best depth ${nm.best || "—"}, ${nm.disc.length} codex entries.${runMsg}`;
  } catch (e) { void e; return "❌ Could not read that code. Make sure you pasted the whole thing."; }
}

export default function DungeonOfEchoes() {
  const t = useGrokTheme();
  const G = useRef<Game | null>(null);
  const [toast, setToast] = useState<string>(() => {
    try { const gg = parseRun(rawRun()); if (gg) { G.current = gg; LAST_SAVE = saveRun(gg); return "💾 Resumed where you left off"; } } catch (e) { void e; }
    return "";
  });
  const [, setTick] = useState<number>(0);
  const [exitAsk, setExitAsk] = useState<boolean>(false);
  const [impFocus, setImpFocus] = useState<boolean>(false);
  const [sheet, setSheet] = useState<{ code: string; exit: boolean } | null>(null);
  const [sheetMsg, setSheetMsg] = useState<string>("");
  const sheetRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = sheetRef.current;
    if (sheet && el) { try { el.focus({ preventScroll: true }); el.setSelectionRange(0, el.value.length); } catch (e) { void e; } }
  }, [sheet]);
  const [pickCls, setPickCls] = useState<ClassId>("warrior");
  const [ui, setUi] = useState<Ui>("title");
  const [treeCls, setTreeCls] = useState<ClassId>("warrior");
  const [confirm, setConfirm] = useState<Mode | null>(null);
  const [codeText, setCodeText] = useState<string>("");
  const [imp, setImp] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const inp = useRef<Inp>({ jx: 0, jy: 0, kx: 0, ky: 0, gx: 0, gy: 0, atk: false, katk: false, gatk: false, stepT: 0, monT: 0.5, regT: 0, alt: false, saveT: 0, rT: 0, slowT: 0, shopL: false, vx: 0, vy: 0, idleT: 0 });
  const tickRef = useRef<(dt: number) => void>(() => undefined);
  const padRef = useRef<(dt: number) => void>(() => undefined);
  const keyRef = useRef<(e: KeyboardEvent, down: boolean) => void>(() => undefined);
  const padSt = useRef<{ prev: boolean[]; dir: string; rep: number }>({ prev: [], dir: "", rep: 0 });
  const joyRef = useRef<{ id: number; ox: number; oy: number }>({ id: -1, ox: 0, oy: 0 });
  const joyBase = useRef<HTMLDivElement | null>(null);
  const joyKnob = useRef<HTMLDivElement | null>(null);
  const mapCv = useRef<HTMLCanvasElement | null>(null);
  const worldEl = useRef<HTMLDivElement | null>(null);
  const miniCv = useRef<HTMLCanvasElement | null>(null);
  const bigCv = useRef<HTMLCanvasElement | null>(null);
  const miniT = useRef<number>(0);
  const drawRef = useRef<(force: boolean) => void>(() => undefined);
  const [bigMap, setBigMap] = useState<boolean>(false);
  const [vp, setVp] = useState<{ w: number; h: number }>(() => ({ w: typeof window !== "undefined" ? window.innerWidth : 400, h: typeof window !== "undefined" ? window.innerHeight : 800 }));
  const refresh = useCallback((): void => setTick((n: number) => n + 1), []);
  const run = useCallback((fn: (g: Game) => void): void => { const g = G.current; if (!g) return; fn(g); LAST_SAVE = saveRun(g); refresh(); }, [refresh]);
  const toTitle = (): void => { if (G.current) LAST_SAVE = saveRun(G.current); G.current = null; setConfirm(null); setUi("title"); refresh(); };

  useEffect(() => {
    let alive = true;
    void idbInit().then(() => {
      if (!alive) return;
      if (!BK.local && IDB_OK) {
        META = null;
        if (!G.current) { const gg = parseRun(rawRun()); if (gg) { G.current = gg; LAST_SAVE = saveRun(gg); setToast("💾 Resumed where you left off"); } }
      }
      refresh();
    });
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const g = G.current; if (!g) return;
    const id = window.setTimeout(() => { if (G.current === g) LAST_SAVE = saveRun(g); }, 250);
    return () => window.clearTimeout(id);
  });

  useEffect(() => {
    const flush = (): void => { const g = G.current; if (g) LAST_SAVE = saveRun(g); HASH_T = 0; hashWrite(); };
    const onVis = (): void => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    const onBU = (e: BeforeUnloadEvent): void => { flush(); if (LEAVING) return; try { e.preventDefault(); e.returnValue = ""; } catch (err) { void err; } };
    window.addEventListener("beforeunload", onBU);
    window.addEventListener("blur", flush);
    const onPop = (): void => { if (LEAVING) return; flush(); trapBack(); setExitAsk(true); };
    window.addEventListener("freeze", flush);
    window.addEventListener("popstate", onPop);
    trapBack();
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", onBU);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("freeze", flush);
      window.removeEventListener("blur", flush);
    };
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent): void => keyRef.current(e, true);
    const ku = (e: KeyboardEvent): void => keyRef.current(e, false);
    const clear = (): void => { const I = inp.current; HELD.clear(); I.kx = 0; I.ky = 0; I.katk = false; I.atk = false; };
    const pd = (): void => { try { document.documentElement.removeAttribute("data-doe-nav"); } catch (err) { void err; } };
    const onPad = (e: Event): void => setToast(e.type === "gamepadconnected" ? "🎮 Controller connected" : "🎮 Controller disconnected");
    const onRs = (): void => setVp({ w: window.innerWidth, h: window.innerHeight });
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(orientation: landscape)") : null;
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", clear);
    window.addEventListener("pointerdown", pd, true);
    window.addEventListener("gamepadconnected", onPad);
    window.addEventListener("gamepaddisconnected", onPad);
    window.addEventListener("resize", onRs);
    window.addEventListener("orientationchange", onRs);
    try { if (mq) mq.addEventListener("change", onRs); } catch (err) { void err; }
    let raf = 0; let last = performance.now();
    const frame = (now: number): void => {
      raf = window.requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      try { padRef.current(dt); tickRef.current(dt); } catch (err) { console.error(err); }
    };
    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", clear);
      window.removeEventListener("pointerdown", pd, true);
      window.removeEventListener("gamepadconnected", onPad);
      window.removeEventListener("gamepaddisconnected", onPad);
      window.removeEventListener("resize", onRs);
      window.removeEventListener("orientationchange", onRs);
      try { if (mq) mq.removeEventListener("change", onRs); } catch (err) { void err; }
    };
  }, []);

  useEffect(() => {
    const g = G.current; if (!g || g.fx.length === 0) return;
    const id = window.setTimeout(() => { const now = Date.now(); g.fx = g.fx.filter((x: Fx) => now - x.ts < (x.at === "m" ? 1300 : 1000)); refresh(); }, 1050);
    return () => window.clearTimeout(id);
  });
  useEffect(() => { drawRef.current(true); });
  useEffect(() => { const gg = G.current; const cv = bigCv.current; if (bigMap && gg && cv) drawMini(cv, gg, true); }, [bigMap, vp]);

  const col = (c: string): string => c.startsWith("#") ? c : c === "bad" ? t.text.danger : c === "heal" ? t.text.success : c === "loot" ? t.text.warning : c === "good" ? t.text.accent : c === "dmg" ? t.text.primary : t.text.secondary;
  const card: CSSProperties = { background: t.bg.elevated, border: `1px solid ${t.border.default}`, borderRadius: 12, padding: 10, boxSizing: "border-box", minWidth: 0 };
  const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
  const small: CSSProperties = { fontSize: 12, color: t.text.secondary, lineHeight: 1.35 };
  const head: CSSProperties = { fontWeight: 700, fontSize: 13, color: t.text.secondary };

  const btn = (label: ReactNode, onClick: () => void, opts?: { disabled?: boolean; tone?: "primary" | "danger" | "accent"; grow?: boolean; tall?: boolean; key?: string }): ReactNode => {
    const tone = opts?.tone;
    const bg = tone === "primary" ? t.fill.primary : tone === "danger" ? t.fill.dangerSubtle : tone === "accent" ? t.fill.accentSubtle : t.fill.secondary;
    const fg = tone === "primary" ? t.text.onPrimary : t.text.primary;
    return (
      <button key={opts?.key} onClick={onClick} disabled={opts?.disabled}
        style={{ background: bg, color: fg, border: `1px solid ${t.border.default}`, borderRadius: 10, padding: "8px 10px", minHeight: opts?.tall ? 56 : 46, fontSize: 14, fontWeight: 600, fontFamily: "inherit", opacity: opts?.disabled ? 0.45 : 1, cursor: opts?.disabled ? "default" : "pointer", flex: opts?.grow ? "1 1 0" : undefined, minWidth: 0, touchAction: "manipulation", lineHeight: 1.2 }}>
        {label}
      </button>
    );
  };
  const bar = (v: number, max: number, color: string, label: string): ReactNode => (
    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.text.secondary }}><span>{label}</span><span>{Math.max(0, Math.round(v))}/{max}</span></div>
      <div style={{ height: 8, borderRadius: 4, background: t.fill.secondary, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%`, height: "100%", background: color, transition: "width .25s" }} />
      </div>
    </div>
  );
  const fxLayer = (g: Game, at: string): ReactNode => (
    <div style={{ position: "absolute", right: 6, top: 2, display: "flex", flexDirection: "column", alignItems: "flex-end", pointerEvents: "none" }}>
      {g.fx.filter((x: Fx) => x.at === at && Date.now() - x.ts < 1000).map((x: Fx) => (
        <span key={x.id} style={{ animation: "doeFloat 1s ease-out forwards", fontWeight: 800, fontSize: 16, color: col(x.c) }}>{x.text}</span>
      ))}
    </div>
  );
  const arenaFx = (gg: Game, at: string): ReactNode => (
    <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 8 }}>
      {gg.fx.filter((x: Fx) => (x.at === at || (at === "p" && x.at === "m")) && Date.now() - x.ts < 1000).map((x: Fx) => (
        <span key={x.id} style={{ animation: "doeFloat 1s ease-out forwards", fontWeight: 800, fontSize: 13, color: col(x.c), textShadow: "0 1px 3px #000" }}>{x.text}</span>
      ))}
    </div>
  );
  // short-lived notices (level ups, boss warnings, hazards, shop results) replace the old log panel
  const notes = (g0: Game, inline: boolean): ReactNode => {
    const now = Date.now();
    const ls = g0.log.filter((l: LogL) => l.ts !== undefined && now - l.ts < 3600 && l.c !== "dmg").slice(0, 3);
    if (ls.length === 0) return null;
    return (
      <div data-notes="1" style={inline ? { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, pointerEvents: "none" } : { position: "absolute", left: 6, right: 6, bottom: 8, display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 4, pointerEvents: "none", zIndex: 7 }}>
        {ls.map((l: LogL, i: number) => <div key={`${l.ts}-${i}-${l.t}`} style={{ maxWidth: "94%", fontSize: 12, fontWeight: 700, lineHeight: 1.3, padding: "4px 10px", borderRadius: 999, background: "rgba(10,8,14,.86)", border: `1px solid ${col(l.c)}`, color: col(l.c), textAlign: "center", animation: `doeNote 3.6s ease-in ${-(now - (l.ts ?? now))}ms forwards` }}>{l.t}</div>)}
      </div>
    );
  };
  const logBox = (g: Game, n: number): ReactNode => (
    <div data-noj="1" style={{ ...card, maxHeight: 130, overflowY: "auto", padding: 8, touchAction: "pan-y" }}>
      {g.log.slice(0, n).map((l: LogL, i: number) => (
        <div key={i} style={{ fontSize: 12, lineHeight: 1.4, color: col(l.c), opacity: i === 0 ? 1 : Math.max(0.55, 1 - i * 0.05) }}>{l.t}</div>
      ))}
    </div>
  );
  const statChips = (s: Stats | undefined): ReactNode => {
    if (!s) return null;
    const ss: Stats = s;
    const keys = Object.keys(ss) as StatKey[];
    if (keys.length === 0) return null;
    return <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", fontSize: 13 }}>{keys.map((k: StatKey) => { const v = ss[k] ?? 0; return <span key={k} style={{ color: v >= 0 ? t.text.success : t.text.danger, fontWeight: 600 }}>{v >= 0 ? "+" : ""}{v} {STAT_LABEL[k]}</span>; })}</div>;
  };
  const clsLabel = (it: ItemT): string => it.cls ? `${it.cls.map((c: ClassId) => CLS[c].name).join("/")} only` : "All classes";
  const tplDetail = (it: ItemT): ReactNode => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 15, color: RCOL[it.r], fontWeight: 600 }}>{it.icon} {it.name}</div>
      <div style={small}>{RAR[it.r]} {SLOT_NAME[it.slot]} · {clsLabel(it)}{it.cursed ? " · " : ""}{it.cursed && <span style={{ color: t.text.danger, fontWeight: 700 }}>Cursed</span>}</div>
      {statChips(it.st)}
      {it.set && <div style={{ fontSize: 12, color: t.text.accent }}>Set: {SETS[it.set].name} — {SETS[it.set].desc}</div>}
      {it.desc && <div style={{ fontSize: 13, color: it.cursed ? t.text.danger : it.r === 4 ? RCOL[4] : t.text.primary }}>{it.sp ? "★ " : ""}{it.desc}</div>}
    </div>
  );
  const splat = (seed: number): ReactNode => (
    <div key={`s${seed}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {[0, 1, 2, 3, 4, 5, 6].map((i: number) => {
        const a = (seed * 7 + i * 61) % 100, b = (seed * 13 + i * 37) % 100, s = 5 + ((seed + i * 5) % 11);
        return <span key={i} style={{ position: "absolute", left: `${8 + a * 0.8}%`, top: `${8 + b * 0.75}%`, width: s, height: s * (i % 2 ? 1.4 : 1), borderRadius: "50% 45% 55% 40%", background: i % 3 ? "#b3001b" : "#7a0010", opacity: 0, animation: `doeSplat .75s ease-out ${i * 0.03}s both` }} />;
      })}
    </div>
  );
  const instDetail = (inv: Inv, g: Game): ReactNode => {
    const it = IT[inv.id];
    if (!inv.ident) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.text.secondary }}>{instIcon(inv)} {instName(inv)}</div>
        <div style={small}>{SLOT_NAME[it.slot]} · rarity, stats and enchantments unknown. It might be cursed. Equip it to reveal (risky), pay a merchant, or read a Scroll of Identify.</div>
      </div>
    );
    const sc = it.set ? (setCounts(g)[it.set] ?? 0) : 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontSize: 15, color: RCOL[it.r], fontWeight: 600 }}>{it.icon} {instName(inv)}</div>
        <div style={small}>{RAR[it.r]} {SLOT_NAME[it.slot]} · {clsLabel(it)}{it.cursed ? " · " : ""}{it.cursed && <span style={{ color: t.text.danger, fontWeight: 700 }}>{inv.freed ? "Cursed (lifted)" : "Cursed"}</span>}</div>
        {statChips(it.st)}
        {Object.keys(inv.bon).length > 0 && <div style={{ fontSize: 11, color: t.text.tertiary }}>Rolled bonuses:</div>}
        {statChips(inv.bon)}
        {it.set && <div style={{ fontSize: 12, color: t.text.accent }}>Set: {SETS[it.set].name} ({sc}/{SETS[it.set].n} worn) — {SETS[it.set].desc}</div>}
        {it.desc && <div style={{ fontSize: 13, color: it.cursed ? t.text.danger : it.r === 4 ? RCOL[4] : t.text.primary }}>{it.sp ? "★ " : ""}{it.desc}</div>}
        {it.cls && !it.cls.includes(g.cls) && <div style={{ fontSize: 12, color: t.text.danger }}>Your class can't equip this (sell it).</div>}
      </div>
    );
  };

  const g = G.current;
  const land = vp.w > vp.h && vp.h <= 640;
  const sa = (s: string, b: number): string => `max(${b}px, env(safe-area-inset-${s}))`;
  const root: CSSProperties = { position: "relative", fontFamily: t.font.family, color: t.text.primary, background: t.bg.base, maxWidth: land ? 1000 : 520, width: "100%", margin: "0 auto", padding: `${sa("top", 10)} ${sa("right", 10)} ${sa("bottom", 10)} ${sa("left", 10)}`, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10, userSelect: "none", overflowX: "hidden" };
  const cols: CSSProperties = land ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10, alignItems: "start" } : { display: "flex", flexDirection: "column", gap: 10 };
  const colS: CSSProperties = { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 };
  const keepPlaying = (): void => { setExitAsk(false); };
  const leaveNow = (): void => { LEAVING = true; try { window.history.go(TRAP_OK ? -2 : -1); } catch (e) { void e; } window.setTimeout(() => { LEAVING = false; }, 1500); };
  const goHome = (): void => {
    const code = codeFor(G.current);
    copyCode(code, (ok: boolean) => { if (ok) setToast("📋 Save code copied"); else { setSheetMsg(""); setSheet({ code, exit: false }); } });
    const gg = G.current; if (gg) LAST_SAVE = saveRun(gg);
    toTitle();
  };
  const confirmExit = (): void => {
    const code = codeFor(G.current);
    copyCode(code, (ok: boolean) => { if (ok) { setToast("📋 Save code copied"); window.setTimeout(leaveNow, 0); } else { setSheetMsg(""); setSheet({ code, exit: true }); } });
    const gg = G.current; if (gg) LAST_SAVE = saveRun(gg);
    setExitAsk(false);
  };
  const selAll = (e: { currentTarget: HTMLTextAreaElement }): void => { try { e.currentTarget.setSelectionRange(0, e.currentTarget.value.length); } catch (err) { void err; } };
  const closeSheet = (): void => { const ex = sheet ? sheet.exit : false; setSheet(null); if (ex) leaveNow(); };
  const sheetEl = sheet ? (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 12, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 480, background: t.bg.elevated, color: t.text.primary, border: `1px solid ${t.border.default}`, borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10, fontFamily: t.font.family, boxSizing: "border-box" }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>💾 Your save code</div>
        <div style={{ fontSize: 13, color: t.text.secondary }}>Automatic copy was blocked on this device. Keep this code somewhere safe (notes app, message to yourself) and restore it later with 📋 Paste save code.</div>
        <textarea ref={sheetRef} readOnly value={sheet.code} onFocus={selAll} onClick={selAll} style={{ width: "100%", boxSizing: "border-box", height: 110, fontFamily: t.font.mono, fontSize: 16, padding: 8, borderRadius: 10, border: `1px solid ${t.border.default}`, background: t.bg.subtle, color: t.text.primary, wordBreak: "break-all", userSelect: "text", WebkitUserSelect: "text", resize: "none" }} />
        {sheetMsg && <div style={{ fontSize: 13, fontWeight: 700 }}>{sheetMsg}</div>}
        <div style={{ fontSize: 12, color: t.text.secondary }}>If Copy doesn't work, long-press the code and tap Copy.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => {
            const el = sheetRef.current; let ok = false;
            if (el) { try { el.focus({ preventScroll: true }); el.select(); el.setSelectionRange(0, el.value.length); ok = document.execCommand("copy") === true; } catch (e) { void e; ok = false; } }
            if (ok) setSheetMsg("✅ Copied! You can close this now.");
            else copyCode(sheet.code, (ok2: boolean) => setSheetMsg(ok2 ? "✅ Copied! You can close this now." : "❌ Copy is blocked here — long-press the code above and tap Copy."));
          }} style={{ flex: "1 1 140px", minHeight: 52, borderRadius: 12, border: "none", background: t.fill.primary, color: t.text.onPrimary, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>📋 Copy</button>
          <button onClick={closeSheet} style={{ flex: "1 1 120px", minHeight: 52, borderRadius: 12, border: `1px solid ${t.border.default}`, background: sheet.exit ? t.fill.dangerSubtle : t.fill.secondary, color: sheet.exit ? t.text.danger : t.text.primary, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{sheet.exit ? "Close & exit" : "Continue"}</button>
          {sheet.exit && <button onClick={() => setSheet(null)} style={{ flex: "1 1 120px", minHeight: 52, borderRadius: 12, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Keep playing</button>}
        </div>
      </div>
    </div>
  ) : null;
  const exitModal = exitAsk ? (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 340, background: t.bg.elevated, color: t.text.primary, border: `1px solid ${t.border.default}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10, fontFamily: t.font.family }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Are you sure you want to exit?</div>
        <div style={{ fontSize: 13, color: t.text.secondary }}>{LAST_SAVE || !G.current ? "💾 Your progress is saved — you'll resume right where you left off." : "⚠️ This browser blocks saving. Use 💾 Save Code first or progress may be lost."}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button autoFocus onClick={keepPlaying} style={{ flex: "1 1 120px", minHeight: 48, borderRadius: 12, border: "none", background: t.fill.primary, color: t.text.onPrimary, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Keep playing</button>
          <button onClick={confirmExit} style={{ flex: "1 1 120px", minHeight: 48, borderRadius: 12, border: `1px solid ${t.border.default}`, background: t.fill.dangerSubtle, color: t.text.danger, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Exit</button>
        </div>
      </div>
    </div>
  ) : null;
  const joyDown = (e: { clientX: number; clientY: number; pointerId: number; target: EventTarget | null; currentTarget: HTMLDivElement }): void => {
    const tg = e.target as HTMLElement | null;
    if (tg && typeof tg.closest === "function" && tg.closest("button, textarea, input, a, [data-noj]")) return;
    if (e.clientX > window.innerWidth / 2 || joyRef.current.id !== -1) return;
    joyRef.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { void err; }
    const b = joyBase.current; if (b) { b.style.display = "block"; b.style.left = `${e.clientX}px`; b.style.top = `${e.clientY}px`; }
    const kn = joyKnob.current; if (kn) kn.style.transform = "translate(-50%, -50%)";
  };
  const joyMove = (e: { clientX: number; clientY: number; pointerId: number }): void => {
    const J = joyRef.current; if (J.id !== e.pointerId) return;
    let dx = e.clientX - J.ox, dy = e.clientY - J.oy; const R0 = 46; const m = Math.hypot(dx, dy);
    if (m > R0) {
      // the base follows the finger, so reversing direction never has to travel back through the centre
      J.ox += (dx / m) * (m - R0); J.oy += (dy / m) * (m - R0); dx = (dx / m) * R0; dy = (dy / m) * R0;
      const bb = joyBase.current; if (bb) { bb.style.left = `${J.ox}px`; bb.style.top = `${J.oy}px`; }
    }
    const I = inp.current; const n = Math.min(R0, m) / R0;
    if (n < 0.12) { I.jx = 0; I.jy = 0; } else { const k = Math.min(1, 0.4 + ((n - 0.12) / 0.33) * 0.6) / n; I.jx = (dx / R0) * k; I.jy = (dy / R0) * k; }
    const b = joyBase.current; if (b && b.style.display !== "block") { b.style.display = "block"; b.style.left = `${J.ox}px`; b.style.top = `${J.oy}px`; }
    const kn = joyKnob.current; if (kn) kn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };
  const joyUp = (e: { pointerId: number }): void => {
    if (joyRef.current.id !== e.pointerId) return;
    joyRef.current = { id: -1, ox: 0, oy: 0 }; inp.current.jx = 0; inp.current.jy = 0;
    const b = joyBase.current; if (b) b.style.display = "none";
  };
  const joyH = { onPointerDown: joyDown, onPointerMove: joyMove, onPointerUp: joyUp, onPointerCancel: joyUp };
  const joyEl = (
    <div ref={joyBase} style={{ display: "none", position: "fixed", width: 104, height: 104, marginLeft: -52, marginTop: -52, borderRadius: "50%", border: "2px solid rgba(255,220,160,.45)", background: "radial-gradient(circle, rgba(255,200,120,.12), rgba(0,0,0,.3))", pointerEvents: "none", zIndex: 40 }}>
      <div ref={joyKnob} style={{ position: "absolute", left: "50%", top: "50%", width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #f3d9a6, #8a5a2a)", boxShadow: "0 0 12px rgba(255,180,90,.6)", transform: "translate(-50%, -50%)" }} />
    </div>
  );
  const toastEl = toast ? <div key={toast} role="status" style={{ position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 60, maxWidth: "90vw", fontSize: 13, fontWeight: 700, padding: "8px 14px", borderRadius: 999, background: t.bg.elevated, color: t.text.primary, border: `1px solid ${t.border.default}`, boxShadow: "0 4px 14px rgba(0,0,0,.35)", pointerEvents: "none", animation: "doeFlash 2.6s ease-in forwards", fontFamily: t.font.family }}>{toast}</div> : null;
  const toggleMap = (): void => {
    const gg = G.current; const I = inp.current;
    HELD.clear(); I.kx = 0; I.ky = 0; I.vx = 0; I.vy = 0;
    if (!gg || gg.screen !== "map") { setBigMap(false); return; }
    setBigMap((b: boolean) => !b);
  };
  const bigSide = land ? Math.max(160, Math.min(vp.h - 36, vp.w - 260)) : Math.max(160, Math.min(vp.w - 28, vp.h - 250));
  const bigMapEl = bigMap && g && g.screen === "map" ? (
    <div role="dialog" aria-label="Dungeon map" data-noj="1" data-bigmap="1" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(4,3,8,.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: `${sa("top", 10)} ${sa("right", 10)} ${sa("bottom", 10)} ${sa("left", 10)}`, boxSizing: "border-box", fontFamily: t.font.family, color: t.text.primary }}>
      <div style={{ display: "flex", flexDirection: land ? "row" : "column", gap: 14, alignItems: "center", maxWidth: "100%", maxHeight: "100%" }}>
        <canvas ref={bigCv} onClick={toggleMap} style={{ width: bigSide, height: bigSide, borderRadius: 12, border: `1px solid ${t.border.strong}`, display: "block", flex: "0 0 auto" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 170, maxWidth: 320 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🗺️ {g.mode === "story" ? `Floor ${g.floor}` : `Depth ${g.floor}`} · {BIOME[g.biome ?? biomeOf(g.floor)].name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 12, color: t.text.secondary }}>
            <span><b style={{ color: "#fff2c8" }}>●</b> You</span><span><b style={{ color: "#6dffa0" }}>■</b> Stairs</span><span><b style={{ color: "#ffcc4d" }}>●</b> Merchant</span><span><b style={{ color: "#c98a3a" }}>●</b> Chest</span><span><b style={{ color: "#ff6b6b" }}>●</b> Monster in sight</span>
          </div>
          <div style={{ fontSize: 12, color: t.text.tertiary }}>Only explored areas are shown. The game is paused.</div>
          <button autoFocus onClick={toggleMap} style={{ minHeight: 46, borderRadius: 12, border: "none", background: t.fill.primary, color: t.text.onPrimary, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Close map (M / Esc / B)</button>
        </div>
      </div>
    </div>
  ) : null;
  const style = <div style={{ display: "contents" }}>{exitModal}{sheetEl}{bigMapEl}{toastEl}{joyEl}<style>{"html[data-doe-nav=\"1\"] button:focus,html[data-doe-nav=\"1\"] textarea:focus{outline:3px solid #ffcc4d!important;outline-offset:2px!important;box-shadow:0 0 0 6px rgba(255,204,77,.35)!important}.doe-cols>*{break-inside:avoid;margin-bottom:10px}@keyframes doeFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-26px)}}@keyframes doePulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes doeFlash{0%{opacity:1}100%{opacity:0}}@keyframes doeSplat{0%{transform:scale(.2);opacity:1}60%{opacity:.95}100%{transform:scale(1.5) translateY(6px);opacity:0}}@keyframes doeDrip{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1.2)}}@keyframes doeFlick{0%,100%{opacity:1}40%{opacity:.8}70%{opacity:.92}}@keyframes doeBanner{0%{opacity:0;transform:scale(.9)}15%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}@keyframes doeDrift{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(18px,-160px);opacity:0}}@keyframes doeRise{0%{opacity:0;transform:translateY(6px)}12%{opacity:1;transform:translateY(0)}65%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}@keyframes doeNote{0%{opacity:0;transform:translateY(4px)}8%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}@keyframes doeMist{0%{transform:translateX(-12%)}100%{transform:translateX(12%)}}"}</style></div>;
  const back = (): void => { if (g) run((gg: Game) => { gg.screen = gg.prev; }); else setUi("title"); };
  // ---------- INPUT: keyboard, gamepad, real-time loop ----------
  const isPlay = (): boolean => { const gg = G.current; return !!gg && !exitAsk && !sheet && !bigMap && (gg.screen === "map" || (gg.screen === "combat" && !!gg.combat && !gg.combat.itemOpen)); };
  const openExit = (): void => { const gg = G.current; if (gg) LAST_SAVE = saveRun(gg); HELD.clear(); const I = inp.current; I.kx = 0; I.ky = 0; I.katk = false; I.atk = false; setExitAsk(true); };
  const cycleTarget = (d: number): void => run((x: Game) => { const c = x.combat; if (!c) return; const n = c.enemies.length; for (let k = 1; k <= n; k++) { const i = (((c.target + d * k) % n) + n) % n; const e = c.enemies[i]; if (e && !e.dead && e.hp > 0) { c.target = i; return; } } });
  const cycleTab = (d: number): void => {
    const gg = G.current; const n = CLASS_IDS.length;
    if (!gg && ui === "tree") { setTreeCls(CLASS_IDS[(CLASS_IDS.indexOf(treeCls) + d + n) % n]); return; }
    if (!gg && ui === "title") { setPickCls(CLASS_IDS[(CLASS_IDS.indexOf(pickCls) + d + n) % n]); return; }
    if (gg && gg.screen === "combat") cycleTarget(d);
  };
  const goBack = (): void => {
    if (bigMap) { setBigMap(false); return; }
    if (sheet) { setSheet(null); return; }
    if (exitAsk) { keepPlaying(); return; }
    const gg = G.current;
    if (!gg) {
      if (ui === "title") { if (confirm) setConfirm(null); else openExit(); return; }
      setMsg(""); setImpFocus(false); setUi("title"); return;
    }
    switch (gg.screen) {
      case "codex": case "help": back(); return;
      case "inventory": run((x: Game) => { if (x.sel !== -1) x.sel = -1; else x.screen = "map"; }); return;
      case "shop": run((x: Game) => { x.screen = "map"; }); return;
      case "combat": if (gg.combat && gg.combat.itemOpen) { run((x: Game) => { if (x.combat) x.combat.itemOpen = false; }); return; } openExit(); return;
      case "map": openExit(); return;
      case "dead": case "victory": toTitle(); return;
      default: return;
    }
  };
  const navOk = (): void => {
    const a = document.activeElement as HTMLElement | null;
    if (a && a !== document.body && a.tagName === "BUTTON" && navLayer().contains(a)) { a.click(); return; }
    navMove(0, 1, true);
  };
  const abil = (i: number): void => {
    const gg = G.current; if (!gg || gg.screen !== "combat") return;
    const a = CLS[gg.cls].abs[i]; if (!a) return;
    if ((gg.cds[a.id] ?? 0) > 0 || gg.mp < abCost(gg, a)) { addFx(gg, (gg.cds[a.id] ?? 0) > 0 ? "cooldown" : "no MP", "sys", "p"); refresh(); return; }
    run((x: Game) => rtAbility(x, a.id));
  };
  const mvVec = (): [number, number] => { const I = inp.current; let x = I.jx + I.kx + I.gx, y = I.jy + I.ky + I.gy; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } return [x, y]; };
  const dodge = (): void => { const [x, y] = mvVec(); run((gg: Game) => rtDodge(gg, x, y)); };
  const interact = (): void => run((gg: Game) => { if (gg.screen === "map" && nearMerchant(gg)) { gg.screen = "shop"; gg.sel = -1; inp.current.shopL = true; } });
  const openBag = (): void => run((gg: Game) => {
    if (gg.screen === "map") { gg.screen = "inventory"; gg.sel = -1; }
    else if (gg.screen === "inventory") { gg.screen = "map"; gg.sel = -1; }
    else if (gg.screen === "combat" && gg.combat) gg.combat.itemOpen = !gg.combat.itemOpen;
  });
  drawRef.current = (force: boolean): void => {
    const gg = G.current; if (!gg || gg.screen !== "map") return;
    const cv = mapCv.current; if (cv) drawView(cv, gg, force);
    const we = worldEl.current; if (we) we.style.transform = worldTf(gg);
    const mc = miniCv.current; const now = performance.now();
    if (mc && (force || now - miniT.current > 120)) { miniT.current = now; drawMini(mc, gg, false); }
  };
  const openPage = (s: Screen): void => run((gg: Game) => { if (gg.screen === "map") { gg.prev = "map"; gg.screen = s; } });
  keyRef.current = (e: KeyboardEvent, down: boolean): void => {
    const tg = e.target as HTMLElement | null;
    const typing = !!tg && (tg.tagName === "TEXTAREA" || tg.tagName === "INPUT" || tg.isContentEditable === true);
    const I = inp.current;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const DIR: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const recalc = (): void => { let x = 0, y = 0; HELD.forEach((h: string) => { const v = DIR[h]; if (v) { x += v[0]; y += v[1]; } }); I.kx = Math.sign(x); I.ky = Math.sign(y); };
    if (!down) { if (DIR[k]) { HELD.delete(k); recalc(); } if (k === " " || k === "j") I.katk = false; return; }
    if (typing) { if (k === "Escape" && tg) { tg.blur(); e.preventDefault(); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    try { document.documentElement.setAttribute("data-doe-nav", "1"); } catch (err) { void err; }
    const gg = G.current; const play = isPlay();
    const act = document.activeElement as HTMLElement | null;
    const onBtn = !!act && act.tagName === "BUTTON";
    if (DIR[k]) {
      e.preventDefault();
      if (play) { HELD.add(k); recalc(); return; }
      const now = Date.now(); if (e.repeat && now - NAV_T < 110) return; NAV_T = now;
      navMove(DIR[k][0], DIR[k][1], false); return;
    }
    if (k === "Escape" || (k === "Backspace" && !play)) { e.preventDefault(); goBack(); return; }
    if (k === "m" && gg && gg.screen === "map" && !exitAsk && !sheet) { e.preventDefault(); toggleMap(); return; }
    if (!play) {
      if ((k === "Enter" || k === " ") && !onBtn) { e.preventDefault(); navOk(); return; }
      if (k === "q" || k === "[") { cycleTab(-1); return; }
      if (k === "e" || k === "]") { cycleTab(1); return; }
      if ((k === "i" || k === "b") && gg && (gg.screen === "inventory" || gg.screen === "combat")) { e.preventDefault(); openBag(); return; }
      return;
    }
    if (!gg) return;
    if (gg.screen === "combat") {
      if (k === " " || k === "j") { if (onBtn && k === " ") return; e.preventDefault(); I.katk = true; run((x: Game) => rtAttack(x)); return; }
      if (k === "Enter") { if (onBtn) return; e.preventDefault(); run((x: Game) => rtAttack(x)); return; }
      if (k === "1" || k === "2" || k === "3") { abil(Number(k) - 1); return; }
      if (k === "Shift" || k === "k") { dodge(); return; }
      if (k === "i" || k === "b") { openBag(); return; }
      if (k === "f") { run((x: Game) => rtFlee(x)); return; }
      if (k === "Tab") { e.preventDefault(); cycleTarget(e.shiftKey ? -1 : 1); return; }
      if (k === "q") { cycleTarget(-1); return; }
      if (k === "e") { cycleTarget(1); return; }
      return;
    }
    if ((k === "Enter" || k === " " || k === "e") && !onBtn) { e.preventDefault(); interact(); return; }
    if (k === "i" || k === "b") { openBag(); return; }
    if (k === "c") { openPage("codex"); return; }
    if (k === "h" || k === "?") { openPage("help"); return; }
  };
  padRef.current = (dt: number): void => {
    const I = inp.current; const P = padSt.current;
    let gp: Gamepad | null = null;
    try { const ps = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) { gp = p; break; } } catch (err) { void err; }
    if (!gp) { I.gx = 0; I.gy = 0; I.gatk = false; P.prev = []; return; }
    const pad: Gamepad = gp;
    const b = (i: number): boolean => !!pad.buttons[i] && pad.buttons[i].pressed;
    let ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
    { const sm = Math.hypot(ax, ay); if (sm < 0.22) { ax = 0; ay = 0; } else { const k = Math.min(1, (sm - 0.22) / 0.63) / sm; ax *= k; ay *= k; } }
    if (b(14)) ax = -1;
    if (b(15)) ax = 1;
    if (b(12)) ay = -1;
    if (b(13)) ay = 1;
    const play = isPlay(); const gg = G.current;
    if (pad.buttons.some((x: GamepadButton) => x.pressed) || Math.abs(ax) > 0.5 || Math.abs(ay) > 0.5) { try { document.documentElement.setAttribute("data-doe-nav", "1"); } catch (err) { void err; } }
    if (play) { I.gx = ax; I.gy = ay; P.dir = ""; }
    else {
      I.gx = 0; I.gy = 0;
      const dir = Math.abs(ax) > 0.5 || Math.abs(ay) > 0.5 ? (Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? "r" : "l") : (ay > 0 ? "d" : "u")) : "";
      const V: Record<string, [number, number]> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
      if (dir !== P.dir) { P.dir = dir; P.rep = 0.4; const v = V[dir]; if (v) navMove(v[0], v[1], false); }
      else if (dir) { P.rep -= dt; if (P.rep <= 0) { P.rep = 0.15; const v = V[dir]; if (v) navMove(v[0], v[1], false); } }
    }
    I.gatk = play && !!gg && gg.screen === "combat" && b(0);
    const prev = P.prev;
    const edge = (i: number): boolean => b(i) && !prev[i];
    P.prev = pad.buttons.map((x: GamepadButton) => x.pressed);
    if (play && gg) {
      if (gg.screen === "combat") {
        if (edge(0)) run((x: Game) => rtAttack(x));
        if (edge(1)) dodge();
        if (edge(2)) abil(0);
        if (edge(3)) abil(1);
        if (edge(5)) abil(2);
        if (edge(4)) cycleTarget(1);
        if (edge(8)) openBag();
      } else {
        if (edge(0)) interact();
        if (edge(3)) openBag();
        if (edge(2)) openPage("codex");
        if (edge(8)) toggleMap();
        if (edge(11)) openPage("help");
      }
      if (edge(9)) openExit();
    } else {
      if (bigMap && (edge(8) || edge(0))) { toggleMap(); return; }
      if (edge(0)) navOk();
      if (edge(1)) goBack();
      if (edge(4)) cycleTab(-1);
      if (edge(5)) cycleTab(1);
      if (edge(9)) { if (exitAsk) keepPlaying(); else goBack(); }
    }
  };
  tickRef.current = (dt: number): void => {
    const gg = G.current; const I = inp.current;
    if (!gg || exitAsk || sheet || bigMap || document.hidden) return;
    const [mx, my] = mvVec();
    if (gg.screen === "map") {
      const chg = rtMap(gg, dt, mx, my, I);
      drawRef.current(false);
      if ((gg.screen as Screen) !== "map") { if ((gg.screen as Screen) === "combat") rtInit(gg); I.rT = 0; refresh(); }
      else if (chg) { I.rT += dt; if (I.rT >= 0.03) { I.rT = 0; refresh(); } }
    } else if (gg.screen === "combat" && gg.combat && !gg.combat.itemOpen) {
      rtStep(gg, dt, mx, my, I.atk || I.katk || I.gatk);
      I.rT += dt; if (I.rT >= 0.033 || gg.screen !== "combat") { I.rT = 0; refresh(); }
    } else return;
    I.saveT += dt;
    if (I.saveT >= 1.5 || (gg.screen as Screen) === "dead") { I.saveT = 0; LAST_SAVE = saveRun(gg); }
  };
  const m = meta();

  // ---------- CODEX ----------
  if ((g && g.screen === "codex") || (!g && ui === "codex")) {
    const slots: Slot[] = ["weapon", "armor", "helmet", "ring", "amulet", "consumable"];
    return (
      <div style={root}>{style}
        <div style={row}><div style={{ fontSize: 20, fontWeight: 700, flex: "1 1 auto" }}>📖 Item Codex</div>{btn("Back", back)}</div>
        <div style={small}>Discovered {ITEMS.filter((i: ItemT) => m.disc.includes(i.id)).length} of {ITEMS.length} items. Items are discovered when you find or identify them.</div>
        <div style={row}>{RAR.map((r: string, i: number) => <span key={r} style={{ color: RCOL[i], fontSize: 12, fontWeight: 700 }}>● {r}</span>)}</div>
        {slots.map((s: Slot) => (
          <div key={s} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...head, marginTop: 4 }}>{SLOT_NAME[s].toUpperCase()}S</div>
            {ITEMS.filter((i: ItemT) => i.slot === s).map((i: ItemT) => (
              <div key={i.id} style={card}>{m.disc.includes(i.id) ? tplDetail(i) : <div style={{ color: t.text.tertiary, fontSize: 14 }}>❔ ??? <span style={{ fontSize: 12 }}>— undiscovered {SLOT_NAME[s].toLowerCase()}</span></div>}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ---------- HELP ----------
  if ((g && g.screen === "help") || (!g && ui === "help")) {
    return (
      <div className={land ? "doe-cols" : undefined} style={land ? { ...root, display: "block", columnCount: 2, columnGap: 16 } : root}>{style}
        <div style={row}><div style={{ fontSize: 20, fontWeight: 700, flex: "1 1 auto" }}>❓ How to Play</div>{btn("Back", back)}</div>
        {HELP.map((h: [string, string]) => (
          <div key={h[0]} style={card}><div style={{ fontWeight: 700, marginBottom: 3 }}>{h[0]}</div><div style={{ fontSize: 13, lineHeight: 1.45 }}>{h[1]}</div></div>
        ))}
      </div>
    );
  }

  // ---------- SAVE CODE ----------
  if (!g && ui === "save") {
    const manual = "Tap the code box, select all, and copy it manually.";
    const doCopy = (): void => {
      const code = exportCode(); setCodeText(code);
      if (!code) { setMsg("❌ Could not build a save code."); return; }
      try {
        copyCode(code, (ok: boolean) => setMsg(ok ? "✅ Copied to clipboard. Keep it somewhere safe." : `Copy was blocked. ${manual}`));
      } catch (e) { void e; setMsg(manual); }
    };
    const ta: CSSProperties = { width: "100%", boxSizing: "border-box", minHeight: 90, fontFamily: t.font.mono, fontSize: 11, padding: 8, borderRadius: 10, border: `1px solid ${t.border.default}`, background: t.bg.subtle, color: t.text.primary, wordBreak: "break-all", resize: "vertical", userSelect: "text" };
    const sv = parseRun(rawRun());
    return (
      <div style={root}>{style}
        <div style={row}><div style={{ fontSize: 20, fontWeight: 700, flex: "1 1 auto" }}>💾 Save Code</div>{btn("Back", () => { setMsg(""); setImpFocus(false); setUi("title"); })}</div>
        <div style={small}>Autosave: {storageOk() ? "on (this browser keeps your progress)" : "kept while this page stays open, but this browser may not keep it between visits"}. Storage check: {storeReport()}. A save code backs up tokens, upgrades, best depth, codex{sv ? ` and your current run (${CLS[sv.cls].name}, ${sv.mode === "story" ? "floor" : "depth"} ${sv.floor})` : ""}.</div>
        {msg && <div style={{ ...card, fontSize: 13 }}>{msg}</div>}
        <div style={cols}>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Export</div>
          <div style={row}>{btn("📋 Copy save code", doCopy, { tone: "primary", grow: true })}{btn("Show code", () => { setCodeText(exportCode()); setMsg(manual); }, { grow: true })}</div>
          {codeText && <textarea readOnly value={codeText} style={ta} onFocus={(e: FocusEvent<HTMLTextAreaElement>) => e.currentTarget.select()} />}
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Import</div>
          <div style={small}>Paste a code to restore it. This replaces your current tokens, upgrades, codex and saved run.</div>
          <textarea autoFocus={impFocus} value={imp} placeholder="Paste your DOE1:… code here" style={ta} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setImp(e.target.value)} />
          <div style={row}>{btn("⬇️ Import code", () => { setMsg(importCode(imp)); refresh(); }, { tone: "danger", grow: true, disabled: imp.trim().length === 0 })}{btn("Clear", () => setImp(""), { grow: true })}</div>
        </div>
        </div>
      </div>
    );
  }

  // ---------- TREE ----------
  if (!g && ui === "tree") {
    const nodes = TREE[treeCls]; const o = owned(treeCls);
    return (
      <div style={root}>{style}
        <div style={row}><div style={{ fontSize: 20, fontWeight: 700, flex: "1 1 auto" }}>🌳 Endless Upgrades</div>{btn("Back", () => setUi("title"))}</div>
        <div style={{ ...card, ...row, justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, color: t.text.warning }}>🪙 {m.tokens} token{m.tokens === 1 ? "" : "s"}</span>
          <span style={small}>Best depth: {m.best || "—"} · +1 token per 10 Endless floors</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CLASS_IDS.map((cid: ClassId) => (
            <button key={cid} onClick={() => setTreeCls(cid)} style={{ flex: "1 1 60px", minWidth: 0, minHeight: 46, borderRadius: 10, border: `2px solid ${cid === treeCls ? t.border.focus : t.border.default}`, background: cid === treeCls ? t.fill.accentSubtle : t.bg.elevated, color: t.text.primary, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <span style={{ display: "block", width: 32, height: 32, margin: "0 auto" }}>{spr(cid, 32)}</span>{CLS[cid].name} <span style={{ color: t.text.secondary }}>{owned(cid).length}/{TREE[cid].length}</span>
            </button>
          ))}
        </div>
        <div style={small}>Upgrades apply to Endless runs only. Ranks unlock in order; each tier needs 3 upgrades from the tier before it. Tier V holds the capstones.</div>
        {[1, 2, 3, 4, 5].map((tier: number) => (
          <div key={tier} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...head, color: tier === 5 ? RCOL[4] : t.text.secondary }}>TIER {["I", "II", "III", "IV", "V — CAPSTONES"][tier - 1]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6 }}>
              {nodes.filter((n: TNode) => n.tier === tier).map((n: TNode) => {
                const has = o.includes(n.id); const ok = canBuy(treeCls, n);
                return (
                  <button key={n.id} disabled={has || !ok} onClick={() => { if (!canBuy(treeCls, n)) return; m.tokens -= n.cost; owned(treeCls).push(n.id); saveMeta(); refresh(); }}
                    style={{ textAlign: "left", minWidth: 0, borderRadius: 10, padding: 8, fontFamily: "inherit", color: t.text.primary, cursor: ok ? "pointer" : "default", background: has ? t.fill.successSubtle : ok ? t.fill.accentSubtle : t.bg.elevated, border: `2px solid ${has ? t.text.success : tier === 5 ? RCOL[4] : t.border.default}`, opacity: has || ok ? 1 : 0.55 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{n.icon} {n.name}</div>
                    <div style={{ fontSize: 11, color: t.text.secondary }}>{n.desc}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: has ? t.text.success : t.text.warning }}>{has ? "✓ Owned" : `🪙 ${n.cost}${ok ? " · tap to buy" : " · locked"}`}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------- TITLE ----------
  if (!g) {
    const c = CLS[pickCls];
    const saved = parseRun(rawRun());
    const start = (mode: Mode): void => {
      if (saved && confirm !== mode) { setConfirm(mode); return; }
      const ng = newGame(pickCls, mode); G.current = ng; LAST_SAVE = saveRun(ng); setConfirm(null); refresh();
    };
    return (
      <div className={land ? "doe-cols" : undefined} style={land ? { ...root, display: "block", columnCount: 2, columnGap: 16 } : root}>{style}
        <div style={{ textAlign: "center", padding: "10px 0 2px" }}>
          <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: "50%", background: "radial-gradient(circle at 50% 55%, #2a1038, #0d0a10 72%)", filter: "drop-shadow(0 0 10px rgba(150,40,200,.45))" }}>{spr("lord", 120)}</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>Dungeon of Echoes</div>
          <div style={small}>Ten floors. A Broodmother. The Echo Lord. Endless depths beyond.</div>
        </div>
        {saved && (
          <div style={{ ...card, ...row, border: `2px solid ${t.border.focus}` }}>
            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>💾 Saved run</div>
              <div style={{ ...small, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}><span style={{ display: "inline-block", width: 22, height: 22 }}>{spr(saved.cls, 22)}</span> {CLS[saved.cls].name} · {saved.mode === "story" ? `Story floor ${saved.floor}/${STORY_END}` : `Endless depth ${saved.floor}`} · Lv {saved.lvl} · {saved.gold}g</div>
            </div>
            {btn("▶ Continue", () => { const gg = parseRun(rawRun()); if (gg) { G.current = gg; log(gg, "💾 Run loaded. Welcome back!", "good"); LAST_SAVE = saveRun(gg); setConfirm(null); refresh(); } }, { tone: "primary", tall: true })}
          </div>
        )}
        {btn(<span>📋 Paste save code<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Restore a run or backup from your clipboard</span></span>, () => {
          const openBox = (txt: string, note: string): void => { setImp(txt); setMsg(note); setImpFocus(true); setCodeText(""); setConfirm(null); setUi("save"); };
          const tryImport = (txt: string): void => {
            const s = txt.trim();
            if (!s) { openBox("", "Your clipboard was empty — paste your code into the Import box below."); return; }
            const r = importCode(s);
            if (!r.startsWith("✅")) { openBox(s, r); return; }
            const gg = parseRun(rawRun());
            if (gg) { G.current = gg; log(gg, "📋 Save code imported. Welcome back!", "good"); LAST_SAVE = saveRun(gg); }
            setToast(gg ? "📋 Save code imported — resuming" : "📋 Save code imported"); refresh();
          };
          try {
            if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
              navigator.clipboard.readText().then((txt: string) => tryImport(txt), () => openBox("", "Clipboard reading was blocked here — long-press the Import box below and tap Paste."));
              return;
            }
          } catch (e) { void e; }
          openBox("", "Long-press the Import box below and tap Paste.");
        }, { tone: "accent", tall: true })}
        {!storageOk() && <div style={{ ...small, color: t.text.secondary }}>💡 Your progress is kept while this page is open, but this browser may not remember it next time. Tap 💾 Save Code anytime for a backup you can paste back in.</div>}
        <div style={{ fontWeight: 700 }}>Choose your class</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CLASS_IDS.map((id: ClassId) => {
            const k = CLS[id]; const on = id === pickCls;
            return (
              <button key={id} onClick={() => setPickCls(id)} style={{ flex: "1 1 92px", minWidth: 0, background: on ? t.fill.accentSubtle : t.bg.elevated, border: `2px solid ${on ? t.border.focus : t.border.default}`, borderRadius: 12, padding: "10px 4px", color: t.text.primary, fontFamily: "inherit", cursor: "pointer" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 2px", borderRadius: 10, background: "radial-gradient(circle at 50% 45%, #3a2a1c, #0d0a10 75%)" }}>{spr(id, 64)}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{k.name}</div>
              </button>
            );
          })}
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 104, height: 104, flex: "0 0 auto", borderRadius: 12, background: "radial-gradient(circle at 50% 45%, #3a2a1c, #0d0a10 75%)", border: "1px solid #4a2a1a" }}>{spr(pickCls, 104)}</div>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.name} <span style={{ fontSize: 13, color: t.text.secondary, fontWeight: 400 }}>— {c.tag}</span></div>
              {pickCls === "ranger" && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: t.text.secondary }}><span style={{ width: 40, height: 40, display: "inline-block", borderRadius: 8, background: "#16121c" }}>{spr("wolf", 40)}</span>Wolf companion<span style={{ width: 40, height: 40, display: "inline-block", borderRadius: 8, background: "#16121c" }}>{spr("hawk", 40)}</span>Hawk (Pack Leader)</div>}
            </div>
          </div>
          <div style={{ ...row, gap: 10, fontSize: 13 }}>
            <span>❤️ {c.base.hp}</span><span>🔷 {c.base.mp}</span><span>⚔️ {c.base.atk}</span><span>🛡️ {c.base.def}</span><span>🎯 {c.base.crit}%</span><span>💨 {c.base.dodge}%</span>
          </div>
          <div style={small}>{c.passive}</div>
          {c.abs.map((a: Ab) => <div key={a.id} style={{ fontSize: 13 }}><b>{a.icon} {a.name}</b> <span style={{ color: t.text.secondary }}>({a.mp} MP{a.cd ? `, ${a.cd}t cd` : ""})</span> — {a.desc}</div>)}
          <div style={{ fontSize: 12, color: t.text.secondary, marginTop: 4 }}>Capstones: {CAPS[pickCls].map((p: Perk) => `${p.icon} ${p.name}`).join(" · ")} · Endless tree {owned(pickCls).length}/{TREE[pickCls].length}</div>
        </div>
        <div style={row}>
          {btn(<span>📖 Story<br /><span style={{ fontSize: 11, fontWeight: 400 }}>10 floors + 2 bosses</span></span>, () => start("story"), { tone: "primary", tall: true, grow: true })}
          {btn(<span>∞ Endless<br /><span style={{ fontSize: 11, fontWeight: 400 }}>☠️ Permadeath · Best depth {m.best || "—"}</span></span>, () => start("endless"), { tone: "accent", tall: true, grow: true })}
        </div>
        {confirm && saved && (
          <div style={{ ...card, background: t.fill.warningSubtle, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Start a new {confirm === "story" ? "Story" : "Endless"} run as {CLS[pickCls].name}? This overwrites your saved run ({CLS[saved.cls].name}, floor {saved.floor}). Tokens, upgrades and codex are kept.</div>
            <div style={row}>{btn("Yes, overwrite", () => start(confirm), { tone: "danger", grow: true })}{btn("Cancel", () => setConfirm(null), { grow: true })}</div>
          </div>
        )}
        <div style={row}>
          {btn(`🌳 Endless Upgrades (🪙 ${m.tokens})`, () => { setTreeCls(pickCls); setUi("tree"); }, { grow: true })}
          {btn("💾 Save Code", () => { setCodeText(""); setMsg(""); setUi("save"); }, { grow: true })}
        </div>
        <div style={row}>
          {btn("❓ How to Play", () => setUi("help"), { grow: true })}
          {btn(`📖 Codex (${ITEMS.filter((i: ItemT) => m.disc.includes(i.id)).length}/${ITEMS.length})`, () => setUi("codex"), { grow: true })}
        </div>
      </div>
    );
  }

  const f = full(g);
  const hud = (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
      {fxLayer(g, "p")}
      {g.hurtTs && Date.now() - g.hurtTs < 700 ? splat(g.hurtTs % 100000) : null}
      <div style={{ ...row, justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 42, height: 42, flex: "0 0 auto", borderRadius: 8, background: "radial-gradient(circle at 50% 40%, #3a2a1a, #0d0a10 80%)", border: "1px solid #5a3a2a", overflow: "hidden" }}>{spr(g.cls, 42)}</span>{CLS[g.cls].name} · Lv {g.lvl}</span>
        <span>{g.mode === "story" ? `🏰 Floor ${g.floor}/${STORY_END}` : `∞ Depth ${g.floor}`}</span>
        <span style={{ color: t.text.warning, fontWeight: 700 }}>💰 {g.gold}</span>
        <span style={{ fontSize: 11, color: LAST_SAVE ? t.text.success : t.text.warning }}>{LAST_SAVE ? "💾 Saved" : "⚠️ Session only"}</span>
        <button onClick={goHome} aria-label="Title screen (copies your save code)" style={{ minWidth: 40, minHeight: 36, borderRadius: 10, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 16, cursor: "pointer" }}>🏠</button>
      </div>
      <div style={{ display: "none" }}>
      </div>
      <div style={row}>
        {bar(g.hp, f.maxHp, "#e5484d", "HP")}
        {bar(g.mp, f.maxMp, "#3e8ef7", "MP")}
        {bar(g.xp, need(g.lvl), "#f5a524", "XP")}
      </div>
    </div>
  );

  const hudC = (
    <div style={{ ...card, padding: "4px 8px", display: "flex", alignItems: "center", gap: 8, position: "relative", flex: "0 0 auto" }}>
      {fxLayer(g, "p")}
      <span style={{ width: 30, height: 30, flex: "0 0 auto", borderRadius: 6, background: "radial-gradient(circle at 50% 40%, #3a2a1a, #0d0a10 80%)", border: "1px solid #5a3a2a", overflow: "hidden" }}>{spr(g.cls, 30)}</span>
      <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{CLS[g.cls].name} {g.lvl}</span>
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", gap: 8 }}>{bar(g.hp, f.maxHp, "#e5484d", "HP")}{bar(g.mp, f.maxMp, "#3e8ef7", "MP")}{bar(g.xp, need(g.lvl), "#f5a524", "XP")}</div>
      <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{g.mode === "story" ? `🏰 ${g.floor}/${STORY_END}` : `∞ ${g.floor}`}</span>
      <span style={{ fontSize: 12, color: t.text.warning, fontWeight: 700, whiteSpace: "nowrap" }}>💰 {g.gold}</span>
      <span style={{ fontSize: 11, color: LAST_SAVE ? t.text.success : t.text.warning, whiteSpace: "nowrap" }}>{LAST_SAVE ? "💾" : "⚠️"}</span>
      <button onClick={goHome} aria-label="Title screen (copies your save code)" style={{ minWidth: 36, minHeight: 32, borderRadius: 8, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 15, cursor: "pointer" }}>🏠</button>
    </div>
  );
  const playLayout = (g0: Game, viewFn: () => ReactNode, aspect: number, actions: ReactNode, below: ReactNode) => {
    if (land) {
      const side = Math.round(Math.max(150, Math.min(240, vp.w * 0.25)));
      const availH = vp.h - 70; const availW = vp.w - side * 2 - 44;
      const w = Math.max(140, Math.min(availW, availH * aspect));
      return (
        <div {...joyH} style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: `${sa("top", 6)} ${sa("right", 8)} ${sa("bottom", 6)} ${sa("left", 8)}`, boxSizing: "border-box", background: t.bg.base, color: t.text.primary, fontFamily: t.font.family, userSelect: "none", touchAction: "none", overflow: "hidden" }}>
          {style}
          {hudC}
          <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", gap: 8 }}>
            <div style={{ width: side, flex: "0 0 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ flex: "1 1 auto", minHeight: 50, borderRadius: 12, border: `1px dashed ${t.border.default}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: t.text.tertiary, textAlign: "center", padding: 6 }}>🕹️<br />Drag on the left half to move</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: w, maxWidth: "100%", position: "relative" }}>{viewFn()}{notes(g0, false)}</div></div>
            <div data-noj="1" style={{ width: side, flex: "0 0 auto", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, touchAction: "pan-y" }}>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>{below}{actions}</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={root}>{style}
        {hud}
        <div {...joyH} style={{ display: "flex", flexDirection: "column", gap: 8, touchAction: "none" }}>
          <div style={{ position: "relative" }}>{viewFn()}{notes(g0, false)}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <div style={{ flex: "1 1 0", minHeight: 150, borderRadius: 12, border: `1px dashed ${t.border.default}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: t.text.tertiary, textAlign: "center", padding: 6 }}>🕹️<br />Touch &amp; drag on the left half to move</div>
            <div data-noj="1" style={{ flex: "1.4 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>{actions}</div>
          </div>
        </div>
        {below}
      </div>
    );
  };

  // ---------- DEAD ----------
  if (g.screen === "dead") {
    return (
      <div style={root}>{style}
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 56 }}>🪦</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>You have fallen</div>
          <div style={small}>{CLS[g.cls].name} · Level {g.lvl} · {g.mode === "story" ? `Floor ${g.floor}/${STORY_END}` : `Depth ${g.floor} · Best ${m.best} · +${g.tokensEarned} token(s) this run`} · {g.kills} kills</div>
        </div>
        {logBox(g, 6)}
        {btn("Back to title ↻", toTitle, { tone: "primary", tall: true })}
      </div>
    );
  }

  // ---------- VICTORY ----------
  if (g.screen === "victory") {
    return (
      <div style={root}>{style}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 4 }}><div style={{ width: 104, height: 104 }}>{spr(g.cls, 104)}</div><div style={{ width: 96, height: 96 }}>{remSvg("lord")}</div></div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Victory!</div>
          <div style={{ fontSize: 14 }}>The Echo Lord is silenced. The dungeon falls quiet.</div>
          <div style={small}>{CLS[g.cls].name} · Level {g.lvl} · {g.kills} kills · {g.turns} tiles walked</div>
        </div>
        <div style={card}><div style={{ fontWeight: 700 }}>∞ Try Endless</div><div style={small}>Infinite floors, a boss every 5, tokens every 10 floors for permanent class upgrades.</div></div>
        {btn("Back to title", toTitle, { tone: "primary", tall: true })}
      </div>
    );
  }

  // ---------- UPGRADE ----------
  if (g.screen === "upgrade") {
    const tierName = (n: number): string => n === 3 ? "CAPSTONE" : n === 2 ? "Tier II" : "Tier I";
    return (
      <div style={root}>{style}
        {hud}
        <div style={{ fontSize: 20, fontWeight: 800 }}>∞ Boss slain — choose an upgrade</div>
        <div style={small}>{g.floor % 10 === 0 ? "Capstone reward: these perks change how your class plays." : "Capstone choices appear after every 10th-floor boss."}</div>
        {g.offers.map((p: Perk) => (
          <button key={p.id} onClick={() => run((gg: Game) => applyPerk(gg, p))} style={{ ...card, textAlign: "left", cursor: "pointer", color: t.text.primary, fontFamily: "inherit", border: `2px solid ${p.tier === 3 ? RCOL[4] : p.tier === 2 ? RCOL[3] : t.border.default}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: p.tier === 3 ? RCOL[4] : p.tier === 2 ? RCOL[3] : t.text.secondary }}>{tierName(p.tier)}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{p.icon} {p.name}</div>
            <div style={{ fontSize: 13 }}>{p.desc}</div>
          </button>
        ))}
      </div>
    );
  }

  // ---------- SHOP ----------
  if (g.screen === "shop") {
    const unid = g.inv.filter((i: Inv) => !i.ident);
    const cursedOn = GEAR.some((k: GearSlot) => { const it = g.eq[k]; return !!it && locked(it); });
    const liftFee = 50 + g.floor * 15;
    return (
      <div style={root}>{style}
        {hud}
        <div style={row}><div style={{ fontSize: 20, fontWeight: 800, flex: "1 1 auto" }}>💰 Merchant</div>{btn("Leave", () => run((gg: Game) => { gg.screen = "map"; }))}</div>
        <div style={cols}><div style={colS}>
        <div style={head}>FOR SALE</div>
        {g.shop.map((inv: Inv, i: number) => (
          <div key={inv.uid} style={{ ...card, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}>{instDetail(inv, g)}</div>
            {btn(`Buy ${priceOf(inv)}g`, () => run((gg: Game) => {
              const p = priceOf(inv);
              if (gg.gold < p) { log(gg, "Not enough gold."); return; }
              if (gg.inv.length >= MAXINV) { log(gg, "Your bag is full."); return; }
              gg.gold -= p;
              const consumable = IT[inv.id].slot === "consumable";
              addItem(gg, consumable ? makeInst(inv.id, gg.floor, false) : inv);
              log(gg, `Bought ${instName(inv)}.`, "loot");
              if (!consumable) gg.shop.splice(i, 1);
            }), { disabled: g.gold < priceOf(inv), tone: "accent" })}
          </div>
        ))}
        {(unid.length > 0 || cursedOn) && <div style={head}>SERVICES</div>}
        {cursedOn && (
          <div style={{ ...card, ...row }}>
            <div style={{ flex: "1 1 180px", fontSize: 13 }}>🕯️ Lift the curse on your equipped gear so it can be removed.</div>
            {btn(`Lift ${liftFee}g`, () => run((gg: Game) => { if (gg.gold < liftFee) { log(gg, "Not enough gold."); return; } gg.gold -= liftFee; const n = liftCurses(gg); log(gg, `🕯️ The merchant breaks ${n} curse(s).`, "good"); }), { disabled: g.gold < liftFee, tone: "accent" })}
          </div>
        )}
        {unid.map((inv: Inv) => (
          <div key={inv.uid} style={{ ...card, ...row }}>
            <div style={{ flex: "1 1 180px", fontSize: 13 }}>🔍 Identify {instName(inv)}</div>
            {btn(`Reveal ${idFee(inv, g.floor)}g`, () => run((gg: Game) => { const fee = idFee(inv, gg.floor); if (gg.gold < fee) { log(gg, "Not enough gold."); return; } gg.gold -= fee; identify(gg, inv); }), { disabled: g.gold < idFee(inv, g.floor) })}
          </div>
        ))}
        </div><div style={colS}>
        <div style={head}>SELL FROM BAG ({g.inv.length}/{MAXINV})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {g.inv.map((it: Inv) => (
            <div key={it.uid} style={{ ...card, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: 8 }}>
              <div style={{ flex: "1 1 160px", minWidth: 0, fontSize: 14, fontWeight: 600, color: it.ident ? RCOL[IT[it.id].r] : t.text.secondary }}>{instIcon(it)} {instName(it)}</div>
              {btn(`Sell ${sellOf(it)}g`, () => run((gg: Game) => { gg.inv = gg.inv.filter((x: Inv) => x.uid !== it.uid); gg.gold += sellOf(it); log(gg, `Sold ${instName(it)}.`, "loot"); }))}
            </div>
          ))}
        </div>
        {notes(g, true)}
        </div></div>
      </div>
    );
  }

  // ---------- INVENTORY ----------
  if (g.screen === "inventory") {
    const selInv = g.inv.find((i: Inv) => i.uid === g.sel);
    const selSlot = GEAR.find((k: GearSlot) => g.eq[k]?.uid === g.sel);
    const selEq = selSlot ? g.eq[selSlot] : undefined;
    const sel = selInv ?? selEq;
    const sc = setCounts(g);
    return (
      <div style={root}>{style}
        {hud}
        <div style={row}>
          <div style={{ fontSize: 20, fontWeight: 800, flex: "1 1 auto" }}>🎒 Inventory</div>
          {btn("📖 Codex", () => run((gg: Game) => { gg.prev = "inventory"; gg.screen = "codex"; }))}
          {btn("Back", () => run((gg: Game) => { gg.screen = "map"; gg.sel = -1; }), { tone: "primary" })}
        </div>
        <div style={cols}><div style={colS}>
        <div style={{ ...card, fontSize: 13, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <span>⚔️ ATK {f.atk}</span><span>🛡️ DEF {f.def}</span><span>🎯 Crit {f.crit}%</span><span>💨 Dodge {f.dodge}%</span>
          {f.ls > 0 && <span>🩸 LS {f.ls}%</span>}
          {f.fire + f.ice + f.holy + f.poison > 0 && <span>🌈 Elem +{f.fire + f.ice + f.holy + f.poison}</span>}
          {Object.keys(sc).filter((s: string) => sc[s] >= 2).map((s: string) => <span key={s} style={{ color: t.text.accent }}>🧩 {SETS[s].name} {sc[s]}/{SETS[s].n}</span>)}
          {f.curses.length > 0 && <span style={{ color: t.text.danger }}>☠️ {f.curses.length} curse(s)</span>}
        </div>
        {g.perks.length > 0 && (
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: RCOL[4] }}>CAPSTONES</div>
            {g.perks.map((pid: string) => { const p = CAPS[g.cls].find((x: Perk) => x.id === pid); return p ? <div key={pid} style={{ fontSize: 13 }}>{p.icon} <b>{p.name}</b> — {p.desc}</div> : null; })}
          </div>
        )}
        <div style={head}>EQUIPPED</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GEAR.map((k: GearSlot) => {
            const it = g.eq[k];
            return (
              <button key={k} onClick={() => run((gg: Game) => { gg.sel = it ? it.uid : -1; })} style={{ flex: "1 1 90px", minWidth: 0, minHeight: 64, backgroundColor: it && g.sel === it.uid ? t.fill.accentSubtle : t.bg.elevated, backgroundImage: it && k !== "ring" && k !== "amulet" ? bloodBg(it.uid) : undefined, border: `2px solid ${it ? RCOL[IT[it.id].r] : t.border.default}`, borderRadius: 10, color: t.text.primary, fontFamily: "inherit", padding: 4, cursor: "pointer" }}>
                <div style={{ fontSize: 22, filter: it && k === "weapon" ? "drop-shadow(0 2px 2px rgba(170,0,0,.75))" : undefined }}>{it ? IT[it.id].icon : SLOT_ICON[k]}{it && locked(it) ? "🔒" : ""}</div>
                <div style={{ fontSize: 11, color: t.text.secondary }}>{it ? instName(it) : `No ${SLOT_NAME[k].toLowerCase()}`}</div>
              </button>
            );
          })}
        </div>
        {sel && (
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8, border: `2px solid ${sel.ident ? RCOL[IT[sel.id].r] : t.border.strong}` }}>
            {instDetail(sel, g)}
            <div style={row}>
              {selSlot && btn(locked(sel) ? "🔒 Cursed" : "Unequip", () => run((gg: Game) => { unequip(gg, selSlot); if (!gg.eq[selSlot]) gg.sel = -1; }), { grow: true, disabled: locked(sel) })}
              {selInv && IT[selInv.id].slot !== "consumable" && btn(selInv.ident ? "Equip" : "Equip (reveal)", () => run((gg: Game) => { equip(gg, selInv.uid); }), { tone: "primary", grow: true })}
              {selInv && IT[selInv.id].slot === "consumable" && btn("Use", () => run((gg: Game) => { const r = useConsumable(gg, selInv); if (r === "turn") gg.sel = -1; }), { tone: "primary", grow: true })}
              {selInv && btn("Drop", () => run((gg: Game) => { gg.inv = gg.inv.filter((x: Inv) => x.uid !== selInv.uid); log(gg, `Dropped ${instName(selInv)}.`); gg.sel = -1; }), { tone: "danger", grow: true })}
            </div>
            {selInv && IT[selInv.id].slot !== "consumable" && (() => {
              const cur = g.eq[IT[selInv.id].slot as GearSlot];
              return cur ? <div style={small}>Currently worn: {instName(cur)}{locked(cur) ? " (cursed, locked)" : ""}</div> : null;
            })()}
          </div>
        )}
        </div><div style={colS}>
        <div style={head}>BAG ({g.inv.length}/{MAXINV})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6 }}>
          {g.inv.map((it: Inv) => {
            const tt = IT[it.id]; const on = g.sel === it.uid;
            return (
              <button key={it.uid} onClick={() => run((gg: Game) => { gg.sel = it.uid; })} style={{ minHeight: 64, backgroundColor: on ? t.fill.accentSubtle : t.bg.elevated, backgroundImage: tt.slot === "weapon" || tt.slot === "armor" || tt.slot === "helmet" ? bloodBg(it.uid) : undefined, border: `2px ${it.ident ? "solid" : "dashed"} ${it.ident ? RCOL[tt.r] : t.border.strong}`, borderRadius: 10, color: t.text.primary, fontFamily: "inherit", padding: 2, cursor: "pointer", minWidth: 0 }}>
                <div style={{ fontSize: 24, filter: tt.slot === "weapon" ? "drop-shadow(0 2px 2px rgba(170,0,0,.75))" : undefined }}>{instIcon(it)}</div>
                <div style={{ fontSize: 9, color: t.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.ident ? tt.name : "???"}</div>
              </button>
            );
          })}
        </div>
        {notes(g, true)}
        </div></div>
      </div>
    );
  }

  // ---------- COMBAT ----------
  if (g.screen === "combat" && g.combat) {
    const c = g.combat;
    const cons = g.inv.filter((i: Inv) => IT[i.id].slot === "consumable");
    const b = g.buffs;
    const chips: string[] = [];
    if (b.rage > 0) chips.push(`📣 Rage ${b.rage}`);
    if (b.fury > 0) chips.push(`📜 Fury ${b.fury}`);
    if (b.holy > 0) chips.push(`🔆 Holy ${b.holy}`);
    if (b.iron > 0) chips.push(`📃 Iron ${b.iron}`);
    if (b.evade > 0) chips.push(`💨 Evade ×${b.evade}`);
    if (b.shield > 0) chips.push(`🔮 Shield ${b.shield}`);
    if (b.frenzy > 0) chips.push(`📯 Frenzy ${b.frenzy}`);
    if (b.dotT > 0) chips.push(`☠️ DoT ${b.dotD}×${b.dotT}`);
    if (f.curses.length > 0) chips.push(`☠️ Cursed ×${f.curses.length}`);
    const boss = c.enemies.find((e: Enemy) => e.boss);
    const cbio: Biome = g.biome ?? biomeOf(g.floor);
    const now = Date.now();
    const pc = (v: number, tot: number): string => `${(v / tot) * 100}%`;
    const box = (x: number, y: number, s: number): CSSProperties => ({ position: "absolute", left: pc(x - s / 2, AW), top: pc(y - s / 2, AH), width: pc(s, AW), height: pc(s, AH) });
    const cpx = c.px ?? 16, cpy = c.py ?? AH / 2;
    const arena = (): ReactNode => (
      <div style={{ position: "relative", width: "100%", aspectRatio: `${AW} / ${AH}`, overflow: "hidden", borderRadius: 12, border: `1px solid ${cbio === "warren" ? "#3c5a2a" : "#4a2f6a"}`, background: cbio === "warren" ? "radial-gradient(ellipse at 50% 55%, #2c3622 0%, #151a10 60%, #090b07 100%)" : "radial-gradient(ellipse at 50% 55%, #2c2238 0%, #17111f 60%, #08060c 100%)", touchAction: "none" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.35) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,.35) 1px, transparent 1px)", backgroundSize: "10% 14.2857%", opacity: 0.6, pointerEvents: "none" }} />
        {g.hurtTs && now - g.hurtTs < 700 ? <div key={g.hurtTs} style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 40%, rgba(190,0,0,.5) 100%)", animation: "doeFlash .55s ease-out forwards", zIndex: 6 }} /> : null}
        <div style={{ position: "absolute", left: 6, top: 4, fontSize: 11, fontWeight: 700, color: "#e8dcc8", textShadow: "0 1px 2px #000", pointerEvents: "none", zIndex: 7 }}>{c.boss ? "☠️ Boss" : "⚔️ Fight"}{boss ? ` · Phase ${c.phase}/${boss.bk === "lord" ? 3 : 2}` : ""}</div>
        {(c.tele ?? []).map((tl: Tele) => (
          <div key={tl.id} style={{ ...box(tl.x, tl.y, tl.r * 2), borderRadius: "50%", border: `2px solid ${tl.kind === "acid" ? "#7dff4a" : tl.kind === "cata" ? "#c07bff" : "#ff5a2a"}`, background: "rgba(0,0,0,.15)", boxSizing: "border-box", pointerEvents: "none", zIndex: 1 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: tl.kind === "acid" ? "rgba(110,220,60,.4)" : tl.kind === "cata" ? "rgba(150,60,255,.45)" : "rgba(255,80,20,.42)", transform: `scale(${Math.max(0, Math.min(1, 1 - tl.t / tl.max))})` }} />
          </div>
        ))}
        {c.enemies.map((e: Enemy) => {
          if (e.dead || e.wk !== "melee" || (e.wind ?? 0) <= 0) return null;
          const rr = (e.boss ? (e.bk === "lord" ? 17 : 16) : (RTB[e.b] ?? RTB.brute)[1]) + 5;
          return (
            <div key={"w" + e.uid} style={{ ...box(e.x ?? 0, e.y ?? 0, rr * 2), borderRadius: "50%", border: "2px solid rgba(255,40,40,.9)", boxSizing: "border-box", pointerEvents: "none", zIndex: 1 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(220,0,0,.35)", transform: `scale(${Math.max(0, Math.min(1, 1 - (e.wind ?? 0) / (e.wm || 1)))})` }} />
            </div>
          );
        })}
        {c.enemies.map((e: Enemy, i: number) => {
          const s = e.boss ? 24 : 13; const on = i === c.target && !e.dead;
          return (
            <div key={e.uid} data-noj="1" onPointerDown={() => { if (!e.dead) run((gg: Game) => { if (gg.combat) gg.combat.target = i; }); }} style={{ ...box(e.x ?? 0, e.y ?? 0, s), zIndex: e.dead ? 0 : 2, opacity: e.dead ? 0.75 : 1 }}>
              {on && <div style={{ position: "absolute", inset: "-12%", borderRadius: "50%", border: "2px dashed #ffcc4d", pointerEvents: "none" }} />}
              <div style={{ position: "absolute", inset: 0, filter: e.dead ? "grayscale(.3)" : e.stun > 0 ? "brightness(1.5) saturate(.4)" : e.boss ? "drop-shadow(0 0 4px rgba(190,0,0,.8))" : "drop-shadow(0 2px 2px rgba(0,0,0,.6))", animation: e.wk === "cast" && (e.wind ?? 0) > 0 ? "doePulse .4s infinite" : undefined }}>{e.dead ? remSvg(sprOf(e)) : spr(sprOf(e), "100%")}</div>
              {!e.dead && <div style={{ position: "absolute", left: "5%", right: "5%", top: "-12%", height: 4, borderRadius: 2, background: "rgba(0,0,0,.6)", overflow: "hidden" }}><div style={{ width: `${(Math.max(0, e.hp) / e.max) * 100}%`, height: "100%", background: e.boss ? "#a855f7" : "#e5484d" }} /></div>}
              {!e.dead && (e.stun > 0 || e.burnT > 0 || e.poisT > 0) && <div style={{ position: "absolute", left: 0, right: 0, bottom: "-26%", textAlign: "center", fontSize: 10, pointerEvents: "none" }}>{e.stun > 0 ? "😵" : ""}{e.burnT > 0 ? "🔥" : ""}{e.poisT > 0 ? "☠️" : ""}</div>}
              {g.fx.filter((x: Fx) => x.at === "e" + e.uid && x.text.startsWith("-") && now - x.ts < 900).map((x: Fx) => splat(x.id))}
              {arenaFx(g, "e" + e.uid)}
            </div>
          );
        })}
        {(c.proj ?? []).map((p: Proj) => <div key={p.id} style={{ ...box(p.x, p.y, 3.2), borderRadius: "50%", background: p.c, boxShadow: `0 0 8px ${p.c}`, zIndex: 3, pointerEvents: "none" }} />)}
        <svg viewBox={`0 0 ${AW} ${AH}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
          {(c.shots ?? []).filter((s: Shot) => now - s.ts < 160).map((s: Shot) => <line key={s.id} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={0.9} strokeLinecap="round" opacity={0.9} />)}
        </svg>
        {g.cls === "ranger" && (g.perks.includes("packleader") ? ["wolf", "hawk"] : ["wolf"]).map((pk: string, k: number) => <div key={pk} style={{ ...box(cpx - 8 + k * 16, cpy + 8, 8), zIndex: 2, pointerEvents: "none", filter: g.buffs.frenzy > 0 ? "drop-shadow(0 0 3px rgba(220,30,30,.9))" : undefined }}>{spr(pk, "100%")}</div>)}
        <div style={{ ...box(cpx, cpy, 12), zIndex: 4, pointerEvents: "none", opacity: (c.iT ?? 0) > 0 ? 0.55 : 1 }}>
          <div style={{ position: "absolute", inset: "-12%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,170,70,.35), transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0 }}>{spr(g.cls, "100%")}</div>
          {arenaFx(g, "p")}
        </div>
        {(c.grace ?? 0) > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: "42%", textAlign: "center", fontWeight: 800, fontSize: 18, color: "#ffe6b0", textShadow: "0 2px 6px #000", pointerEvents: "none", zIndex: 7 }}>Get ready…</div>}
        {c.charging && <div style={{ position: "absolute", left: 0, right: 0, top: 18, textAlign: "center", fontWeight: 800, fontSize: 12, color: "#ffb0ff", animation: "doePulse .8s infinite", pointerEvents: "none", zIndex: 7 }}>⚠️ CATACLYSM — leave the purple ring!</div>}
      </div>
    );
    const ring = (fr: number): ReactNode => fr > 0 ? <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(rgba(0,0,0,.72) ${Math.round(fr * 360)}deg, transparent 0deg)`, pointerEvents: "none" }} /> : null;
    const roundBtn: CSSProperties = { position: "relative", width: 58, height: 58, borderRadius: "50%", border: "2px solid #c9a24a", background: "radial-gradient(circle at 40% 35%, #3a2a44, #140e1a)", color: "#fff", fontFamily: "inherit", fontSize: 22, cursor: "pointer", overflow: "hidden", touchAction: "manipulation", padding: 0, flex: "0 0 auto" };
    const atkUp = (): void => { inp.current.atk = false; };
    const actions = c.itemOpen ? <div style={{ ...small, textAlign: "right" }}>⏸ Paused — pick an item</div> : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {CLS[g.cls].abs.map((a: Ab, i: number) => {
            const cd = g.cds[a.id] ?? 0; const cost = abCost(g, a); const fr = cd > 0 ? Math.min(1, cd / cdSec(g, a)) : 0; const noMp = g.mp < cost;
            return (
              <button key={a.id} onClick={() => abil(i)} aria-label={`${a.name} (key ${i + 1})`} title={`${a.name}: ${a.desc}`} style={{ ...roundBtn, borderColor: cd > 0 || noMp ? t.border.default : "#c9a24a", opacity: noMp && cd <= 0 ? 0.55 : 1 }}>
                <span>{a.icon}</span>{ring(fr)}
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontSize: 9, fontWeight: 700, color: "#ffe6b0", textShadow: "0 1px 2px #000" }}>{cd > 0 ? `${Math.ceil(cd)}s` : `${cost}MP`}</span>
                <span style={{ position: "absolute", left: 0, right: 0, top: 2, fontSize: 9, color: "#bbb" }}>{i + 1}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
          <button onClick={dodge} aria-label="Dodge roll" style={{ ...roundBtn, borderColor: (c.dashCd ?? 0) > 0 ? t.border.default : "#7ab8ff" }}><span>💨</span>{ring(Math.min(1, (c.dashCd ?? 0) / 2.2))}<span style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontSize: 9, fontWeight: 700, color: "#cfe6ff" }}>Dodge</span></button>
          <button onPointerDown={() => { inp.current.atk = true; run((gg: Game) => rtAttack(gg)); }} onPointerUp={atkUp} onPointerCancel={atkUp} onPointerLeave={atkUp} onClick={() => run((gg: Game) => rtAttack(gg))} onContextMenu={(e: { preventDefault: () => void }) => e.preventDefault()} aria-label="Attack (hold)" style={{ ...roundBtn, width: 86, height: 86, fontSize: 34, border: "3px solid #e0b25a", background: "radial-gradient(circle at 40% 35%, #8a2a1a, #2a0a08)" }}>
            <span>{g.cls === "mage" ? "🪄" : g.cls === "ranger" ? "🏹" : g.cls === "cleric" ? "🔨" : g.cls === "rogue" ? "🗡️" : "⚔️"}</span>{ring(Math.min(1, (c.atkCd ?? 0) / ARATE[g.cls]))}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {btn(`🎒 ${cons.length}`, () => run((gg: Game) => { if (gg.combat) gg.combat.itemOpen = true; }))}
          {btn(c.boss ? "🚫 No escape" : "🏃 Flee", () => run((gg: Game) => rtFlee(gg)), { disabled: c.boss || (c.fleeCd ?? 0) > 0 })}
          {g.perks.includes("shadowmeld") && btn(g.usedShadow ? "🌫️ used" : "🌫️ Meld", () => run((gg: Game) => combatAct(gg, "vanish", "")), { disabled: g.usedShadow || c.boss, key: "vanish" })}
        </div>
      </div>
    );
    const below = (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {c.itemOpen && (
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...row, justifyContent: "space-between" }}><b>Use an item (paused)</b>{btn("Cancel", () => run((gg: Game) => { if (gg.combat) gg.combat.itemOpen = false; }))}</div>
            {cons.length === 0 && <div style={small}>You have no consumables.</div>}
            {cons.map((it: Inv) => (
              <button key={it.uid} onClick={() => run((gg: Game) => combatAct(gg, "item", String(it.uid)))} style={{ textAlign: "left", background: t.fill.secondary, border: `1px solid ${t.border.default}`, borderRadius: 10, padding: 8, color: t.text.primary, fontFamily: "inherit", minHeight: 46, cursor: "pointer" }}>
                <div style={{ fontSize: 14, color: RCOL[IT[it.id].r], fontWeight: 600 }}>{IT[it.id].icon} {IT[it.id].name}</div>
                <div style={{ fontSize: 11, color: t.text.secondary }}>{IT[it.id].desc}</div>
              </button>
            ))}
          </div>
        )}
        {chips.length > 0 && <div style={{ ...row, gap: 6 }}>{chips.map((s: string) => <span key={s} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: t.fill.secondary }}>{s}</span>)}</div>}
        <div style={small}>Red rings are incoming hits — step out or dodge! Tap an enemy to target it. {CLS[g.cls].passive}</div>
      </div>
    );
    return playLayout(g, arena, AW / AH, actions, below);
  }

  // ---------- MAP ----------
  const remAt = new Map<number, string>();
  for (const r of g.rem ?? []) { const [a, b] = r.split(":"); remAt.set(Number(a), b); }
  const bio: Biome = g.biome ?? biomeOf(g.floor);
  const VH = 7;
  const tPos = (x: number, y: number): CSSProperties => ({ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${100 / W}%`, height: `${100 / H}%` });
  const objs: ReactNode[] = [];
  for (let y = Math.max(0, g.py - VH); y <= Math.min(H - 1, g.py + VH); y++) for (let x = Math.max(0, g.px - VH); x <= Math.min(W - 1, g.px + VH); x++) {
    if (!g.seen[y][x]) continue;
    const v = g.map[y][x]; const rk = remAt.get(y * W + x);
    const isObj = v === 2 || v === 3 || v === 4;
    if (!isObj && !rk) continue;
    const lit = litT(g, x, y);
    if (rk) objs.push(<div key={`r${x},${y}`} style={{ ...tPos(x, y), opacity: lit ? 1 : 0.5 }}>{remSvg(rk)}</div>);
    if (isObj) objs.push(<div key={`o${x},${y}`} style={{ ...tPos(x, y), padding: "4%", boxSizing: "border-box", filter: lit ? "drop-shadow(0 2px 2px rgba(0,0,0,.7))" : "brightness(.5)" }}>{spr(v === 2 ? "stairs" : v === 3 ? "chest" : "gold", "100%")}</div>);
  }
  for (const mm of g.mons) {
    const mfx = mm.fx ?? mm.x + 0.5, mfy = mm.fy ?? mm.y + 0.5;
    if (Math.abs(mm.x - g.px) > VH || Math.abs(mm.y - g.py) > VH || !g.seen[mm.y]?.[mm.x]) continue;
    const vis = litT(g, mm.x, mm.y);
    if (!vis && !mm.boss) continue;
    const sty: CSSProperties | undefined = mm.boss ? (vis ? { filter: "drop-shadow(0 0 3px rgba(200,0,0,.8))" } : { filter: "brightness(0)", opacity: 0.55 }) : mm.stun > 0 ? { opacity: 0.6 } : { filter: "drop-shadow(0 2px 2px rgba(0,0,0,.8))" };
    objs.push(<div key={`m${mm.id}`} style={tPos(mfx - 0.5, mfy - 0.5)}>{spr(mm.boss ? (mm.t === "lord" ? "lord" : "brood") : mm.t, "100%", sty)}</div>);
  }
  const tilePct = `${100 / VT}%`;
  const nowMs = Date.now();
  const floats = g.fx.filter((x: Fx) => x.at === "m" && nowMs - x.ts < 1250);
  const onMerchant = nearMerchant(g);
  const mapView = (): ReactNode => (
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", width: "100%", aspectRatio: "1", background: "#07060a" }}>
        <canvas ref={mapCv} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at 50% 50%, ${bio === "warren" ? "rgba(255,170,80,.13)" : "rgba(220,150,255,.11)"} 0, rgba(0,0,0,0) ${(2.6 / VT) * 100}%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${(1.3 / VT) * 100}%, rgba(0,0,0,.6) ${((R + 1.4) / VT) * 100}%)` }} />
        <div ref={worldEl} style={{ position: "absolute", left: 0, top: 0, width: `${(W / VT) * 100}%`, height: `${(H / VT) * 100}%`, transform: worldTf(g), pointerEvents: "none", willChange: "transform" }}>{objs}</div>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: tilePct, height: tilePct, transform: "translate(-50%,-50%)", pointerEvents: "none", filter: "drop-shadow(0 0 3px rgba(0,0,0,.9))" }}>{spr(g.cls, "100%")}</div>
        <div style={{ position: "absolute", left: "50%", bottom: `${50 + 50 / VT}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 1, pointerEvents: "none", zIndex: 6 }}>
          {floats.map((x: Fx) => <span key={x.id} data-float="1" style={{ fontWeight: 800, fontSize: 13, color: col(x.c), textShadow: "0 1px 3px #000, 0 0 2px #000", whiteSpace: "nowrap", animation: `doeRise 1.2s ease-out ${-(nowMs - x.ts)}ms forwards` }}>{x.text}</span>)}
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {bio === "warren"
            ? [0, 1, 2, 3, 4, 5, 6, 7].map((i: number) => <span key={i} style={{ position: "absolute", left: `${(i * 37 + 8) % 92}%`, top: `${60 + (i * 23) % 35}%`, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: i % 3 === 0 ? "rgba(230,230,240,.7)" : "rgba(160,255,90,.7)", opacity: 0, animation: `doeDrift ${5 + (i % 4)}s linear ${i * 0.7}s infinite` }} />)
            : [0, 1, 2].map((i: number) => <span key={i} style={{ position: "absolute", left: "-20%", width: "140%", top: `${10 + i * 30}%`, height: "30%", background: "radial-gradient(ellipse at center, rgba(150,70,220,.22), transparent 70%)", animation: `doeMist ${9 + i * 3}s ease-in-out ${i}s infinite alternate` }} />)}
        </div>
        <button data-noj="1" data-minimap="1" aria-label="Open map (M)" title="Map (M)" onClick={toggleMap} style={{ position: "absolute", right: 6, top: 6, width: "27%", aspectRatio: "1", padding: 0, border: "1px solid rgba(255,230,180,.4)", borderRadius: 8, background: "transparent", overflow: "hidden", zIndex: 5, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
          <canvas ref={miniCv} style={{ width: "100%", height: "100%", display: "block" }} />
          <span style={{ position: "absolute", left: 3, bottom: 1, fontSize: 9, fontWeight: 800, color: "rgba(255,240,210,.85)", textShadow: "0 1px 2px #000" }}>M</span>
        </button>
        {g.bannerTs && Date.now() - g.bannerTs < 3500 ? (
          <div key={g.bannerTs} style={{ position: "absolute", left: "6%", right: "6%", top: "36%", textAlign: "center", padding: "10px 8px", borderRadius: 10, background: "rgba(8,6,12,.85)", border: `1px solid ${bio === "warren" ? "#6aa83a" : "#8a4ad0"}`, color: "#f0e8ff", animation: "doeBanner 3.2s ease-in-out forwards", pointerEvents: "none", zIndex: 3 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>{g.mode === "story" ? `FLOOR ${g.floor}` : `DEPTH ${g.floor}`}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{BIOME[bio].name}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{BIOME[bio].sub}</div>
          </div>
        ) : null}
      </div>
  );
  const mapActions = (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {onMerchant && btn("💰 Trade", interact, { tone: "accent", tall: true })}
          {btn(`🎒 Bag (${g.inv.length})`, () => run((gg: Game) => { gg.screen = "inventory"; gg.sel = -1; }), { tone: "primary", tall: true })}
          <div style={row}>
            {btn("📖", () => run((gg: Game) => { gg.prev = "map"; gg.screen = "codex"; }), { grow: true })}
            {btn("❓", () => run((gg: Game) => { gg.prev = "map"; gg.screen = "help"; }), { grow: true })}
            {btn("🏠", toTitle, { grow: true })}
            {btn("💾", () => { if (G.current) LAST_SAVE = saveRun(G.current); G.current = null; setCodeText(""); setMsg(""); setConfirm(null); setUi("save"); refresh(); }, { grow: true })}
          </div>
        </div>
  );
  const legend = (
          <div style={{ ...small, fontSize: 11 }}><b>{BIOME[bio].name}</b> · {bio === "warren" ? "🕸️ webs slow you and wake the warren" : "🔮 runes drain 8% HP and wake the dead"} · 🔽 stairs · 📦 chest · 💰 merchant (walk onto it){g.floor % 5 === 0 ? ` · ${bossKind(g.floor) === "lord" ? "Echo Lord" : "Broodmother"} guards the stairs` : ""}{g.mode === "endless" ? " · ☠️ permadeath" : ""}{g.perks.length ? ` · ${g.perks.length} capstone${g.perks.length > 1 ? "s" : ""}` : ""} · monsters roam in real time</div>
  );
  return playLayout(g, mapView, 1, mapActions, legend);
}


