import { useState, useEffect, useRef, useCallback, useGrokTheme } from "./grok";
import type { ReactNode, CSSProperties, ChangeEvent, FocusEvent } from "./grok";

type ClassId = "warrior" | "mage" | "rogue" | "cleric" | "ranger";
type Slot = "weapon" | "armor" | "helmet" | "ring" | "amulet" | "consumable";
type GearSlot = Exclude<Slot, "consumable">;
type StatKey = "hp" | "mp" | "atk" | "def" | "crit" | "dodge" | "ls" | "fire" | "ice" | "holy" | "poison" | "th";
type Stats = Partial<Record<StatKey, number>>;
type Behav = "brute" | "swift" | "tank" | "caster" | "poisoner" | "drainer" | "boss" | "archer" | "spitter" | "hexer";
type Screen = "map" | "inventory" | "shop" | "upgrade" | "victory" | "dead" | "codex" | "help" | "vault";
type Ui = "title" | "help" | "tree" | "codex" | "save";
type Mode = "story" | "endless";
type ActRes = "none" | "turn" | "end";

interface ItemT { id: string; name: string; icon: string; slot: Slot; r: number; minF: number; price: number; st?: Stats; cls?: ClassId[]; sp?: string; desc?: string; fx?: string; pw?: number; set?: string; cursed?: boolean; curse?: string; pet?: string; ff?: number; mpreg?: number; uranges?: Partial<Record<StatKey, [number, number]>>; }
interface SetT { name: string; n: number; b2: Stats; bf: Stats; sp: string; desc: string; b3?: Stats; cls?: ClassId; }
interface Ab { id: string; name: string; icon: string; mp: number; cd: number; desc: string; }
interface Base { hp: number; mp: number; atk: number; def: number; crit: number; dodge: number; }
interface ClassT { id: ClassId; name: string; icon: string; tag: string; base: Base; grow: { hp: number; mp: number; atk: number; def: number; crit: number }; abs: Ab[]; passive: string; start: string[]; }
interface Perk { id: string; name: string; icon: string; desc: string; tier: number; st?: Stats; gold?: number; rar?: string; cls?: ClassId; }
interface MonT { id: string; name: string; icon: string; hp: number; atk: number; def: number; dodge: number; xp: number; gold: number; b: Behav; undead?: boolean; lo: number; hi: number; bio?: Biome; ff?: number; w?: number; }
interface Room { x: number; y: number; w: number; h: number; }
interface MapMon { id: number; x: number; y: number; t: string; boss: boolean; awake: boolean; stun: number; fx?: number; fy?: number; hp?: number; max?: number; hx?: number; hy?: number; el?: boolean; }
interface Enemy { uid: number; spr?: string; name: string; icon: string; hp: number; max: number; atk: number; def: number; dodge: number; xp: number; gold: number; b: Behav; bk: string; undead: boolean; boss: boolean; stun: number; burnT: number; burnD: number; poisT: number; poisD: number; dead: boolean; x?: number; y?: number; atkT?: number; wind?: number; wm?: number; wk?: string; rt?: boolean; mid?: number; hx?: number; hy?: number; lost?: number; minion?: boolean; mt?: string; away?: boolean; dt0?: number; elite?: boolean; tpk?: string; ax?: number; ay?: number; }
interface Combat { enemies: Enemy[]; target: number; monId: number; turn: number; elapsed?: number; boss: boolean; phase: number; charging: boolean; itemOpen: boolean; px?: number; py?: number; proj?: Proj[]; tele?: Tele[]; shots?: Shot[]; atkCd?: number; dashCd?: number; dashT?: number; dvx?: number; dvy?: number; iT?: number; tick?: number; grace?: number; bossT?: number; fleeCd?: number; v2?: boolean; calm?: number; upg?: boolean; vault?: boolean; opened?: boolean; curseAcc?: number; }
interface Proj { id: number; x: number; y: number; vx: number; vy: number; dmg: number; from: number; life: number; c: string; k?: string; }
interface Tele { id: number; x: number; y: number; r: number; t: number; max: number; dmg: number; from: number; kind: string; }
interface Shot { id: number; x1: number; y1: number; x2: number; y2: number; ts: number; c: string; }
interface Inp { jx: number; jy: number; kx: number; ky: number; gx: number; gy: number; atk: boolean; katk: boolean; gatk: boolean; stepT: number; monT: number; regT: number; alt: boolean; saveT: number; rT: number; slowT: number; shopL: boolean; vx: number; vy: number; idleT: number; }
interface Buffs { rage: number; holy: number; evade: number; shield: number; frenzy: number; fury: number; iron: number; defend: boolean; defendT?: number; dotT: number; dotD: number; hex?: number; veil?: number; }
// companions that fight on the map
interface Pet { k: string; hp: number; max: number; x: number; y: number; ko: number; cd: number; aT?: number; tx?: number; ty?: number; }
interface PetT { name: string; icon: string; hpF: number; mult: number; spd: number; reach: number; rate: number; desc: string; }
interface RolledAff { id: string; pre: boolean; tier: number; stat: StatKey | "mpreg"; v: number; name: string; lo: number; hi: number; }
interface Inv { uid: number; id: string; ident: boolean; bon: Stats; freed: boolean; ilvl?: number; affs?: RolledAff[]; aname?: string; mpreg?: number; }
interface LogL { t: string; c: string; ts?: number; }
interface Fx { id: number; text: string; c: string; at: string; ts: number; }
interface Full { maxHp: number; maxMp: number; atk: number; def: number; crit: number; dodge: number; ls: number; fire: number; ice: number; holy: number; poison: number; th: number; sp: string[]; curses: string[]; }
interface Meta { tokens: number; best: number; owned: Record<string, string[]>; disc: string[]; }
interface TNode { id: string; tier: number; name: string; icon: string; desc: string; cost: number; req: string; st?: Stats; cap?: string; }
interface Game {
  screen: Screen; prev: Screen; mode: Mode; cls: ClassId; lvl: number; xp: number; hp: number; mp: number; gold: number;
  inv: Inv[]; eq: Partial<Record<GearSlot, Inv>>; floor: number; map: number[][]; seen: boolean[][];
  px: number; py: number; wx?: number; wy?: number; mons: MapMon[]; sx: number; sy: number; log: LogL[]; combat: Combat | null;
  cds: Record<string, number>; buffs: Buffs; perks: string[]; bonus: Stats; goldMult: number; inAb: boolean;
  usedUndying: boolean; usedShadow: boolean; usedPhoenix: boolean; shop: Inv[]; stock?: number[];
  offers: Perk[]; kills: number; sel: number; fx: Fx[]; turns: number; tokensEarned: number; stains?: number[]; rem?: string[]; hurtTs?: number; usedRes?: boolean; biome?: Biome; bannerTs?: number; qs?: string;
  pets?: Pet[]; cpet?: string; startPick?: boolean; vaultOffer?: boolean; vaultThen?: Screen; vaultSel?: number;
}

const W = 32, H = 32, R = 4, MAXINV = 24, STORY_END = 10;
const RAR = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const RCOL = ["#9aa0a6", "#22a55b", "#3b82f6", "#a855f7", "#f59e0b"];
const GEAR: GearSlot[] = ["weapon", "armor", "helmet", "ring", "amulet"];
const SLOT_ICON: Record<GearSlot, string> = { weapon: "⚔️", armor: "🛡️", helmet: "⛑️", ring: "💍", amulet: "📿" };
const SLOT_NAME: Record<Slot, string> = { weapon: "Weapon", armor: "Armor", helmet: "Helmet", ring: "Ring", amulet: "Amulet", consumable: "Consumable" };
const STAT_LABEL: Record<StatKey, string> = { hp: "HP", mp: "MP", atk: "ATK", def: "DEF", crit: "Crit%", dodge: "Dodge%", ls: "Lifesteal%", fire: "Fire", ice: "Ice", holy: "Holy", poison: "Poison", th: "Thorns%" };
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
  I("w_channel", "Channeler's Rod", "🪄", "weapon", 1, 1, 55, { atk: 4, mp: 18 }, { cls: MC, mpreg: 2.2, desc: "♻ Mana regen 2.2/s." }),
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
  I("a_aegis", "Aegis of Dawn", "☀️", "armor", 4, 4, 800, { def: 22, hp: 60 }, { sp: "holyWard", desc: "Take 12% less damage." }),
  I("a_thorn", "Bulwark of Thorns", "🌵", "armor", 4, 4, 800, { def: 20, hp: 50 }, { cls: ["warrior"], sp: "thorns", desc: "Reflect 25% of damage taken." }),
  I("a_dragon", "Dragonheart Plate", "🐉", "armor", 4, 4, 850, { def: 24, hp: 50, fire: 6 }, { sp: "dotImmune", desc: "Immune to poison and burns." }),
  I("h_cap", "Leather Cap", "🧢", "helmet", 0, 1, 15, { def: 2 }),
  I("h_hood", "Thief's Hood", "🎩", "helmet", 1, 1, 50, { dodge: 5, crit: 3 }),
  I("h_helm", "Iron Helm", "⛑️", "helmet", 1, 1, 50, { def: 4, hp: 15 }),
  I("h_circlet", "Sage Circlet", "💠", "helmet", 2, 2, 130, { mp: 30, atk: 3 }),
  I("h_arcflow", "Circlet of Living Arcana", "💠", "helmet", 3, 3, 300, { mp: 35, atk: 3 }, { mpreg: 4.0, desc: "♻ Mana regen 4.0/s." }),
  I("h_horned", "Horned Warhelm", "🪖", "helmet", 3, 3, 300, { def: 8, atk: 5, hp: 25 }),
  I("h_crown", "Crown of Echoes", "👑", "helmet", 4, 4, 800, { def: 10, hp: 40, mp: 40 }, { sp: "cdr", desc: "All ability cooldowns 1.5 s shorter." }),
  I("r_copper", "Copper Ring", "💍", "ring", 0, 1, 15, { atk: 2 }),
  I("r_jade", "Jade Band", "💍", "ring", 1, 1, 50, { hp: 20, def: 2 }),
  I("r_thief", "Thief's Signet", "💍", "ring", 1, 1, 55, { crit: 6, dodge: 3 }, { cls: ["rogue"] }),
  I("r_ember", "Ember Ring", "🔥", "ring", 2, 2, 130, { fire: 6, atk: 3 }),
  I("r_frost", "Frost Loop", "❄️", "ring", 2, 2, 130, { ice: 6, def: 3 }),
  I("r_spell", "Spellweave Ring", "💍", "ring", 2, 2, 140, { mp: 25, fire: 4, ice: 4 }, { cls: ["mage"] }),
  I("r_vamp", "Vampire Signet", "🩸", "ring", 3, 3, 300, { ls: 8, atk: 5 }),
  I("r_void", "Ring of the Void", "🌀", "ring", 4, 4, 800, { ls: 12, atk: 8, crit: 8 }, { sp: "void", desc: "+15% damage dealt." }),
  I("r_etern", "Ring of Eternity", "♾️", "ring", 4, 4, 800, { mp: 50, hp: 30, atk: 6 }, { desc: "+50 MP, +30 HP and +6 ATK." }),
  I("r_mana1", "Copper Focus", "💍", "ring", 0, 1, 18, { mp: 8 }, { mpreg: 1.2, desc: "♻ Mana regen 1.2/s." }),
  I("r_mana2", "Moonwell Band", "💍", "ring", 1, 1, 50, { mp: 16 }, { mpreg: 1.8, desc: "♻ Mana regen 1.8/s." }),
  I("m_tooth", "Wolf Tooth Charm", "🦷", "amulet", 0, 1, 15, { crit: 4 }),
  I("m_saint", "Saint's Medallion", "📿", "amulet", 1, 1, 50, { holy: 4, hp: 15 }),
  I("m_beads", "Prayer Beads", "📿", "amulet", 1, 1, 55, { mp: 20, holy: 3 }, { cls: ["cleric"] }),
  I("m_owl", "Owl Amulet", "🦉", "amulet", 2, 2, 130, { mp: 30, dodge: 4 }),
  I("m_well", "Amulet of the Wellspring", "📿", "amulet", 2, 2, 140, { mp: 25 }, { mpreg: 2.8, desc: "♻ Mana regen 2.8/s." }),
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
  I("x_blood", "Bloodthirster", "🩸", "weapon", 4, 3, 500, { atk: 30, ls: 12 }, { cursed: true, curse: "c_bleed", desc: "Curse: lose 5% max HP every 1.5 s in combat." }),
  I("x_agony", "Blade of Agony", "🗡️", "weapon", 3, 2, 350, { atk: 20, crit: 25 }, { cursed: true, curse: "c_frail", desc: "Curse: max HP reduced by 30%." }),
  I("x_mad", "Crown of Madness", "👑", "helmet", 3, 2, 350, { atk: 14, crit: 20 }, { cursed: true, curse: "c_fragile", desc: "Curse: take 40% more damage." }),
  I("x_leech", "Ring of the Leech King", "💍", "ring", 3, 2, 350, { hp: 80, def: 8 }, { cursed: true, curse: "c_halfheal", desc: "Curse: all healing halved." }),
  I("x_void", "Voidheart Amulet", "🖤", "amulet", 4, 3, 500, { mp: 80, fire: 10, ice: 10 }, { cursed: true, curse: "c_nomana", desc: "Curse: no MP regeneration." }),
  I("x_greed", "Gambler's Mail", "🎰", "armor", 3, 2, 350, { def: 25, dodge: 10, atk: -8 }, { cursed: true, curse: "c_greed", desc: "Curse: gold gains halved." }),
  // ---- v8: more gear (affix-friendly) ----
  I("w_rapier", "Duelist's Rapier", "🤺", "weapon", 1, 1, 60, { atk: 6, crit: 6, dodge: 2 }),
  I("w_spear", "Hunter's Spear", "🔱", "weapon", 1, 1, 60, { atk: 7, crit: 3 }, { cls: ["warrior", "ranger", "rogue"] }),
  I("w_reaper", "Gravereaper Scythe", "⚰️", "weapon", 3, 3, 330, { atk: 17, ls: 6 }, { cls: ["warrior", "rogue"] }),
  I("a_brig", "Spiked Brigandine", "🦔", "armor", 2, 2, 150, { def: 9, hp: 20, th: 10 }),
  I("h_visor", "Ember Visor", "🥽", "helmet", 2, 2, 140, { def: 4, fire: 4, crit: 3 }),
  I("r_briar", "Briar Band", "🌿", "ring", 1, 1, 55, { th: 8, def: 2 }),
  I("r_bloodst", "Bloodstone Ring", "🔴", "ring", 2, 2, 140, { ls: 4, hp: 20 }),
  I("m_storm", "Storm Talisman", "🌩️", "amulet", 3, 3, 300, { atk: 6, ice: 6, crit: 6 }),
  I("m_pack", "Collar of the Pack", "🐾", "amulet", 2, 2, 130, { atk: 3, hp: 15 }, { sp: "petBoost", desc: "Your pets deal +30% damage and have +30% HP." }),
  // ---- v8: class sets (4 pieces, 2/3/4-piece bonuses) ----
  I("s_war_h", "Warlord's Greathelm", "🪖", "helmet", 2, 2, 160, { def: 6, hp: 25 }, { set: "warlord", cls: ["warrior"] }),
  I("s_war_a", "Warlord's Bulwark", "🛡️", "armor", 3, 3, 320, { def: 15, hp: 40 }, { set: "warlord", cls: ["warrior"] }),
  I("s_war_r", "Warlord's Seal", "💍", "ring", 2, 2, 150, { atk: 4, th: 6 }, { set: "warlord", cls: ["warrior"] }),
  I("s_war_m", "Warlord's Torc", "📿", "amulet", 3, 3, 300, { hp: 40, atk: 4 }, { set: "warlord", cls: ["warrior"] }),
  I("s_sto_w", "Stormcaller's Conduit", "⚡", "weapon", 3, 3, 320, { atk: 13, mp: 25, ice: 4 }, { set: "storm", cls: ["mage"] }),
  I("s_sto_h", "Stormcaller's Hood", "🎓", "helmet", 2, 2, 150, { mp: 25, crit: 4 }, { set: "storm", cls: ["mage"] }),
  I("s_sto_a", "Stormcaller's Robes", "👘", "armor", 2, 2, 160, { def: 6, mp: 30 }, { set: "storm", cls: ["mage"] }),
  I("s_sto_m", "Stormcaller's Focus", "🔮", "amulet", 3, 3, 300, { mp: 30, fire: 5, ice: 5 }, { set: "storm", cls: ["mage"] }),
  I("s_nig_w", "Nightblade Kris", "🗡️", "weapon", 3, 3, 320, { atk: 13, crit: 10 }, { set: "night", cls: ["rogue"] }),
  I("s_nig_h", "Nightblade Mask", "🎭", "helmet", 2, 2, 150, { dodge: 5, crit: 5 }, { set: "night", cls: ["rogue"] }),
  I("s_nig_a", "Nightblade Garb", "🥷", "armor", 2, 2, 160, { def: 6, dodge: 6 }, { set: "night", cls: ["rogue"] }),
  I("s_nig_r", "Nightblade Loop", "💍", "ring", 3, 3, 300, { crit: 8, poison: 4 }, { set: "night", cls: ["rogue"] }),
  I("s_dawn_h", "Lightbringer's Mitre", "👑", "helmet", 2, 2, 150, { def: 4, holy: 4, mp: 15 }, { set: "dawn", cls: ["cleric"] }),
  I("s_dawn_a", "Lightbringer's Vestments", "🥼", "armor", 3, 3, 320, { def: 12, hp: 35, holy: 3 }, { set: "dawn", cls: ["cleric"] }),
  I("s_dawn_r", "Lightbringer's Ring", "💍", "ring", 2, 2, 150, { holy: 4, hp: 20 }, { set: "dawn", cls: ["cleric"] }),
  I("s_dawn_m", "Lightbringer's Censer", "🏮", "amulet", 3, 3, 300, { mp: 30, holy: 6 }, { set: "dawn", cls: ["cleric"] }),
  I("s_bst_w", "Beastmaster's Recurve", "🏹", "weapon", 3, 3, 320, { atk: 14, crit: 8 }, { set: "beast", cls: ["ranger"] }),
  I("s_bst_h", "Beastmaster's Cowl", "🐺", "helmet", 2, 2, 150, { def: 4, crit: 5 }, { set: "beast", cls: ["ranger"] }),
  I("s_bst_a", "Beastmaster's Hide", "🦺", "armor", 2, 2, 160, { def: 8, dodge: 4 }, { set: "beast", cls: ["ranger"] }),
  I("s_bst_m", "Beastmaster's Fang Necklace", "🦷", "amulet", 3, 3, 300, { atk: 5, hp: 30 }, { set: "beast", cls: ["ranger"] }),

  I("s_emb_w", "Emberforged Blade", "⚔️", "weapon", 2, 2, 160, { atk: 11, fire: 5 }, { set: "ember", ff: 4 }),
  I("s_emb_a", "Emberforged Mail", "🛡️", "armor", 2, 2, 170, { def: 10, hp: 20, fire: 2 }, { set: "ember", ff: 4 }),
  I("s_emb_h", "Emberforged Casque", "⛑️", "helmet", 2, 2, 150, { def: 5, hp: 15 }, { set: "ember", ff: 4 }),
  I("s_emb_r", "Emberforged Signet", "💍", "ring", 2, 2, 150, { atk: 3, fire: 4 }, { set: "ember", ff: 4 }),
  I("s_dsk_w", "Duskward Shortsword", "🗡️", "weapon", 3, 4, 300, { atk: 15, dodge: 5 }, { set: "dusk", ff: 8 }),
  I("s_dsk_a", "Duskward Mantle", "🧥", "armor", 3, 4, 300, { def: 10, dodge: 6 }, { set: "dusk", ff: 8 }),
  I("s_dsk_h", "Duskward Hood", "🎭", "helmet", 3, 4, 280, { dodge: 5, crit: 4 }, { set: "dusk", ff: 8 }),
  I("s_dsk_m", "Duskward Talisman", "📿", "amulet", 3, 4, 280, { hp: 25, dodge: 4 }, { set: "dusk", ff: 8 }),
  I("s_bld_w", "Bloodmoon Cleaver", "🪓", "weapon", 3, 4, 320, { atk: 16, ls: 4 }, { set: "blood", ff: 8 }),
  I("s_bld_a", "Bloodmoon Cuirass", "🛡️", "armor", 3, 4, 320, { def: 14, hp: 30 }, { set: "blood", ff: 8 }),
  I("s_bld_r", "Bloodmoon Band", "💍", "ring", 3, 4, 300, { ls: 5, atk: 4 }, { set: "blood", ff: 8 }),
  I("s_bld_m", "Bloodmoon Charm", "📿", "amulet", 3, 4, 300, { hp: 35, crit: 4 }, { set: "blood", ff: 8 }),
  I("s_ttn_w", "Titanbone Greatblade", "⚔️", "weapon", 3, 6, 360, { atk: 19, def: 3 }, { set: "titan", ff: 12 }),
  I("s_ttn_a", "Titanbone Plate", "🛡️", "armor", 3, 6, 360, { def: 18, hp: 45 }, { set: "titan", ff: 12 }),
  I("s_ttn_h", "Titanbone Helm", "⛑️", "helmet", 3, 6, 330, { def: 8, hp: 30 }, { set: "titan", ff: 12 }),
  I("s_ttn_m", "Titanbone Idol", "💎", "amulet", 3, 6, 330, { hp: 40, atk: 6 }, { set: "titan", ff: 12 }),
  I("s_ber_w", "Berserker's Wrathblade", "⚔️", "weapon", 3, 4, 320, { atk: 16, crit: 5 }, { set: "berserk", cls: ["warrior"], ff: 8 }),
  I("s_ber_a", "Berserker's Harness", "🦺", "armor", 3, 4, 320, { def: 12, hp: 30, atk: 3 }, { set: "berserk", cls: ["warrior"], ff: 8 }),
  I("s_ber_h", "Berserker's Helm", "🪖", "helmet", 3, 4, 280, { def: 6, crit: 5 }, { set: "berserk", cls: ["warrior"], ff: 8 }),
  I("s_ber_r", "Berserker's Band", "💍", "ring", 3, 4, 280, { atk: 5, hp: 20 }, { set: "berserk", cls: ["warrior"], ff: 8 }),
  I("s_glm_w", "Gloamrunner's Fang", "🔪", "weapon", 3, 4, 320, { atk: 15, dodge: 4, crit: 6 }, { set: "gloam", cls: ["rogue"], ff: 8 }),
  I("s_glm_a", "Gloamrunner's Wraps", "🥷", "armor", 3, 4, 300, { def: 8, dodge: 7 }, { set: "gloam", cls: ["rogue"], ff: 8 }),
  I("s_glm_h", "Gloamrunner's Veil", "🎭", "helmet", 3, 4, 280, { dodge: 6, crit: 5 }, { set: "gloam", cls: ["rogue"], ff: 8 }),
  I("s_glm_m", "Gloamrunner's Charm", "📿", "amulet", 3, 4, 280, { atk: 4, dodge: 4 }, { set: "gloam", cls: ["rogue"], ff: 8 }),
  I("s_oath_w", "Oathkeeper's Maul", "🔨", "weapon", 3, 4, 320, { atk: 15, holy: 6 }, { set: "oath", cls: ["cleric"], ff: 8 }),
  I("s_oath_a", "Oathkeeper's Plate", "🛡️", "armor", 3, 4, 320, { def: 13, hp: 35, holy: 3 }, { set: "oath", cls: ["cleric"], ff: 8 }),
  I("s_oath_h", "Oathkeeper's Helm", "⛑️", "helmet", 3, 4, 280, { def: 6, hp: 20, mp: 15 }, { set: "oath", cls: ["cleric"], ff: 8 }),
  I("s_oath_m", "Oathkeeper's Relic", "📿", "amulet", 3, 4, 300, { mp: 25, holy: 5, hp: 20 }, { set: "oath", cls: ["cleric"], ff: 8 }),
  I("s_wnd_w", "Windstrider Longbow", "🏹", "weapon", 3, 4, 320, { atk: 16, crit: 8 }, { set: "wind", cls: ["ranger"], ff: 8 }),
  I("s_wnd_a", "Windstrider Coat", "🧥", "armor", 3, 4, 300, { def: 9, dodge: 5 }, { set: "wind", cls: ["ranger"], ff: 8 }),
  I("s_wnd_h", "Windstrider Cap", "🧢", "helmet", 3, 4, 280, { crit: 6, dodge: 4 }, { set: "wind", cls: ["ranger"], ff: 8 }),
  I("s_wnd_r", "Windstrider Band", "💍", "ring", 3, 4, 280, { atk: 5, crit: 5 }, { set: "wind", cls: ["ranger"], ff: 8 }),
  I("c_hp1", "Minor Healing Potion", "🧪", "consumable", 0, 1, 15, undefined, { fx: "heal", pw: 35, desc: "Restore 35% HP." }),
  I("c_hp2", "Healing Potion", "🍷", "consumable", 1, 1, 35, undefined, { fx: "heal", pw: 60, desc: "Restore 60% HP." }),
  I("c_hp3", "Greater Healing Draught", "💖", "consumable", 2, 2, 80, undefined, { fx: "heal", pw: 100, desc: "Fully restore HP." }),
  I("c_mp1", "Mana Potion", "🔵", "consumable", 0, 1, 15, undefined, { fx: "mana", pw: 50, desc: "Restore 50% MP." }),
  I("c_mp2", "Elixir of Clarity", "💧", "consumable", 1, 1, 35, undefined, { fx: "mana", pw: 100, desc: "Fully restore MP." }),
  I("c_rej", "Rejuvenation Tonic", "🍹", "consumable", 2, 2, 70, undefined, { fx: "both", pw: 60, desc: "Restore 60% HP and MP." }),
  I("c_anti", "Antidote", "🌿", "consumable", 0, 1, 12, undefined, { fx: "cleanse", pw: 15, desc: "Cure poison/burn, heal 15%." }),
  I("c_bomb", "Fire Bomb", "💣", "consumable", 1, 1, 40, undefined, { fx: "bomb", desc: "Combat: fire damage to ALL enemies + burn." }),
  I("c_frost", "Frost Grenade", "🧊", "consumable", 2, 2, 70, undefined, { fx: "frost", desc: "Combat: ice damage to ALL nearby foes and freeze them for 2.5 s." }),
  I("c_smoke", "Smoke Bomb", "💨", "consumable", 1, 1, 30, undefined, { fx: "smoke", desc: "Combat: instantly break off the fight, foes are blinded (not bosses)." }),
  I("c_fury", "Scroll of Fury", "📜", "consumable", 1, 1, 40, undefined, { fx: "fury", desc: "+50% ATK for 20 s. Reading another refreshes the duration." }),
  I("c_iron", "Scroll of Ironskin", "📃", "consumable", 1, 1, 40, undefined, { fx: "iron", desc: "+50% DEF for 25 s. Reading another refreshes the duration." }),
  I("c_map", "Scroll of Revealing", "🗺️", "consumable", 0, 1, 20, undefined, { fx: "reveal", desc: "Map: reveal the whole floor." }),
  I("c_tele", "Scroll of Descent", "🌀", "consumable", 2, 2, 60, undefined, { fx: "tele", desc: "Map: teleport beside the stairs (or boss)." }),
  I("c_ident", "Scroll of Identify", "🔍", "consumable", 2, 1, 60, undefined, { fx: "ident", desc: "Identify every unidentified item in your bag." }),
  I("c_uncurse", "Scroll of Remove Curse", "🕯️", "consumable", 2, 1, 70, undefined, { fx: "uncurse", desc: "Lift curses from equipped items so they can be removed." }),
  I("c_might", "Elixir of Might", "🍺", "consumable", 3, 2, 200, undefined, { fx: "eatk", desc: "Permanently +3 ATK." }),
  I("c_life", "Elixir of Vitality", "🍯", "consumable", 3, 2, 200, undefined, { fx: "ehp", desc: "Permanently +25 max HP." }),
  I("c_tome", "Tome of Insight", "📕", "consumable", 3, 3, 250, undefined, { fx: "tome", desc: "Instantly gain a level." }),
  I("c_storm", "Bottled Storm", "🌪️", "consumable", 1, 1, 45, undefined, { fx: "storm", desc: "Combat: lightning strikes the 3 nearest foes and stuns them." }),
  I("c_treat", "Pet Treat", "🦴", "consumable", 0, 1, 15, undefined, { fx: "treat", desc: "Revive and fully heal your pets." }),
  I("c_pet_wolf", "Wolf Pup Whistle", "🐺", "consumable", 1, 1, 70, undefined, { fx: "pet", pet: "wolf", desc: "Gain a Wolf companion that fights beside you (replaces your current charm pet)." }),
  I("c_pet_owl", "Spirit Owl Feather", "🦉", "consumable", 1, 1, 70, undefined, { fx: "pet", pet: "owl", desc: "Gain a Spirit Owl: quick strikes that can stun." }),
  I("c_pet_imp", "Imp Sigil", "😈", "consumable", 2, 2, 120, undefined, { fx: "pet", pet: "imp", desc: "Gain a Fire Imp: hurls fire bolts from range and sets foes ablaze." }),
  I("c_pet_hound", "Bone Hound Totem", "🐕", "consumable", 2, 3, 130, undefined, { fx: "pet", pet: "hound", desc: "Gain a Bone Hound: a sturdy guardian that draws enemy attacks." }),
  // ---- expansion: new bases, mid/deep sets, uniques and curses ----
  I("w_pike", "Militia Pike", "🔱", "weapon", 0, 1, 22, { atk: 4 }, { cls: ["warrior"] }),
  I("w_club", "Knotted Club", "🔨", "weapon", 0, 1, 18, { atk: 5 }, { cls: ["warrior"] }),
  I("w_wand0", "Spark Wand", "✨", "weapon", 0, 1, 22, { atk: 3, mp: 12 }, { cls: ["mage"] }),
  I("w_hatchet", "Woodsman's Hatchet", "🪓", "weapon", 1, 1, 55, { atk: 6, crit: 3 }, { cls: ["warrior"] }),
  I("w_dirk", "Iron Dirk", "🔪", "weapon", 1, 1, 55, { atk: 5, crit: 6 }, { cls: ["rogue"] }),
  I("w_recur", "Recurve Bow", "🏹", "weapon", 1, 1, 55, { atk: 6, crit: 5 }, { cls: ["ranger"] }),
  I("w_gladius", "Steel Gladius", "🗡️", "weapon", 2, 2, 140, { atk: 11 }),
  I("w_halberd", "Iron Halberd", "🔱", "weapon", 2, 2, 150, { atk: 12, def: 2 }, { cls: ["warrior"] }),
  I("w_waraxe", "Crescent Axe", "🪓", "weapon", 2, 2, 150, { atk: 13, crit: 4 }, { cls: ["warrior"] }),
  I("w_runewand", "Runed Wand", "✨", "weapon", 2, 2, 145, { atk: 8, mp: 28, fire: 4 }, { cls: ["mage"] }),
  I("w_boar", "Boar Spear", "🔱", "weapon", 2, 2, 145, { atk: 11, crit: 4 }, { cls: ["warrior", "ranger"] }),
  I("w_star", "Morning Star", "🔨", "weapon", 3, 3, 320, { atk: 15, holy: 6 }, { cls: ["warrior", "cleric"] }),
  I("w_stiletto", "Stiletto", "🔪", "weapon", 3, 3, 320, { atk: 13, crit: 16 }, { cls: ["rogue"] }),
  I("w_compbow", "Composite Bow", "🏹", "weapon", 3, 3, 320, { atk: 15, crit: 12 }, { cls: ["ranger"] }),
  I("w_bstaff", "Battlestaff", "🪄", "weapon", 3, 3, 320, { atk: 14, mp: 35, def: 3 }, { cls: MC }),
  I("w_flamberge", "Flamberge", "⚔️", "weapon", 3, 4, 400, { atk: 20, crit: 6 }, { cls: ["warrior"] }),
  I("w_voidpike", "Void Pike", "🔱", "weapon", 3, 5, 440, { atk: 22 }, { cls: ["warrior"] }),
  I("w_doomhammer", "Doom Hammer", "🔨", "weapon", 3, 5, 450, { atk: 23, def: 5 }, { cls: ["warrior"] }),
  I("w_eclipse", "Eclipse Bow", "🏹", "weapon", 3, 5, 440, { atk: 21, crit: 14 }, { cls: ["ranger"] }),
  I("w_lichwand", "Lich Wand", "✨", "weapon", 3, 5, 440, { atk: 16, mp: 50, poison: 8 }, { cls: ["mage"] }),
  I("w_ashstaff", "Ashen Staff", "🪄", "weapon", 3, 6, 500, { atk: 18, mp: 55, fire: 10 }, { cls: MC }),
  I("w_endblade", "Echoing Longsword", "🗡️", "weapon", 3, 7, 560, { atk: 26, crit: 8 }),
  I("a_hide", "Hide Jerkin", "👕", "armor", 0, 1, 18, { def: 4, hp: 8 }),
  I("a_scale", "Scale Vest", "🛡️", "armor", 1, 1, 55, { def: 7, hp: 12 }),
  I("a_studded", "Studded Leather", "🦺", "armor", 2, 2, 145, { def: 11, dodge: 3 }),
  I("a_splint", "Splint Mail", "🛡️", "armor", 2, 2, 155, { def: 15, hp: 25 }, { cls: ["warrior", "cleric"] }),
  I("a_silkweave", "Silkweave Robes", "👘", "armor", 2, 2, 145, { def: 6, mp: 35 }, { cls: MC }),
  I("a_wyrm", "Wyrmhide Coat", "🐲", "armor", 3, 3, 330, { def: 18, hp: 35, poison: 4 }),
  I("a_mirror", "Mirror Mail", "🛡️", "armor", 3, 4, 400, { def: 17, th: 12 }),
  I("a_voidmail", "Void-Touched Mail", "🛡️", "armor", 3, 5, 450, { def: 20, hp: 50, dodge: 4 }),
  I("a_titanhide", "Titanhide Harness", "🛡️", "armor", 3, 6, 500, { def: 22, hp: 55 }),
  I("a_echoplate", "Echoplate Cuirass", "🛡️", "armor", 3, 7, 560, { def: 24, hp: 70 }),
  I("h_coif", "Mail Coif", "⛑️", "helmet", 1, 1, 45, { def: 3, hp: 10 }),
  I("h_barbute", "Barbute", "🪖", "helmet", 2, 2, 140, { def: 6, hp: 18 }, { cls: ["warrior", "cleric"] }),
  I("h_cowl", "Adept's Cowl", "🎩", "helmet", 2, 2, 135, { mp: 22, dodge: 3 }, { cls: MC }),
  I("h_bascinet", "Bascinet", "⛑️", "helmet", 3, 3, 300, { def: 9, hp: 22 }),
  I("h_mask", "Assassin's Mask", "🎭", "helmet", 3, 4, 380, { crit: 8, dodge: 5 }, { cls: ["rogue"] }),
  I("h_voidcrown", "Void Circlet", "💠", "helmet", 3, 5, 430, { def: 8, mp: 40, atk: 4 }),
  I("h_endless", "Helm of the Deep", "🪖", "helmet", 3, 6, 490, { def: 10, hp: 35, mp: 30 }),
  I("h_echohood", "Echo Hood", "🎭", "helmet", 3, 7, 540, { dodge: 8, crit: 8, hp: 20 }),
  I("r_iron", "Iron Band", "💍", "ring", 0, 1, 15, { def: 1, hp: 8 }),
  I("r_sage", "Sage Loop", "💍", "ring", 1, 1, 50, { mp: 18, atk: 1 }),
  I("r_serpent", "Serpent Ring", "💍", "ring", 2, 2, 135, { poison: 5, dodge: 3 }),
  I("r_titan", "Titan's Band", "💍", "ring", 3, 3, 300, { hp: 40, def: 4 }),
  I("r_storm", "Storm Signet", "💍", "ring", 3, 4, 380, { atk: 5, ice: 5, fire: 5 }),
  I("r_abyss", "Abyssal Ring", "💍", "ring", 3, 5, 430, { ls: 6, atk: 6 }),
  I("r_echo", "Echo Band", "💍", "ring", 3, 6, 490, { crit: 8, mp: 30, atk: 5 }),
  I("m_pebble", "Stone Charm", "🪨", "amulet", 0, 1, 14, { def: 2 }),
  I("m_amber", "Amber Pendant", "📿", "amulet", 1, 1, 50, { hp: 20, atk: 2 }),
  I("m_anvil", "Anvil Talisman", "📿", "amulet", 2, 2, 135, { def: 5, hp: 25 }),
  I("m_moon", "Moon Pendant", "🌙", "amulet", 2, 2, 135, { mp: 28, ice: 4 }),
  I("m_wyrm", "Wyrm's Eye", "🐲", "amulet", 3, 3, 300, { fire: 8, hp: 30 }),
  I("m_abyss", "Abyss Locket", "🖤", "amulet", 3, 5, 430, { atk: 7, ls: 5 }),
  I("m_endless", "Amulet of the Deep", "💎", "amulet", 3, 6, 500, { hp: 70, def: 6, mp: 30 }),
  I("s_grv_a", "Gravebloom Shroud", "🧥", "armor", 3, 3, 300, { def: 11, hp: 25, poison: 3 }, { set: "grave", ff: 6 }),
  I("s_grv_h", "Gravebloom Cowl", "🎭", "helmet", 3, 3, 280, { def: 5, poison: 4, hp: 15 }, { set: "grave", ff: 6 }),
  I("s_grv_r", "Gravebloom Band", "💍", "ring", 3, 3, 280, { poison: 5, atk: 3 }, { set: "grave", ff: 6 }),
  I("s_grv_m", "Gravebloom Amulet", "📿", "amulet", 3, 3, 280, { hp: 25, poison: 4 }, { set: "grave", ff: 6 }),
  I("s_rme_w", "Rimeward Blade", "⚔️", "weapon", 3, 5, 420, { atk: 18, ice: 6 }, { set: "rime", ff: 10 }),
  I("s_rme_a", "Rimeward Mail", "🛡️", "armor", 3, 5, 420, { def: 16, hp: 30, ice: 3 }, { set: "rime", ff: 10 }),
  I("s_rme_h", "Rimeward Helm", "⛑️", "helmet", 3, 5, 400, { def: 7, hp: 20, ice: 3 }, { set: "rime", ff: 10 }),
  I("s_rme_m", "Rimeward Talisman", "❄️", "amulet", 3, 5, 400, { ice: 6, def: 4 }, { set: "rime", ff: 10 }),
  I("s_ash_h", "Ashen Circlet", "💠", "helmet", 3, 6, 430, { mp: 30, fire: 4, atk: 3 }, { set: "ashen", ff: 14 }),
  I("s_ash_r", "Ashen Signet", "💍", "ring", 3, 6, 430, { fire: 6, mp: 20 }, { set: "ashen", ff: 14 }),
  I("s_ash_m", "Ashen Amulet", "🔥", "amulet", 3, 6, 430, { fire: 6, atk: 4 }, { set: "ashen", ff: 14 }),
  I("w_kiss", "Reaper's Kiss", "🔪", "weapon", 4, 4, 900, undefined, { cls: ["rogue"], sp: "reapSoul", desc: "Kills restore 8% HP and 10% MP.", uranges: { atk: [22, 28], crit: [16, 24] } }),
  I("w_worldender", "Worldender", "🪓", "weapon", 4, 6, 1100, undefined, { cls: ["warrior"], sp: "cleaveHit", desc: "Basic attacks also cleave a nearby foe for 50%.", uranges: { atk: [28, 36], crit: [6, 10] } }),
  I("w_starlance", "Starlance", "🔱", "weapon", 4, 5, 1000, undefined, { cls: ["warrior", "ranger"], sp: "skyfall", desc: "Your first hit in a fight deals 175%.", uranges: { atk: [24, 30], holy: [8, 14] } }),
  I("w_soulwand", "Soulfire Wand", "✨", "weapon", 4, 5, 1000, undefined, { cls: ["mage"], sp: "soulburn", desc: "Ability hits ignite the target and restore 10 MP.", uranges: { atk: [16, 22], mp: [50, 70], fire: [10, 16] } }),
  I("a_gloom", "Gloomhide Carapace", "🧥", "armor", 4, 5, 1000, undefined, { sp: "shadowVeil", desc: "After you are hit, gain +20% dodge for 3 s.", uranges: { def: [22, 28], hp: [50, 80], dodge: [4, 8] } }),
  I("h_oracle", "Oracle's Diadem", "👑", "helmet", 4, 5, 1000, undefined, { cls: MC, sp: "insight", desc: "Abilities deal 20% more damage.", uranges: { def: [6, 10], mp: [50, 70], atk: [4, 8] } }),
  I("r_twin", "Twin Serpent Ring", "💍", "ring", 4, 4, 900, undefined, { sp: "critPoison", desc: "Critical hits inflict heavy poison.", uranges: { poison: [8, 14], ls: [6, 10], atk: [5, 9] } }),
  I("x_cinder", "Cinderstride Raiment", "🧥", "armor", 3, 3, 420, { def: 16, dodge: 12, atk: 8 }, { cursed: true, curse: "c_burn", desc: "Curse: burn 3% of max HP every 2 s in combat." }),
  I("x_glutton", "Helm of the Glutton", "🪖", "helmet", 3, 3, 420, { hp: 90, def: 10 }, { cursed: true, curse: "c_slow", desc: "Curse: you move 30% slower." }),
  I("x_glass", "Glassfang", "🗡️", "weapon", 3, 4, 480, { atk: 28, crit: 22 }, { cursed: true, curse: "c_brittle", desc: "Curse: your DEF is halved." }),
  I("x_pendulum", "Pendulum Amulet", "⏳", "amulet", 3, 4, 480, { atk: 10, mp: 50, crit: 8 }, { cursed: true, curse: "c_lag", desc: "Curse: ability cooldowns last 50% longer." }),
  I("x_living", "Ring of Living Lightning", "⚡", "ring", 4, 5, 650, { atk: 10, crit: 12, fire: 8 }, { cursed: true, curse: "c_manatick", sp: "chainShock", desc: "Attacks arc lightning to all other foes for 35%. Curse: lose 8% of max MP every 2 s in combat." }),
];
const IT: Record<string, ItemT> = {};
for (const it of ITEMS) IT[it.id] = it;
const SETS: Record<string, SetT> = {
  iron: { name: "Ironclad", n: 3, b2: { def: 10 }, bf: { hp: 60 }, sp: "thorns15", desc: "2 pc: +10 DEF · 3 pc: +60 HP and reflect 15% damage" },
  shadow: { name: "Shadowstalker", n: 3, b2: { dodge: 8 }, bf: { crit: 12 }, sp: "critHeal", desc: "2 pc: +8% dodge · 3 pc: +12% crit, crits heal 5% HP" },
  arc: { name: "Arcanist's Regalia", n: 4, b2: { mp: 40 }, bf: { atk: 6 }, sp: "arcanist", desc: "2 pc: +40 MP · 4 pc: +6 ATK, abilities cost 25% less and deal +20% damage" },
  warlord: { name: "Warlord's Panoply", cls: "warrior", n: 4, b2: { def: 8 }, b3: { th: 15, hp: 40 }, bf: { atk: 10 }, sp: "thorns", desc: "2 pc: +8 DEF · 3 pc: +15% thorns, +40 HP · 4 pc: +10 ATK and reflect another 25% of damage taken" },
  storm: { name: "Stormcaller's Regalia", cls: "mage", n: 4, b2: { mp: 30 }, b3: { fire: 6, ice: 6 }, bf: { atk: 6 }, sp: "chainShock", desc: "2 pc: +30 MP · 3 pc: +6 fire, +6 ice · 4 pc: +6 ATK and every attack arcs lightning to all other foes (35%)" },
  night: { name: "Nightblade's Shroud", cls: "rogue", n: 4, b2: { crit: 6 }, b3: { dodge: 6, poison: 5 }, bf: { atk: 6 }, sp: "critPoison", desc: "2 pc: +6% crit · 3 pc: +6% dodge, +5 poison · 4 pc: +6 ATK and crits inflict heavy poison" },
  dawn: { name: "Lightbringer's Vestiture", cls: "cleric", n: 4, b2: { holy: 5 }, b3: { hp: 40, def: 5 }, bf: { mp: 30, holy: 6 }, sp: "holyWard", desc: "2 pc: +5 holy · 3 pc: +40 HP, +5 DEF · 4 pc: +30 MP, +6 holy, and take 12% less damage" },
  beast: { name: "Beastmaster's Garb", cls: "ranger", n: 4, b2: { crit: 5 }, b3: { atk: 5, dodge: 5 }, bf: { hp: 30 }, sp: "petx2", desc: "2 pc: +5% crit · 3 pc: +5 ATK, +5% dodge · 4 pc: +30 HP and pet damage doubled" },
  ember: { name: "Emberforged Battlegear", n: 4, b2: { fire: 6 }, b3: { atk: 5, hp: 20 }, bf: { atk: 4 }, sp: "flameHit", desc: "2 pc: +6 fire · 3 pc: +5 ATK, +20 HP · 4 pc: +4 ATK and attacks can ignite foes" },
  dusk: { name: "Duskward Raiment", n: 4, b2: { dodge: 6 }, b3: { hp: 30, crit: 5 }, bf: { dodge: 4 }, sp: "ghoststep", desc: "2 pc: +6% dodge · 3 pc: +30 HP, +5% crit · 4 pc: +4% dodge and dodging an attack heals 4% HP" },
  blood: { name: "Bloodmoon Panoply", n: 4, b2: { ls: 5 }, b3: { atk: 5, hp: 30 }, bf: { ls: 4 }, sp: "bloodlust", desc: "2 pc: +5% lifesteal · 3 pc: +5 ATK, +30 HP · 4 pc: +4% lifesteal and kills heal 8% HP" },
  titan: { name: "Titanbone Plate", n: 4, b2: { hp: 40, def: 6 }, b3: { atk: 6, def: 6 }, bf: { hp: 50 }, sp: "colossus", desc: "2 pc: +40 HP, +6 DEF · 3 pc: +6 ATK, +6 DEF · 4 pc: +50 HP and take 12% less damage" },
  berserk: { name: "Berserker's Harness", cls: "warrior", n: 4, b2: { atk: 8 }, b3: { crit: 8, hp: 30 }, bf: { def: 6 }, sp: "execute", desc: "2 pc: +8 ATK · 3 pc: +8% crit, +30 HP · 4 pc: +6 DEF and +25% damage to wounded foes" },
  gloam: { name: "Gloamrunner's Kit", cls: "rogue", n: 4, b2: { dodge: 6 }, b3: { crit: 6, atk: 4 }, bf: { dodge: 4 }, sp: "opener", desc: "2 pc: +6% dodge · 3 pc: +6% crit, +4 ATK · 4 pc: +4% dodge and your first hit in a fight deals 150%" },
  oath: { name: "Oathkeeper's Sacrament", cls: "cleric", n: 4, b2: { holy: 6 }, b3: { hp: 40, def: 6 }, bf: { mp: 25 }, sp: "lifeTap", desc: "2 pc: +6 holy · 3 pc: +40 HP, +6 DEF · 4 pc: +25 MP and 8% of damage dealt is returned as healing" },
  wind: { name: "Windstrider's Leaguer", cls: "ranger", n: 4, b2: { crit: 6 }, b3: { atk: 5, dodge: 5 }, bf: { crit: 4 }, sp: "pierce", desc: "2 pc: +6% crit · 3 pc: +5 ATK, +5% dodge · 4 pc: +4% crit and basic attacks also pierce a nearby foe for 40%" },
  grave: { name: "Gravebloom Vestments", n: 4, b2: { poison: 6 }, b3: { hp: 30, atk: 4 }, bf: { poison: 5 }, sp: "graveRot", desc: "2 pc: +6 poison · 3 pc: +30 HP, +4 ATK · 4 pc: +5 poison and attacks inflict a heavier rot" },
  rime: { name: "Rimeward Pall", n: 4, b2: { ice: 6 }, b3: { def: 6, hp: 20 }, bf: { ice: 5 }, sp: "freezeHit", desc: "2 pc: +6 ice · 3 pc: +6 DEF, +20 HP · 4 pc: +5 ice and attacks have a 25% chance to freeze" },
  ashen: { name: "Ashen Covenant", n: 3, b2: { mp: 30, fire: 4 }, bf: { atk: 6 }, sp: "flameHit", desc: "2 pc: +30 MP, +4 fire · 3 pc: +6 ATK and attacks can ignite foes" },
};
const PETS: Record<string, PetT> = {
  wolf: { name: "Wolf", icon: "🐺", hpF: 0.5, mult: 0.45, spd: 4.4, reach: 0.95, rate: 1.5, desc: "bites hard" },
  hawk: { name: "Hawk", icon: "🦅", hpF: 0.32, mult: 0.4, spd: 5.2, reach: 1.05, rate: 1.4, desc: "swift talons" },
  owl: { name: "Spirit Owl", icon: "🦉", hpF: 0.3, mult: 0.32, spd: 5, reach: 1.0, rate: 1.3, desc: "strikes can stun" },
  imp: { name: "Fire Imp", icon: "😈", hpF: 0.32, mult: 0.36, spd: 4, reach: 3.4, rate: 1.9, desc: "fire bolts from range, burns" },
  hound: { name: "Bone Hound", icon: "🐕", hpF: 0.8, mult: 0.38, spd: 4.2, reach: 0.95, rate: 1.6, desc: "sturdy, draws attacks" },
};

const CLS: Record<ClassId, ClassT> = {
  warrior: { id: "warrior", name: "Warrior", icon: "🛡️", tag: "Unbreakable frontliner", base: { hp: 120, mp: 30, atk: 12, def: 6, crit: 5, dodge: 3 }, grow: { hp: 14, mp: 3, atk: 2, def: 1.5, crit: 0 }, passive: "Rage: gains 2 MP every time it is struck.", start: ["w_sword", "a_tunic"],
    abs: [{ id: "bash", name: "Shield Bash", icon: "🛡️", mp: 5, cd: 5, desc: "130% damage and stuns for 2 s." }, { id: "cleave", name: "Cleave", icon: "🪓", mp: 8, cd: 6, desc: "100% damage in a frontal cone." }, { id: "cry", name: "Battle Cry", icon: "📣", mp: 10, cd: 12, desc: "+50% ATK for 8 s, heal 15%." }, { id: "smash", name: "Smash", icon: "💥", mp: 10, cd: 12, desc: "120% damage in a circle around you, with a shockwave." }] },
  mage: { id: "mage", name: "Mage", icon: "🧙", tag: "Glass-cannon spellcaster", base: { hp: 70, mp: 80, atk: 11, def: 2, crit: 5, dodge: 5 }, grow: { hp: 7, mp: 10, atk: 2.3, def: 0.7, crit: 0 }, passive: "Staff strikes are weak but restore 6 MP.", start: ["w_staff", "a_robe"],
    abs: [{ id: "fireball", name: "Fireball", icon: "🔥", mp: 12, cd: 0, desc: "220% fire damage + burn for 4.5 s." }, { id: "nova", name: "Frost Nova", icon: "❄️", mp: 16, cd: 10, desc: "120% to ALL enemies, freezes for 3 s." }, { id: "arcane", name: "Arcane Shield", icon: "🔮", mp: 10, cd: 14, desc: "Absorb shield worth 40% of max MP." }] },
  rogue: { id: "rogue", name: "Rogue", icon: "🥷", tag: "Crits, poison and evasion", base: { hp: 85, mp: 35, atk: 11, def: 3, crit: 25, dodge: 15 }, grow: { hp: 9, mp: 4, atk: 2.2, def: 0.8, crit: 0.5 }, passive: "Born lucky: high crit and dodge. Backstab auto-crits in the first 3 s of a fight or vs stunned foes.", start: ["w_dagger", "a_tunic"],
    abs: [{ id: "backstab", name: "Backstab", icon: "🗡️", mp: 8, cd: 5, desc: "220% damage; guaranteed crit in the first 3 s of a fight or vs stunned." }, { id: "poison", name: "Poison Blade", icon: "🧪", mp: 8, cd: 6, desc: "100% damage + strong poison for 6 s." }, { id: "evade", name: "Evade", icon: "💨", mp: 6, cd: 10, desc: "Automatically dodge the next 2 attacks." }] },
  cleric: { id: "cleric", name: "Cleric", icon: "😇", tag: "Holy healer, undead slayer", base: { hp: 100, mp: 60, atk: 9, def: 5, crit: 5, dodge: 5 }, grow: { hp: 11, mp: 7, atk: 1.7, def: 1.2, crit: 0 }, passive: "Holy power: Smite deals 250% to undead; outlasts anything.", start: ["w_staff", "a_robe"],
    abs: [{ id: "heal", name: "Heal", icon: "✨", mp: 10, cd: 6, desc: "Restore 35% HP and cleanse poison/burn." }, { id: "smite", name: "Smite", icon: "⚡", mp: 10, cd: 0, desc: "180% holy damage (250% vs undead)." }, { id: "holy", name: "Holy Shield", icon: "🔆", mp: 12, cd: 14, desc: "Halve all damage taken for 6 s." }, { id: "smash", name: "Smash", icon: "💥", mp: 10, cd: 12, desc: "120% damage in a circle around you, with a shockwave." }] },
  ranger: { id: "ranger", name: "Ranger", icon: "🏹", tag: "Archer with a wolf companion", base: { hp: 90, mp: 40, atk: 10, def: 4, crit: 15, dodge: 10 }, grow: { hp: 10, mp: 5, atk: 2, def: 1, crit: 0.3 }, passive: "Wolf companion runs at foes and bites for 45% ATK every 1.5 s.", start: ["w_bow", "a_tunic"],
    abs: [{ id: "multi", name: "Multi-Shot", icon: "🏹", mp: 10, cd: 5, desc: "4 arrows at random foes, 70% each." }, { id: "trap", name: "Snare Trap", icon: "⛓️", mp: 8, cd: 10, desc: "Stun target for 3 s + bleed for 4.5 s." }, { id: "frenzy", name: "Call of the Wild", icon: "📯", mp: 10, cd: 12, desc: "150% shot; pets deal triple for 8 s." }] },
};
const CLASS_IDS: ClassId[] = ["warrior", "mage", "rogue", "cleric", "ranger"];

const CAPS: Record<ClassId, Perk[]> = {
  warrior: [
    { id: "undying", name: "Undying", icon: "⚰️", tier: 5, rar: "Legendary", cls: "warrior", desc: "Once per floor, a lethal blow leaves you at 1 HP." },
    { id: "whirlwind", name: "Whirlwind", icon: "🌪️", tier: 4, rar: "Epic", cls: "warrior", desc: "Cleave becomes a 120% hit on ALL nearby enemies and stuns them." },
    { id: "juggernaut", name: "Juggernaut", icon: "🗿", tier: 4, rar: "Epic", cls: "warrior", desc: "Take 15% less damage and reflect 35% of damage taken." },
  ],
  mage: [
    { id: "chain", name: "Chain Magic", icon: "⚡", tier: 4, rar: "Epic", cls: "mage", desc: "Fireball chains to ALL enemies; Frost Nova deals +50%." },
    { id: "echo", name: "Arcane Echo", icon: "🔁", tier: 4, rar: "Epic", cls: "mage", desc: "Fireball and Frost Nova have a 30% chance to cast twice for free." },
    { id: "archmage", name: "Archmage", icon: "🌌", tier: 5, rar: "Legendary", cls: "mage", desc: "All spells cost 50% MP and cooldowns are 1.5 s shorter." },
  ],
  rogue: [
    { id: "shadowmeld", name: "Shadowmeld", icon: "🌫️", tier: 4, rar: "Epic", cls: "rogue", desc: "Once per floor, turn invisible to skip any non-boss fight." },
    { id: "deathmark", name: "Death Mark", icon: "🎯", tier: 5, rar: "Legendary", cls: "rogue", desc: "+10% crit; crits deal 3x damage instead of 2x." },
    { id: "shadowstep", name: "Shadow Step", icon: "🌑", tier: 5, rar: "Legendary", cls: "rogue", desc: "Open every fight with a free 150% critical strike that stuns." },
  ],
  cleric: [
    { id: "radiance", name: "Radiance", icon: "☀️", tier: 4, rar: "Epic", cls: "cleric", desc: "Every heal in combat also blasts ALL enemies for the amount healed." },
    { id: "sanctuary", name: "Sanctuary", icon: "🕊️", tier: 4, rar: "Epic", cls: "cleric", desc: "Take 12% less damage." },
    { id: "wrath", name: "Wrath of Heaven", icon: "🌩️", tier: 5, rar: "Legendary", cls: "cleric", desc: "Smite strikes ALL enemies and stuns undead." },
    { id: "resurrect", name: "Divine Resurrection", icon: "🕯️", tier: 5, rar: "Legendary", cls: "cleric", desc: "Once per floor, a lethal blow instead revives you at 50% HP." },
  ],
  ranger: [
    { id: "packleader", name: "Pack Leader", icon: "🪶", tier: 5, rar: "Legendary", cls: "ranger", desc: "Gain a second pet: a Hawk that strikes every 1.4 s." },
    { id: "volley", name: "Arrow Volley", icon: "🌧️", tier: 4, rar: "Epic", cls: "ranger", desc: "Multi-Shot fires 2 arrows at EVERY enemy." },
    { id: "eagleeye", name: "Eagle Eye", icon: "👁️", tier: 4, rar: "Epic", cls: "ranger", desc: "+20% crit; crits ignore enemy defense." },
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
// v8: Common-rarity perk pool = the six stat perks above + these special commons (starter pick and Endless Tier I offers)
const UPG1X: Perk[] = [
  { id: "beastbond", name: "Beast Bond", icon: "🐾", tier: 1, desc: "Gain a Wolf companion if you have no charm pet; all your pets deal +25% damage and have +25% HP." },
  { id: "scavenger", name: "Scavenger", icon: "🔎", tier: 1, desc: "Monsters and chests are 20% more likely to drop an item (gold unchanged)." },
  { id: "herbalist", name: "Herbalist", icon: "🌿", tier: 1, desc: "Healing items restore 25% more." },
  { id: "fleet", name: "Fleet-Footed", icon: "🪽", tier: 1, desc: "Dodge roll cooldown 25% shorter." },
];
const UPG2: Perk[] = [
  { id: "titan", name: "Titan's Blood", icon: "🏔️", tier: 2, desc: "+60 max HP, +4 DEF", st: { hp: 60, def: 4 } },
  { id: "berserk", name: "Berserker", icon: "🔥", tier: 2, desc: "+6 ATK, +5% crit", st: { atk: 6, crit: 5 } },
  { id: "leech", name: "Bloodthirst", icon: "🩸", tier: 2, desc: "+6% lifesteal", st: { ls: 6 } },
  { id: "sage", name: "Sage's Focus", icon: "📘", tier: 2, desc: "+40 max MP, +3 ATK", st: { mp: 40, atk: 3 } },
  { id: "fortune", name: "Fortune", icon: "💰", tier: 2, desc: "+50% gold from all sources", gold: 0.5 },
  { id: "prism", name: "Prismatic Edge", icon: "🌈", tier: 2, desc: "+5 fire and +5 ice damage", st: { fire: 5, ice: 5 } },
];
// Additional rarity-tiered perks (shared + class-specific). Existing ids above are kept unchanged.
const MORE_PERKS: Perk[] = [
  // Common
  { id: "secondwind", name: "Second Wind", icon: "🌬️", tier: 1, desc: "+6 DEF.", st: { def: 6 } },
  { id: "spark", name: "Spark", icon: "🔥", tier: 1, desc: "+4 fire damage", st: { fire: 4 } },
  { id: "chill", name: "Chill", icon: "❄️", tier: 1, desc: "+4 ice damage", st: { ice: 4 } },
  { id: "wardlight", name: "Wardlight", icon: "✨", tier: 1, desc: "+4 holy damage", st: { holy: 4 } },
  { id: "thickhide", name: "Thick Hide", icon: "🦏", tier: 1, desc: "+15 max HP, +1 DEF", st: { hp: 15, def: 1 } },
  { id: "deepbreath", name: "Deep Breath", icon: "💨", tier: 1, desc: "+12 max MP and +3 ATK.", st: { mp: 12, atk: 3 } },
  // Uncommon
  { id: "ironwall", name: "Iron Wall", icon: "🧱", tier: 2, desc: "+8 DEF", st: { def: 8 } },
  { id: "sharpness", name: "Sharpness", icon: "🗡️", tier: 2, desc: "+8% crit", st: { crit: 8 } },
  { id: "ghoststep", name: "Ghost Step", icon: "👻", tier: 2, desc: "+6% dodge", st: { dodge: 6 } },
  { id: "voidedge", name: "Void Edge", icon: "🧿", tier: 2, desc: "+5 poison, +3 ATK", st: { poison: 5, atk: 3 } },
  { id: "alchemist", name: "Alchemist", icon: "⚗️", tier: 2, desc: "Healing potions also restore 20% of your max MP." },
  { id: "warborn", name: "Warborn", icon: "🪓", tier: 2, cls: "warrior", desc: "+20 max HP, +3 ATK", st: { hp: 20, atk: 3 } },
  { id: "manafont", name: "Mana Font", icon: "⛲", tier: 2, cls: "mage", desc: "+25 max MP, +2 ATK", st: { mp: 25, atk: 2 } },
  { id: "backstabber", name: "Backstabber", icon: "🗡️", tier: 2, cls: "rogue", desc: "+6% crit, +2 ATK", st: { crit: 6, atk: 2 } },
  { id: "acolyte", name: "Acolyte", icon: "📿", tier: 2, cls: "cleric", desc: "+4 holy, +15 max HP", st: { holy: 4, hp: 15 } },
  { id: "packtactics", name: "Pack Tactics", icon: "🐺", tier: 2, cls: "ranger", desc: "Pets deal +15% damage and have +15% HP." },
  // Rare
  { id: "colossus", name: "Colossus", icon: "🏛️", tier: 3, desc: "+120 max HP, +4 DEF", st: { hp: 120, def: 4 } },
  { id: "overpower", name: "Overpower", icon: "💥", tier: 3, desc: "+10 ATK, +5% crit", st: { atk: 10, crit: 5 } },
  { id: "ironskin", name: "Iron Skin", icon: "🪨", tier: 3, desc: "+10 DEF, +40 max HP", st: { def: 10, hp: 40 } },
  { id: "deadlyaim", name: "Deadly Aim", icon: "🎯", tier: 3, desc: "+12% crit", st: { crit: 12 } },
  { id: "phantomstep", name: "Phantom Step", icon: "🌙", tier: 3, desc: "+10% dodge", st: { dodge: 10 } },
  { id: "vampiric", name: "Vampiric", icon: "🦇", tier: 3, desc: "+10% lifesteal", st: { ls: 10 } },
  { id: "stormcall", name: "Stormcall", icon: "⛈️", tier: 3, desc: "+8 fire and +8 ice damage", st: { fire: 8, ice: 8 } },
  { id: "thornskin", name: "Thornskin", icon: "🌵", tier: 3, desc: "+15% thorns, +4 DEF", st: { th: 15, def: 4 } },
  { id: "lifewell", name: "Life Well", icon: "💧", tier: 3, desc: "+40 max HP and +5 DEF.", st: { hp: 40, def: 5 } },
  { id: "execution", name: "Execution", icon: "⚰️", tier: 3, desc: "Enemies below 30% HP take 25% more damage." },
  { id: "arcanebattery", name: "Arcane Battery", icon: "🔋", tier: 3, desc: "Abilities cost 15% less MP." },
  { id: "shieldwall", name: "Shield Wall", icon: "🛡️", tier: 3, cls: "warrior", desc: "Take 8% less damage." },
  { id: "spellsurge", name: "Spellsurge", icon: "🎇", tier: 3, cls: "mage", desc: "+8 ATK, +30 max MP", st: { atk: 8, mp: 30 } },
  { id: "bleedout", name: "Bleed Out", icon: "🩸", tier: 3, cls: "rogue", desc: "Your attacks also inflict poison equal to 30% of your ATK." },
  { id: "hallow", name: "Hallow", icon: "😇", tier: 3, cls: "cleric", desc: "All heals restore 15% more." },
  { id: "huntersmark", name: "Hunter's Mark", icon: "🏹", tier: 3, cls: "ranger", desc: "Open every fight with a free 150% hit." },
  // Epic
  { id: "unbreakable", name: "Unbreakable", icon: "🗽", tier: 4, desc: "Take 12% less damage, +80 max HP, +6 DEF", st: { hp: 80, def: 6 } },
  { id: "doublecut", name: "Double Cut", icon: "⚔️", tier: 4, desc: "Attacks have a 20% chance to strike twice." },
  { id: "bloodcycle", name: "Blood Cycle", icon: "♻️", tier: 4, desc: "+8% lifesteal, +8 ATK", st: { ls: 8, atk: 8 } },
  { id: "spellblade", name: "Spellblade", icon: "🪄", tier: 4, cls: "mage", desc: "Basic attacks restore 10 MP." },
  { id: "highpriest", name: "High Priest", icon: "⛪", tier: 4, cls: "cleric", desc: "Your Heal ability restores 50% more." },
  { id: "feralpact", name: "Feral Pact", icon: "🦊", tier: 4, cls: "ranger", desc: "Pets deal +50% damage and have +50% HP." },
  // Legendary
  { id: "godslayer", name: "Godslayer", icon: "🔱", tier: 5, desc: "You deal 20% more damage." },
  { id: "dragonheart", name: "Dragonheart", icon: "🐉", tier: 5, desc: "+150 max HP, +10 DEF; immune to poison and burns.", st: { hp: 150, def: 10 } },
  { id: "eternity", name: "Eternity", icon: "♾️", tier: 5, desc: "Take 10% less damage, and +20 max MP.", st: { mp: 20 } },
];
function withRar(p: Perk, rar: string): Perk { return { ...p, rar, tier: RAR.indexOf(rar) + 1 }; }
const COMMON_PERKS: Perk[] = [...UPG1, ...UPG1X, ...MORE_PERKS.filter((p: Perk) => p.tier === 1)].map((p: Perk) => withRar(p, "Common"));
const UNCOMMON_PERKS: Perk[] = [...UPG2, ...MORE_PERKS.filter((p: Perk) => p.tier === 2)].map((p: Perk) => withRar(p, p.rar ?? "Uncommon"));
const ALL_PERKS: Perk[] = [
  ...COMMON_PERKS,
  ...UNCOMMON_PERKS,
  ...MORE_PERKS.filter((p: Perk) => p.tier >= 3).map((p: Perk) => withRar(p, p.rar ?? RAR[p.tier - 1])),
  ...CLASS_IDS.flatMap((c: ClassId) => CAPS[c]),
];
const PERK_BY_ID: Record<string, Perk> = {};
for (const p of ALL_PERKS) PERK_BY_ID[p.id] = p;
function perkRar(p: Perk): number { const i = p.rar ? RAR.indexOf(p.rar) : -1; return i >= 0 ? i : Math.max(0, Math.min(4, (p.tier ?? 1) - 1)); }
function perkCol(p: Perk): string { return RCOL[perkRar(p)]; }
function perkEligible(g: Game, p: Perk): boolean { return !g.perks.includes(p.id) && (!p.cls || p.cls === g.cls); }
function starterPool(cls: ClassId): Perk[] { return ALL_PERKS.filter((p: Perk) => perkRar(p) === 0 && (!p.cls || p.cls === cls)); }
// Boss-offer weights [Common, Uncommon, Rare, Epic, Legendary] by floor band.
// Floors 1–9: 40/35/18/6/1 · 10–19: 22/28/26/18/6 · 20–29: 12/22/28/26/12 · 30–39: 8/16/26/30/20 · 40+: 5/12/23/32/28
function perkWeights(floor: number): number[] {
  if (floor < 10) return [40, 35, 18, 6, 1];
  if (floor < 20) return [22, 28, 26, 18, 6];
  if (floor < 30) return [12, 22, 28, 26, 12];
  if (floor < 40) return [8, 16, 26, 30, 20];
  return [5, 12, 23, 32, 28];
}
function rollPerkTier(weights: number[]): number {
  const sum = weights.reduce((a: number, b: number) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < 5; i++) { r -= weights[i]; if (r <= 0) return i; }
  return 4;
}
function pickPerkOfRarity(g: Game, want: number, taken: Set<string>): Perk | undefined {
  for (let d = 0; d <= 4; d++) {
    const order = d === 0 ? [want] : [want + d, want - d];
    for (const i of order) {
      if (i < 0 || i > 4) continue;
      const pool = shuffle(ALL_PERKS.filter((p: Perk) => perkRar(p) === i && perkEligible(g, p) && !taken.has(p.id)));
      if (pool.length > 0) return pool[0];
    }
  }
  return undefined;
}

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
  // ranged attackers, introduced gradually (ff = first floor they can appear on)
  { id: "garcher", name: "Goblin Archer", icon: "🏹", hp: 18, atk: 7, def: 1, dodge: 10, xp: 10, gold: 6, b: "archer", lo: 1, hi: 3, ff: 2, w: 4 },
  { id: "spitter", name: "Acid Spitter", icon: "🐸", hp: 26, atk: 8, def: 2, dodge: 5, xp: 14, gold: 7, b: "spitter", lo: 2, hi: 4, ff: 3, w: 4 },
  { id: "sarcher", name: "Skeleton Archer", icon: "💀", hp: 30, atk: 11, def: 3, dodge: 5, xp: 20, gold: 11, b: "archer", undead: true, lo: 3, hi: 999, ff: 6, w: 4 },
  { id: "hexer", name: "Hex Cultist", icon: "🧙", hp: 34, atk: 12, def: 3, dodge: 8, xp: 24, gold: 13, b: "hexer", lo: 4, hi: 999, ff: 7, w: 4 },
];
const MON: Record<string, MonT> = {};
for (const m of MONS) MON[m.id] = m;

let UID = 1;
function rnd(n: number): number { return Math.floor(Math.random() * n); }
function pick<T>(a: T[]): T { return a[rnd(a.length)]; }
function shuffle<T>(a: T[]): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const tmp = b[i]; b[i] = b[j]; b[j] = tmp; } return b; }
function need(l: number): number { return 30 + l * l * 12; }
const AB_LVLS = [3, 6, 9, 12];
function abUnlockAt(i: number): number { return AB_LVLS[i] ?? (3 * (i + 1)); }
function abReady(g: Game, i: number): boolean { return g.lvl >= abUnlockAt(i); }
function abIdxOf(g: Game, id: string): number { return CLS[g.cls].abs.findIndex((a: Ab) => a.id === id); }
function abReadyId(g: Game, id: string): boolean { const i = abIdxOf(g, id); return i >= 0 && abReady(g, i); }
interface AbPop { icon: string; name: string; ts: number }
const AB_POPS: AbPop[] = [];
function noteAbUnlock(g: Game, a: Ab): void {
  log(g, `✨ New ability unlocked: ${a.icon} ${a.name}!`, "good");
  addFx(g, `NEW: ${a.name}`, "good", "p");
  AB_POPS.push({ icon: a.icon, name: a.name, ts: Date.now() });
}
function checkAbUnlocks(g: Game, from: number, to: number): void {
  CLS[g.cls].abs.forEach((a: Ab, i: number) => { const lv = abUnlockAt(i); if (from < lv && to >= lv) noteAbUnlock(g, a); });
}
function currentAbPop(): AbPop | null {
  const now = Date.now();
  while (AB_POPS.length && now - AB_POPS[0].ts > 3200) {
    AB_POPS.shift();
    if (AB_POPS[0]) AB_POPS[0].ts = now;
  }
  return AB_POPS[0] ?? null;
}
// facing in radians (0 = east); used by Cleave's frontal cone and attack animations
let FACE = 0;
function setFace(dx: number, dy: number): void { if (Math.hypot(dx, dy) > 0.04) FACE = Math.atan2(dy, dx); }
interface PulseFx { k: "cleave" | "smash"; ts: number; ang: number }
const PULSES: PulseFx[] = [];
function addPulse(k: "cleave" | "smash", ang: number): void {
  PULSES.push({ k, ts: Date.now(), ang });
  if (PULSES.length > 6) PULSES.shift();
}
function livePulses(now: number): PulseFx[] { return PULSES.filter((p: PulseFx) => now - p.ts < (p.k === "smash" ? 440 : 280)); }
function inCone(px: number, py: number, ang: number, x: number, y: number, half: number, reach: number): boolean {
  const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
  if (d > reach || d < 1e-4) return d <= 0.35;
  let da = Math.atan2(dy, dx) - ang;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  return Math.abs(da) <= half;
}
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
const FURY_T = 20, IRON_T = 25;
function keepScrollBuffs(b: Buffs): Buffs { const n = freshBuffs(); n.fury = b.fury; n.iron = b.iron; return n; }
function tickScrollBuffs(g: Game, dt: number): void {
  const b = g.buffs;
  if (b.fury > 0) b.fury = Math.max(0, b.fury - dt);
  if (b.iron > 0) b.iron = Math.max(0, b.iron - dt);
  if (b.rage > 0) b.rage = Math.max(0, b.rage - dt);
  if (b.holy > 0) b.holy = Math.max(0, b.holy - dt);
  if (b.frenzy > 0) b.frenzy = Math.max(0, b.frenzy - dt);
  if ((b.defendT ?? 0) > 0) b.defendT = Math.max(0, (b.defendT ?? 0) - dt);
  b.defend = (b.defendT ?? 0) > 0;
  if ((b.veil ?? 0) > 0) b.veil = Math.max(0, (b.veil ?? 0) - dt);
}
function fmtBuff(n: number): string { return n >= 10 ? `${Math.ceil(n)}s` : `${Math.max(0.1, n).toFixed(1)}s`; }
function log(g: Game, t: string, c: string = "sys"): void { g.log.unshift({ t, c, ts: Date.now() }); if (g.log.length > 60) g.log.pop(); }
function addFx(g: Game, text: string, c: string, at: string): void { g.fx.push({ id: UID++, text, c, at, ts: Date.now() }); if (g.fx.length > 12) g.fx.shift(); }
// floating pickup text above the hero (map and arena) instead of log lines
const GOLDC = "#ffcc4d", XPC = "#c79bff";
function gain(g: Game, text: string, color: string): void { addFx(g, text, color, "m"); }
function rarCol(inv: Inv): string { return inv.ident ? RCOL[IT[inv.id].r] : "#d8cfc0"; }

// ---- item instances ----
const NOUN: Record<string, string> = { "🪄": "Staff", "🏹": "Bow", "🔪": "Dagger", "🪓": "Axe", "🔨": "Mace", "🔱": "Scepter", "✨": "Wand" };
function nounOf(it: ItemT): string {
  if (/spear|pike|lance|halberd/i.test(it.name)) return "Spear";
  if (/wand/i.test(it.name)) return "Wand";
  const m: Record<Slot, string> = { weapon: NOUN[it.icon] ?? "Sword", armor: "Armor", helmet: "Helm", ring: "Ring", amulet: "Amulet", consumable: "Item" };
  return m[it.slot];
}
type AffStat = StatKey | "mpreg";
type LootSrc = "mob" | "elite" | "chest" | "boss" | "shop";
interface AffTier { lv: number; lo: number; hi: number; }
interface AffDef { id: string; kind: "pre" | "suf"; name: string; stat: AffStat; tiers: AffTier[]; slots?: GearSlot[]; w?: number; }
function itemLevel(f: number, src?: string): number {
  const b = src === "elite" || src === "chest" ? 2 : src === "boss" ? 4 : 0;
  return Math.max(1, Math.floor(f) + b);
}
const ATK_T: AffTier[] = [{ lv: 1, lo: 1, hi: 3 }, { lv: 5, lo: 3, hi: 6 }, { lv: 10, lo: 6, hi: 10 }, { lv: 18, lo: 10, hi: 15 }, { lv: 28, lo: 15, hi: 22 }, { lv: 40, lo: 22, hi: 30 }, { lv: 55, lo: 30, hi: 40 }];
const DEF_T: AffTier[] = [{ lv: 1, lo: 1, hi: 3 }, { lv: 5, lo: 3, hi: 6 }, { lv: 10, lo: 6, hi: 10 }, { lv: 18, lo: 10, hi: 15 }, { lv: 28, lo: 15, hi: 22 }, { lv: 40, lo: 22, hi: 30 }, { lv: 55, lo: 30, hi: 40 }];
const HP_T: AffTier[] = [{ lv: 1, lo: 5, hi: 15 }, { lv: 5, lo: 15, hi: 30 }, { lv: 10, lo: 30, hi: 50 }, { lv: 18, lo: 50, hi: 75 }, { lv: 28, lo: 75, hi: 110 }, { lv: 40, lo: 110, hi: 150 }, { lv: 55, lo: 150, hi: 200 }];
const MP_T: AffTier[] = [{ lv: 1, lo: 4, hi: 12 }, { lv: 5, lo: 12, hi: 24 }, { lv: 10, lo: 24, hi: 40 }, { lv: 18, lo: 40, hi: 60 }, { lv: 28, lo: 60, hi: 88 }, { lv: 40, lo: 88, hi: 120 }, { lv: 55, lo: 120, hi: 160 }];
const CRT_T: AffTier[] = [{ lv: 1, lo: 1, hi: 3 }, { lv: 5, lo: 2, hi: 5 }, { lv: 10, lo: 4, hi: 8 }, { lv: 18, lo: 6, hi: 12 }, { lv: 28, lo: 9, hi: 16 }, { lv: 40, lo: 13, hi: 22 }, { lv: 55, lo: 18, hi: 28 }];
const DOG_T: AffTier[] = [{ lv: 1, lo: 1, hi: 2 }, { lv: 5, lo: 2, hi: 4 }, { lv: 10, lo: 3, hi: 6 }, { lv: 18, lo: 5, hi: 9 }, { lv: 28, lo: 7, hi: 12 }, { lv: 40, lo: 10, hi: 16 }, { lv: 55, lo: 14, hi: 20 }];
const LS_T: AffTier[] = [{ lv: 1, lo: 1, hi: 2 }, { lv: 5, lo: 2, hi: 3 }, { lv: 10, lo: 3, hi: 5 }, { lv: 18, lo: 5, hi: 8 }, { lv: 28, lo: 7, hi: 11 }, { lv: 40, lo: 10, hi: 14 }, { lv: 55, lo: 13, hi: 18 }];
const ELE_T: AffTier[] = [{ lv: 1, lo: 1, hi: 3 }, { lv: 5, lo: 3, hi: 6 }, { lv: 10, lo: 6, hi: 10 }, { lv: 18, lo: 10, hi: 15 }, { lv: 28, lo: 15, hi: 22 }, { lv: 40, lo: 22, hi: 30 }, { lv: 55, lo: 30, hi: 40 }];
const TH_T: AffTier[] = [{ lv: 1, lo: 1, hi: 3 }, { lv: 5, lo: 2, hi: 5 }, { lv: 10, lo: 4, hi: 8 }, { lv: 18, lo: 6, hi: 12 }, { lv: 28, lo: 9, hi: 16 }, { lv: 40, lo: 13, hi: 22 }, { lv: 55, lo: 18, hi: 28 }];
const MAN_T: AffTier[] = [{ lv: 8, lo: 0.3, hi: 0.5 }, { lv: 16, lo: 0.5, hi: 0.8 }, { lv: 28, lo: 0.8, hi: 1.2 }, { lv: 40, lo: 1.2, hi: 1.6 }];
const WRM: GearSlot[] = ["weapon", "ring", "amulet"];
const AH: GearSlot[] = ["armor", "helmet"];
const WR: GearSlot[] = ["weapon", "ring"];
const RAM: GearSlot[] = ["ring", "amulet", "helmet"];
const AFFIXES: AffDef[] = [
  { id: "p_atk", kind: "pre", name: "Sharp", stat: "atk", tiers: ATK_T, slots: WRM },
  { id: "p_def", kind: "pre", name: "Sturdy", stat: "def", tiers: DEF_T, slots: AH },
  { id: "p_hp", kind: "pre", name: "Stout", stat: "hp", tiers: HP_T },
  { id: "p_mp", kind: "pre", name: "Glowing", stat: "mp", tiers: MP_T },
  { id: "p_crit", kind: "pre", name: "Lucky", stat: "crit", tiers: CRT_T, slots: WRM },
  { id: "p_dodge", kind: "pre", name: "Swift", stat: "dodge", tiers: DOG_T },
  { id: "p_ls", kind: "pre", name: "Cruel", stat: "ls", tiers: LS_T, slots: WR },
  { id: "p_fire", kind: "pre", name: "Fiery", stat: "fire", tiers: ELE_T, slots: WRM },
  { id: "p_ice", kind: "pre", name: "Frozen", stat: "ice", tiers: ELE_T, slots: WRM },
  { id: "p_holy", kind: "pre", name: "Blessed", stat: "holy", tiers: ELE_T, slots: WRM },
  { id: "p_pois", kind: "pre", name: "Venomous", stat: "poison", tiers: ELE_T, slots: WRM },
  { id: "p_th", kind: "pre", name: "Barbed", stat: "th", tiers: TH_T, slots: AH },
  { id: "s_atk", kind: "suf", name: "of the Bear", stat: "atk", tiers: ATK_T, slots: WRM },
  { id: "s_def", kind: "suf", name: "of the Turtle", stat: "def", tiers: DEF_T, slots: AH },
  { id: "s_hp", kind: "suf", name: "of the Whale", stat: "hp", tiers: HP_T },
  { id: "s_mp", kind: "suf", name: "of the Magus", stat: "mp", tiers: MP_T },
  { id: "s_crit", kind: "suf", name: "of Precision", stat: "crit", tiers: CRT_T, slots: WRM },
  { id: "s_dodge", kind: "suf", name: "of the Fox", stat: "dodge", tiers: DOG_T },
  { id: "s_ls", kind: "suf", name: "of Leeching", stat: "ls", tiers: LS_T, slots: WR },
  { id: "s_fire", kind: "suf", name: "of Flames", stat: "fire", tiers: ELE_T, slots: WRM },
  { id: "s_ice", kind: "suf", name: "of Frost", stat: "ice", tiers: ELE_T, slots: WRM },
  { id: "s_holy", kind: "suf", name: "of Light", stat: "holy", tiers: ELE_T, slots: WRM },
  { id: "s_pois", kind: "suf", name: "of Venom", stat: "poison", tiers: ELE_T, slots: WRM },
  { id: "s_th", kind: "suf", name: "of Thorns", stat: "th", tiers: TH_T, slots: AH },
  { id: "s_mana", kind: "suf", name: "of Channeling", stat: "mpreg", tiers: MAN_T, slots: RAM, w: 0.28 },
];
const AFF_BY = Object.fromEntries(AFFIXES.map((a: AffDef) => [a.id, a])) as Record<string, AffDef>;
const RARE_ADJ = ["Grim", "Rune", "Shadow", "Blight", "Storm", "Iron", "Bone", "Dusk", "Blood", "Ash", "Gloom", "Widow", "Fang", "Dire", "Hex", "Oath", "Frost", "Ember", "Void", "Pale"];
const RARE_NOUN = ["Shroud", "Fang", "Keeper", "Spire", "Coil", "Warden", "Grasp", "Crest", "Requiem", "Nexus", "Brand", "Veil", "Relic", "Howl", "Aegis", "Covenant", "Knell", "Mantle", "Collar", "Edge"];
function rareName(uid: number, id: string): string {
  let h = (uid * 2654435761) >>> 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return `${RARE_ADJ[h % RARE_ADJ.length]} ${RARE_NOUN[(h >>> 5) % RARE_NOUN.length]}`;
}
function affixLegal(def: AffDef, slot: GearSlot, ilvl: number, minT: number): AffTier[] {
  if (def.slots && !def.slots.includes(slot)) return [];
  return def.tiers.filter((t: AffTier, i: number) => t.lv <= ilvl && i + 1 >= minT);
}
function pickAffTier(legal: AffTier[]): AffTier {
  // weight toward the highest legal tier, but still allow lower ones
  const w = legal.map((_: AffTier, i: number) => Math.pow(1.7, i));
  let r = Math.random() * w.reduce((a: number, b: number) => a + b, 0);
  for (let i = 0; i < legal.length; i++) { r -= w[i]; if (r <= 0) return legal[i]; }
  return legal[legal.length - 1];
}
function qualityScale(it: ItemT): number {
  // Rares and epics roll more affixes than the old system, so their per-affix ranges
  // are scaled down so total affix power stays near (or only slightly above) the old curve.
  if (it.set) return 1;
  return [1, 1, 0.55, 0.7, 1][it.r] ?? 1;
}
function scaleBand(lo: number, hi: number, scale: number): [number, number] {
  if (scale === 1) return [lo, hi];
  return [Math.max(1, Math.round(lo * scale)), Math.max(1, Math.round(hi * scale))];
}
function rollAffVal(t: AffTier, stat: AffStat, scale: number): number {
  if (stat === "mpreg") {
    const v = t.lo + Math.random() * (t.hi - t.lo);
    return Math.round(v * 10) / 10;
  }
  const [lo, hi] = scaleBand(t.lo, t.hi, scale);
  return lo + rnd(Math.max(1, hi - lo + 1));
}
function affixRange(k: AffStat, ilvl: number, minT = 1): [number, number] {
  const defs = AFFIXES.filter((d: AffDef) => d.stat === k);
  let lo = 0, hi = 0;
  for (const d of defs) {
    const legal = d.tiers.filter((t: AffTier, i: number) => t.lv <= ilvl && i + 1 >= minT);
    if (!legal.length) continue;
    const top = legal[legal.length - 1];
    if (lo === 0 && hi === 0) { lo = top.lo; hi = top.hi; }
    else { lo = Math.min(lo, top.lo); hi = Math.max(hi, top.hi); }
  }
  if (hi === 0) return [1, 1];
  return [lo, hi];
}
function rollAffixes(it: ItemT, ilvl: number): { bon: Stats; affs: RolledAff[]; mpreg: number } {
  const empty = { bon: {} as Stats, affs: [] as RolledAff[], mpreg: 0 };
  if (it.slot === "consumable") return empty;
  const slot = it.slot as GearSlot;
  // Unique/legendary: keep the designed unique stats, no random affixes
  if (it.r >= 4 && !it.set) return empty;
  let n = 0, maxPre = 1, maxSuf = 1, minT = 1;
  if (it.set) { n = 1 + rnd(2); maxPre = 1; maxSuf = 1; }
  else if (it.r === 0) n = 0;
  else if (it.r === 1) { n = 1 + rnd(2); maxPre = 1; maxSuf = 1; }
  else if (it.r === 2) { n = 3 + rnd(2); maxPre = 2; maxSuf = 2; }
  else { n = 4 + rnd(2); maxPre = 3; maxSuf = 3; minT = 2; }
  if (n <= 0) return empty;
  const used = new Set<string>();
  const affs: RolledAff[] = [];
  let nPre = 0, nSuf = 0;
  for (let i = 0; i < n; i++) {
    const prefer: "pre" | "suf" | "any" = (nPre >= maxPre) ? "suf" : (nSuf >= maxSuf) ? "pre" : (i === 0 && it.r >= 2 ? (Math.random() < 0.5 ? "pre" : "suf") : "any");
    const pool = AFFIXES.filter((d: AffDef) => {
      if (used.has(d.stat)) return false;
      if (prefer !== "any" && d.kind !== prefer) return false;
      return affixLegal(d, slot, ilvl, d.stat === "mpreg" ? 1 : minT).length > 0;
    });
    if (pool.length === 0) {
      const any = AFFIXES.filter((d: AffDef) => !used.has(d.stat) && affixLegal(d, slot, ilvl, 1).length > 0 && (nPre < maxPre || d.kind !== "pre") && (nSuf < maxSuf || d.kind !== "suf"));
      if (any.length === 0) break;
      pool.push(...any);
    }
    const w = pool.map((d: AffDef) => d.w ?? 1);
    let r = Math.random() * w.reduce((a: number, b: number) => a + b, 0);
    let def = pool[pool.length - 1];
    for (let k = 0; k < pool.length; k++) { r -= w[k]; if (r <= 0) { def = pool[k]; break; } }
    let legal = affixLegal(def, slot, ilvl, def.stat === "mpreg" ? 1 : minT);
    if (legal.length === 0) legal = affixLegal(def, slot, ilvl, 1);
    if (legal.length === 0) continue;
    const t = pickAffTier(legal);
    const scale = def.stat === "mpreg" ? 1 : qualityScale(it);
    const v = rollAffVal(t, def.stat, scale);
    const [lo, hi] = def.stat === "mpreg" ? [t.lo, t.hi] : scaleBand(t.lo, t.hi, scale);
    const ti = def.tiers.indexOf(t) + 1;
    affs.push({ id: def.id, pre: def.kind === "pre", tier: ti, stat: def.stat, v, name: def.name, lo, hi });
    used.add(def.stat);
    if (def.kind === "pre") nPre++; else nSuf++;
  }
  const bon: Stats = {};
  let mpreg = 0;
  for (const a of affs) {
    if (a.stat === "mpreg") mpreg += a.v;
    else bon[a.stat as StatKey] = (bon[a.stat as StatKey] ?? 0) + a.v;
  }
  return { bon, affs, mpreg };
}
function affix(b: Stats): string {
  const e: [StatKey, string][] = [["fire", "of Flames"], ["ice", "of Frost"], ["holy", "of Light"], ["poison", "of Venom"]];
  let best = "", bv = 0;
  for (const [k, s] of e) { const v = b[k] ?? 0; if (v > bv) { bv = v; best = s; } }
  return best;
}
function instName(inv: Inv): string {
  const it = IT[inv.id];
  if (!inv.ident) return `Unidentified ${nounOf(it)} ???`;
  if (inv.aname) return inv.aname;
  const affs = (inv.affs ?? []).filter((a: RolledAff) => a.tier > 0);
  const pre = affs.find((a: RolledAff) => a.pre);
  const suf = affs.find((a: RolledAff) => !a.pre);
  if (pre || suf) return [pre?.name, it.name, suf?.name].filter(Boolean).join(" ");
  const a = affix(inv.bon);
  return a ? `${it.name} ${a}` : it.name;
}
function instIcon(inv: Inv): string { const it = IT[inv.id]; return inv.ident || it.slot === "consumable" ? it.icon : SLOT_ICON[it.slot as GearSlot]; }
function priceOf(inv: Inv): number { return Math.round(IT[inv.id].price * (1 + 0.15 * Object.keys(inv.bon).length)); }
function sellOf(inv: Inv): number { return inv.ident ? Math.max(1, Math.floor(priceOf(inv) * 0.4)) : 12; }
function idFee(inv: Inv, f: number): number { return Math.round(IDFEE[IT[inv.id].r] * (1 + 0.1 * f)); }
function locked(inv: Inv): boolean { return !!IT[inv.id].cursed && !inv.freed; }

function makeInst(id: string, f: number, roll: boolean, src?: string): Inv {
  const it = IT[id];
  const hideP = it.cursed ? 0.9 : HIDE[it.r];
  const ident = src === "shop" || !roll || it.slot === "consumable" || Math.random() >= hideP;
  const ilvl = itemLevel(f, src);
  if (!roll || it.slot === "consumable") {
    return { uid: UID++, id, ident, bon: {}, freed: false, ilvl };
  }
  if (it.r >= 4 && !it.set) {
    const bon: Stats = {};
    const affs: RolledAff[] = [];
    const ur = it.uranges;
    if (ur) {
      for (const k of Object.keys(ur) as StatKey[]) {
        const pair = ur[k]; if (!pair) continue;
        const [lo, hi] = pair;
        const v = lo + rnd(Math.max(1, hi - lo + 1));
        bon[k] = v;
        affs.push({ id: "u_" + k, pre: false, tier: 0, stat: k, v, name: "Unique", lo, hi });
      }
    }
    return { uid: UID++, id, ident, bon, freed: false, ilvl, affs: affs.length ? affs : undefined };
  }
  const { bon, affs, mpreg } = rollAffixes(it, ilvl);
  const aname = it.r >= 2 && !it.set && affs.length > 0 ? rareName(UID, it.id) : undefined;
  return { uid: UID++, id, ident, bon, freed: false, ilvl, affs: affs.length ? affs : undefined, mpreg: mpreg || undefined, aname };
}

// limited shop stock: gear is one-of-a-kind, common consumables 3, uncommon 2, rarer ones 1
function stockOf(inv: Inv): number { const it = IT[inv.id]; return it.slot !== "consumable" || it.r >= 3 ? 1 : it.r <= 1 ? 3 : 2; }
// shop premium (Epic/Legendary) odds scale with floor/depth: chance of a 1st premium slot,
// a 2nd only if the 1st hit (same chance again), hard cap 2, never two of the same item
function premiumChance(f: number): number { return Math.min(0.5, Math.max(0.03, 0.03 + 0.035 * (f - 2))); }
function legendShare(f: number): number { return Math.min(0.4, Math.max(0.1, 0.1 + 0.03 * (f - 2))); }
const SHOP_PREMIUM_MAX = 2;
function rollPremium(f: number, cls: ClassId, taken: string[]): string | null {
  const t = tierOf(f);
  const cons = Math.random() < 0.3;
  for (let r = Math.random() < legendShare(f) ? 4 : 3; r >= 3; r--) {
    let c = ITEMS.filter((i: ItemT) => i.r === r && i.minF <= t && !i.cursed && cons === (i.slot === "consumable") && !taken.includes(i.id));
    if (c.length === 0) continue;
    const mine = c.filter((i: ItemT) => !i.cls || i.cls.includes(cls));
    if (mine.length && Math.random() < 0.6) c = mine;
    return pick(c).id;
  }
  return null;
}
// ---- the Echo Vault: one item stored across runs (separate key, survives death/permadeath) ----
const VAULT_KEY = "dungeon-of-echoes-vault-v1";
interface VaultT { item: Inv; floor: number; cls: ClassId; mode: Mode; ts: number; }
function vaultGet(): VaultT | null {
  try { const s = kvGet(VAULT_KEY); if (!s) return null; const o = JSON.parse(s) as unknown; if (isObj(o) && okInv(o.item)) return { item: normInv(o.item as Inv), floor: Number(o.floor) || 0, cls: CLASS_IDS.includes(o.cls as ClassId) ? (o.cls as ClassId) : "warrior", mode: o.mode === "endless" ? "endless" : "story", ts: Number(o.ts) || 0 }; } catch (e) { void e; }
  return null;
}
function vaultSet(v: VaultT | null): void { try { kvSet(VAULT_KEY, v ? JSON.stringify(v) : null); } catch (e) { void e; } }
function vaultDeposit(g: Game, uid: number): boolean {
  let inv = g.inv.find((i: Inv) => i.uid === uid);
  if (inv) g.inv = g.inv.filter((i: Inv) => i.uid !== uid);
  else { const k = GEAR.find((s: GearSlot) => g.eq[s]?.uid === uid); if (!k) return false; inv = g.eq[k]; if (!inv || locked(inv)) return false; delete g.eq[k]; clamp(g); syncPets(g); }
  vaultSet({ item: { ...inv, bon: { ...inv.bon } }, floor: g.floor, cls: g.cls, mode: g.mode, ts: Date.now() });
  log(g, `🏦 ${instName(inv)} is sealed in the Echo Vault for a future run.`, "good");
  return true;
}
function vaultLeave(g: Game): void { g.vaultSel = undefined; g.screen = g.vaultThen === "victory" || (g.vaultThen === "upgrade" && g.offers.length > 0) ? g.vaultThen : "map"; g.vaultThen = undefined; }
function vaultTake(g: Game): void {
  const v = vaultGet(); g.vaultOffer = false; if (!v) return;
  const inv: Inv = { ...v.item, bon: { ...v.item.bon }, uid: UID++ };
  g.inv.push(inv); if (inv.ident) discover(inv.id);
  vaultSet(null);
  log(g, `🏦 You bring ${instName(inv)} out of the Echo Vault.`, "good");
  if (!g.startPick && g.offers.length === 0) g.screen = "map";
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
  f.ls += s.ls ?? 0; f.fire += s.fire ?? 0; f.ice += s.ice ?? 0; f.holy += s.holy ?? 0; f.poison += s.poison ?? 0; f.th += s.th ?? 0;
}
function addBonus(g: Game, s: Stats): void { for (const k of Object.keys(s) as StatKey[]) g.bonus[k] = (g.bonus[k] ?? 0) + (s[k] ?? 0); }
function setCounts(g: Game): Record<string, number> {
  const sc: Record<string, number> = {};
  for (const k of GEAR) { const it = g.eq[k]; if (it) { const s = IT[it.id].set; if (s) sc[s] = (sc[s] ?? 0) + 1; } }
  return sc;
}
function full(g: Game): Full {
  const c = CLS[g.cls]; const l = g.lvl - 1;
  const f: Full = { maxHp: c.base.hp + c.grow.hp * l, maxMp: c.base.mp + c.grow.mp * l, atk: c.base.atk + c.grow.atk * l, def: c.base.def + c.grow.def * l, crit: c.base.crit + c.grow.crit * l, dodge: c.base.dodge, ls: 0, fire: 0, ice: 0, holy: 0, poison: 0, th: 0, sp: [], curses: [] };
  addStats(f, g.bonus);
  for (const k of GEAR) {
    const it = g.eq[k];
    if (it) { const tt = IT[it.id]; addStats(f, tt.st); addStats(f, it.bon); if (tt.sp) f.sp.push(tt.sp); if (tt.curse) f.curses.push(tt.curse); }
  }
  const sc = setCounts(g);
  for (const sid of Object.keys(sc)) { const S = SETS[sid]; if (sc[sid] >= 2) addStats(f, S.b2); if (S.b3 && sc[sid] >= 3) addStats(f, S.b3); if (sc[sid] >= S.n) { addStats(f, S.bf); f.sp.push(S.sp); } }
  if (g.perks.includes("eagleeye")) f.crit += 20;
  if (g.perks.includes("deathmark")) f.crit += 10;
  if (f.curses.includes("c_frail")) f.maxHp *= 0.7;
  if (f.curses.includes("c_brittle")) f.def *= 0.5;
  if ((g.buffs.veil ?? 0) > 0) f.dodge += 20;
  f.maxHp = Math.max(10, Math.round(f.maxHp)); f.maxMp = Math.max(0, Math.round(f.maxMp)); f.atk = Math.max(1, Math.round(f.atk)); f.def = Math.max(0, Math.round(f.def));
  f.crit = Math.max(0, Math.min(75, Math.round(f.crit))); f.dodge = Math.max(0, Math.min(50, Math.round(f.dodge))); f.ls = Math.max(0, Math.min(40, f.ls)); f.th = Math.max(0, Math.min(60, f.th));
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
// per-item drop weight inside a rarity: healing is scarce, utility normal, gear normal
function dropW(it: ItemT, f = 1): number {
  if (it.fx === "heal" || it.fx === "both") return 0.45;
  if (it.fx === "cleanse") return 0.6;
  if (it.fx === "mana" || it.fx === "treat") return 0.8;
  if (it.fx === "pet" || it.fx === "eatk" || it.fx === "ehp") return 0.5;
  if (it.fx === "tome") return 0.4;
  if (it.set) {
    if (it.ff && f < it.ff) return 0;
    let w = 0.45;
    if (it.ff) w *= Math.min(1, (f - it.ff + 1) / 4);
    return w;
  }
  if (it.cursed) return 0.7;
  return 1;
}
function wpick(c: ItemT[], cls: ClassId, f = 1): ItemT {
  const w = c.map((i: ItemT) => dropW(i, f) * (i.cls && !i.cls.includes(cls) ? 0.4 : 1));
  let r = Math.random() * w.reduce((a: number, b: number) => a + b, 0);
  for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
  return c[c.length - 1];
}
// ---- chance-based loot table (gold is rolled separately and is unchanged) ----
const LOOT: Record<string, { p: number; minR: number; p2: number }> = {
  mob: { p: 0.18, minR: 0, p2: 0 },       // ordinary monster: 18% one item (was 24%)
  elite: { p: 0.525, minR: 1, p2: 0.1875 }, // elite: 52.5% one item (Uncommon+), 18.75% a second (was 70% / 25%)
  chest: { p: 0.6375, minR: 0, p2: 0.09 }, // chest: 63.75% one item (Uncommon+ from floor 5), 9% a second (was 85% / 12%)
  boss: { p: 1, minR: 3, p2: 0.5 },       // boss: 2 Epic+ gear + Identify scroll, 50% an extra Rare+ item (unchanged)
};
function lootRoll(g: Game, src: string): Inv[] {
  const L = LOOT[src]; const out: Inv[] = [];
  const sc = g.perks.includes("scavenger") ? 1.2 : 1;
  const f = g.floor;
  if (src === "boss") {
    for (let k = 0; k < 2; k++) out.push(makeInst(rollItem(f, 3, g.cls, "gear"), f, true, "boss"));
    out.push(makeInst("c_ident", f, false, "boss"));
    if (Math.random() < L.p2) out.push(makeInst(rollItem(f, 2, g.cls, "any"), f, true, "boss"));
    return out;
  }
  const minR = src === "chest" ? (f >= 5 ? 1 : 0) : L.minR;
  if (Math.random() < Math.min(0.95, L.p * sc)) out.push(makeInst(rollItem(f, minR, g.cls, "any"), f, true, src));
  if (L.p2 > 0 && Math.random() < L.p2 * sc) out.push(makeInst(rollItem(f, 0, g.cls, src === "chest" ? "gear" : "any"), f, true, src));
  return out;
}
function rollItem(f: number, minR: number, cls: ClassId, kind: "any" | "gear" | "cons", maxR = 4): string {
  const t = tierOf(f);
  const want = kind === "any" ? (Math.random() < 0.4 ? "cons" : "gear") : kind;
  for (let r = Math.min(maxR, rollRarity(t, minR)); r >= 0; r--) {
    const c = ITEMS.filter((i: ItemT) => i.r === r && i.minF <= t && (!i.ff || f >= i.ff) && (want === "cons") === (i.slot === "consumable"));
    if (c.length === 0) continue;
    return wpick(c, cls, f).id;
  }
  return "c_hp1";
}

function poolFor(f: number, b?: Biome): MonT[] {
  const T = Math.min(5, tierOf(f)); const bb: Biome = b ?? biomeOf(f);
  const out: MonT[] = [];
  for (const m of MONS) {
    if (m.bio && m.bio !== bb) continue;
    if (m.ff && f < m.ff) continue;
    if (m.w) { if (T >= m.lo && T <= m.hi) for (let k = 0; k < m.w; k++) out.push(m); continue; }
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
  g.shop = []; g.stock = [];
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
      for (const c of cons) g.shop.push(makeInst(c.id, g.floor, false, "shop"));
      // regular wares top out at Rare; Epic/Legendary only come from the capped premium rolls below
      for (let k = 0; k < 4; k++) { const id = rollItem(g.floor, k === 0 ? 2 : 1, g.cls, "gear", 2); if (!IT[id].cursed) { const inv = makeInst(id, g.floor, true, "shop"); inv.ident = true; g.shop.push(inv); } }
      const pc = premiumChance(g.floor), taken: string[] = [];
      for (let k = 0; k < SHOP_PREMIUM_MAX && Math.random() < pc; k++) {
        const id = rollPremium(g.floor, g.cls, taken); if (!id) break;
        taken.push(id);
        const inv = makeInst(id, g.floor, IT[id].slot !== "consumable", "shop"); inv.ident = true; g.shop.push(inv);
      }
      g.stock = g.shop.map(stockOf);
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
  const nm = monCount(g.floor);
  for (let k = 0; k < nm; k++) { const s = spot(1, rooms.length); if (s) g.mons.push({ id: UID++, x: s.x, y: s.y, t: pick(pool).id, boss: false, awake: false, stun: 0, el: g.floor >= 3 && Math.random() < ELITE_P }); }
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
    shop: [], stock: [], offers: [], kills: 0, sel: -1, fx: [], turns: 0, tokensEarned: 0,
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
  syncPets(g, true);
  // one-time starting perk (3 random Common perks, rolled once and saved with the run) + optional vaulted item
  g.offers = shuffle(starterPool(cls)).slice(0, 3); g.startPick = true; g.vaultOffer = !!vaultGet(); g.screen = "upgrade";
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
  for (const p of g.pets ?? []) { p.x = (g.wx ?? g.px + 0.5); p.y = (g.wy ?? g.py + 0.5) + 0.01; }
  syncPets(g);
  log(g, `${BIOME[biomeOf(g.floor)].name}: you descend to ${g.mode === "story" ? "Floor" : "Depth"} ${g.floor}${g.floor % 5 === 0 ? ` — ${bossKind(g.floor) === "lord" ? "the Echo Lord" : "the Broodmother"} lurks here!` : ""}.`, "good");
  g.screen = "map";
}
function makeOffers(g: Game): Perk[] {
  const w = perkWeights(g.floor);
  const taken = new Set<string>();
  const out: Perk[] = [];
  for (let k = 0; k < 3; k++) {
    const p = pickPerkOfRarity(g, rollPerkTier(w), taken);
    if (!p) break;
    out.push(p); taken.add(p.id);
  }
  // 10th-floor bosses (and every 10 floors after) guarantee at least one Epic or better
  if (g.floor % 10 === 0 && !out.some((p: Perk) => perkRar(p) >= 3)) {
    const up = pickPerkOfRarity(g, 3, taken);
    if (up) {
      if (out.length < 3) out.push(up);
      else {
        let wi = 0;
        for (let i = 1; i < out.length; i++) if (perkRar(out[i]) < perkRar(out[wi])) wi = i;
        out[wi] = up;
      }
    }
  }
  return out;
}
function applyPerk(g: Game, p: Perk): void {
  if (!g.perks.includes(p.id)) g.perks.push(p.id);
  const holdVault = g.startPick === true && g.vaultOffer === true && !!vaultGet();
  if (g.startPick) { g.startPick = false; if (!holdVault) g.vaultOffer = false; g.offers = []; }
  if (p.id === "beastbond" && !g.cpet && g.cls !== "ranger") g.cpet = "wolf";
  syncPets(g, true);
  if (p.st) { addBonus(g, p.st); if (p.st.hp) g.hp += p.st.hp; if (p.st.mp) g.mp += p.st.mp; }
  if (p.gold) g.goldMult += p.gold;
  log(g, `${p.icon} ${p.rar === "Common" && g.turns === 0 ? "Starting perk" : "Upgrade gained"}: ${p.name}.`, "good");
  g.screen = holdVault ? "upgrade" : "map";
}

function gainXp(g: Game, n: number): void {
  g.xp += n;
  const from = g.lvl;
  while (g.xp >= need(g.lvl)) {
    g.xp -= need(g.lvl); g.lvl++;
    const f = full(g);
    g.hp = Math.min(g.hp, f.maxHp); g.mp = Math.min(g.mp, f.maxMp);
    log(g, `⭐ Level up! You are now level ${g.lvl}.`, "good"); syncPets(g);
    addFx(g, `LEVEL ${g.lvl}!`, "good", "p");
  }
  if (g.lvl > from) checkAbUnlocks(g, from, g.lvl);
}
function healPlayer(g: Game, amt: number, combatHeal: boolean): number {
  const f = full(g); const before = g.hp;
  if (g.perks.includes("hallow")) amt = Math.round(amt * 1.15);
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
  if (full(g).sp.includes("dotImmune") || g.perks.includes("dragonheart")) { log(g, `${g.perks.includes("dragonheart") ? "Dragonheart" : "Dragonheart Plate"} shrugs off the ${label}.`, "good"); return; }
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
  const atk = f.atk * (b.rage > 0 || b.fury > 0 ? 1.5 : 1) * ((b.hex ?? 0) > 0 ? 0.75 : 1);
  const crit = forceCrit || Math.random() * 100 < f.crit;
  const def = crit && g.perks.includes("eagleeye") ? 0 : e.def;
  let d = atk * mult * (0.9 + Math.random() * 0.2) * 60 / (60 + def);
  d += (f.fire + f.ice + f.poison + f.holy * (e.undead ? 2 : 1)) * Math.min(1, mult);
  if (holy && e.undead) d *= 1.2;
  if (crit) d *= g.perks.includes("deathmark") ? 3 : 2;
  if (f.sp.includes("void")) d *= 1.15;
  if (g.perks.includes("godslayer")) d *= 1.2;
  if (g.perks.includes("execution") && e.max > 0 && e.hp / e.max <= 0.3) d *= 1.25;
  if (g.inAb && f.sp.includes("arcanist")) d *= 1.2;
  if (f.sp.includes("execute") && e.max > 0 && e.hp / e.max <= 0.4) d *= 1.25;
  if (f.sp.includes("opener") && g.combat && !g.combat.opened) d *= 1.5;
  if (f.sp.includes("skyfall") && g.combat && !g.combat.opened) d *= 1.75;
  if (g.inAb && f.sp.includes("insight")) d *= 1.2;
  const dmg = Math.max(1, Math.round(d));
  e.hp -= dmg;
  if (f.sp.includes("opener") && g.combat) g.combat.opened = true;
  if (f.sp.includes("lifeTap")) healPlayer(g, Math.max(1, Math.round(dmg * 0.08)), false);
  if (f.sp.includes("flameHit") && e.hp > 0 && Math.random() < 0.25) { e.burnT = Math.max(e.burnT, 3); e.burnD = Math.max(e.burnD, Math.max(3, Math.round(f.atk * 0.2))); }
  if (f.sp.includes("soulburn") && g.inAb) { g.mp = Math.min(f.maxMp, g.mp + 10); if (e.hp > 0) { e.burnT = Math.max(e.burnT, 3); e.burnD = Math.max(e.burnD, Math.max(3, Math.round(f.atk * 0.25))); } }
  if (f.sp.includes("graveRot") && e.hp > 0) { e.poisT = Math.max(e.poisT, 4); e.poisD = Math.max(e.poisD, Math.max(f.poison, Math.round(f.atk * 0.25))); }
  log(g, `${label} → ${e.name}: ${dmg}${crit ? " CRIT! 🩸 Blood sprays!" : ""}`, "dmg");
  addFx(g, `-${dmg}${crit ? "!" : ""}`, crit ? "loot" : "dmg", "e" + e.uid);
  if (f.ls > 0) healPlayer(g, Math.max(1, Math.round(dmg * f.ls / 100)), false);
  if (crit && f.sp.includes("critHeal")) healPlayer(g, Math.round(f.maxHp * 0.05), false);
  if (f.ice > 0 && e.hp > 0 && Math.random() < 0.1) stunE(g, e, 1.5);
  if (f.poison > 0) { e.poisT = Math.max(e.poisT, 3); e.poisD = Math.max(e.poisD, f.poison); }
  if (g.perks.includes("bleedout")) { e.poisT = Math.max(e.poisT, 3); e.poisD = Math.max(e.poisD, Math.round(f.atk * 0.3)); }
  if (crit && f.sp.includes("critPoison")) { e.poisT = 4; e.poisD = Math.max(e.poisD, Math.round(f.atk * 0.4)); }
  return dmg;
}
function stunE(g: Game, e: Enemy, n: number): void {
  if (e.hp <= 0) return;
  if (e.boss) { if (Math.random() < 0.5) { e.stun = Math.max(e.stun, 1.5); log(g, `${e.name} is staggered!`); } else log(g, `${e.name} resists the stun.`); return; }
  e.stun = Math.max(e.stun, n); log(g, `${e.name} is stunned/frozen for ${n === Math.round(n) ? n : n.toFixed(1)}s.`);
}
function damagePlayer(g: Game, e: Enemy, raw: number, magic: boolean, verb: string): number {
  if (g.combat && (g.combat.iT ?? 0) > 0) { addFx(g, "dodge", "sys", "p"); return 0; }
  const f = full(g); const b = g.buffs;
  if (b.evade > 0) { b.evade--; log(g, `You evade ${e.name}'s attack!`); addFx(g, "EVADE", "sys", "p"); return 0; }
  if (Math.random() * 100 < f.dodge) {
    log(g, `You dodge ${e.name}.`); addFx(g, "dodge", "sys", "p");
    if (f.sp.includes("ghoststep")) { const h = healPlayer(g, Math.max(1, Math.round(f.maxHp * 0.04)), false); if (h > 0) addFx(g, `+${h}`, "heal", "p"); }
    return 0;
  }
  let def = magic ? f.def * 0.5 : f.def;
  if (b.iron > 0) def *= 1.5;
  let d = raw * (0.9 + Math.random() * 0.2) * 60 / (60 + def);
  if (b.defend) d *= 0.5;
  if (b.holy > 0) d *= 0.5;
  if (g.perks.includes("juggernaut")) d *= 0.85;
  if (g.perks.includes("shieldwall")) d *= 0.92;
  if (g.perks.includes("unbreakable")) d *= 0.88;
  if (f.sp.includes("colossus")) d *= 0.88;
  if (f.sp.includes("holyWard")) d *= 0.88;
  if (g.perks.includes("sanctuary")) d *= 0.88;
  if (g.perks.includes("eternity")) d *= 0.90;
  if (f.curses.includes("c_fragile")) d *= 1.4;
  d = Math.max(1, Math.round(d));
  const total = d;
  if (b.shield > 0) { const a = Math.min(b.shield, d); b.shield -= a; d -= a; if (a > 0) log(g, `Arcane Shield absorbs ${a}.`); }
  g.hp -= d;
  log(g, `${e.name} ${verb} you for ${d}.`, "bad");
  addFx(g, `-${d}`, "bad", "p");
  if (d > 0) g.hurtTs = Date.now();
  if (d > 0 && f.sp.includes("shadowVeil")) b.veil = 3;
  const th = f.th / 100 + (f.sp.includes("thorns") ? 0.25 : 0) + (f.sp.includes("thorns15") ? 0.15 : 0) + (g.perks.includes("juggernaut") ? 0.35 : 0);
  if (th > 0 && e.hp > 0) { const r = Math.max(1, Math.round(total * th)); e.hp -= r; log(g, `Thorns reflect ${r} to ${e.name}.`, "dmg"); }
  if (g.cls === "warrior") g.mp = Math.min(f.maxMp, g.mp + 2);
  lethal(g);
  return d;
}

function resolveDeaths(g: Game): void {
  const c = g.combat; if (!c) return;
  for (const e of c.enemies) {
    if (e.dead || e.hp > 0) continue;
    e.dead = true; e.hp = 0; e.wind = 0; e.wk = ""; e.dt0 = Date.now(); g.kills++;
    if (full(g).sp.includes("bloodlust")) { const h = healPlayer(g, Math.max(1, Math.round(full(g).maxHp * 0.08)), false); if (h > 0) { log(g, `🩸 Bloodlust heals ${h}.`, "heal"); addFx(g, `+${h}`, "heal", "p"); } }
    if (full(g).sp.includes("reapSoul")) { const F = full(g); const h = healPlayer(g, Math.max(1, Math.round(F.maxHp * 0.08)), false); const m = Math.max(1, Math.round(F.maxMp * 0.10)); g.mp = Math.min(F.maxMp, g.mp + m); if (h > 0) { log(g, `💀 Reaper's Kiss restores ${h} HP and ${m} MP.`, "heal"); addFx(g, `+${h}`, "heal", "p"); } }
    const gold = goldGain(g, e.gold * (0.8 + Math.random() * 0.4));
    gain(g, `+${e.xp} XP`, XPC); gain(g, `+${gold} gold`, GOLDC);
    gainXp(g, e.xp);
    const ex = clampN(Math.floor(e.x ?? g.px + 0.5), 0, W - 1), ey = clampN(Math.floor(e.y ?? g.py + 0.5), 0, H - 1);
    (g.rem = g.rem ?? []).push(`${ey * W + ex}:${sprOf(e)}`);
    if ((g.rem ?? []).length > 120) g.rem.shift();
    const drops: Inv[] = e.minion ? (Math.random() < 0.1 ? lootRoll(g, "mob") : []) : lootRoll(g, e.boss ? "boss" : e.elite ? "elite" : "mob");
    for (const d of drops) { gain(g, `+ ${instName(d)}`, rarCol(d)); addItem(g, d); }
    if (e.boss) bossDown(g, e);
  }
  const t = c.enemies[c.target];
  if (!t || t.dead) { const i = c.enemies.findIndex((x: Enemy) => !x.dead); if (i >= 0) c.target = i; }
}
// the floor boss fell: its brood scatters, the stairs open; story ends / endless offers an upgrade once combat is over
function bossDown(g: Game, b: Enemy): void {
  const c = g.combat; if (!c) return;
  for (const e of c.enemies) if (e !== b && e.minion && !e.dead) { e.dead = true; e.away = true; e.hp = 0; }
  c.tele = []; c.proj = []; c.charging = false;
  g.map[g.sy][g.sx] = 2;
  log(g, "The stairs 🔽 appear where the boss fell.", "good");
  if (g.mode === "story" && g.floor >= STORY_END) { g.combat = null; g.buffs = keepScrollBuffs(g.buffs); revivePets(g); if (g.floor % 10 === 0) { g.vaultThen = "victory"; g.screen = "vault"; } else g.screen = "victory"; return; }
  if (g.mode === "endless") { g.offers = makeOffers(g); c.upg = true; }
  if (g.floor % 10 === 0) c.vault = true;
  if (g.floor === 5 && g.mode === "story") log(g, "The Broodmother is dead. Deeper halls await…", "good");
  void b;
}
function endCombat(g: Game): void {
  const c = g.combat; if (!c) return;
  const won = c.enemies.some((e: Enemy) => e.dead && !e.away);
  const ff = full(g);
  g.combat = null; g.buffs = keepScrollBuffs(g.buffs); revivePets(g);
  log(g, "✅ Combat over — menus unlocked.", "good");
  if (c.vault) { g.vaultThen = c.upg && g.offers.length > 0 ? "upgrade" : "map"; g.screen = "vault"; }
  else if (c.upg && g.mode === "endless" && g.offers.length > 0) g.screen = "upgrade";
}
function newCombat(): Combat {
  return { enemies: [], target: 0, monId: -1, turn: 0, elapsed: 0, boss: false, phase: 1, charging: false, itemOpen: false, proj: [], tele: [], shots: [], grace: 0, bossT: 3, tick: 0, v2: true, calm: 0 };
}
// real-time + difficulty scaling, applied once per enemy
function rtScale(e: Enemy, f: number): void {
  if (e.rt) return;
  e.rt = true;
  const d = floorDiff(f);
  const m = (e.boss ? 1.8 : 1.5) * EHP * d;
  e.max = Math.round(e.max * m); e.hp = Math.round(e.hp * m); e.atk = Math.max(1, Math.round(e.atk * EATK * d));
}
// a map monster gains aggro: it joins the (possibly new) encounter right where it stands
function engage(g: Game, m: MapMon): void {
  const fresh = !g.combat;
  if (!g.combat) { g.combat = newCombat(); g.buffs = keepScrollBuffs(g.buffs); }
  const c = g.combat;
  const e = m.boss ? makeBoss(g.floor) : makeEnemy(MON[m.t], g.floor);
  rtScale(e, g.floor);
  // elites: tougher, better loot odds, same gold
  if (m.el && !m.boss) { e.elite = true; e.name = `Elite ${e.name}`; e.max = Math.round(e.max * 1.5); e.hp = e.max; e.atk = Math.round(e.atk * 1.15); e.xp = Math.round(e.xp * 1.5); }
  if (typeof m.hp === "number" && typeof m.max === "number" && isFinite(m.hp) && m.max > 0) { e.max = m.max; e.hp = Math.max(1, Math.min(m.max, m.hp)); }
  e.x = m.fx ?? m.x + 0.5; e.y = m.fy ?? m.y + 0.5;
  e.mid = m.id; e.hx = m.hx ?? e.x; e.hy = m.hy ?? e.y; e.mt = m.boss ? e.bk : m.t; e.lost = 0;
  e.atkT = 0.5 + Math.random() * 0.8;
  c.enemies.push(e);
  g.mons = g.mons.filter((x: MapMon) => x !== m);
  c.calm = 0;
  if (m.boss) { c.boss = true; c.bossT = 2.5; log(g, `☠️ ${e.name} rises — the way down stays sealed until it falls!`, "bad"); addFx(g, "BOSS!", "bad", "p"); }
  else log(g, fresh ? `⚔️ ${e.name} attacks!` : `⚔️ ${e.name} joins the fight!`, "bad");
  const cur = c.enemies[c.target]; if (!cur || cur.dead) c.target = c.enemies.length - 1;
  if (fresh && g.perks.includes("shadowstep")) { hitEnemy(g, e, 1.5, true, "🌑 Shadow Step"); if (e.hp > 0) stunE(g, e, 1.5); resolveDeaths(g); }
  if (fresh && g.perks.includes("huntersmark") && !g.perks.includes("shadowstep")) { hitEnemy(g, e, 1.5, false, "🎯 Hunter's Mark"); resolveDeaths(g); }
}
// an engaged enemy loses track of you and becomes a map monster again (damage taken is kept)
function toMapMon(g: Game, e: Enemy, stun: number, home: boolean): void {
  if (e.minion) return;
  let x = e.x ?? g.px + 0.5, y = e.y ?? g.py + 0.5;
  if (home && e.hx !== undefined && e.hy !== undefined) { x = e.hx; y = e.hy; }
  const q = { x, y }; pushOut(g, q, MR);
  if (solidT(g, Math.floor(q.x), Math.floor(q.y))) { q.x = (e.hx ?? x); q.y = (e.hy ?? y); }
  g.mons.push({ id: e.mid ?? UID++, x: Math.floor(q.x), y: Math.floor(q.y), fx: q.x, fy: q.y, t: e.boss ? e.bk : (e.mt ?? e.spr ?? "rat"), boss: e.boss, awake: e.boss, stun, hp: e.hp, max: e.max, hx: e.hx, hy: e.hy, el: e.elite === true });
}
function escapeAll(g: Game, stun: number): void {
  const c = g.combat; if (!c) return;
  for (const e of c.enemies) if (!e.dead) { toMapMon(g, e, stun, false); e.dead = true; e.away = true; }
  g.combat = null; g.buffs = keepScrollBuffs(g.buffs); revivePets(g);
  log(g, "✅ Combat over — menus unlocked.", "good");
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
    const hp = Math.round(boss.max * (lord ? 0.11 : 0.12) * 1.5);
    const m = mkEnemy({ spr: lord ? "shade" : "spiderling", name: lord ? "Echo Shade" : "Spiderling", icon: lord ? "👤" : "🕷️", hp, atk: Math.round(boss.atk * (lord ? 0.6 : 0.5)), def: Math.round(boss.def * 0.4), dodge: 10, xp: Math.round(boss.xp * 0.06), gold: Math.round(boss.gold * 0.05), b: lord ? "drainer" : "poisoner", undead: lord, stun: 1 });
    const a = Math.random() * Math.PI * 2, q = { x: (boss.x ?? 0) + Math.cos(a) * 1.3, y: (boss.y ?? 0) + Math.sin(a) * 1.3 };
    pushOut(g, q, MR); if (solidT(g, Math.floor(q.x), Math.floor(q.y)) || !los(g, boss.x ?? 0, boss.y ?? 0, q.x, q.y)) { q.x = boss.x ?? 0; q.y = boss.y ?? 0; }
    m.rt = true; m.minion = true; m.x = q.x; m.y = q.y; m.hx = boss.hx; m.hy = boss.hy; m.lost = 0; m.atkT = 0.8 + Math.random() * 0.6;
    c.enemies.push(m);
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
// Combat happens on the exploration map, in tile units. U converts the old arena units (26 u/s ≈ 3.25 tiles/s).
const U = 8;
// ---- difficulty knobs ----
const EHP = 1.12;        // enemy HP ×1.12 (on top of the real-time ×1.5, bosses ×1.8)
const EATK = 1.1;        // enemy damage ×1.1
// Floor 1 stays close to the original; the +20% damage / +50% pack bump
// is fully in by floor 4, then HP/ATK compound 7%/floor and packs grow 4%/floor.
const DIFF_DMG = 0.20;
const DIFF_PACK = 0.50;
const DIFF_COMPOUND = 1.07;
const DIFF_DENSITY = 1.04;
const MON_CAP = 28;
function earlyRamp(f: number, extra: number): number {
  const start = 1 + 0.15 * extra;
  if (f <= 1) return start;
  if (f >= 4) return 1 + extra;
  return start + ((1 + extra) - start) * (f - 1) / 3;
}
function floorDiff(f: number): number {
  const early = earlyRamp(f, DIFF_DMG);
  return f <= 4 ? early : (1 + DIFF_DMG) * Math.pow(DIFF_COMPOUND, f - 4);
}
function packMult(f: number): number {
  const early = earlyRamp(f, DIFF_PACK);
  return f <= 4 ? early : (1 + DIFF_PACK) * Math.pow(DIFF_DENSITY, f - 4);
}
function monCount(f: number): number {
  const base = 6 + tierOf(f) + Math.floor(Math.max(0, f - 2) / 3);
  return Math.min(MON_CAP, Math.max(1, Math.round(base * packMult(f))));
}
const WIND = 0.9;        // telegraph / wind-up durations ×0.9
const WAKE = 4.5;        // sleeping monsters notice you (was 4)
const AGGRO = 5.5;       // awake monsters with line of sight join the fight
const BOSS_AGGRO = 5;    // bosses wake when you step into their lair (LOS)
const ELITE_P = 0.08;      // share of monsters spawned as elites from floor 3
const LEASH = 11, BOSS_LEASH = 7, LOSE_T = 4, CALM_T = 1.5, DASH_SPD = 13.75;
const HELD = new Set<string>();
let NAV_T = 0;
let NOTE_T = 0;
function combatNote(g: Game, t: string): void { const n = Date.now(); if (n - NOTE_T < 2500) return; NOTE_T = n; log(g, t, "bad"); }
// speed, reach, wind-up (s), cooldown (s) — speed/reach in old arena units (÷U for tiles)
const RTB: Record<string, [number, number, number, number]> = { brute: [30, 11, 0.75, 1.9], swift: [35, 9, 0.4, 1.25], tank: [20, 12, 0.85, 2.3], caster: [26, 50, 0.7, 2.3], poisoner: [34, 9, 0.5, 1.6], drainer: [33, 10, 0.6, 1.7], archer: [26, 52, 0.8, 2.4], spitter: [25, 48, 0.95, 3.2], hexer: [25, 52, 0.85, 3.0] };
const FAST_B = new Set(["swift", "poisoner", "drainer"]);
function eSpdOf(b: string, elite = false, boss?: string): number {
  const P0 = boss ? (boss === "lord" ? 28 : 26) : (RTB[b]?.[0] ?? 30);
  let spd = 0.75 + P0 * 0.085;
  if (elite && !boss) spd *= 1.08;
  return spd;
}
// ranged foes keep a distance band [min, max] in tiles and fire from up to `fire` tiles
const RANGED: Record<string, { min: number; max: number; fire: number }> = { caster: { min: 26 / U, max: 44 / U, fire: 62 / U }, archer: { min: 3.5, max: 6, fire: 6.5 }, spitter: { min: 3, max: 5.5, fire: 6 }, hexer: { min: 3.25, max: 5.5, fire: 6.5 } };
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
function canHit(g: Game, c: Combat, e: Enemy, r: number): boolean { return !e.dead && e.hp > 0 && eDist(c, e) <= r && los(g, c.px ?? 0, c.py ?? 0, e.x ?? 0, e.y ?? 0); }
function aimTarget(g: Game, c: Combat, r: number): boolean {
  const cur = c.enemies[c.target];
  if (cur && canHit(g, c, cur, r)) return true;
  let bi = -1, bd = Infinity;
  c.enemies.forEach((e: Enemy, i: number) => { if (!canHit(g, c, e, r)) return; const d = eDist(c, e); if (d < bd) { bd = d; bi = i; } });
  if (bi >= 0) { c.target = bi; return true; }
  return false;
}
function syncPos(g: Game): void { const c = g.combat; if (!c) return; c.px = g.wx ?? g.px + 0.5; c.py = g.wy ?? g.py + 0.5; }
function shot(g: Game, col: string, delay = 0): void {
  const c = g.combat; if (!c) return;
  const e = c.enemies[c.target]; if (!e) return;
  const s = c.shots ?? (c.shots = []);
  s.push({ id: UID++, x1: c.px ?? 0, y1: c.py ?? 0, x2: e.x ?? 0, y2: e.y ?? 0, ts: Date.now() + delay, c: col });
  if (s.length > 8) s.shift();
}
function rtAttack(g: Game): void {
  const c = g.combat; if (!c || g.screen !== "map" || (c.atkCd ?? 0) > 0) return;
  syncPos(g);
  const r = ARNG[g.cls] / U;
  if (!aimTarget(g, c, r)) { c.atkCd = 0.3; addFx(g, "too far", "sys", "p"); return; }
  { const e = c.enemies[c.target]; if (e) setFace((e.x ?? 0) - (c.px ?? 0), (e.y ?? 0) - (c.py ?? 0)); }
  beginHeroAtk(g);
  c.atkCd = ARATE[g.cls];
  if (r > 30 / U) shot(g, g.cls === "mage" ? "#b18cff" : "#e8d9a8", weapAnim(g) === "bow" ? 90 : 0);
  doAction(g, "attack", "");
  resolveDeaths(g);
}
function rtAbility(g: Game, id: string): void {
  const c = g.combat; if (!c || g.screen !== "map") return;
  if (!abReadyId(g, id)) { const i = abIdxOf(g, id); addFx(g, `Lv ${i >= 0 ? abUnlockAt(i) : "?"}`, "sys", "p"); return; }
  syncPos(g);
  const r = ABR[id] !== undefined ? ABR[id] / U : undefined;
  if (r !== undefined && !aimTarget(g, c, r)) { log(g, "No enemy in range — move closer."); addFx(g, "out of range", "sys", "p"); return; }
  if (r !== undefined && r > 30 / U) shot(g, "#ffd36b");
  combatAct(g, "ability", id);
}
function rtDodge(g: Game, mx: number, my: number): void {
  const c = g.combat; if (!c || g.screen !== "map" || (c.dashCd ?? 0) > 0) return;
  syncPos(g);
  let vx = mx, vy = my;
  if (Math.hypot(vx, vy) < 0.2) { const i = nearestIdx(c, 999); const e = i >= 0 ? c.enemies[i] : undefined; vx = e ? (c.px ?? 0) - (e.x ?? 0) : -1; vy = e ? (c.py ?? 0) - (e.y ?? 0) : 0; }
  const m = Math.hypot(vx, vy) || 1;
  c.dvx = vx / m; c.dvy = vy / m; c.dashT = 0.2; c.iT = 0.4; c.dashCd = (g.cls === "rogue" ? 1.6 : 2.2) * (g.perks.includes("fleet") ? 0.75 : 1);
}
function rtResolve(g: Game, e: Enemy, d: number, reach: number): void {
  const c = g.combat; if (!c) return;
  const kind = e.wk; e.wk = "";
  const pet = e.tpk ? (g.pets ?? [])[Number(e.tpk)] : undefined; e.tpk = "";
  const ex0 = e.x ?? 0, ey0 = e.y ?? 0;
  if (kind === "arrow" || kind === "hex" || kind === "spit") {
    const ax = e.ax ?? c.px ?? 0, ay = e.ay ?? c.py ?? 0;
    if (kind === "spit") { (c.tele ?? (c.tele = [])).push({ id: UID++, x: ax, y: ay, r: 1.1, t: 1.0 * WIND, max: 1.0 * WIND, dmg: e.atk * 1.1, from: e.uid, kind: "spit" }); return; }
    const dx = ax - ex0, dy = ay - ey0, m = Math.hypot(dx, dy) || 1, sp = kind === "arrow" ? 8 : 4.5;
    (c.proj ?? (c.proj = [])).push({ id: UID++, x: ex0, y: ey0, vx: dx / m * sp, vy: dy / m * sp, dmg: e.atk * (kind === "arrow" ? 1 : 0.8), from: e.uid, life: 2.2, c: kind === "arrow" ? "#f2e6c0" : "#c04cff", k: kind });
    return;
  }
  if (pet && kind === "melee") {
    if (pet.ko > 0 || Math.hypot(pet.x - ex0, pet.y - ey0) > reach + 5 / U) { addFx(g, "whiff", "sys", "e" + e.uid); return; }
    hurtPet(g, pet, e.atk * (e.b === "brute" ? 1.15 : e.b === "swift" ? 1.2 : 1)); return;
  }
  if (kind === "cast") {
    const hurt = alive(c).filter((x: Enemy) => x !== e && x.hp / x.max < 0.6);
    if (hurt.length > 0 && Math.random() < 0.35) { const h = hurt[0]; const amt = Math.round(h.max * 0.25); h.hp = Math.min(h.max, h.hp + amt); log(g, `${e.name} heals ${h.name} for ${amt}.`, "bad"); addFx(g, `+${amt}`, "heal", "e" + h.uid); return; }
    const dx = (pet ? pet.x : c.px ?? 0) - (e.x ?? 0), dy = (pet ? pet.y : c.py ?? 0) - (e.y ?? 0); const m = Math.hypot(dx, dy) || 1;
    (c.proj ?? (c.proj = [])).push({ id: UID++, x: e.x ?? 0, y: e.y ?? 0, vx: (dx / m) * 48 / U, vy: (dy / m) * 48 / U, dmg: e.atk * 1.1, from: e.uid, life: 2.5, c: e.undead ? "#b48cff" : "#ff7a3a" });
    return;
  }
  if (d > reach + 5 / U) { addFx(g, "whiff", "sys", "e" + e.uid); return; }
  if (e.bk === "lord") lordMelee(g, e); else if (e.bk === "brood") broodMelee(g, e); else mobAct(g, e);
}
function bossSpecial(g: Game, e: Enemy, dt: number): void {
  const c = g.combat; if (!c || e.stun > 0) return;
  c.bossT = (c.bossT ?? 3) - dt;
  if (c.bossT > 0) return;
  const tl = c.tele ?? (c.tele = []);
  const at = (r: number, t: number, dmg: number, kind: string, x: number, y: number): void => { tl.push({ id: UID++, x, y, r: r / U, t: t * WIND, max: t * WIND, dmg, from: e.uid, kind }); };
  const px = c.px ?? 0, py = c.py ?? 0;
  const near = (): [number, number] => {
    for (let k = 0; k < 6; k++) { const x = px + (Math.random() * 30 - 15) / U, y = py + (Math.random() * 24 - 12) / U; if (!solidT(g, Math.floor(x), Math.floor(y))) return [x, y]; }
    return [px, py];
  };
  if (e.bk === "brood") {
    at(12, 1.1, e.atk * 1.3, "acid", px, py);
    if (c.phase === 2) { const [x, y] = near(); at(10, 1.4, e.atk * 1.1, "acid", x, y); }
    log(g, "🕸️ The Broodmother spits acid — get out of the green ring!", "bad");
    c.bossT = c.phase === 2 ? 3.2 : 4.5; return;
  }
  const atk = e.atk * (c.phase === 3 ? 1.35 : 1);
  if (c.phase === 1) { at(11, 1.1, atk * 1.2, "flame", px, py); c.bossT = 5; return; }
  if (c.phase === 3 && !c.charging && Math.random() < 0.45) {
    c.charging = true; at(30, 2.2, atk * 2.4, "cata", e.x ?? px, e.y ?? py);
    log(g, "⚠️ The Echo Lord gathers a CATACLYSM — get out of the purple ring!", "bad"); c.bossT = 4.5; return;
  }
  at(12, 1.0, atk * 1.25, "flame", px, py); log(g, "🔥 Shadow flame gathers beneath you — move!", "bad");
  c.bossT = c.phase === 3 ? 2.8 : 3.5;
}
// one step toward the player through the BFS flow field (used when there is no line of sight)
function flowStep(g: Game, fld: Int16Array, x: number, y: number): [number, number] | null {
  const tx0 = Math.floor(x), ty0 = Math.floor(y);
  let bv = fld[ty0 * W + tx0]; if (bv < 0) return null;
  let tx = -1, ty = -1;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
    const nx = tx0 + ox, ny = ty0 + oy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const v = fld[ny * W + nx];
    if (v >= 0 && v < bv) { bv = v; tx = nx + 0.5; ty = ny + 0.5; }
  }
  return tx < 0 ? null : [tx, ty];
}
// in-world combat: runs every frame on the map while any enemy is engaged
function combatStep(g: Game, dt: number, atk: boolean): void {
  const c = g.combat; if (!c || g.screen !== "map") return;
  if (!c.proj) c.proj = [];
  if (!c.tele) c.tele = [];
  if (!c.shots) c.shots = [];
  syncPos(g);
  const px = c.px ?? 0, py = c.py ?? 0;
  c.dashCd = Math.max(0, (c.dashCd ?? 0) - dt); c.iT = Math.max(0, (c.iT ?? 0) - dt); c.atkCd = Math.max(0, (c.atkCd ?? 0) - dt);
  g.buffs.hex = Math.max(0, (g.buffs.hex ?? 0) - dt);
  const now = Date.now();
  if (c.enemies.some((e: Enemy) => e.dead && (e.away || now - (e.dt0 ?? 0) > 900))) {
    const tu = c.enemies[c.target]?.uid;
    c.enemies = c.enemies.filter((e: Enemy) => !e.dead || (!e.away && now - (e.dt0 ?? 0) <= 900));
    const ti = c.enemies.findIndex((e: Enemy) => e.uid === tu && !e.dead);
    c.target = ti >= 0 ? ti : Math.max(0, c.enemies.findIndex((e: Enemy) => !e.dead));
  }
  if (alive(c).length === 0) {
    c.proj = []; c.tele = []; c.charging = false;
    c.calm = (c.calm ?? 0) + dt;
    if (c.calm >= CALM_T) endCombat(g);
    return;
  }
  c.calm = 0;
  if (atk) { rtAttack(g); if (g.combat !== c || g.screen !== "map") return; }
  petStep(g, dt);
  c.elapsed = (c.elapsed ?? 0) + dt;
  tickCombatCurses(g, c, dt); if (g.combat !== c || g.screen !== "map") return;
  c.tick = (c.tick ?? 0) + dt;
  if (c.tick >= 1.5) {
    c.tick -= 1.5;
    endRound(g); if (g.combat !== c || g.screen !== "map") return;
    resolveDeaths(g); if (g.combat !== c || g.screen !== "map") return;
  }
  const boss = c.enemies.find((e: Enemy) => e.boss && !e.dead && e.hp > 0);
  if (boss) { bossPhase(g, boss); bossSpecial(g, boss, dt); }
  let fld: Int16Array | null = null;
  for (const e of c.enemies) {
    if (e.dead || e.hp <= 0) continue;
    const ex = e.x ?? px, ey = e.y ?? py; const dx = px - ex, dy = py - ey; const d = Math.hypot(dx, dy) || 0.001;
    const see = los(g, ex, ey, px, py);
    const hx = e.hx ?? ex, hy = e.hy ?? ey, leash = e.boss ? BOSS_LEASH : LEASH;
    const leashed = Math.hypot(ex - hx, ey - hy) >= leash - 0.5 && Math.hypot(px - hx, py - hy) > leash + 2;
    const runAway = !see || d > 9 || leashed;
    e.lost = runAway ? (e.lost ?? 0) + dt : 0;
    if ((e.lost ?? 0) >= LOSE_T || (e.minion && !boss)) {
      if (e.boss) { e.hp = e.max; c.phase = 1; }
      toMapMon(g, e, e.boss ? 0 : 1.5, e.boss);
      e.dead = true; e.away = true;
      if (!e.minion) log(g, e.boss ? `${e.name} retreats to its lair and recovers.` : `${e.name} loses track of you.`);
      continue;
    }
    if (e.stun > 0) { e.stun = Math.max(0, e.stun - dt); e.wind = 0; e.wk = ""; continue; }
    const P: [number, number, number, number] = e.boss ? (e.bk === "lord" ? [28, 17, 0.6, 1.5] : [26, 16, 0.7, 1.7]) : (RTB[e.b] ?? RTB.brute);
    const spd = eSpdOf(e.b, e.elite === true, e.boss ? e.bk : undefined), reach = P[1] / U;
    if ((e.wind ?? 0) > 0) {
      const w = (e.wind ?? 0) - dt; e.wind = w;
      // quick types close a short, telegraphed lunge in the last moments of the wind-up (aim is already locked)
      if (w > 0 && w <= 0.14 && !e.boss && FAST_B.has(e.b)) {
        const lx = (e.ax ?? px) - ex, ly = (e.ay ?? py) - ey, ll = Math.hypot(lx, ly) || 1;
        const q = { x: ex, y: ey };
        slideMove(g, q, (lx / ll) * spd * 1.25, (ly / ll) * spd * 1.25, dt, MR);
        e.x = q.x; e.y = q.y;
      }
      if (w <= 0) { e.wind = 0; rtResolve(g, e, see ? d : 99, reach); if (g.hp <= 0) { die(g); return; } if (g.combat !== c) return; }
      continue;
    }
    const at = (e.atkT ?? 0) - dt; e.atkT = at;
    const RG = e.boss ? undefined : RANGED[e.b];
    // pets draw aggro: a foe goes for a nearby pet it can see when the pet is closer than you (Bone Hounds are extra tempting)
    let ax = px, ay = py, ad = d, asee = see, pti = -1;
    if (!e.boss) { let best = d; (g.pets ?? []).forEach((p: Pet, i: number) => { if (p.ko > 0) return; const pd = Math.hypot(p.x - ex, p.y - ey); const eff = pd + (p.k === "hound" ? -1.2 : 0.4); if (pd < 4 && eff < best && los(g, ex, ey, p.x, p.y)) { best = eff; ax = p.x; ay = p.y; ad = pd; asee = true; pti = i; } }); }
    let tx = ax, ty = ay, mv = true;
    if (Math.hypot(ex - hx, ey - hy) > leash) { tx = hx; ty = hy; }
    else if (!see && pti < 0) { fld = fld ?? flowField(g); const st = flowStep(g, fld, ex, ey); if (st) { tx = st[0]; ty = st[1]; } else mv = false; }
    else if (RG) { if (ad < RG.min) { tx = ex - (ax - ex); ty = ey - (ay - ey); } else if (ad <= RG.max) mv = false; }
    else if (ad <= reach * 0.7) mv = false;
    let mvx = 0, mvy = 0;
    if (mv) { const vx = tx - ex, vy = ty - ey, vl = Math.hypot(vx, vy) || 1; mvx = vx / vl; mvy = vy / vl; }
    for (const o of c.enemies) {
      if (o === e || o.dead || o.hp <= 0) continue;
      const ox = ex - (o.x ?? 0), oy = ey - (o.y ?? 0); const od = Math.hypot(ox, oy);
      if (od < 0.95 && od > 0.01) { mvx += (ox / od) * 0.7; mvy += (oy / od) * 0.7; }
    }
    const q = { x: ex, y: ey };
    if (mvx !== 0 || mvy !== 0) { const ml = Math.max(1, Math.hypot(mvx, mvy)); slideMove(g, q, mvx / ml * spd, mvy / ml * spd, dt, MR); }
    const bx = q.x - px, by = q.y - py, bd = Math.hypot(bx, by), mn = PR + MR + (e.boss ? 0.3 : 0);
    if (bd < mn && bd > 1e-4) { q.x = px + bx / bd * mn; q.y = py + by / bd * mn; pushOut(g, q, MR); }
    e.x = q.x; e.y = q.y;
    if (at <= 0 && asee && ad <= (RG ? RG.fire : reach + 3 / U)) {
      e.wk = e.b === "caster" ? "cast" : e.b === "archer" ? "arrow" : e.b === "spitter" ? "spit" : e.b === "hexer" ? "hex" : "melee";
      e.tpk = pti >= 0 ? String(pti) : ""; e.ax = ax; e.ay = ay; // aim locks when the wind-up starts: move to dodge
      e.wm = P[2] * WIND; e.wind = e.wm; e.atkT = P[3] + Math.random() * 0.6;
    }
  }
  const pr = c.proj ?? [];
  for (const p of pr) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (solidT(g, Math.floor(p.x), Math.floor(p.y))) { p.life = 0; continue; }
    if (p.life > 0 && Math.hypot(p.x - px, p.y - py) < 4.5 / U) {
      p.life = 0;
      const e = c.enemies.find((x: Enemy) => x.uid === p.from);
      if (e) {
        const dd = damagePlayer(g, e, p.dmg, p.k !== "arrow", p.k === "arrow" ? "shoots" : p.k === "hex" ? "hexes" : "blasts");
        if (dd > 0 && p.k === "hex") { g.buffs.hex = 4; log(g, "🌀 Hexed! Your damage is reduced by 25% for 4 s.", "bad"); addFx(g, "HEXED", "bad", "p"); }
      }
      if (g.hp <= 0) { die(g); return; }
    } else if (p.life > 0) {
      for (const pt of g.pets ?? []) if (pt.ko <= 0 && Math.hypot(p.x - pt.x, p.y - pt.y) < 0.4) { p.life = 0; hurtPet(g, pt, p.dmg); break; }
    }
  }
  c.proj = pr.filter((p: Proj) => p.life > 0);
  const tl = c.tele ?? [];
  for (const tz of tl) {
    tz.t -= dt;
    const e = c.enemies.find((x: Enemy) => x.uid === tz.from);
    if (!e || e.dead || e.hp <= 0) { tz.t = -1; if (tz.kind === "cata") c.charging = false; continue; }
    if (tz.t > 0) continue;
    if (tz.kind === "cata") c.charging = false;
    for (const pt of g.pets ?? []) if (pt.ko <= 0 && Math.hypot(pt.x - tz.x, pt.y - tz.y) <= tz.r) hurtPet(g, pt, tz.dmg * (tz.kind === "spit" ? 1 : 0.5));
    if (Math.hypot(px - tz.x, py - tz.y) <= tz.r + 2 / U) {
      const verb = tz.kind === "spit" ? "spatters acid on" : tz.kind === "acid" ? "splashes acid on" : tz.kind === "cata" ? "💥 OBLITERATES" : "engulfs in shadow flame";
      const dd = damagePlayer(g, e, tz.dmg, true, verb);
      if (dd > 0 && tz.kind === "flame") applyDot(g, Math.round(e.atk * 0.25), "burn");
      if (dd > 0 && (tz.kind === "acid" || tz.kind === "spit")) applyDot(g, Math.round(e.atk * 0.2), "poison");
      if (g.hp <= 0) { die(g); return; }
    } else addFx(g, "dodged!", "good", "p");
  }
  c.tele = tl.filter((tz: Tele) => tz.t > 0);
  resolveDeaths(g);
}
// ----- free (sub-tile) map movement -----
const PR = 0.3, MR = 0.3, MAP_SPD = 3.25;
function mSpd(m: MapMon): number { const b = MON[m.t]?.b ?? "brute"; return eSpdOf(b, m.el === true, m.boss ? (m.t === "lord" || m.t === "brood" ? m.t : undefined) : undefined); }
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
      if (g.combat) { if (d < 0.5 && !I.shopL) { I.shopL = true; combatNote(g, "⚔️ In combat — the merchant won't trade until the fight is over."); } continue; }
      if (d < 0.5 && !I.shopL) { I.shopL = true; g.screen = "shop"; g.sel = -1; log(g, "💰 The merchant steps aside and grins: \"Take a look!\""); return true; }
      continue;
    }
    if (tile === 3 && d < 0.65) {
      g.map[ty][tx] = 1;
      const gold = goldGain(g, (10 + tierOf(g.floor) * 8) * (0.7 + Math.random() * 0.6));
      const got = lootRoll(g, "chest");
      gain(g, `+${gold} gold`, GOLDC);
      for (const inv of got) { addItem(g, inv); gain(g, `+ ${instName(inv)}`, rarCol(inv)); }
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
    if (tile === 2 && d < 0.42) {
      if (g.combat) { combatNote(g, "⚔️ In combat — shake off or defeat your foes before taking the stairs."); continue; }
      descend(g); return true;
    }
  }
  if (!nearShop) I.shopL = false;
  return false;
}
function mapMonsters(g: Game, dt: number, p: { x: number; y: number }): boolean {
  let ch = false, fld: Int16Array | null = null;
  for (const m of [...g.mons]) {
    if (m.fx === undefined || m.fy === undefined || Math.floor(m.fx) !== m.x || Math.floor(m.fy) !== m.y) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; }
    if (m.stun > 0) { m.stun = Math.max(0, m.stun - dt); continue; }
    const d = Math.hypot(p.x - m.fx, p.y - m.fy);
    if (m.hx === undefined || m.hy === undefined) { m.hx = m.fx; m.hy = m.fy; }
    if (d < PR + MR + 0.05) { engage(g, m); ch = true; continue; }
    if (m.boss) { if (d <= BOSS_AGGRO && los(g, m.fx, m.fy, p.x, p.y)) { engage(g, m); ch = true; } continue; }
    if (!m.awake) { if (d <= WAKE) m.awake = true; else continue; }
    if (d <= AGGRO && los(g, m.fx, m.fy, p.x, p.y)) { engage(g, m); ch = true; continue; }
    if (d > 15) continue;
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
const TS = 32, VT_MIN = 11;
let VTX = VT_MIN, VTY = VT_MIN;
function syncView(w?: number, h?: number): void {
  const sw = Math.max(1, w ?? (typeof window !== "undefined" ? window.innerWidth : 400));
  const sh = Math.max(1, h ?? (typeof window !== "undefined" ? window.innerHeight : 800));
  const tile = Math.min(sw, sh) / VT_MIN;
  VTX = Math.max(VT_MIN, sw / tile);
  VTY = Math.max(VT_MIN, sh / tile);
}
if (typeof window !== "undefined") syncView();
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
  const cw = Math.min(Math.round(cv.clientWidth * dpr), Math.round(VTX * TS * 1.4)); if (!cw) return;
  const ch = Math.min(Math.round(cv.clientHeight * dpr), Math.round(VTY * TS * 1.4)); if (!ch) return;
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; force = true; }
  // redraw when the camera moves or the view size changes; otherwise only ~12 times a second for candle flicker
  const key = `${(g.wx ?? 0).toFixed(3)},${(g.wy ?? 0).toFixed(3)},${g.floor},${g.px},${g.py},${VTX.toFixed(3)},${VTY.toFixed(3)},${cw}x${ch}`, tn = performance.now();
  if (!force && key === VIEW_K && tn - VIEW_T < 80) return;
  VIEW_K = key; VIEW_T = tn;
  const c = cv.getContext("2d"); if (!c) return;
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  // keep tiles square: never stretch even if the canvas is a pixel off the ideal aspect
  const s = Math.min(cw / VTX, ch / VTY), ox = (cw - s * VTX) / 2, oy = (ch - s * VTY) / 2;
  const x0 = px - VTX / 2, y0 = py - VTY / 2;
  const ac = art.cv.getContext("2d");
  for (let ty = Math.max(0, Math.floor(y0)); ty <= Math.min(H - 1, Math.floor(y0 + VTY)); ty++) for (let tx = Math.max(0, Math.floor(x0)); tx <= Math.min(W - 1, Math.floor(x0 + VTX)); tx++) {
    if (art.baked[ty * W + tx] !== g.map[ty][tx] && ac) { bakeTile(ac, g, tx, ty, art.bio, null); art.baked[ty * W + tx] = g.map[ty][tx]; }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#07060a"; c.fillRect(0, 0, cw, ch);
  const sx0 = Math.max(0, x0), sy0 = Math.max(0, y0), sx1 = Math.min(W, x0 + VTX), sy1 = Math.min(H, y0 + VTY);
  if (sx1 > sx0 && sy1 > sy0) c.drawImage(art.cv, sx0 * TS, sy0 * TS, (sx1 - sx0) * TS, (sy1 - sy0) * TS, ox + (sx0 - x0) * s, oy + (sy0 - y0) * s, (sx1 - sx0) * s, (sy1 - sy0) * s);
  for (let ty = Math.floor(y0); ty <= Math.floor(y0 + VTY); ty++) for (let tx = Math.floor(x0); tx <= Math.floor(x0 + VTX); tx++) {
    const inb = tx >= 0 && ty >= 0 && tx < W && ty < H;
    const dx = ox + (tx - x0) * s, dy = oy + (ty - y0) * s;
    if (!inb || !g.seen[ty][tx]) { c.fillStyle = "#07060a"; c.fillRect(Math.floor(dx), Math.floor(dy), Math.ceil(s) + 1, Math.ceil(s) + 1); }
    else if (!litT(g, tx, ty)) { c.fillStyle = "rgba(6,4,10,.62)"; c.fillRect(Math.floor(dx), Math.floor(dy), Math.ceil(s) + 1, Math.ceil(s) + 1); }
  }
  c.globalCompositeOperation = "lighter";
  const now = performance.now() / 1000;
  art.lights.forEach((L: [number, number, number], i: number) => {
    if (L[0] < x0 - 1 || L[0] > x0 + VTX + 1 || L[1] < y0 - 1 || L[1] > y0 + VTY + 1) return;
    const lx = Math.floor(L[0]), ly = Math.floor(L[1]);
    if (lx < 0 || ly < 0 || lx >= W || ly >= H || !g.seen[ly][lx]) return;
    const f = 0.75 + 0.25 * Math.sin(now * (7 + (i % 5)) + i * 1.7) * Math.sin(now * 3.1 + i);
    const gx = ox + (L[0] - x0) * s, gy = oy + (L[1] - y0) * s, rad = s * (L[2] === 2 ? 1.1 : 1.5);
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
    else if (v === 3) dot(x + 0.5, y + 0.5, "#c98a3a", big ? 0.3 : 0.36);
  }
  for (const m of g.mons) {
    if (!g.seen[m.y]?.[m.x]) continue;
    if (!(m.boss || litT(g, m.x, m.y))) continue;
    dot(m.fx ?? m.x + 0.5, m.fy ?? m.y + 0.5, m.boss ? "#ff3355" : "#ff6b6b", m.boss ? 0.6 : 0.38);
  }
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  c.strokeStyle = "#000"; c.lineWidth = Math.max(1, dpr);
  dot(px, py, "#fff2c8", 0.55); c.beginPath(); c.arc(px * s, py * s, Math.max(1.5 * dpr, 0.55 * s), 0, 7); c.stroke();
  if (!big) { c.strokeStyle = "rgba(255,230,180,.35)"; c.lineWidth = 1; c.strokeRect((px - VTX / 2) * s, (py - VTY / 2) * s, VTX * s, VTY * s); }
}
// move combat sprites every frame without a React render (React refreshes HP bars etc. at ~15 Hz)

// visual-only hero and pet animation (module state, never written into a save)
type WeapAnim = "slash" | "bow" | "staff" | "mace" | "thrust";
interface HeroAn { walkT: number; face: number; moving: boolean; atkTs: number; kind: WeapAnim | ""; ang: number; prev: number }
const HERO_AN: HeroAn = { walkT: 0, face: 1, moving: false, atkTs: 0, kind: "", ang: 0, prev: 0 };
interface PetAn { x: number; y: number; walk: number; face: number; hT: number; prev: number }
const PET_AN: PetAn[] = [];
function weapAnim(g: Game): WeapAnim {
  const id = g.eq.weapon?.id ?? CLS[g.cls].start[0];
  const ic = IT[id]?.icon ?? "";
  if (ic === "🏹") return "bow";
  if (ic === "🪄") return "staff";
  if (ic === "🔨") return "mace";
  if (ic === "🔱") return "thrust";
  return "slash";
}
function beginHeroAtk(g: Game): void {
  const c = g.combat; if (!c) return;
  const e = c.enemies[c.target];
  const px = c.px ?? 0, py = c.py ?? 0;
  const ang = e ? Math.atan2((e.y ?? py) - py, (e.x ?? px) - px) : FACE;
  HERO_AN.atkTs = performance.now(); HERO_AN.kind = weapAnim(g); HERO_AN.ang = ang;
  HERO_AN.face = Math.cos(ang) >= 0 ? 1 : -1;
}
function atkDur(k: string): number { return k === "bow" ? 250 : k === "mace" ? 260 : 230; }
function setFx(fx: SVGElement, name: string, on: boolean, rot = 0, extra?: (g: SVGGElement) => void): void {
  const g = fx.querySelector(`[data-fx="${name}"]`) as SVGGElement | null; if (!g) return;
  g.style.opacity = on ? "1" : "0";
  g.style.transform = `rotate(${rot}deg)`;
  if (on && extra) extra(g);
}
function placeHero(g: Game, I: Inp): void {
  const el = document.querySelector("[data-hero-an]") as HTMLElement | null;
  const fx = document.querySelector("[data-hero-fx]") as SVGElement | null;
  if (!el) return;
  const now = performance.now();
  const dt = Math.min(0.05, (now - (HERO_AN.prev || now)) / 1000);
  HERO_AN.prev = now;
  const vm = Math.hypot(I.vx, I.vy);
  HERO_AN.moving = vm > 0.35;
  const horiz = HERO_AN.moving && Math.abs(I.vx) > 0.15;
  if (HERO_AN.moving) HERO_AN.walkT += dt;
  if (horiz) HERO_AN.face = I.vx > 0 ? 1 : -1;
  const bob = HERO_AN.moving ? Math.sin(HERO_AN.walkT * 11) * 6 : Math.sin(now / 520) * 1.6;
  // lean is in unflipped local space; scale(face) then makes it lean into the walk
  const lean = horiz ? 7 : 0;
  const squash = HERO_AN.moving ? 1 + Math.sin(HERO_AN.walkT * 22) * 0.05 : 1 + Math.sin(now / 520) * 0.02;
  let rot = lean, ox = 0, oy = bob;
  const kind = HERO_AN.kind, age = now - HERO_AN.atkTs, dur = atkDur(kind);
  const t = HERO_AN.atkTs > 0 && age < dur ? age / dur : -1;
  if (t >= 0) {
    const swing = Math.sin(t * Math.PI);
    if (kind === "slash" || kind === "mace") rot += swing * (kind === "mace" ? 18 : 14);
    else if (kind === "staff" || kind === "thrust") { ox += Math.cos(HERO_AN.ang) * swing * 12; oy += Math.sin(HERO_AN.ang) * swing * 10; }
    else if (kind === "bow") { const pull = t < 0.4 ? t / 0.4 : Math.max(0, 1 - (t - 0.4) / 0.6); ox -= Math.cos(HERO_AN.ang) * pull * 8; }
  }
  el.style.transform = `translate(${ox}%, ${oy}%) scale(${HERO_AN.face}, ${squash}) rotate(${rot}deg)`;
  el.style.transformOrigin = "50% 70%";
  if (!fx) return;
  const deg = HERO_AN.ang * 180 / Math.PI;
  const show = (name: WeapAnim): boolean => t >= 0 && kind === name;
  setFx(fx, "slash", show("slash"), deg - 70 + (t >= 0 ? t * 120 : 0), (gr) => {
    const trails = gr.querySelectorAll("path");
    trails.forEach((p, i) => { (p as SVGPathElement).style.opacity = String(Math.max(0, 1 - t - i * 0.2)); });
  });
  setFx(fx, "bow", show("bow"), deg, (gr) => {
    const str = gr.querySelector('[data-part="string"]') as SVGLineElement | null;
    const ar = gr.querySelector('[data-part="arrow"]') as SVGLineElement | null;
    const pull = t < 0.4 ? t / 0.4 : 0;
    if (str) { str.setAttribute("x2", String(10 - pull * 10)); }
    if (ar) { ar.style.opacity = t >= 0.4 && t < 0.75 ? "1" : t < 0.4 ? String(0.7) : "0"; ar.setAttribute("x2", t >= 0.4 ? String(28 + (t - 0.4) * 20) : "18"); }
  });
  setFx(fx, "staff", show("staff"), deg, (gr) => {
    const orb = gr.querySelector("circle") as SVGCircleElement | null;
    if (orb) orb.setAttribute("r", String(3 + Math.sin(t * Math.PI) * 3));
    gr.style.transform = `rotate(${deg}deg) translate(${8 + Math.sin(t * Math.PI) * 10}px, 0)`;
  });
  setFx(fx, "mace", show("mace"), deg - 80 + (t >= 0 ? t * 130 : 0), (gr) => {
    const thud = gr.querySelector("circle") as SVGCircleElement | null;
    if (thud) thud.style.opacity = t > 0.4 && t < 0.75 ? String(1 - (t - 0.4) / 0.35) : "0";
  });
  setFx(fx, "thrust", show("thrust"), deg, (gr) => {
    gr.style.transform = `rotate(${deg}deg) translate(${Math.sin(t * Math.PI) * 14}px, 0)`;
  });
}
function placeCombat(we: HTMLElement, c: Combat): void {
  const put = (el: HTMLElement, x: number, y: number, sz: number): void => { el.style.left = `${((x - sz / 2) / W) * 100}%`; el.style.top = `${((y - sz / 2) / H) * 100}%`; };
  const byUid = (v: string | undefined): Enemy | undefined => c.enemies.find((e: Enemy) => e.uid === Number(v));
  we.querySelectorAll<HTMLElement>("[data-enemy]").forEach((el: HTMLElement) => { const e = byUid(el.dataset.enemy); if (e && !e.dead) put(el, e.x ?? 0, e.y ?? 0, e.boss ? 1.8 : 1.05); });
  we.querySelectorAll<HTMLElement>("[data-wind]").forEach((el: HTMLElement) => {
    const e = byUid(el.dataset.wind); if (!e || e.dead) return;
    const sz = parseFloat(el.dataset.sz ?? "1"); put(el, e.x ?? 0, e.y ?? 0, sz);
    const f = el.firstElementChild as HTMLElement | null; if (f) f.style.transform = `scale(${Math.max(0, Math.min(1, 1 - (e.wind ?? 0) / (e.wm || 1)))})`;
  });
  we.querySelectorAll<HTMLElement>("[data-proj]").forEach((el: HTMLElement) => { const q = (c.proj ?? []).find((x: Proj) => x.id === Number(el.dataset.proj)); if (q) put(el, q.x, q.y, 0.4); else el.style.display = "none"; });
  we.querySelectorAll<HTMLElement>("[data-tid]").forEach((el: HTMLElement) => { const tz = (c.tele ?? []).find((x: Tele) => x.id === Number(el.dataset.tid)); const f = el.firstElementChild as HTMLElement | null; if (tz && f) f.style.transform = `scale(${Math.max(0, Math.min(1, 1 - tz.t / tz.max))})`; });
}
function placePets(we: HTMLElement, g: Game): void {
  const ps = g.pets ?? [];
  const now = performance.now();
  we.querySelectorAll<HTMLElement>("[data-pet]").forEach((el: HTMLElement) => {
    const i = Number(el.dataset.pet); const p = ps[i]; if (!p) return;
    const sz = parseFloat(el.dataset.sz ?? "0.62");
    el.style.left = `${((p.x - sz / 2) / W) * 100}%`; el.style.top = `${((p.y - sz / 2) / H) * 100}%`;
    const st = PET_AN[i] ?? (PET_AN[i] = { x: p.x, y: p.y, walk: 0, face: 1, hT: 0, prev: now });
    const dt = Math.min(0.05, (now - (st.prev || now)) / 1000); st.prev = now;
    const dx = p.x - st.x, dy = p.y - st.y; st.x = p.x; st.y = p.y;
    const moving = Math.hypot(dx, dy) > 0.0008;
    if (dx > 0.02) st.face = 1; else if (dx < -0.02) st.face = -1;
    st.walk += dt;
    const inner = el.querySelector("[data-pet-an]") as HTMLElement | null;
    const fx = el.querySelector("[data-pet-fx]") as SVGElement | null;
    if (!inner) return;
    const ko = p.ko > 0;
    const ag = p.aT ? Date.now() - p.aT : 9999;
    const hurt = st.hT ? Date.now() - st.hT : 9999;
    let ox = 0, oy = 0, rot = 0, sx = st.face, sy = 1, op = 1;
    if (ko) { rot = 80; op = 0.5; sy = 0.72; sx = st.face * 0.95; }
    else {
      const breath = Math.sin(now / 480 + i) * 0.035;
      if (p.k === "wolf" || p.k === "hound") {
        if (moving) { oy = Math.sin(st.walk * 14) * 8; rot = Math.sin(st.walk * 14) * 8; sy = 1 + Math.sin(st.walk * 28) * 0.07; }
        else sy = 1 + breath;
      } else if (p.k === "hawk" || p.k === "owl") {
        oy = Math.sin(now / 260 + i) * (moving ? 7 : 4);
        rot = Math.sin(now / 130 + i) * (moving ? 11 : 5);
        sy = 1 + Math.sin(now / 130 + i) * 0.09;
      } else {
        oy = Math.sin(now / 200 + i) * 7;
        op = 0.86 + Math.sin(now / 90 + i) * 0.14;
        rot = Math.sin(now / 320 + i) * 5;
        sy = 1 + breath;
      }
      if (ag < 280 && p.tx !== undefined && p.ty !== undefined) {
        const u = ag / 280, vx = p.tx - p.x, vy = p.ty - p.y, vl = Math.hypot(vx, vy) || 1;
        const dive = p.k === "hawk" || p.k === "owl";
        const k = Math.sin(u * Math.PI) * (p.k === "imp" ? 16 : dive ? 55 : 42);
        ox += (vx / vl) * k; oy += (vy / vl) * k;
        if (dive) rot += 22 * Math.sin(u * Math.PI);
      }
      if (hurt < 180) { const f = 1 - hurt / 180; ox += Math.sin(hurt / 20) * 5 * f; sx *= 1 - 0.08 * f; }
    }
    inner.style.transform = `translate(${ox}%, ${oy}%) scale(${sx}, ${sy}) rotate(${rot}deg)`;
    inner.style.opacity = String(op);
    inner.style.filter = ko ? "grayscale(1) brightness(.6)" : g.buffs.frenzy > 0 ? "drop-shadow(0 0 3px rgba(220,30,30,.9))" : "drop-shadow(0 2px 2px rgba(0,0,0,.7))";
    if (fx) {
      const flash = !ko && ((p.k === "imp" && ag < 200) || (p.k !== "imp" && ag < 220));
      fx.style.opacity = flash ? String(1 - ag / 240) : "0";
      const bolt = fx.querySelector("path");
      if (bolt) bolt.setAttribute("d", p.k === "imp" ? "M8 2 L12 9 L9 9 L14 18 L7 10 L10 10 Z" : "M4 3 L14 15 M8 2 L17 12 M2 7 L11 18");
    }
  });
}
function petSz(k: string): number { return k === "hound" ? 0.74 : k === "wolf" ? 0.66 : 0.58; }
function petSpr(k: string): string { return k === "imp" ? "pimp" : k === "owl" ? "powl" : k === "hound" ? "phound" : k; }
function worldTf(g: Game): string { const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5; return `translate(${(-(px - VTX / 2) / W) * 100}%, ${(-(py - VTY / 2) / H) * 100}%)`; }
function rtMap(g: Game, dt: number, mx: number, my: number, I: Inp): boolean {
  if (g.screen !== "map") return false;
  tickScrollBuffs(g, dt);
  let ch = false;
  if (g.wx === undefined || g.wy === undefined || Math.floor(g.wx) !== g.px || Math.floor(g.wy) !== g.py) { g.wx = g.px + 0.5; g.wy = g.py + 0.5; ch = true; }
  const p = { x: g.wx, y: g.wy };
  I.slowT = Math.max(0, I.slowT - dt);
  for (const k of Object.keys(g.cds)) if (g.cds[k] > 0) g.cds[k] = Math.max(0, g.cds[k] - dt);
  const cb = g.combat;
  const sp = MAP_SPD * (I.slowT > 0 ? 0.45 : 1) * (full(g).curses.includes("c_slow") ? 0.7 : 1) * (cb ? 1 + Math.min(50, full(g).dodge) / 250 : 1);
  const mag = Math.hypot(mx, my);
  let tvx = 0, tvy = 0;
  if (cb && (cb.dashT ?? 0) > 0) {
    cb.dashT = Math.max(0, (cb.dashT ?? 0) - dt);
    slideMove(g, p, (cb.dvx ?? 0) * DASH_SPD, (cb.dvy ?? 0) * DASH_SPD, dt, PR);
    I.vx = (cb.dvx ?? 0) * sp; I.vy = (cb.dvy ?? 0) * sp; ch = true;
  } else {
  if (mag > 0.12) { const k = (Math.min(1, mag) / mag) * sp; tvx = mx * k; tvy = my * k; I.idleT = 0; }
  else { I.idleT += dt; if (I.idleT < 0.05) { tvx = I.vx; tvy = I.vy; } }
  steerVel(I, tvx, tvy, dt);
  const vm = Math.hypot(I.vx, I.vy);
  if (vm > 0.01) {
    setFace(I.vx, I.vy);
    const ox = p.x, oy = p.y;
    slideMove(g, p, I.vx, I.vy, dt, PR);
    const got = ((p.x - ox) * I.vx + (p.y - oy) * I.vy) / vm;
    if (mag > 0.12 && got < vm * dt * 0.6) laneAssist(g, p, I.vx, I.vy, vm * dt);
    ch = true;
  }
  }
  g.wx = p.x; g.wy = p.y;
  const tx = Math.floor(p.x), ty = Math.floor(p.y);
  if (tx !== g.px || ty !== g.py) { g.px = tx; g.py = ty; g.turns++; reveal(g); }
  if (touchTiles(g, p, I)) return true;
  if (mapMonsters(g, dt, p)) ch = true;
  if (g.screen !== "map") return true;
  tickManaItems(g, dt);
  if (g.combat) { I.regT = 0; return true; }
  if ((g.pets ?? []).length) { petsFollow(g, dt); ch = true; }
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
// ---------- PETS: real companions on the map ----------
const PET_KO = 12; // seconds a knocked-out pet stays down mid-fight (revives at 40%); all KO'd pets revive at 50% when combat ends
function petRoster(g: Game): string[] { const r: string[] = []; if (g.cls === "ranger") { r.push("wolf"); if (g.perks.includes("packleader")) r.push("hawk"); } if (g.cpet && PETS[g.cpet]) r.push(g.cpet); return r; }
function petBoost(g: Game, f: Full): number { return (g.perks.includes("beastbond") ? 1.25 : 1) * (g.perks.includes("packtactics") ? 1.15 : 1) * (g.perks.includes("feralpact") ? 1.5 : 1) * (f.sp.includes("petBoost") ? 1.3 : 1); }
function syncPets(g: Game, heal = false): void {
  const ros = petRoster(g); const f = full(g); const cur = g.pets ?? []; const out: Pet[] = [];
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  ros.forEach((k: string, i: number) => {
    const max = Math.max(8, Math.round(f.maxHp * PETS[k].hpF * petBoost(g, f)));
    const old = cur.find((p: Pet) => p.k === k && !out.includes(p));
    if (old) { if (old.max !== max) { old.hp = Math.min(max, Math.round(old.hp * max / Math.max(1, old.max))); old.max = max; } if (heal && old.ko <= 0) old.hp = old.max; out.push(old); return; }
    const q = { x: px - 0.5 + i * 0.5, y: py + 0.55 }; if (!g.map.length) { q.x = px; q.y = py; } else { pushOut(g, q, 0.25); if (solidT(g, Math.floor(q.x), Math.floor(q.y))) { q.x = px; q.y = py; } }
    out.push({ k, hp: max, max, x: q.x, y: q.y, ko: 0, cd: 0.6 });
  });
  g.pets = out;
}
function revivePets(g: Game): void { for (const p of g.pets ?? []) if (p.ko > 0 || p.hp <= 0) { p.ko = 0; p.hp = Math.max(1, Math.round(p.max * 0.5)); log(g, `${PETS[p.k].icon} Your ${PETS[p.k].name} recovers.`, "good"); } }
// smarter pet pathing (module state, not saved): A* around walls/hazards, LOS corner-cuts, smooth steering
interface PetNav { k: string; path: [number, number][]; gx: number; gy: number; repathT: number; stuckT: number; lastX: number; lastY: number; vx: number; vy: number; prog: number; progT: number }
const PET_NAV: PetNav[] = [];
function petNav(i: number, p: Pet): PetNav {
  let st = PET_NAV[i];
  if (!st || st.k !== p.k) { st = { k: p.k, path: [], gx: p.x, gy: p.y, repathT: 0, stuckT: 0, lastX: p.x, lastY: p.y, vx: 0, vy: 0, prog: 0, progT: 0 }; PET_NAV[i] = st; }
  return st;
}
function petWalkable(g: Game, x: number, y: number): boolean { return !solidT(g, x, y); }
function petCost(g: Game, x: number, y: number): number { const t = g.map[y][x]; return (t === 5 || t === 6) ? 8 : 1; }
function petNearestOpen(g: Game, x: number, y: number): [number, number] {
  x = clampN(Math.floor(x), 0, W - 1); y = clampN(Math.floor(y), 0, H - 1);
  if (petWalkable(g, x, y)) return [x, y];
  for (let r = 1; r <= 6; r++) for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
    const nx = x + ox, ny = y + oy; if (petWalkable(g, nx, ny)) return [nx, ny];
  }
  return [x, y];
}
function petLineHazard(g: Game, ax: number, ay: number, bx: number, by: number): boolean {
  const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 0.25));
  for (let i = 1; i < n; i++) {
    const t = i / n, x = Math.floor(ax + (bx - ax) * t), y = Math.floor(ay + (by - ay) * t);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const tile = g.map[y][x]; if (tile === 5 || tile === 6) return true;
  }
  return false;
}
function petAStar(g: Game, ax: number, ay: number, bx: number, by: number): [number, number][] | null {
  const [sx, sy] = petNearestOpen(g, ax, ay), [gx, gy] = petNearestOpen(g, bx, by);
  if (sx === gx && sy === gy) return [[gx + 0.5, gy + 0.5]];
  const N = W * H, start = sy * W + sx, goal = gy * W + gx;
  const gS = new Float32Array(N).fill(1e9); gS[start] = 0;
  const came = new Int32Array(N).fill(-1); const closed = new Uint8Array(N);
  const open: number[] = [start];
  const heur = (i: number): number => { const x = i % W, y = (i - x) / W; return Math.abs(x - gx) + Math.abs(y - gy); };
  while (open.length) {
    let bi = 0, bv = gS[open[0]] + heur(open[0]);
    for (let i = 1; i < open.length; i++) { const v = gS[open[i]] + heur(open[i]); if (v < bv) { bv = v; bi = i; } }
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (closed[cur]) continue; if (cur === goal) break; closed[cur] = 1;
    const cx = cur % W, cy = (cur - cx) / W;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
      const nx = cx + ox, ny = cy + oy; if (!petWalkable(g, nx, ny)) continue;
      const ni = ny * W + nx, ng = gS[cur] + petCost(g, nx, ny); if (ng >= gS[ni]) continue;
      gS[ni] = ng; came[ni] = cur; open.push(ni);
    }
  }
  if (gS[goal] >= 1e8) return null;
  const tiles: [number, number][] = [];
  for (let i = goal; i >= 0; i = came[i]) { tiles.push([i % W, (i - (i % W)) / W]); if (i === start) break; }
  tiles.reverse();
  return tiles.map(([x, y]) => [x + 0.5, y + 0.5] as [number, number]);
}
function petPull(g: Game, px: number, py: number, path: [number, number][]): [number, number] {
  if (path.length === 0) return [px, py];
  let best = path[0], bi = 0;
  for (let i = 0; i < path.length; i++) {
    if (los(g, px, py, path[i][0], path[i][1]) && !petLineHazard(g, px, py, path[i][0], path[i][1])) { best = path[i]; bi = i; }
    else if (i > bi) break;
  }
  return best;
}
function petSteer(st: PetNav, px: number, py: number, hx: number, hy: number, spd: number, dt: number): void {
  const ACC = 32, ROT = 14;
  const dx = hx - px, dy = hy - py, dist = Math.hypot(dx, dy);
  const ts = dist < 0.16 ? 0 : Math.min(spd, dist < 0.5 ? spd * (dist / 0.5) : spd);
  const tx = dist > 1e-4 ? dx / dist * ts : 0, ty = dist > 1e-4 ? dy / dist * ts : 0;
  const cs = Math.hypot(st.vx, st.vy), want = Math.hypot(tx, ty);
  if (want < 1e-3) { const ns = Math.max(0, cs - ACC * dt); if (cs > 0) { st.vx *= ns / cs; st.vy *= ns / cs; } else { st.vx = 0; st.vy = 0; } return; }
  const ns = cs < want ? Math.min(want, cs + ACC * dt) : Math.max(want, cs - ACC * dt);
  if (cs < 0.25) { st.vx = (tx / want) * ns; st.vy = (ty / want) * ns; return; }
  const ca = Math.atan2(st.vy, st.vx), ta = Math.atan2(ty, tx);
  let da = ta - ca; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const turn = ROT * dt, na = Math.abs(da) <= turn ? ta : ca + Math.sign(da) * turn;
  st.vx = Math.cos(na) * ns; st.vy = Math.sin(na) * ns;
}
function petPoof(g: Game, p: Pet, i: number, x: number, y: number): void {
  addFx(g, "💨", "sys", "pt" + i); p.x = x; p.y = y;
  const st = petNav(i, p); st.path = []; st.stuckT = 0; st.vx = 0; st.vy = 0; st.lastX = x; st.lastY = y; st.prog = 0; st.progT = 0;
  const an = PET_AN[i]; if (an) { an.x = x; an.y = y; }
  log(g, `${PETS[p.k].icon} Your ${PETS[p.k].name} poofs back to your side.`, "sys");
}
function petTrail(g: Game, i: number, n: number): [number, number] {
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5, back = FACE + Math.PI;
  const spread = (i - (n - 1) / 2) * 0.62, dist = 1.05 + Math.min(i, 2) * 0.12;
  let x = px + Math.cos(back) * dist + Math.cos(back + Math.PI / 2) * spread;
  let y = py + Math.sin(back) * dist + Math.sin(back + Math.PI / 2) * spread;
  if (solidT(g, Math.floor(x), Math.floor(y))) { const o = petNearestOpen(g, x, y); x = o[0] + 0.5; y = o[1] + 0.5; }
  return [x, y];
}
function petFlank(g: Game, p: Pet, e: Enemy, i: number): [number, number] {
  const ex = e.x ?? p.x, ey = e.y ?? p.y, px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5;
  let dx = px - ex, dy = py - ey, L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const side = i % 2 === 0 ? 1 : -1, ring = Math.max(0.7, PETS[p.k].reach * 0.85), out = 1 + Math.floor(i / 2) * 0.4;
  let x = ex - dy * side * ring * out, y = ey + dx * side * ring * out;
  if (solidT(g, Math.floor(x), Math.floor(y)) || !los(g, x, y, ex, ey)) {
    x = ex + dx * ring; y = ey + dy * ring;
    if (solidT(g, Math.floor(x), Math.floor(y))) { const o = petNearestOpen(g, x, y); x = o[0] + 0.5; y = o[1] + 0.5; }
  }
  return [x, y];
}
function petStandoff(g: Game, p: Pet, e: Enemy): [number, number] {
  const ex = e.x ?? p.x, ey = e.y ?? p.y, evx = p.x - ex, evy = p.y - ey, el = Math.hypot(evx, evy) || 1, prefer = 2.7;
  const hintX = ex + evx / el * prefer, hintY = ey + evy / el * prefer;
  let best: [number, number] | null = null, bd = 1e9;
  for (let y = Math.floor(ey - 4); y <= Math.floor(ey + 4); y++) for (let x = Math.floor(ex - 4); x <= Math.floor(ex + 4); x++) {
    if (!petWalkable(g, x, y) || petCost(g, x, y) > 1) continue;
    const cx = x + 0.5, cy = y + 0.5, d = Math.hypot(cx - ex, cy - ey);
    if (d < 2.15 || d > 3.2 || !los(g, cx, cy, ex, ey)) continue;
    const s = Math.hypot(cx - p.x, cy - p.y) + Math.hypot(cx - hintX, cy - hintY) * 0.45;
    if (s < bd) { bd = s; best = [cx, cy]; }
  }
  return best ?? [hintX, hintY];
}
function petDrive(g: Game, p: Pet, i: number, destX: number, destY: number, dt: number, spd: number, arrived = 0.2): void {
  const st = petNav(i, p), dist = Math.hypot(destX - p.x, destY - p.y);
  st.repathT = Math.max(0, st.repathT - dt);
  let hx = destX, hy = destY;
  const clear = los(g, p.x, p.y, destX, destY) && !petLineHazard(g, p.x, p.y, destX, destY);
  if (dist > arrived && !clear) {
    if (st.stuckT > 0.4 || st.repathT <= 0 || st.path.length === 0 || Math.hypot(destX - st.gx, destY - st.gy) > 0.7) {
      const path = petAStar(g, p.x, p.y, destX, destY);
      if (path && path.length) { st.path = path; st.gx = destX; st.gy = destY; }
      st.repathT = 0.2;
    }
    const wp = petPull(g, p.x, p.y, st.path); hx = wp[0]; hy = wp[1];
  }
  petSteer(st, p.x, p.y, hx, hy, spd, dt);
  const q = { x: p.x, y: p.y }; slideMove(g, q, st.vx, st.vy, dt, 0.25); p.x = q.x; p.y = q.y;
  const others = g.pets ?? [];
  for (const o of others) {
    if (o === p) continue; const sx = p.x - o.x, sy = p.y - o.y, sd = Math.hypot(sx, sy);
    if (sd > 1e-4 && sd < 0.42) { p.x += sx / sd * (0.42 - sd) * 0.5; p.y += sy / sd * (0.42 - sd) * 0.5; }
  }
  pushOut(g, p, 0.25);
  const moved = Math.hypot(p.x - st.lastX, p.y - st.lastY); st.lastX = p.x; st.lastY = p.y;
  st.prog += moved; st.progT += dt;
  if (st.progT >= 0.35) {
    if (dist > arrived + 0.12 && st.prog < 0.16) st.stuckT += st.progT; else st.stuckT = Math.max(0, st.stuckT - st.progT);
    st.prog = 0; st.progT = 0;
  }
}

// out of combat: pets trail behind the hero, pathing around walls and hazards
function petsFollow(g: Game, dt: number): void {
  const px = g.wx ?? g.px + 0.5, py = g.wy ?? g.py + 0.5, pets = g.pets ?? [];
  pets.forEach((p: Pet, i: number) => {
    if (p.ko > 0) return;
    if (!isFinite(p.x) || !isFinite(p.y)) { p.x = px; p.y = py; return; }
    const dHero = Math.hypot(px - p.x, py - p.y);
    const [tx, ty] = petTrail(g, i, pets.length);
    if (dHero > 13) { petPoof(g, p, i, tx, ty); return; }
    let spd = PETS[p.k].spd;
    if (dHero > 2.4) spd *= 1.35;
    if (dHero > 4.2) spd *= 1.22;
    petDrive(g, p, i, tx, ty, dt, spd, 0.18);
    if (petNav(i, p).stuckT > 1.15) petPoof(g, p, i, tx, ty);
  });
}
function hurtPet(g: Game, p: Pet, raw: number): number {
  if (p.ko > 0 || p.hp <= 0) return 0;
  const f = full(g); const d = Math.max(1, Math.round(raw * (0.9 + Math.random() * 0.2) * 60 / (60 + f.def * 0.5)));
  p.hp -= d; const i = (g.pets ?? []).indexOf(p); addFx(g, `-${d}`, "bad", "pt" + i);
  if (i >= 0) { const st = PET_AN[i] ?? (PET_AN[i] = { x: p.x, y: p.y, walk: 0, face: 1, hT: 0, prev: performance.now() }); st.hT = Date.now(); }
  if (p.hp <= 0) { p.hp = 0; p.ko = PET_KO; log(g, `💫 Your ${PETS[p.k].name} is knocked out!`, "bad"); }
  return d;
}
function petAttack(g: Game, p: Pet, e: Enemy, f: Full): void {
  const c = g.combat; if (!c) return;
  const T = PETS[p.k]; p.cd = T.rate; p.aT = Date.now(); p.tx = e.x; p.ty = e.y;
  const mult = T.mult * (g.buffs.frenzy > 0 ? 3 : 1) * (f.sp.includes("petx2") ? 2 : 1) * petBoost(g, f);
  const d = Math.max(1, Math.round(f.atk * mult * (0.9 + Math.random() * 0.2) * 60 / (60 + e.def)));
  e.hp -= d; addFx(g, `-${d}`, "dmg", "e" + e.uid);
  log(g, `${T.icon} Your ${T.name} ${p.k === "imp" ? "scorches" : "hits"} ${e.name} for ${d}.`, "dmg");
  if (p.k === "imp") { const s = c.shots ?? (c.shots = []); s.push({ id: UID++, x1: p.x, y1: p.y, x2: e.x ?? 0, y2: e.y ?? 0, ts: Date.now(), c: "#ff8a3a" }); if (s.length > 8) s.shift(); if (e.hp > 0) { e.burnT = Math.max(e.burnT, 2); e.burnD = Math.max(e.burnD, Math.round(f.atk * 0.15)); } }
  if (p.k === "owl" && e.hp > 0 && Math.random() < 0.15) stunE(g, e, 1.5);
}
// in combat: each pet picks a foe (yours if close, else the nearest it can see), closes in and attacks on its own timer
function petStep(g: Game, dt: number): void {
  const c = g.combat; if (!c) return;
  const pets = g.pets ?? []; if (pets.length === 0) return;
  const f = full(g); const px = c.px ?? 0, py = c.py ?? 0;
  for (const p of pets) {
    if (p.ko > 0) { p.ko -= dt; if (p.ko <= 0) { p.ko = 0; p.hp = Math.round(p.max * 0.4); log(g, `${PETS[p.k].icon} Your ${PETS[p.k].name} gets back up!`, "good"); } continue; }
    const T = PETS[p.k]; p.cd = Math.max(0, p.cd - dt);
    const dist = (x: Enemy): number => Math.hypot((x.x ?? 0) - p.x, (x.y ?? 0) - p.y);
    let e: Enemy | undefined = c.enemies[c.target];
    if (!e || e.dead || e.hp <= 0 || dist(e) > 8) {
      e = undefined; let bd = 8;
      for (const x of c.enemies) { if (x.dead || x.hp <= 0) continue; const d = dist(x); if (d < bd && los(g, p.x, p.y, x.x ?? 0, x.y ?? 0)) { bd = d; e = x; } }
    }
    const i = pets.indexOf(p);
    let tx = px, ty = py, stop = false;
    if (e) {
      const d = dist(e), see = los(g, p.x, p.y, e.x ?? 0, e.y ?? 0);
      if (p.k === "imp") {
        if (see && d <= T.reach && p.cd <= 0) petAttack(g, p, e, f);
        if (see && d >= 2.15 && d <= 3.2) stop = true;
        else { const st = petStandoff(g, p, e); tx = st[0]; ty = st[1]; }
      } else {
        if (see && d <= T.reach + 0.2) { if (p.cd <= 0 && d <= T.reach) petAttack(g, p, e, f); if (d <= T.reach) stop = true; }
        if (!stop) { const fl = petFlank(g, p, e, i); tx = fl[0]; ty = fl[1]; }
      }
    } else if (Math.hypot(px - p.x, py - p.y) < 1.15) stop = true;
    else { const tr = petTrail(g, i, pets.length); tx = tr[0]; ty = tr[1]; }
    if (!stop) {
      let spd = T.spd;
      if (Math.hypot(px - p.x, py - p.y) > 3) spd *= 1.3;
      petDrive(g, p, i, tx, ty, dt, spd, p.k === "imp" ? 0.28 : 0.2);
    }
    const dHero = Math.hypot(px - p.x, py - p.y);
    if (dHero > 13 || petNav(i, p).stuckT > 1.15) petPoof(g, p, i, px, py);
  }
}
function tickCombatCurses(g: Game, c: Combat, dt: number): void {
  const f = full(g);
  if (!f.curses.includes("c_burn") && !f.curses.includes("c_manatick")) return;
  c.curseAcc = (c.curseAcc ?? 0) + dt;
  while ((c.curseAcc ?? 0) >= 2) {
    c.curseAcc = (c.curseAcc ?? 0) - 2;
    if (f.curses.includes("c_burn")) {
      const d = Math.max(1, Math.round(f.maxHp * 0.03));
      g.hp -= d;
      log(g, `🔥 Cinderstride burns you for ${d}.`, "bad");
      addFx(g, `-${d}`, "bad", "p");
      lethal(g); if (g.hp <= 0) { die(g); return; }
    }
    if (f.curses.includes("c_manatick")) {
      const m = Math.max(1, Math.round(f.maxMp * 0.08));
      g.mp = Math.max(0, g.mp - m);
      log(g, `⚡ Living Lightning drains ${m} MP.`, "bad");
    }
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
  c.turn++;
}
function cdSec(g: Game, ab: Ab): number { return abCd(g, ab); }

function abCost(g: Game, ab: Ab): number {
  const sp = full(g).sp;
  let m = 1;
  if (sp.includes("manaSave")) m *= 0.7;
  if (sp.includes("arcanist")) m *= 0.75;
  if (g.perks.includes("archmage")) m *= 0.5;
  if (g.perks.includes("arcanebattery")) m *= 0.85;
  return Math.round(ab.mp * m);
}
function abCd(g: Game, ab: Ab): number { const f = full(g); const base = Math.max(0, ab.cd - (f.sp.includes("cdr") ? 1.5 : 0) - (g.perks.includes("archmage") ? 1.5 : 0)); return f.curses.includes("c_lag") ? base * 1.5 : base; }
function runAbility(g: Game, id: string, label: string): void {
  const c = g.combat; if (!c) return;
  const f = full(g); const b = g.buffs; const t = tgt(c);
  g.inAb = true;
  switch (id) {
    case "bash": if (t) { hitEnemy(g, t, 1.3, false, label); stunE(g, t, 2); } break;
    case "cleave": {
      const ww = g.perks.includes("whirlwind");
      const px = c.px ?? 0, py = c.py ?? 0, reach = (ww ? 34 : 26) / U, half = Math.PI * 50 / 180;
      for (const e of alive(c)) {
        if (!los(g, px, py, e.x ?? 0, e.y ?? 0) || eDist(c, e) > reach) continue;
        if (!ww && !inCone(px, py, FACE, e.x ?? 0, e.y ?? 0, half, reach)) continue;
        hitEnemy(g, e, ww ? 1.2 : 1.0, false, label); if (ww) stunE(g, e, 1.5);
      }
      addPulse("cleave", FACE);
      break;
    }
    case "smash": {
      const px = c.px ?? 0, py = c.py ?? 0, reach = 2.4;
      for (const e of alive(c)) {
        if (eDist(c, e) > reach || !los(g, px, py, e.x ?? 0, e.y ?? 0)) continue;
        hitEnemy(g, e, 1.2, false, label);
      }
      addPulse("smash", 0);
      break;
    }
    case "cry": b.rage = 8; healPlayer(g, Math.round(f.maxHp * 0.15), true); log(g, "📣 Battle Cry! +50% ATK for 8 s.", "good"); break;
    case "fireball": {
      const ts = g.perks.includes("chain") ? alive(c) : t ? [t] : [];
      for (const e of ts) { hitEnemy(g, e, 2.2, false, label); if (e.hp > 0) { e.burnT = 3; e.burnD = Math.max(e.burnD, Math.round(f.atk * 0.3)); } }
      break;
    }
    case "nova": { const m = g.perks.includes("chain") ? 1.8 : 1.2; for (const e of g.perks.includes("chain") ? alive(c) : nearP(c, 34 / U)) { hitEnemy(g, e, m, false, label); stunE(g, e, 3); } break; }
    case "arcane": { b.shield += Math.round(f.maxMp * 0.4 + g.lvl * 4); log(g, `🔮 Arcane Shield absorbs the next ${b.shield} damage.`, "good"); break; }
    case "backstab": if (t) hitEnemy(g, t, 2.2, (c.elapsed ?? 0) < 3 || t.stun > 0, label); break;
    case "poison": if (t) { hitEnemy(g, t, 1.0, false, label); if (t.hp > 0) { t.poisT = 4; t.poisD = Math.max(t.poisD, Math.round(f.atk * 0.45)); log(g, `${t.name} is badly poisoned.`); } } break;
    case "evade": b.evade = 2; log(g, "💨 You melt into the shadows: next 2 attacks will miss.", "good"); break;
    case "heal": { const amt = Math.round(f.maxHp * 0.35 * (f.sp.includes("healBoost") ? 1.5 : 1) * (g.perks.includes("highpriest") ? 1.5 : 1)); b.dotT = 0; const h = healPlayer(g, amt, true); log(g, `✨ You heal for ${h}.`, "heal"); break; }
    case "smite": {
      const wr = g.perks.includes("wrath");
      const ts = wr ? alive(c) : t ? [t] : [];
      for (const e of ts) { hitEnemy(g, e, e.undead ? 2.5 : 1.8, false, label, true); if (wr && e.undead) stunE(g, e, 1.5); }
      break;
    }
    case "holy": b.holy = 6; log(g, "🔆 Holy Shield: damage halved for 6 s.", "good"); break;
    case "multi": {
      if (g.perks.includes("volley")) { for (const e of alive(c)) { hitEnemy(g, e, 0.7, false, label); hitEnemy(g, e, 0.7, false, label); } }
      else for (let k = 0; k < 4; k++) { const a = alive(c); if (a.length === 0) break; hitEnemy(g, pick(a), 0.7, false, label); }
      break;
    }
    case "trap": if (t) { stunE(g, t, 3); t.poisT = Math.max(t.poisT, 3); t.poisD = Math.max(t.poisD, Math.round(f.atk * 0.35)); log(g, `${t.name} is snared and bleeding.`); } break;
    case "frenzy": b.frenzy = 8; if (t) hitEnemy(g, t, 1.5, false, label); log(g, "📯 Call of the Wild! Pets deal triple damage for 8 s.", "good"); break;
  }
  g.inAb = false;
}
function useAbility(g: Game, id: string): ActRes {
  const c = g.combat; if (!c) return "none";
  const ab = CLS[g.cls].abs.find((a: Ab) => a.id === id); if (!ab) return "none";
  if (!abReadyId(g, id)) { const i = abIdxOf(g, id); log(g, `${ab.name} unlocks at level ${abUnlockAt(i)}.`); addFx(g, `Lv ${abUnlockAt(i)}`, "sys", "p"); return "none"; }
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
function liftCurses(g: Game): number { let n = 0; for (const k of GEAR) { const it = g.eq[k]; if (it && locked(it)) { it.freed = true; n++; } } return n; }
function useConsumable(g: Game, inv: Inv): ActRes {
  const t = IT[inv.id]; const f = full(g); const c = g.combat;
  const inCombat = !!c;
  const pw = t.pw ?? 0;
  switch (t.fx) {
    case "heal": { const h = healPlayer(g, Math.round(f.maxHp * pw / 100 * (g.perks.includes("herbalist") ? 1.25 : 1)), inCombat); if (g.perks.includes("alchemist")) g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * 0.2)); log(g, `${t.icon} ${t.name}: +${h} HP.`, "heal"); break; }
    case "mana": { const before = g.mp; g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * pw / 100)); log(g, `${t.icon} +${g.mp - before} MP.`, "heal"); break; }
    case "both": healPlayer(g, Math.round(f.maxHp * pw / 100 * (g.perks.includes("herbalist") ? 1.25 : 1)), inCombat); g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * pw / 100)); if (g.perks.includes("alchemist")) g.mp = Math.min(f.maxMp, g.mp + Math.round(f.maxMp * 0.2)); log(g, `${t.icon} You feel rejuvenated.`, "heal"); break;
    case "cleanse": g.buffs.dotT = 0; healPlayer(g, Math.round(f.maxHp * pw / 100), inCombat); log(g, `${t.icon} Cleansed.`, "heal"); break;
    case "bomb": case "frost": {
      if (!c || !inCombat) { log(g, "Save that for combat."); return "none"; }
      const d = t.fx === "bomb" ? 15 + g.floor * 6 : 10 + g.floor * 4;
      for (const e of nearP(c, 5)) {
        e.hp -= d; addFx(g, `-${d}`, "loot", "e" + e.uid);
        if (t.fx === "bomb") { e.burnT = Math.max(e.burnT, 2); e.burnD = Math.max(e.burnD, 3 + g.floor * 2); } else stunE(g, e, 2.5);
      }
      log(g, `${t.icon} ${t.name} hits all enemies for ${d}!`, "dmg");
      break;
    }
    case "smoke": {
      if (!c || !inCombat) { log(g, "Save that for combat."); return "none"; }
      if (alive(c).some((e: Enemy) => e.boss)) { log(g, "The boss sees through the smoke!"); return "none"; }
      g.inv = g.inv.filter((i: Inv) => i.uid !== inv.uid);
      log(g, "💨 You vanish in a puff of smoke! Your foes stagger, blinded.", "good");
      escapeAll(g, 3);
      return "end";
    }
    case "fury": case "iron": {
      if (t.fx === "fury") g.buffs.fury = FURY_T; else g.buffs.iron = IRON_T;
      log(g, `${t.icon} ${t.name}! +50% ${t.fx === "fury" ? "ATK" : "DEF"} for ${t.fx === "fury" ? FURY_T : IRON_T} s.`, "good");
      addFx(g, t.fx === "fury" ? "FURY" : "IRONSKIN", "good", "p");
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
    case "storm": {
      if (!c) { log(g, "Save that for combat."); return "none"; }
      const ts = alive(c).filter((e: Enemy) => eDist(c, e) <= 5).sort((a: Enemy, b: Enemy) => eDist(c, a) - eDist(c, b)).slice(0, 3);
      if (ts.length === 0) { log(g, "No foes close enough."); return "none"; }
      const d = 12 + g.floor * 6;
      for (const e of ts) { e.hp -= d; addFx(g, `-${d}`, "loot", "e" + e.uid); stunE(g, e, 1.5); const s = c.shots ?? (c.shots = []); s.push({ id: UID++, x1: c.px ?? 0, y1: c.py ?? 0, x2: e.x ?? 0, y2: e.y ?? 0, ts: Date.now(), c: "#9fd8ff" }); }
      log(g, `🌪️ Lightning strikes ${ts.length} foe(s) for ${d}!`, "dmg");
      break;
    }
    case "treat": {
      const ps = g.pets ?? [];
      if (ps.length === 0) { log(g, "You have no pet to feed."); return "none"; }
      for (const p of ps) { p.ko = 0; p.hp = p.max; }
      log(g, "🦴 Your pets wolf down the treat — fully healed!", "good");
      break;
    }
    case "pet": {
      const k = t.pet ?? "wolf";
      if (g.cpet === k) { log(g, `You already have a ${PETS[k].name}.`); return "none"; }
      g.cpet = k; syncPets(g, true);
      log(g, `${PETS[k].icon} A ${PETS[k].name} joins you! It will fight at your side.`, "good");
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
    if (g.perks.includes("spellblade")) g.mp = Math.min(f.maxMp, g.mp + 10);
    if (g.perks.includes("doublecut") && t.hp > 0 && Math.random() < 0.2) hitEnemy(g, t, mage ? 0.6 : 1, false, "⚔️ Double Cut");
    if (f.sp.includes("doubleStrike") && t.hp > 0 && Math.random() < 0.2) hitEnemy(g, t, 1, false, "⚔️ Echo Blade");
    if (f.sp.includes("freezeHit") && t.hp > 0 && Math.random() < 0.25) stunE(g, t, 1.5);
    if (f.sp.includes("chainShock")) for (const e of alive(c)) if (e !== t) { const d = Math.max(1, Math.round(f.atk * 0.35 * 60 / (60 + e.def))); e.hp -= d; addFx(g, `-${d}`, "dmg", "e" + e.uid); log(g, `⚡ Lightning arcs to ${e.name} for ${d}.`, "dmg"); }
    if (f.sp.includes("pierce") || f.sp.includes("cleaveHit")) {
      const others = alive(c).filter((e: Enemy) => e !== t && eDist(c, e) <= 3.2).sort((a: Enemy, b: Enemy) => eDist(c, a) - eDist(c, b));
      if (others[0]) hitEnemy(g, others[0], f.sp.includes("cleaveHit") ? 0.5 : 0.4, false, f.sp.includes("cleaveHit") ? "🪓 Cleave" : "🏹 Pierce");
    }
    return "turn";
  }
  if (kind === "defend") { g.buffs.defendT = 1.5; g.buffs.defend = true; const m = Math.round(f.maxMp * 0.1); g.mp = Math.min(f.maxMp, g.mp + m); log(g, `🛡️ You brace yourself for 1.5 s (+${m} MP).`); return "turn"; }
  if (kind === "vanish") {
    if (alive(c).some((e: Enemy) => e.boss)) { log(g, "The boss sees through your shadow."); return "none"; }
    if (g.usedShadow) { log(g, "Shadowmeld already used this floor."); return "none"; }
    g.usedShadow = true; log(g, "🌫️ Shadowmeld! You slip away unseen.", "good"); escapeAll(g, 4); return "end";
  }
  if (kind === "ability") return useAbility(g, arg);
  if (kind === "item") { const inv = g.inv.find((i: Inv) => i.uid === Number(arg)); if (!inv) return "none"; c.itemOpen = false; return useConsumable(g, inv); }
  return "none";
}
function combatAct(g: Game, kind: string, arg: string): void {
  if (g.screen !== "map" || !g.combat) return;
  syncPos(g);
  doAction(g, kind, arg);
  resolveDeaths(g);
}
// the quick-slot consumable: your chosen one if you still carry it, else the first healing potion
function qsItem(g: Game): Inv | undefined {
  const ok = (i: Inv): boolean => { const t = IT[i.id]; return t.slot === "consumable" && ["heal", "both", "mana", "cleanse", "bomb", "frost", "fury", "iron", "storm", "treat"].includes(t.fx ?? ""); };
  if (g.qs) { const q = g.inv.find((i: Inv) => i.id === g.qs && ok(i)); if (q) return q; }
  return g.inv.find((i: Inv) => { const t = IT[i.id]; return t.slot === "consumable" && (t.fx === "heal" || t.fx === "both"); });
}
function quickUse(g: Game): void {
  const it = qsItem(g);
  if (!it) { addFx(g, "no potion", "sys", "p"); log(g, "No potion in your bag."); return; }
  syncPos(g);
  useConsumable(g, it);
  resolveDeaths(g);
}

function gearManaRegen(g: Game): number {
  let r = 0;
  for (const k of GEAR) {
    const it = g.eq[k]; if (!it) continue;
    const t = IT[it.id]; if (t && t.mpreg) r += t.mpreg;
    if (it.mpreg) r += it.mpreg;
  }
  return r;
}
function tickManaItems(g: Game, dt: number): void {
  const f = full(g);
  if (f.curses.includes("c_nomana")) return;
  const r = gearManaRegen(g); if (r <= 0) return;
  g.mp = Math.min(f.maxMp, g.mp + r * dt);
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
  g.eq[slot] = inv; clamp(g); syncPets(g);
  log(g, `Equipped ${t.icon} ${instName(inv)}.`, "good");
  if (locked(inv)) log(g, `☠️ It's cursed! ${t.name} binds to you. ${t.desc ?? ""}`, "bad");
}
function unequip(g: Game, slot: GearSlot): void {
  const it = g.eq[slot]; if (!it) return;
  if (locked(it)) { log(g, "☠️ It's cursed and won't come off. Use a Remove Curse scroll or a merchant.", "bad"); return; }
  if (g.inv.length >= MAXINV) { log(g, "Your bag is full."); return; }
  delete g.eq[slot]; g.inv.push(it); clamp(g); syncPets(g);
  log(g, `Unequipped ${instName(it)}.`);
}

const HELP: [string, string][] = [
  ["🕹️ Controls (touch)", "Touch and drag anywhere on the LEFT half of the screen to spawn a floating joystick; hold it to keep moving (analog, 8 directions). Out of combat the right side holds 🎒 Bag, 📖 Codex, ❓ Help, 🏠 and 💾. When a fight starts the same view swaps to combat controls: ⚔️ Attack (hold to keep swinging), your 3 abilities with cooldown rings, 💨 Dodge roll and a 🧪 potion quick-slot showing how many you carry. Tap an enemy to target it. Tap the minimap (top-right of the dungeon view) for the full map, which pauses the game. Item pickups float above your hero. Works in portrait and landscape."],
  ["⌨️ Keyboard", "Move: WASD or arrow keys (hold to keep moving, you glide along walls). Exploring: M = full map, I or B = bag, Enter/Space/E = trade when next to a merchant, C = codex, H = help. In combat: Space or J = attack (hold), Enter = attack once, 1/2/3 = abilities, Shift or K = dodge roll, R or 4 = quick-slot potion, Tab or Q/E = switch target. Menus: arrows/WASD move the yellow highlight, Enter/Space selects, Q/E switch class tabs, Esc goes back. Esc during play opens the exit prompt (the game pauses; confirming saves and exits) — even mid-fight."],
  ["🎮 Gamepad", "Left stick or D-pad moves. Exploring: A/✕ trade with a merchant, Y bag, X codex, View/Select full map, R3 (right-stick click) help. In combat: A/✕ attack (hold), B/○ dodge roll, X/□ ability 1, Y/△ ability 2, RB/R1 ability 3, RT/R2 ability 4, LB/L1 switch target, View/Select quick-slot potion. Menus: D-pad/stick moves the highlight, A selects, B goes back, LB/RB switch class tabs. Start/Options pauses (exit prompt), also mid-fight."],
  ["🗺️ Exploring", "Fog of war lifts as you walk. 📦 chests hold gold and loot, 💰 is a merchant (stock is limited: each piece of gear sells once, potions and scrolls 1–3 each, then the slot shows SOLD OUT; leaving or reloading doesn't restock — the next merchant floor has fresh wares; Epic/Legendary wares are rare early, more common deeper, at most 2 per shop), 🔽 stairs take you down. Bosses guard the stairs on every 5th floor. You do not regenerate health or mana over time; look for potions, abilities, and gear marked ♻ Mana regen."],
  ["⚔️ Combat", "Fights happen right on the dungeon map — no separate arena. Sleeping monsters notice you within a few steps; awake ones that can see you join the fight, so a careless approach can pull a whole room. Enemies chase you around corners but cannot pass walls, and each one only strays so far from where it lives. A red ring growing around a monster is its wind-up: step out (or dodge roll through it) before it fills. Casters throw bolts you can sidestep or hide behind a wall from. Ranged foes keep their distance: 🏹 archers show a red aim line before loosing a fast arrow, 🐸 Acid Spitters mark a green ring where their acid glob will land, and 🧙 Hex Cultists send a slow purple bolt that hexes you (−25% damage for 4 s). Their aim locks when the wind-up starts, so step aside. ★ Elite monsters (gold glow) are tougher and drop better loot. Your attack auto-targets the nearest foe you can see in range (tap an enemy to pick one): Warrior, Rogue and Cleric must get close, Mage and Ranger shoot from afar. Burn, poison, buffs and pets tick every 1.5 s. There is no Flee button: to escape, run — enemies give up after about 4 seconds without line of sight or when you get far enough away. A Smoke Bomb or Shadowmeld breaks off a fight instantly (not against bosses)."],
  ["🔒 Combat lockout", "While any monster is fighting you, the bag, codex, help, full map, save-code screen, title button, merchants and the stairs are locked (greyed out; pressing them shows “In combat”). You can still move, attack, use abilities, dodge, switch targets and drink from the 🧪 quick-slot (your first healing potion, or any combat consumable you mark with ☆ Quick-slot in the bag). The minimap stays visible. The exit prompt (Esc / Start / back) always works: it pauses, and confirming saves your fight and exits. About 1.5 s after the last foe falls or gives up you'll see “Combat over” and everything unlocks."],
  ["☠️ Bosses", "The Broodmother (Floor 5) and the Echo Lord (Floor 10) wake when you step into their lair and fight you right there: acid pools, shadow flame and the Echo Lord's CATACLYSM ring land on the map, and spiderlings or Echo Shades crawl out around the boss. The stairs only appear once the boss is dead. Run too far and the boss returns to its lair and recovers fully — no chipping it down from range."],
  ["🐾 Pets", "Rangers start with a Wolf (plus a Hawk with Pack Leader). Anyone can gain a charm pet from a Wolf Pup Whistle, Spirit Owl Feather, Imp Sigil or Bone Hound Totem (one charm pet at a time). Pets path around walls and hazards, trail behind you and catch up if you pull ahead; if they get stuck they re-path, then poof to your side. In a fight they close along that path: melee pets flank, and the Imp keeps a ranged standoff with line of sight before throwing fire bolts. Enemies attack pets that get closer than you — Bone Hounds draw extra attention. A pet at 0 HP is knocked out 💫 for 12 s, then gets back up at 40%; every knocked-out pet recovers at 50% when the fight ends. Pets do not regenerate health on their own; a Pet Treat fully heals and revives them."],
  ["✨ Starting perk", "Every new run (Story and Endless) opens with a choice of 3 random Common perks. The roll is saved, so reloading won't change it."],
  ["🎲 Boss perks", "In Endless, after each boss you pick one perk from 3 offers. The roll is saved with the run, so reloading won't reroll them. Perks come in five rarities — Common, Uncommon, Rare, Epic and Legendary — and rarer ones are clearly stronger. Odds shift toward rarer tiers as you go deeper; a 10th-floor boss (and every 10 floors after) always offers at least one Epic or Legendary perk. The pool mixes shared perks with class-specific ones for Warrior, Mage, Rogue, Cleric and Ranger. Perks you already have won't be offered again."],
  ["🏦 Echo Vault", "After the boss on every 10th floor you may seal ONE item (from your bag or equipped) in the Echo Vault. It leaves the current run, keeps its random affixes and survives death. Depositing again replaces the stored item (you're asked to confirm). When you start a new run you're offered to bring it along; if you decline it stays vaulted."],
  ["✨ Abilities", "Each class starts with only a basic attack. Class abilities unlock as you level: the first at level 3, then 6, 9 and (if a class has a fourth) 12. Locked buttons show a lock and the required level, and a banner announces “New ability unlocked” when one opens. Warriors learn Shield Bash, a frontal-cone Cleave, Battle Cry, then Smash (a circular shockwave). Clerics learn Heal, Smite, Holy Shield, then the same Smash. Mage, Rogue and Ranger keep their three class abilities. Abilities cost MP and have cooldowns in seconds — each button shows a sweep and the time left. Mana does not regenerate on its own: use mana potions, staff strikes (Mage), being hit (Warrior), or gear marked ♻ Mana regen. Endless-tree and perk abilities (such as Shadowmeld) are separate and stay as they are."],
  ["💎 Items & rarities", "Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (gold). Loot is chance-based: ordinary monsters drop an item about 1 time in 5, elites about half the time, chests about 2 times in 3 and bosses always (gold drops are separate). Healing potions are scarce — make them count. Gear rolls prefixes and suffixes from a pool that grows with item level (iLvl is the floor the item dropped on, plus a small bonus from elites, chests, and bosses). Common items have no affixes; Uncommon (magic) get 1–2 (at most one prefix and one suffix); Rare get 3–4; Epic get 4–5 with a higher tier floor; set pieces get 1–2 on top of their set bonuses; Legendaries (uniques) keep their fixed named stats and do not roll random affixes. Only affixes whose required level is at or below the item's iLvl can appear, and the roll leans toward the highest legal tier. No two affixes share a stat. Mana regen appears only as a rare, capped suffix (or on the dedicated mana-regen items). Hover or long-press an affix to see its name, roll, and range. Some gear is class-only. Set pieces are rarer than other gear of the same rarity, and newer sets appear on deeper floors (chance ramps in over a few floors). General sets: Ironclad, Shadowstalker, Arcanist, Emberforged Battlegear (from floor 4), Duskward Raiment and Bloodmoon Panoply (from floor 8), and Titanbone Plate (from floor 12, Endless). Class sets: Warlord's Panoply and Berserker's Harness (Warrior), Stormcaller's Regalia (Mage), Nightblade's Shroud and Gloamrunner's Kit (Rogue), Lightbringer's Vestiture and Oathkeeper's Sacrament (Cleric), Beastmaster's Garb and Windstrider's Leaguer (Ranger). Later general sets, rarer than the earlier ones: Gravebloom Vestments (from floor 6), Rimeward Pall (from floor 10), and Ashen Covenant (from floor 14, Endless). Each has 2/3/4-piece bonuses and a full-set special, shown on the item and in the bag. The dungeon holds 67 weapons, 42 armor, 37 helmets, 34 rings and 33 amulets, including 73 set pieces across 19 sets, 24 legendaries (uniques), and 11 cursed items."],
  ["🔍 Identification", "Some drops arrive as 'Unidentified ??? ' with no stats shown. Rarer items are hidden more often; cursed and legendary items almost always are. Equip to reveal (risky!), pay a merchant a fee based on true rarity, or read a Scroll of Identify."],
  ["☠️ Curses", "Cursed items give big bonuses with a nasty downside, and lock on once equipped. Free them with a Scroll of Remove Curse or the merchant's curse-lifting service, then unequip."],
  ["💰 Merchant", "Buy potions, scrolls and gear, sell loot, identify items, and lift curses. Merchants appear on even floors."],
  ["📖 Story", "10 floors. The Broodmother mini-boss waits on Floor 5 and the Echo Lord on Floor 10. Beat him to win."],
  ["∞ Endless", "☠️ PERMADEATH: Endless autosaves constantly and your run save is deleted the moment you die (revives like Undying, Divine Resurrection or the Phoenix Amulet trigger first). Tokens, upgrades, best depth and codex are kept. Infinite scaling floors with a boss every 5 floors. After each boss pick an in-run perk (rarity-weighted; 10th-floor bosses guarantee an Epic or better). Your best depth is saved."],
  ["💾 Saving", "Your run autosaves every couple of seconds — even mid-fight, with every enemy's position and HP — and on every floor change; tap Continue on the title screen to resume. Tokens, upgrades, best depth and the codex are saved separately and survive death. Use 💾 Save Code to copy a backup code or paste one in on another device."],
  ["🪙 Tokens", "Every 10 Endless floors cleared earns 1 token, saved between runs. Spend them in Endless Upgrades: each class has a 36-node tree whose top tier holds game-changing capstones. Upgrades apply in Endless only."],
];

// ---- dark-fantasy SVG sprites (viewBox 64x64, scale to any size) ----
const BONE = "#ddd2b2", BONED = "#a3967a", BLOOD = "#7d0a10", BLOODB = "#b3141c", STEEL = "#8b94a3", STEELD = "#4a505c", STEELL = "#c3cad6", BLK = "#0d0a10";
function eye(x: number, y: number, c: string, r?: number): ReactNode {
  const rr = r ?? 1.1;
  return <g><circle cx={x} cy={y} r={rr * 4.2} fill={c} opacity={0.22} /><circle cx={x} cy={y} r={rr * 2.2} fill={c} opacity={0.45} /><circle cx={x} cy={y} r={rr * 0.85} fill={c} /><circle cx={x} cy={y} r={Math.max(0.35, rr * 0.28)} fill="#fff" opacity={0.9} /></g>;
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
  rat: () => (<g>
    {shd(20)}<ellipse cx="32" cy="50" rx="20" ry="5" fill="#1a0c0c" opacity={0.35} />
    <path d="M58 36 Q66 28 62 20 Q58 28 54 32" fill="none" stroke="#3a2a28" strokeWidth="2.2" />
    <path d="M58 36 Q64 30 60 22" fill="none" stroke="#6a2a28" strokeWidth="0.7" />
    <path d="M12 40 Q10 26 28 22 Q48 20 56 34 Q54 48 30 50 Q14 50 12 40 Z" fill="#2a1c1a" />
    <path d="M16 36 Q28 28 46 32 Q50 40 32 44 Q18 44 16 36 Z" fill="#3a2622" />
    <path d="M20 30 L18 22 L24 28 M14 32 L8 24 L16 30" fill="#2a1c1a" />
    <path d="M22 34 L40 34 M24 38 L36 38" stroke="#1a1010" strokeWidth="0.8" />
    <path d="M8 38 Q4 36 6 32 Q10 34 12 38 Z" fill="#4a2a28" />
    {eye(14, 34, "#ff2a1a", 0.9)}
    <path d="M8 40 L4 42 L8 43 L11 41 Z" fill="#d8cfc0" />
    <path d="M10 42 L6 46" stroke={BLOODB} strokeWidth="1.2" />
    {blot(28, 42, 1.1)}
  </g>),
  slime: () => (<g>
    {shd(22)}<ellipse cx="32" cy="58" rx="22" ry="4" fill="#14200c" opacity={0.55} />
    <path d="M10 56 Q6 40 16 28 Q22 16 28 24 Q32 10 38 22 Q48 16 52 30 Q60 38 56 56 Z" fill="#1c2a10" />
    <path d="M14 54 Q14 36 26 30 Q34 22 40 32 Q50 30 50 50 Q40 56 28 54 Z" fill="#2e4418" />
    <path d="M22 48 Q30 40 40 48 Q34 52 28 50 Z" fill="#4a0d10" opacity={0.7} />
    <path d="M26 34 Q28 28 32 34" stroke={BONE} strokeWidth="1.4" fill="none" />
    <ellipse cx="30" cy="32" rx="4" ry="3.2" fill="#1a140c" /><path d="M27 32 L33 32 M30 30 L30 35" stroke={BONED} strokeWidth="0.7" />
    {eye(24, 36, "#b6ff3a", 1.0)}{eye(38, 34, "#b6ff3a", 0.7)}
    <path d="M20 56 Q22 62 24 56 M36 56 Q38 64 40 56 M44 52 Q46 60 48 52" fill="#3e6a18" />
    <circle cx="18" cy="44" r="2.2" fill="#0c1408" /><circle cx="46" cy="42" r="1.6" fill="#0c1408" />
  </g>),
  goblin: () => (<g>
    {shd(14)}{pud(32, 54, 10, 4, "#3a0808", 0.45)}
    <path d="M26 56 L24 36 L30 34 L28 56 Z M34 56 L36 34 L42 36 L40 56 Z" fill="#2a2010" />
    <path d="M24 36 L22 26 L42 26 L40 36 Z" fill="#3a2a14" />
    <path d="M20 28 Q18 16 28 10 Q36 6 44 14 Q48 22 42 28 Q34 32 24 28 Z" fill="#3a4a1c" />
    <path d="M22 20 L16 12 L24 18 M44 16 L52 6 L46 18" fill="#2a3414" />
    <path d="M28 22 Q36 20 42 24" fill="#2a2010" />
    <path d="M24 26 Q32 30 40 26 Q38 34 32 35 Q26 34 24 26 Z" fill="#2a3410" />
    {eye(29, 22, "#ff3a1a", 0.85)}{eye(38, 21, "#ff3a1a", 0.7)}
    <path d="M30 28 L28 32 L32 30 M36 28 L40 33 L38 29" fill={BONE} />
    <path d="M16 32 L6 28 L16 36 Z" fill="#5a5040" /><path d="M6 28 L2 26" stroke="#8a8070" strokeWidth="1.2" />
    {blot(34, 40, 0.9)}
  </g>),
  bat: () => (<g>
    {shd(16)}
    <path d="M32 28 L8 16 Q4 28 14 34 Q8 40 16 46 L28 36 Z" fill="#1a1018" />
    <path d="M32 28 L56 14 Q62 26 50 34 Q58 42 48 48 L36 36 Z" fill="#160e14" />
    <path d="M12 22 L18 30 M14 36 L22 34 M50 20 L44 30 M52 38 L42 36" stroke="#2a1820" strokeWidth="1.1" />
    <path d="M26 26 Q32 18 38 26 L36 40 Q32 46 28 40 Z" fill="#2a1820" />
    <path d="M28 24 L24 16 L30 22 M36 24 L42 14 L38 22" fill="#2a1820" />
    {eye(30, 28, "#ff2a2a", 0.8)}{eye(35, 27, "#ff2a2a", 0.8)}
    <path d="M30 34 L32 38 L34 34 Q32 36 30 34 Z" fill="#4a0a0c" />
    <path d="M29 35 L30 39 M35 35 L34 39" fill={BONE} stroke={BONE} strokeWidth="0.7" />
  </g>),
  skel: () => (<g>
    {shd(13)}
    <path d="M22 56 L26 40 M38 40 L42 56" stroke={BONED} strokeWidth="3.1" strokeLinecap="round" />
    <path d="M26 40 L38 40 L36 52 L28 52 Z" fill="#cfc3a0" />
    <path d="M28 44 L36 44 M29 48 L35 48" stroke="#5a5040" strokeWidth="0.9" />
    <path d="M20 38 L26 40 M38 40 L48 34" stroke={BONE} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M48 34 L58 30 L52 28 Z" fill="#4a3a30" /><path d="M58 30 L62 22" stroke={STEELD} strokeWidth="1.4" />
    <ellipse cx="32" cy="24" rx="9" ry="8" fill="#e6d8b0" />
    <path d="M26 22 Q32 20 38 22" stroke="#8a7a60" strokeWidth="0.8" fill="none" />
    <ellipse cx="29" cy="23" rx="2.4" ry="3" fill={BLK} /><ellipse cx="36" cy="23" rx="2.1" ry="2.6" fill={BLK} />
    {eye(29.2, 23.2, "#7cff6a", 0.7)}
    <path d="M28 28 L30 30 L32 28 L34 31 L36 28" fill="none" stroke={BLK} strokeWidth="0.8" />
    <path d="M24 20 L22 14 M40 20 L44 12" stroke={BONE} strokeWidth="1.3" />
    {blot(40, 36, 1.0)}
  </g>),
  spider: () => (<g>
    {shd(22)}
    <g fill="none" stroke="#1c1014" strokeWidth="2.3" strokeLinecap="round">
      <path d="M28 32 Q10 16 8 8" /><path d="M26 36 Q6 30 2 22" /><path d="M26 42 Q8 46 4 54" /><path d="M30 46 Q20 56 16 62" />
      <path d="M36 32 Q54 14 58 6" /><path d="M38 36 Q58 28 62 18" /><path d="M38 42 Q56 48 60 56" /><path d="M34 46 Q46 58 50 62" />
    </g>
    <ellipse cx="32" cy="38" rx="13" ry="10" fill="#1a0e12" />
    <ellipse cx="32" cy="37" rx="9" ry="7" fill="#2a1218" />
    <path d="M24 34 Q32 30 40 34" stroke="#4a1a22" strokeWidth="1" fill="none" />
    <g>{eye(27, 34, "#ff2a2a", 0.55)}{eye(31, 32, "#ff2a2a", 0.5)}{eye(35, 32, "#ff2a2a", 0.5)}{eye(39, 34, "#ff2a2a", 0.55)}
    {eye(29, 36, "#ff2a2a", 0.4)}{eye(35, 36, "#ff2a2a", 0.4)}</g>
    <path d="M26 42 L22 48 M38 42 L42 48" stroke="#c8b89a" strokeWidth="1.4" />
    <path d="M22 48 L20 52 M42 48 L44 53" stroke="#6aff3a" strokeWidth="1.1" opacity={0.8} />
  </g>),
  kobold: () => (<g>
    {shd(13)}
    <path d="M28 56 L26 38 L32 36 L30 56 Z M34 56 L36 36 L42 38 L40 56 Z" fill="#3a2a18" />
    <path d="M24 38 Q32 30 42 38 L40 48 Q32 52 26 48 Z" fill="#4a3820" />
    <path d="M24 30 Q20 16 32 12 Q46 14 44 28 Q38 34 28 32 Z" fill="#5a4a28" />
    <path d="M22 18 L16 8 L26 16 M40 14 L48 4 L44 16" fill="#3a2e18" />
    <path d="M26 26 Q34 28 40 24" fill="#2a2010" />
    {eye(30, 22, "#ffcc4d", 0.75)}{eye(38, 21, "#ffcc4d", 0.7)}
    <path d="M32 26 L30 30 L34 28 Z" fill="#1a1008" />
    <path d="M44 32 L50 18" stroke="#6a5a40" strokeWidth="2" /><circle cx="50" cy="16" r="3.2" fill="#6aff3a" opacity={0.45} /><circle cx="50" cy="16" r="1.4" fill="#d8ff9a" />
    <path d="M20 34 L14 38 L20 40 Z" fill="#4a3820" />
  </g>),
  orc: () => (<g>
    {shd(18)}
    <path d="M22 58 L18 36 L28 34 L26 58 Z M36 58 L38 34 L48 36 L44 58 Z" fill="#2a1e12" />
    <path d="M16 36 Q32 26 50 36 L48 50 Q32 56 18 50 Z" fill="#3a4a22" />
    <path d="M20 28 Q18 10 30 6 Q44 4 50 16 Q52 28 42 32 Q30 36 20 28 Z" fill="#4a5a28" />
    <path d="M18 16 L8 8 L22 18 M48 12 L58 2 L50 16" fill="#2a3414" />
    <path d="M22 18 Q28 14 36 16" stroke="#2a3410" strokeWidth="1.2" fill="none" />
    {eye(28, 18, "#ff3a1a", 0.9)}{eye(40, 16, "#ff3a1a", 0.75)}
    <path d="M26 26 L22 34 L28 30 M38 24 L46 34 L40 28" fill={BONE} />
    <path d="M28 26 Q34 30 42 24" fill="#2a1a10" />
    <path d="M50 32 L60 20 L58 40 Z" fill="#4a3a30" /><path d="M58 20 L63 12" stroke="#8a8070" strokeWidth="1.6" />
    {blot(24, 42, 1.3)}
  </g>),
  wraith: () => (<g>
    <ellipse cx="32" cy="44" rx="20" ry="16" fill="#0c2a28" opacity={0.28} />
    <path d="M20 58 Q16 36 28 24 Q32 8 36 22 Q50 30 46 58 Q36 64 20 58 Z" fill="#0e1c1c" opacity={0.92} />
    <path d="M24 54 Q28 36 32 28 Q38 36 42 54" fill="#143230" opacity={0.8} />
    <path d="M26 30 Q32 22 40 30 L38 40 Q32 36 26 40 Z" fill="#0a1212" />
    <path d="M28 34 L36 34 M30 38 L34 38" stroke="#7cf0ff" strokeWidth="0.6" opacity={0.4} />
    {eye(29, 28, "#7cf0ff", 0.7)}{eye(36, 27, "#7cf0ff", 0.65)}
    <path d="M22 48 Q18 60 14 64 M42 50 Q50 62 56 66 M32 52 Q32 62 30 66" stroke="#7cf0ff" strokeWidth="1" opacity={0.35} fill="none" />
  </g>),
  shade: () => (<g>
    <ellipse cx="32" cy="40" rx="18" ry="20" fill="#1a0a2a" opacity={0.4} />
    <path d="M18 58 Q14 30 30 16 Q40 6 44 22 Q54 30 48 58 Q34 66 18 58 Z" fill="#0a0614" />
    <path d="M26 28 Q34 10 42 26 Q36 22 32 24 Z" fill="#14081e" />
    {eye(30, 26, "#d06bff", 0.65)}{eye(37, 24, "#d06bff", 0.85)}
    <path d="M20 44 Q28 36 34 44 Q30 50 24 48 Z" fill="#2a1050" opacity={0.6} />
    <path d="M16 50 Q8 62 4 66 M48 48 Q58 62 62 68" stroke="#b84aff" strokeWidth="1" opacity={0.35} fill="none" />
  </g>),
  elf: () => (<g>
    {shd(13)}
    <path d="M28 56 L26 36 L32 34 L30 56 Z M34 56 L36 34 L42 36 L40 56 Z" fill="#1a1420" />
    <path d="M24 36 Q32 28 42 36 L40 48 Q32 52 26 48 Z" fill="#2a1a28" />
    <path d="M24 28 Q20 10 32 8 Q46 8 44 26 Q38 32 28 30 Z" fill="#3a2a38" />
    <path d="M22 16 L12 2 L26 18 M44 14 L56 0 L46 18" fill="#2a1a28" />
    <ellipse cx="32" cy="20" rx="6" ry="7" fill="#1a1014" />
    {eye(29.5, 20, "#d06bff", 0.7)}{eye(35, 19, "#d06bff", 0.7)}
    <path d="M30 25 L32 28 L34 25" fill="#4a0a10" />
    <path d="M44 32 L54 26" stroke="#2a1a28" strokeWidth="2.2" /><path d="M54 26 L60 18 L56 28 Z" fill={STEELD} />
    <path d="M22 40 L18 38 L22 44 Z" fill="#4a1a22" />
  </g>),
  golem: () => (<g>
    {shd(20)}
    <path d="M16 56 L14 32 L28 28 L26 56 Z M36 56 L38 28 L52 32 L50 56 Z" fill="#2a2620" />
    <path d="M14 32 Q32 16 52 32 L50 46 Q32 54 16 46 Z" fill="#3a3630" />
    <path d="M22 24 Q32 8 44 22 L42 32 Q32 28 24 32 Z" fill="#2e2a26" />
    <path d="M20 28 L36 20 M28 36 L46 30 M18 42 L40 40" stroke="#1a1610" strokeWidth="1.3" />
    <path d="M24 30 L38 26 M26 38 L40 36" stroke="#ff6a1a" strokeWidth="1.1" opacity={0.75} />
    {eye(28, 20, "#ff6a1a", 0.8)}{eye(38, 19, "#ff6a1a", 0.7)}
    <rect x="10" y="30" width="8" height="14" rx="1" fill="#4a4640" /><rect x="48" y="30" width="8" height="14" rx="1" fill="#4a4640" />
  </g>),
  necro: () => (<g>
    {shd(15)}
    <path d="M22 58 L24 34 L40 34 L42 58 Z" fill="#1a1020" />
    <path d="M20 36 Q32 20 44 36 L42 50 Q32 56 22 50 Z" fill="#24162e" />
    <path d="M18 30 Q32 0 46 30 Q38 22 32 22 Q26 22 18 30 Z" fill="#0e0a14" />
    <ellipse cx="32" cy="26" rx="6" ry="6" fill="#0a060c" />
    <path d="M28 24 L30 28 L32 24 L34 29 L36 24" stroke={BONE} strokeWidth="0.8" fill="none" />
    {eye(30, 25, "#6aff3a", 0.7)}{eye(35, 25, "#6aff3a", 0.7)}
    <path d="M44 38 L56 22" stroke="#3a2a1a" strokeWidth="2" /><path d="M54 18 L60 8 L58 22 Z" fill="#6aff3a" opacity={0.45} />
    <circle cx="16" cy="40" r="3" fill="#6aff3a" opacity={0.3} /><path d="M16 44 L16 54" stroke="#6aff3a" strokeWidth="0.8" opacity={0.5} />
  </g>),
  basil: () => (<g>
    {shd(22)}
    <path d="M8 50 Q6 40 16 36 Q10 30 22 28 Q18 20 32 22 Q28 14 40 18 Q48 16 52 24 Q60 28 56 40 Q62 46 50 52 Q32 58 8 50 Z" fill="#1a2a12" />
    <path d="M16 44 Q24 32 38 30 Q48 28 52 38 Q46 46 32 48 Q20 50 16 44 Z" fill="#2a4418" />
    <path d="M40 22 L46 10 L44 22 M48 20 L56 8 L50 22 M36 20 L34 8 L40 20" fill="#1a2a10" />
    <path d="M48 32 Q56 28 58 34 Q52 38 48 36 Z" fill="#4a0a10" />
    {eye(42, 28, "#e8ff3a", 0.9)}{eye(50, 30, "#e8ff3a", 0.6)}
    <path d="M50 36 L58 40 L52 38" fill={BONE} />
    <path d="M58 40 L62 44" stroke="#6aff3a" strokeWidth="1.2" />
    {blot(28, 44, 1.0, "#4a6a10")}
  </g>),
  demon: () => (<g>
    {shd(18)}<ellipse cx="32" cy="48" rx="18" ry="8" fill="#2a0800" opacity={0.4} />
    <path d="M24 58 L20 36 L30 32 L28 58 Z M36 58 L38 32 L48 36 L44 58 Z" fill="#1a0a08" />
    <path d="M16 36 Q32 22 50 36 L48 50 Q32 58 18 50 Z" fill="#4a140c" />
    <path d="M18 20 L8 0 L24 18 M46 18 L58 0 L44 18" fill="#2a0a08" />
    <path d="M20 24 Q32 8 46 22 Q40 30 32 30 Q24 30 20 24 Z" fill="#3a0e0a" />
    <ellipse cx="32" cy="22" rx="8" ry="7" fill="#1a0606" />
    {eye(28, 21, "#ff3a1a", 0.95)}{eye(36, 20, "#ff3a1a", 0.85)}
    <path d="M26 26 L24 34 L30 30 M38 26 L44 34 L38 29" fill={BONE} />
    <path d="M28 28 Q32 34 38 28" fill="#4a0a0c" />
    <path d="M14 32 L4 28 L16 38 Z M50 32 L62 26 L50 40 Z" fill="#5a1a10" />
    <path d="M22 40 L40 40" stroke="#ff6a1a" strokeWidth="0.8" opacity={0.6} />
  </g>),
  lich: () => (<g>
    {shd(16)}
    <path d="M26 58 L28 38 L36 38 L38 58 Z" fill="#2a2430" />
    <path d="M24 40 L40 40 L38 50 L26 50 Z" fill="#cfc3a0" />
    <path d="M28 43 L36 43 M28 47 L36 47" stroke="#5a5040" strokeWidth="0.8" />
    <path d="M20 22 L16 6 L24 16 M44 22 L50 4 L42 16 M32 12 L32 2" stroke={BONE} strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="32" cy="22" rx="9" ry="8" fill="#e8dcc0" />
    <ellipse cx="29" cy="21" rx="2.3" ry="3" fill={BLK} /><ellipse cx="36" cy="21" rx="2.3" ry="3" fill={BLK} />
    {eye(29, 21, "#d06bff", 0.75)}{eye(36, 21, "#d06bff", 0.75)}
    <path d="M28 26 L30 29 L32 26 L34 29 L36 26" stroke={BLK} strokeWidth="0.8" fill="none" />
    <path d="M42 36 L54 16" stroke="#3a2a4a" strokeWidth="2" /><circle cx="55" cy="14" r="5" fill="#d06bff" opacity={0.35} /><circle cx="55" cy="14" r="2" fill="#f0d0ff" />
  </g>),
  wyvern: () => (<g>
    {shd(20)}
    <path d="M32 36 L8 18 Q2 28 16 34 L6 44 Q16 42 28 40 Z" fill="#1a1410" />
    <path d="M40 32 Q58 16 62 8 Q64 22 52 32 Q62 36 56 46 L42 38 Z" fill="#16120e" />
    <path d="M24 36 Q36 22 50 32 Q54 42 42 50 Q28 54 22 46 Z" fill="#2a2218" />
    <path d="M46 30 Q58 28 60 36 Q54 38 48 36 Z" fill="#3a2a1c" />
    <path d="M52 28 L60 22 L54 30" fill="#1a140e" />
    {eye(50, 30, "#ff3a1a", 0.85)}
    <path d="M54 34 L62 36 L56 37" fill={BONE} />
    <path d="M20 48 Q12 60 8 64 M16 50 Q16 62 12 66" stroke="#2a2218" strokeWidth="2.2" fill="none" />
    <path d="M8 64 L4 68 M12 66 L10 70" stroke="#6a2a20" strokeWidth="1.2" />
  </g>),
  brood: () => (<g>
    {shd(26)}<ellipse cx="32" cy="50" rx="26" ry="8" fill="#0c1408" opacity={0.5} />
    <g fill="none" stroke="#140c10" strokeWidth="2.8" strokeLinecap="round">
      <path d="M20 36 Q6 18 4 8" /><path d="M16 42 Q0 36 0 24" /><path d="M16 50 Q2 56 0 64" />
      <path d="M44 36 Q58 16 62 6" /><path d="M48 42 Q64 34 64 22" /><path d="M48 50 Q62 58 64 66" />
    </g>
    <ellipse cx="32" cy="42" rx="20" ry="16" fill="#1a0e14" />
    <ellipse cx="32" cy="46" rx="16" ry="12" fill="#2a1420" />
    <path d="M20 46 Q32 38 44 46 Q40 54 32 56 Q24 54 20 46 Z" fill="#3a1a14" />
    <circle cx="24" cy="48" r="3.2" fill="#4a2010" /><circle cx="32" cy="50" r="3.6" fill="#4a2010" /><circle cx="40" cy="48" r="3" fill="#4a2010" />
    <path d="M22 28 Q32 16 44 28 Q38 24 32 24 Z" fill="#140810" />
    {eye(24, 30, "#ff1a1a", 0.7)}{eye(30, 26, "#ff1a1a", 0.6)}{eye(36, 26, "#ff1a1a", 0.6)}{eye(42, 30, "#ff1a1a", 0.7)}
    {eye(28, 32, "#ff1a1a", 0.45)}{eye(38, 32, "#ff1a1a", 0.45)}
    <path d="M26 36 L20 44 M38 36 L44 44" stroke="#c8b89a" strokeWidth="1.6" />
    <path d="M20 44 L16 50 M44 44 L48 51" stroke="#6aff3a" strokeWidth="1.1" opacity={0.75} />
  </g>),
  lord: () => (<g>
    <ellipse cx="32" cy="48" rx="26" ry="14" fill="#1a0a2a" opacity={0.5} />
    <path d="M16 60 L18 32 L46 32 L48 60 Q32 66 16 60 Z" fill="#14081c" />
    <path d="M20 36 Q32 20 44 36 L42 56 Q32 60 22 56 Z" fill="#1e0e28" />
    <path d="M18 22 L8 0 L22 20 M46 22 L56 0 L44 20 M32 16 L32 2 M24 16 L20 4 M40 16 L44 4" stroke="#cfc3a0" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20 28 Q32 8 44 28 Q38 22 32 22 Z" fill="#0a0610" />
    <ellipse cx="32" cy="24" rx="8" ry="8" fill="#07040c" />
    {eye(28.5, 24, "#f0e8ff", 0.85)}{eye(36, 24, "#f0e8ff", 0.85)}
    <path d="M26 30 Q32 36 38 30" fill="#1a0a20" />
    <path d="M12 40 L4 36 L14 48 Z M52 40 L62 34 L50 50 Z" fill="#1a0e24" />
    <path d="M24 44 L40 44" stroke="#d06bff" strokeWidth="0.8" opacity={0.5} />
    <circle cx="32" cy="40" r="10" fill="#7a2aff" opacity={0.12} />
  </g>),
  garcher: () => (<g>{SPR.goblin()}
    <path d="M6 16 Q-4 32 6 50" stroke="#3a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M6 16 L6 50" stroke={BONED} strokeWidth="0.8" />
    <path d="M6 32 L22 32" stroke="#cfc3a0" strokeWidth="1.1" />
    <path d="M20 30 L26 32 L20 34 Z" fill="#4a3a28" />
  </g>),
  sarcher: () => (<g>{SPR.skel()}
    <path d="M6 14 Q-4 32 6 52" stroke="#3a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M6 14 L6 52" stroke={BONE} strokeWidth="0.8" />
    <path d="M6 32 L20 32" stroke={BONE} strokeWidth="1.1" />
  </g>),
  spitter: () => (<g>
    {shd(18)}
    <path d="M12 52 Q6 36 18 26 Q32 14 48 26 Q58 36 52 52 Q32 60 12 52 Z" fill="#1a2a10" />
    <path d="M16 50 Q18 34 32 28 Q46 34 48 50 Q32 56 16 50 Z" fill="#2a4414" />
    <path d="M20 36 L12 20 L24 34 M44 36 L54 18 L42 34" fill="#1a2a0c" />
    <path d="M22 32 Q32 26 42 32 Q36 40 32 40 Q26 40 22 32 Z" fill="#0e1608" />
    {eye(26, 34, "#b6ff3a", 0.9)}{eye(38, 34, "#b6ff3a", 0.9)}
    <path d="M28 42 Q32 48 36 42" fill="#4a0a10" />
    <circle cx="32" cy="48" r="3" fill="#8aff3a" opacity={0.7} />
    <path d="M32 50 Q30 58 28 60 M34 50 Q38 58 40 62" stroke="#8aff3a" strokeWidth="1.2" fill="none" opacity={0.8} />
  </g>),
  hexer: () => (<g>
    {shd(14)}
    <path d="M24 58 L26 32 L38 32 L40 58 Z" fill="#160c22" />
    <path d="M20 34 Q32 16 44 34 L42 50 Q32 56 22 50 Z" fill="#1e102c" />
    <path d="M18 28 Q32 2 46 28 Q38 20 32 20 Z" fill="#0c0814" />
    <ellipse cx="32" cy="24" rx="6" ry="6" fill="#07040c" />
    {eye(29.5, 24, "#d06bff", 0.7)}{eye(35, 23, "#d06bff", 0.85)}
    <path d="M30 28 Q32 32 35 28" fill="#2a1040" />
    <path d="M44 36 L56 22" stroke="#2a1638" strokeWidth="2.2" />
    <circle cx="57" cy="20" r="6" fill="#c04cff" opacity={0.28} /><circle cx="57" cy="20" r="2.2" fill="#f0d0ff" />
    <path d="M28 40 L36 40 M32 36 L32 46" stroke="#c04cff" strokeWidth="0.9" opacity={0.7} />
  </g>),
  pimp: () => (<g>{shd(11)}
    <path d="M22 50 Q20 34 32 32 Q44 34 42 50 Z" fill="#a8241a" /><circle cx="32" cy="26" r="9" fill="#c8301f" />
    <path d="M24 20 L20 10 L28 18 Z M40 20 L44 10 L36 18 Z" fill="#4a1008" />{eye(28.5, 26, "#ffe03a", 1.2)}{eye(35.5, 26, "#ffe03a", 1.2)}<path d="M28 31 Q32 33 36 31" stroke="#3a0804" strokeWidth="1" fill="none" />
    <path d="M18 36 Q8 30 12 22 Q16 30 22 32 Z M46 36 Q56 30 52 22 Q48 30 42 32 Z" fill="#6a140c" />
    <path d="M42 48 Q52 52 50 44" stroke="#a8241a" strokeWidth="2" fill="none" /><circle cx="46" cy="38" r="4" fill="#ff9a3a" opacity={0.7} /><circle cx="46" cy="38" r="2" fill="#fff0a0" /></g>),
  powl: () => (<g>{shd(12)}
    <ellipse cx="32" cy="38" rx="12" ry="15" fill="#bfe8ff" opacity={0.85} /><ellipse cx="32" cy="42" rx="7" ry="9" fill="#eaf8ff" />
    <path d="M20 32 Q10 38 14 50 Q20 44 22 40 Z M44 32 Q54 38 50 50 Q44 44 42 40 Z" fill="#8fc8f0" />
    <path d="M22 24 L24 18 L28 23 Z M42 24 L40 18 L36 23 Z" fill="#8fc8f0" /><circle cx="27" cy="29" r="4.2" fill="#fff" /><circle cx="37" cy="29" r="4.2" fill="#fff" />
    <circle cx="27" cy="29" r="2.2" fill="#1a3a6a" /><circle cx="37" cy="29" r="2.2" fill="#1a3a6a" /><path d="M31 32 L32 35 L33 32 Z" fill="#e0b03a" />
    <circle cx="32" cy="36" r="18" fill="#9fd8ff" opacity={0.12} /></g>),
  phound: () => (<g>{shd(20)}
    <path d="M14 30 Q20 22 34 24 Q46 22 52 28 Q58 26 62 20 Q60 30 54 34 L54 48 L50 48 L49 38 Q40 40 30 39 L28 48 L24 48 L23 38 Q18 36 14 30 Z" fill={BONE} />
    <path d="M24 28 Q32 26 46 28 M26 32 Q34 30 46 32" stroke={BONED} strokeWidth="1.4" fill="none" />
    <path d="M4 30 L10 25 L14 18 L16 24 L22 22 Q24 32 18 36 L8 35 Z" fill="#e6dcc0" /><path d="M14 18 L16 11 L18 22 Z" fill={BONED} />
    {eye(13, 27, "#7cf0ff", 1.1)}<path d="M4 31 L9 33 L8 35 L4 33 Z" fill={BLK} /><circle cx="13" cy="27" r="4" fill="#7cf0ff" opacity={0.18} /></g>),
  stairs: () => (<g><rect x="6" y="6" width="52" height="52" rx="4" fill="#0a0806" /><rect x="9" y="10" width="46" height="9" fill="#5a5048" /><rect x="13" y="21" width="38" height="9" fill="#463e38" /><rect x="17" y="32" width="30" height="9" fill="#322c28" /><rect x="21" y="43" width="22" height="9" fill="#201c1a" /><circle cx="32" cy="50" r="10" fill="#b84aff" opacity={0.22} /></g>),
  chest: () => (<g>{shd(22)}<rect x="10" y="26" width="44" height="28" rx="2" fill="#4a2e18" stroke="#2a1a0c" strokeWidth="1.5" /><path d="M10 26 Q32 10 54 26 Z" fill="#5a3a1e" stroke="#2a1a0c" strokeWidth="1.5" /><rect x="10" y="30" width="44" height="3" fill="#6a6e78" /><rect x="18" y="19" width="3" height="35" fill="#6a6e78" /><rect x="43" y="19" width="3" height="35" fill="#6a6e78" /><rect x="29" y="30" width="6" height="8" rx="1" fill="#c9a23a" />{blot(40, 42, 2)}</g>),
  merchant: () => (<g><ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,.45)" /><ellipse cx="16" cy="55" rx="9" ry="3.2" fill="#8a6010" /><ellipse cx="16" cy="52.5" rx="7" ry="2.6" fill="#e0b03a" stroke="#8a6010" strokeWidth="0.8" /><ellipse cx="19" cy="49.5" rx="5" ry="2" fill="#f0c84a" stroke="#8a6010" strokeWidth="0.8" /><path d="M20 57 L24 30 Q32 22 40 30 L44 57 Z" fill="#3a2a4a" stroke="#1a1020" strokeWidth="1.2" /><path d="M24 40 L40 40 L41 46 L23 46 Z" fill="#6a4a2a" /><circle cx="32" cy="43" r="1.6" fill="#e0b03a" /><path d="M22 31 Q32 8 42 31 Q37 27 32 27 Q27 27 22 31 Z" fill="#4a3460" stroke="#1a1020" strokeWidth="1.2" /><ellipse cx="32" cy="29" rx="6.5" ry="5" fill="#120a16" /><circle cx="29.6" cy="29" r="1.1" fill="#ffd77a" /><circle cx="34.4" cy="29" r="1.1" fill="#ffd77a" /><path d="M41 38 L49 36" stroke="#2a1a10" strokeWidth="2" strokeLinecap="round" /><line x1="49" y1="36" x2="49" y2="40" stroke="#2a1a10" strokeWidth="1" /><circle cx="49" cy="45" r="7" fill="rgba(255,190,90,.35)" /><rect x="46" y="40" width="6" height="8" rx="1.5" fill="#ffd77a" stroke="#6a4a10" strokeWidth="1" /><rect x="47.5" y="41.5" width="3" height="5" rx="1" fill="#fff4c0" /></g>),
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
  gen: () => (<g>{shd(16)}<path d="M20 56 L22 30 Q32 8 44 30 L46 56 Q32 62 20 56 Z" fill="#1a1420" /><path d="M24 32 Q32 16 42 32 L40 50 Q32 54 26 50 Z" fill="#2a2030" /><ellipse cx="32" cy="24" rx="7" ry="8" fill="#0c0a10" />{eye(29, 23, "#ff2a2a", 0.8)}{eye(36, 23, "#ff2a2a", 0.8)}<path d="M28 30 Q32 36 36 30" fill="#3a0a10" />{blot(30, 40, 1.2)}</g>),
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
function estIlvl(i: Inv): number {
  const it = IT[i.id];
  if (typeof i.ilvl === "number" && isFinite(i.ilvl) && i.ilvl >= 1) return Math.floor(i.ilvl);
  const byTier = ((it?.minF ?? 1) * 2) - 1;
  const byRar = [1, 3, 6, 10, 14][it?.r ?? 0] ?? 1;
  return Math.max(1, byTier, byRar);
}
function normAff(a: unknown): RolledAff | null {
  if (!isObj(a)) return null;
  const id = typeof a.id === "string" ? a.id : "";
  const stat = a.stat;
  const okStat = stat === "mpreg" || (typeof stat === "string" && stat in STAT_LABEL);
  if (!id || !okStat) return null;
  const v = Number(a.v), lo = Number(a.lo), hi = Number(a.hi), tier = Number(a.tier);
  if (![v, lo, hi, tier].every((n: number) => isFinite(n))) return null;
  return { id, pre: a.pre === true, tier: Math.max(1, Math.floor(tier)), stat: stat as RolledAff["stat"], v, name: typeof a.name === "string" ? a.name : id, lo, hi };
}
function normInv(i: Inv): Inv {
  const affs = Array.isArray(i.affs) ? (i.affs as unknown[]).map(normAff).filter((a: RolledAff | null): a is RolledAff => !!a) : undefined;
  const mpreg = typeof i.mpreg === "number" && isFinite(i.mpreg) ? i.mpreg : (affs ? affs.reduce((s: number, a: RolledAff) => s + (a.stat === "mpreg" ? a.v : 0), 0) : 0);
  return {
    uid: i.uid, id: i.id, ident: i.ident !== false, bon: isObj(i.bon) ? (i.bon as Stats) : {}, freed: i.freed === true,
    ilvl: estIlvl(i), affs: affs && affs.length ? affs : undefined, aname: typeof i.aname === "string" && i.aname ? i.aname : undefined,
    mpreg: mpreg || undefined,
  };
}
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
  { // keep stock aligned with the shop list; old saves (no stock) get the default limited stock
    const rawShop: unknown[] = Array.isArray(g.shop) ? g.shop : [], rawStock: unknown[] = Array.isArray(g.stock) ? g.stock : [];
    const shop: Inv[] = [], stock: number[] = [];
    const prem: string[] = [];
    rawShop.forEach((i: unknown, k: number) => { if (!okInv(i)) return; const inv = normInv(i as Inv); const v = rawStock[k];
      if (IT[inv.id].r >= 3) { if (prem.length >= SHOP_PREMIUM_MAX || prem.includes(inv.id)) return; prem.push(inv.id); } shop.push(inv); stock.push(typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(stockOf(inv), Math.floor(v))) : stockOf(inv)); });
    g.shop = shop; g.stock = stock;
  }
  g.log = Array.isArray(g.log) ? g.log.filter((l: LogL) => isObj(l) && typeof l.t === "string").slice(0, 60) : [];
  g.perks = Array.isArray(g.perks) ? g.perks.filter((p: unknown): p is string => typeof p === "string") : [];
  g.bonus = isObj(g.bonus) ? g.bonus : {};
  g.cds = isObj(g.cds) ? g.cds : {};
  g.buffs = isObj(g.buffs) ? { ...freshBuffs(), ...g.buffs } : freshBuffs();
  g.offers = Array.isArray(g.offers) ? g.offers.map((p: Perk) => {
    if (!isObj(p) || typeof p.id !== "string") return null;
    return PERK_BY_ID[p.id] ?? (typeof p.name === "string" && typeof p.desc === "string" ? p : null);
  }).filter((p: Perk | null): p is Perk => !!p) : [];
  g.goldMult = num(g.goldMult) ? g.goldMult : 1;
  g.kills = num(g.kills) ? g.kills : 0; g.turns = num(g.turns) ? g.turns : 0; g.tokensEarned = num(g.tokensEarned) ? g.tokensEarned : 0;
  g.usedUndying = g.usedUndying === true; g.usedShadow = g.usedShadow === true; g.usedPhoenix = g.usedPhoenix === true; g.usedRes = g.usedRes === true;
  if (typeof g.hp !== "number" || !(g.hp > 0)) return null;
  g.biome = g.biome === "warren" || g.biome === "crypt" ? g.biome : biomeOf(g.floor); g.bannerTs = 0;
  g.fx = []; g.inAb = false; g.sel = num(g.sel) ? g.sel : -1; g.prev = (["map", "inventory", "shop"] as Screen[]).includes(g.prev) ? g.prev : "map"; g.hurtTs = 0;
  g.stains = Array.isArray(g.stains) ? g.stains.filter((v: unknown): v is number => typeof v === "number" && isFinite(v)) : [];
  g.rem = Array.isArray(g.rem) ? g.rem.filter((v: unknown): v is string => typeof v === "string" && /^\d+:[a-z]+$/.test(v)) : [];
  for (const n of g.stains) if (!g.rem.some((r: string) => r.startsWith(`${n}:`))) g.rem.push(`${n}:gen`);
  g.stains = [];
  if (typeof g.qs !== "string" || !IT[g.qs]) delete g.qs;
  if (typeof g.cpet !== "string" || !PETS[g.cpet]) delete g.cpet;
  g.pets = Array.isArray(g.pets) ? g.pets.filter((p: Pet) => isObj(p) && !!PETS[p.k] && [p.hp, p.max, p.x, p.y].every(num)).map((p: Pet) => ({ k: p.k, hp: Math.max(0, p.hp), max: p.max, x: p.x, y: p.y, ko: num(p.ko) ? Math.max(0, p.ko) : 0, cd: 0.6 })) : [];
  for (const p of g.pets) if (solidT(g, Math.floor(p.x), Math.floor(p.y)) || Math.hypot(p.x - (g.wx ?? 0), p.y - (g.wy ?? 0)) > 8) { p.x = g.wx ?? g.px + 0.5; p.y = g.wy ?? g.py + 0.5; }
  syncPets(g);
  g.startPick = g.startPick === true && g.offers.length > 0; g.vaultOffer = g.vaultOffer === true && !!vaultGet();
  g.vaultThen = g.vaultThen === "victory" || g.vaultThen === "upgrade" || g.vaultThen === "map" ? g.vaultThen : undefined; g.vaultSel = undefined;
  if (g.screen === "vault" && !g.vaultThen) g.vaultThen = "map";
  const okScreens: Screen[] = ["map", "inventory", "shop", "upgrade", "codex", "help", "vault"];
  if (g.screen === "dead" || g.screen === "victory") return null;
  if (!okScreens.includes(g.screen)) g.screen = "map";
  if (g.screen === "upgrade" && g.offers.length === 0 && !g.vaultOffer) g.screen = "map";
  // in-world combat: positions/HP of engaged enemies are restored; old arena saves drop the encounter (the monster is still on the map)
  if ((g.screen as string) === "combat") g.screen = "map";
  const c = g.combat;
  if (isObj(c) && c.v2 === true && Array.isArray(c.enemies)) {
    c.enemies = c.enemies.filter((e: Enemy) => isObj(e) && !e.dead && num(e.hp) && e.hp > 0 && num(e.max) && num(e.x) && num(e.y) && num(e.atk) && !solidT(g, Math.floor(e.x ?? -1), Math.floor(e.y ?? -1)));
    for (const e of c.enemies) { e.wind = 0; e.wk = ""; e.atkT = Math.max(num(e.atkT) ? (e.atkT ?? 0) : 0, 1); e.stun = num(e.stun) ? e.stun : 0; e.lost = 0; e.rt = true; if (!num(e.hx) || !num(e.hy)) { e.hx = e.x; e.hy = e.y; } }
    if (c.enemies.length === 0) g.combat = null;
    else {
      c.itemOpen = false; c.charging = false; c.calm = 0; c.proj = []; c.tele = []; c.shots = []; c.dashT = 0; c.iT = 1; c.atkCd = 0; c.dashCd = 0;
      if (!num(c.target) || c.target < 0 || c.target >= c.enemies.length) c.target = 0;
      if (!num(c.turn)) c.turn = 0; if (!num(c.elapsed)) c.elapsed = (c.turn || 0) * 1.5; if (!num(c.phase)) c.phase = 1; if (!num(c.tick)) c.tick = 0; if (!num(c.bossT)) c.bossT = 3;
      c.boss = c.enemies.some((e: Enemy) => e.boss) || c.boss === true;
      if (g.screen === "inventory" || g.screen === "codex" || g.screen === "help" || g.screen === "shop") g.screen = "map";
    }
  } else g.combat = null;
  if (g.prev !== "map" && g.prev !== "inventory" && g.prev !== "shop") g.prev = "map";
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
  const [tick, setTick] = useState<number>(0);
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
  const joyRef = useRef<{ id: number; ox: number; oy: number; t: number; el: HTMLElement | null }>({ id: -1, ox: 0, oy: 0, t: 0, el: null });
  const livePtr = useRef<Set<number>>(new Set<number>());
  const joyBase = useRef<HTMLDivElement | null>(null);
  const joyKnob = useRef<HTMLDivElement | null>(null);
  const mapCv = useRef<HTMLCanvasElement | null>(null);
  const worldEl = useRef<HTMLDivElement | null>(null);
  const miniCv = useRef<HTMLCanvasElement | null>(null);
  const bigCv = useRef<HTMLCanvasElement | null>(null);
  const detRef = useRef<HTMLDivElement | null>(null);
  const miniT = useRef<number>(0);
  const drawRef = useRef<(force: boolean) => void>(() => undefined);
  const [bigMap, setBigMap] = useState<boolean>(false);
  const [vp, setVp] = useState<{ w: number; h: number }>(() => ({ w: typeof window !== "undefined" ? window.innerWidth : 400, h: typeof window !== "undefined" ? window.innerHeight : 800 }));
  const refresh = useCallback((): void => setTick((n: number) => n + 1), []);
  const run = useCallback((fn: (g: Game) => void): void => { const g = G.current; if (!g) return; fn(g); LAST_SAVE = saveRun(g); refresh(); }, [refresh]);
  const toTitle = (): void => { if (G.current) LAST_SAVE = saveRun(G.current); G.current = null; setConfirm(null); setUi("title"); refresh(); };

  useEffect(() => {
    const gg = G.current;
    const el = detRef.current;
    if (!gg || gg.screen !== "inventory" || gg.sel < 0 || !el) return;
    const id = window.requestAnimationFrame(() => {
      const r = el.getBoundingClientRect(), pad = 16;
      if (r.bottom > window.innerHeight - pad || r.top < pad) {
        el.scrollIntoView({ behavior: "smooth", block: r.bottom > window.innerHeight - pad ? "end" : "nearest" });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [tick]);

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
    const onRs = (): void => { const w = window.innerWidth, h = window.innerHeight; syncView(w, h); setVp({ w, h }); };
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
  // ---- held-input safety: the joystick and held keys must never outlive the screen they started on ----
  const resetJoy = (): void => {
    const J = joyRef.current;
    if (J.el && J.id !== -1) { try { if (J.el.hasPointerCapture(J.id)) J.el.releasePointerCapture(J.id); } catch (err) { void err; } }
    joyRef.current = { id: -1, ox: 0, oy: 0, t: 0, el: null };
    const I = inp.current; I.jx = 0; I.jy = 0;
    const b = joyBase.current; if (b) b.style.display = "none";
    const kn = joyKnob.current; if (kn) kn.style.transform = "translate(-50%, -50%)";
  };
  const resetHeld = (): void => {
    resetJoy();
    const I = inp.current; HELD.clear();
    I.kx = 0; I.ky = 0; I.gx = 0; I.gy = 0; I.katk = false; I.atk = false; I.gatk = false; I.vx = 0; I.vy = 0; I.idleT = 1;
  };
  const resetRef = useRef<() => void>(resetHeld); resetRef.current = resetHeld;
  const joyResetRef = useRef<() => void>(resetJoy); joyResetRef.current = resetJoy;
  const gNow = G.current;
  const modeKey = `${ui}|${gNow ? gNow.screen : "-"}|${gNow && gNow.combat && gNow.combat.itemOpen ? 1 : 0}|${sheet ? 1 : 0}|${exitAsk ? 1 : 0}|${bigMap ? 1 : 0}`;
  // any screen, overlay, modal, shop or map change drops every held input (touch, keys, pad)
  useEffect(() => { resetRef.current(); }, [modeKey]);
  useEffect(() => {
    // window-level, capture phase: a release that lands on an overlay (or after the joystick's element unmounted) still ends the drag
    const up = (e: PointerEvent): void => { livePtr.current.delete(e.pointerId); if (joyRef.current.id === e.pointerId) joyResetRef.current(); };
    const down = (e: PointerEvent): void => { livePtr.current.add(e.pointerId); };
    const tEnd = (e: TouchEvent): void => { if (e.touches.length === 0) { livePtr.current.clear(); if (joyRef.current.id !== -1) joyResetRef.current(); } };
    const all = (): void => { livePtr.current.clear(); resetRef.current(); };
    const vis = (): void => { if (document.visibilityState !== "visible") all(); };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    window.addEventListener("touchend", tEnd, true);
    window.addEventListener("touchcancel", tEnd, true);
    window.addEventListener("blur", all);
    window.addEventListener("pagehide", all);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("touchend", tEnd, true);
      window.removeEventListener("touchcancel", tEnd, true);
      window.removeEventListener("blur", all);
      window.removeEventListener("pagehide", all);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
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
      <div data-notes="1" style={inline ? { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, pointerEvents: "none" } : { position: "absolute", left: "max(8px, env(safe-area-inset-left))", right: "auto", bottom: "max(10px, env(safe-area-inset-bottom))", maxWidth: "min(420px, 54vw)", display: "flex", flexDirection: "column-reverse", alignItems: "flex-start", gap: 4, pointerEvents: "none", zIndex: 12 }}>
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
  const affixChips = (inv: Inv, f: number): ReactNode => {
    const ilvl = inv.ilvl ?? f;
    const labelOf = (stat: RolledAff["stat"]): string => stat === "mpreg" ? "Mana regen" : STAT_LABEL[stat];
    const fmt = (stat: RolledAff["stat"], v: number): string => stat === "mpreg" ? `${v >= 0 ? "+" : ""}${v}/s` : `${v >= 0 ? "+" : ""}${v}`;
    if (inv.affs && inv.affs.length) {
      return <div data-affixes="1" style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", fontSize: 13 }}>{inv.affs.map((a: RolledAff) => <span key={a.id} title={`T${a.tier} ${a.name}: ${labelOf(a.stat)} rolls ${a.lo}–${a.hi} (iLvl ${ilvl})`} style={{ color: a.v >= 0 ? t.text.success : t.text.danger, fontWeight: 600, borderBottom: "1px dotted currentColor", cursor: "help" }}>✦ {a.name}: {fmt(a.stat, a.v)} {labelOf(a.stat)}</span>)}</div>;
    }
    const keys = Object.keys(inv.bon) as StatKey[]; if (keys.length === 0) return null;
    return <div data-affixes="1" style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", fontSize: 13 }}>{keys.map((k: StatKey) => { const v = inv.bon[k] ?? 0; const [lo, hi] = affixRange(k, ilvl); return <span key={k} title={`Random affix: ${STAT_LABEL[k]} rolls about ${lo}–${hi} at iLvl ${ilvl}`} style={{ color: v >= 0 ? t.text.success : t.text.danger, fontWeight: 600, borderBottom: "1px dotted currentColor", cursor: "help" }}>✦ {v >= 0 ? "+" : ""}{v} {STAT_LABEL[k]}</span>; })}</div>;
  };
  const setLines = (sid: string, n: number): ReactNode => {
    const S = SETS[sid]; const parts = S.desc.split(" · ");
    return (
      <div data-set={sid} style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 1, padding: "4px 6px", borderRadius: 6, background: "rgba(120,90,255,.10)", border: "1px solid rgba(150,120,255,.35)" }}>
        <div style={{ color: t.text.accent, fontWeight: 700 }}>🧩 {S.name}{S.cls ? ` · ${CLS[S.cls].name} set` : ""}{n >= 0 ? ` (${n}/${S.n} worn)` : ` (${S.n} pieces)`}</div>
        {parts.map((p: string, i: number) => { const need = Number(p.trim().split(" ")[0]) || 0; const on = n >= need && need > 0; return <div key={i} style={{ color: on ? t.text.success : t.text.secondary }}>{on ? "✓ " : "○ "}{p}</div>; })}
        <div style={{ color: t.text.tertiary, fontSize: 11 }}>Pieces: {ITEMS.filter((x: ItemT) => x.set === sid).map((x: ItemT) => x.name).join(", ")}</div>
      </div>
    );
  };
  const clsLabel = (it: ItemT): string => it.cls ? `${it.cls.map((c: ClassId) => CLS[c].name).join("/")} only` : "All classes";
  const tplDetail = (it: ItemT): ReactNode => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 15, color: RCOL[it.r], fontWeight: 600 }}>{it.icon} {it.name}</div>
      <div style={small}>{RAR[it.r]} {SLOT_NAME[it.slot]} · {clsLabel(it)}{it.cursed ? " · " : ""}{it.cursed && <span style={{ color: t.text.danger, fontWeight: 700 }}>Cursed</span>}</div>
      {statChips(it.st)}
      {it.set && setLines(it.set, -1)}
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
        <div style={small}>{RAR[it.r]} {SLOT_NAME[it.slot]} · {clsLabel(it)} · iLvl {inv.ilvl ?? "?"}{inv.aname ? ` · ${it.name}` : ""}{it.cursed ? " · " : ""}{it.cursed && <span style={{ color: t.text.danger, fontWeight: 700 }}>{inv.freed ? "Cursed (lifted)" : "Cursed"}</span>}</div>
        {statChips(it.st)}
        {((inv.affs && inv.affs.length > 0) || Object.keys(inv.bon).length > 0 || inv.mpreg) && <div style={{ fontSize: 11, color: t.text.tertiary }}>Affixes (rolled at iLvl {inv.ilvl ?? "?"}):</div>}
        {affixChips(inv, g.floor)}
        {inv.mpreg && !(inv.affs && inv.affs.some((a: RolledAff) => a.stat === "mpreg")) && <div style={{ fontSize: 13, color: t.text.success, fontWeight: 600 }}>✦ +{inv.mpreg}/s Mana regen</div>}
        {it.set && setLines(it.set, sc)}
        {it.desc && <div style={{ fontSize: 13, color: it.cursed ? t.text.danger : it.r === 4 ? RCOL[4] : t.text.primary }}>{it.sp ? "★ " : ""}{it.desc}</div>}
        {it.cls && !it.cls.includes(g.cls) && <div style={{ fontSize: 12, color: t.text.danger }}>Your class can't equip this (sell it).</div>}
      </div>
    );
  };

  const g = G.current;
  syncView(vp.w, vp.h);
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
  const joyStart = (el: HTMLElement, pointerId: number, x: number, y: number): void => {
    // a new touch always takes over; whatever the old one was doing is dropped
    if (joyRef.current.id !== -1) resetJoy();
    joyRef.current = { id: pointerId, ox: x, oy: y, t: performance.now(), el };
    try { el.setPointerCapture(pointerId); } catch (err) { void err; }
    const b = joyBase.current; if (b) { b.style.display = "block"; b.style.left = `${x}px`; b.style.top = `${y}px`; }
    const kn = joyKnob.current; if (kn) kn.style.transform = "translate(-50%, -50%)";
  };
  const joyDown = (e: { clientX: number; clientY: number; pointerId: number; target: EventTarget | null; currentTarget: HTMLDivElement }): void => {
    const tg = e.target as HTMLElement | null;
    if (tg && typeof tg.closest === "function" && tg.closest("button, textarea, input, a, [data-noj]")) return;
    if (e.clientX > window.innerWidth / 2) return;
    joyStart(e.currentTarget, e.pointerId, e.clientX, e.clientY);
  };
  const joyMove = (e: { clientX: number; clientY: number; pointerId: number; pointerType: string; buttons: number; target: EventTarget | null; currentTarget: HTMLDivElement }): void => {
    if (joyRef.current.id === -1 && (e.pointerType === "touch" || (e.buttons & 1) === 1) && e.clientX <= window.innerWidth / 2 && isPlay()) {
      // a finger that is still down after a reset (screen change, watchdog) picks the joystick straight back up
      const tg = e.target as HTMLElement | null;
      if (!(tg && typeof tg.closest === "function" && tg.closest("button, textarea, input, a, [data-noj]"))) joyStart(e.currentTarget, e.pointerId, e.clientX, e.clientY);
      return;
    }
    const J = joyRef.current; if (J.id !== e.pointerId) return;
    J.t = performance.now();
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
  const joyUp = (e: { pointerId: number }): void => { if (joyRef.current.id === e.pointerId) resetJoy(); };
  const joyH = { onPointerDown: joyDown, onPointerMove: joyMove, onPointerUp: joyUp, onPointerCancel: joyUp, onLostPointerCapture: joyUp };
  const joyEl = (
    <div ref={joyBase} style={{ display: "none", position: "fixed", width: 104, height: 104, marginLeft: -52, marginTop: -52, borderRadius: "50%", border: "2px solid rgba(255,220,160,.45)", background: "radial-gradient(circle, rgba(255,200,120,.12), rgba(0,0,0,.3))", pointerEvents: "none", zIndex: 40 }}>
      <div ref={joyKnob} style={{ position: "absolute", left: "50%", top: "50%", width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #f3d9a6, #8a5a2a)", boxShadow: "0 0 12px rgba(255,180,90,.6)", transform: "translate(-50%, -50%)" }} />
    </div>
  );
  const toastEl = toast ? <div key={toast} role="status" style={{ position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 60, maxWidth: "90vw", fontSize: 13, fontWeight: 700, padding: "8px 14px", borderRadius: 999, background: t.bg.elevated, color: t.text.primary, border: `1px solid ${t.border.default}`, boxShadow: "0 4px 14px rgba(0,0,0,.35)", pointerEvents: "none", animation: "doeFlash 2.6s ease-in forwards", fontFamily: t.font.family }}>{toast}</div> : null;
  const lockNote = (): void => { setToast("⚔️ In combat — locked until the fight ends"); };
  const toggleMap = (): void => {
    const gg = G.current; const I = inp.current;
    if (gg && gg.combat && !bigMap) { lockNote(); return; }
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
  const style = <div style={{ display: "contents" }}>{exitModal}{sheetEl}{bigMapEl}{toastEl}{joyEl}<style>{"html[data-doe-nav=\"1\"] button:focus,html[data-doe-nav=\"1\"] textarea:focus{outline:3px solid #ffcc4d!important;outline-offset:2px!important;box-shadow:0 0 0 6px rgba(255,204,77,.35)!important}.doe-cols>*{break-inside:avoid;margin-bottom:10px}@keyframes doeFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-26px)}}@keyframes doePulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes doeFlash{0%{opacity:1}100%{opacity:0}}@keyframes doeSplat{0%{transform:scale(.2);opacity:1}60%{opacity:.95}100%{transform:scale(1.5) translateY(6px);opacity:0}}@keyframes doeDrip{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1.2)}}@keyframes doeFlick{0%,100%{opacity:1}40%{opacity:.8}70%{opacity:.92}}@keyframes doeBanner{0%{opacity:0;transform:scale(.9)}15%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}@keyframes doeDrift{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(18px,-160px);opacity:0}}@keyframes doeRise{0%{opacity:0;transform:translateY(6px)}12%{opacity:1;transform:translateY(0)}65%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}@keyframes doeNote{0%{opacity:0;transform:translateY(4px)}8%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}@keyframes doeBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5%)}}@keyframes doeMist{0%{transform:translateX(-12%)}100%{transform:translateX(12%)}}@keyframes doeBreath{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-3%) scaleY(1.05)}}@keyframes doeTwitch{0%,82%,100%{transform:rotate(0)}86%{transform:rotate(-4deg)}90%{transform:rotate(3deg)}}@keyframes doeFlicker{0%,100%{opacity:1}35%{opacity:.68}55%{opacity:.92}78%{opacity:.75}}@keyframes doeLean{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(-8deg) translateY(-2%)}}@keyframes doeAura{0%,100%{opacity:.4}50%{opacity:.85}}"}</style></div>;
  const back = (): void => { if (g) run((gg: Game) => { gg.screen = gg.prev; }); else setUi("title"); };
  // ---------- INPUT: keyboard, gamepad, real-time loop ----------
  const isPlay = (): boolean => { const gg = G.current; return !!gg && !exitAsk && !sheet && !bigMap && gg.screen === "map"; };
  const openExit = (): void => { const gg = G.current; if (gg) LAST_SAVE = saveRun(gg); HELD.clear(); const I = inp.current; I.kx = 0; I.ky = 0; I.katk = false; I.atk = false; setExitAsk(true); };
  const cycleTarget = (d: number): void => run((x: Game) => { const c = x.combat; if (!c) return; const n = c.enemies.length; for (let k = 1; k <= n; k++) { const i = (((c.target + d * k) % n) + n) % n; const e = c.enemies[i]; if (e && !e.dead && e.hp > 0) { c.target = i; return; } } });
  const cycleTab = (d: number): void => {
    const gg = G.current; const n = CLASS_IDS.length;
    if (!gg && ui === "tree") { setTreeCls(CLASS_IDS[(CLASS_IDS.indexOf(treeCls) + d + n) % n]); return; }
    if (!gg && ui === "title") { setPickCls(CLASS_IDS[(CLASS_IDS.indexOf(pickCls) + d + n) % n]); return; }
    if (gg && gg.screen === "map" && gg.combat) cycleTarget(d);
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
    const gg = G.current; if (!gg || gg.screen !== "map" || !gg.combat) return;
    const a = CLS[gg.cls].abs[i]; if (!a) return;
    if (!abReady(gg, i)) { addFx(gg, `Lv ${abUnlockAt(i)}`, "sys", "p"); refresh(); return; }
    if ((gg.cds[a.id] ?? 0) > 0 || gg.mp < abCost(gg, a)) { addFx(gg, (gg.cds[a.id] ?? 0) > 0 ? "cooldown" : "no MP", "sys", "p"); refresh(); return; }
    run((x: Game) => rtAbility(x, a.id));
  };
  const mvVec = (): [number, number] => { const I = inp.current; let x = I.jx + I.kx + I.gx, y = I.jy + I.ky + I.gy; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } return [x, y]; };
  const dodge = (): void => { const [x, y] = mvVec(); run((gg: Game) => rtDodge(gg, x, y)); };
  const inFight = (): boolean => { const gg = G.current; if (gg && gg.combat && gg.screen === "map") { lockNote(); return true; } return false; };
  const interact = (): void => { if (inFight()) return; run((gg: Game) => { if (gg.screen === "map" && nearMerchant(gg)) { gg.screen = "shop"; gg.sel = -1; inp.current.shopL = true; } }); };
  const openBag = (): void => {
    if (inFight()) return;
    run((gg: Game) => {
      if (gg.screen === "map") { gg.screen = "inventory"; gg.sel = -1; }
      else if (gg.screen === "inventory") { gg.screen = "map"; gg.sel = -1; }
    });
  };
  const quick = (): void => run((gg: Game) => quickUse(gg));
  drawRef.current = (force: boolean): void => {
    const gg = G.current; if (!gg || gg.screen !== "map") return;
    const cv = mapCv.current; if (cv) drawView(cv, gg, force);
    const we = worldEl.current; if (we) { we.style.transform = worldTf(gg); if (gg.combat) placeCombat(we, gg.combat); placePets(we, gg); }
    placeHero(gg, inp.current);
    const mc = miniCv.current; const now = performance.now();
    if (mc && (force || now - miniT.current > 120)) { miniT.current = now; drawMini(mc, gg, false); }
  };
  const openPage = (s: Screen): void => { if (inFight()) return; run((gg: Game) => { if (gg.screen === "map") { gg.prev = "map"; gg.screen = s; } }); };
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
    if (k === "m" && gg && gg.screen === "map" && !exitAsk && !sheet && (!gg.combat || bigMap)) { e.preventDefault(); toggleMap(); return; }
    if (!play) {
      if ((k === "Enter" || k === " ") && !onBtn) { e.preventDefault(); navOk(); return; }
      if (k === "q" || k === "[") { cycleTab(-1); return; }
      if (k === "e" || k === "]") { cycleTab(1); return; }
      if ((k === "i" || k === "b") && gg && gg.screen === "inventory") { e.preventDefault(); openBag(); return; }
      return;
    }
    if (!gg) return;
    if (gg.combat) {
      if (k === " " || k === "j") { if (onBtn && k === " ") return; e.preventDefault(); I.katk = true; run((x: Game) => rtAttack(x)); return; }
      if (k === "Enter") { if (onBtn) return; e.preventDefault(); run((x: Game) => rtAttack(x)); return; }
      if (k === "1" || k === "2" || k === "3" || k === "4") { abil(Number(k) - 1); return; }
      if (k === "Shift" || k === "k") { dodge(); return; }
      if (k === "r" || k === "4") { quick(); return; }
      if (k === "Tab") { e.preventDefault(); cycleTarget(e.shiftKey ? -1 : 1); return; }
      if (k === "q") { cycleTarget(-1); return; }
      if (k === "e") { cycleTarget(1); return; }
      if (["i", "b", "c", "h", "?", "m"].includes(k)) { lockNote(); return; }
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
    I.gatk = play && !!gg && !!gg.combat && b(0);
    const prev = P.prev;
    const edge = (i: number): boolean => b(i) && !prev[i];
    P.prev = pad.buttons.map((x: GamepadButton) => x.pressed);
    if (play && gg) {
      if (gg.combat) {
        if (edge(0)) run((x: Game) => rtAttack(x));
        if (edge(1)) dodge();
        if (edge(2)) abil(0);
        if (edge(3)) abil(1);
        if (edge(5)) abil(2);
        if (edge(7)) abil(3);
        if (edge(4)) cycleTarget(1);
        if (edge(8)) quick();
        if (edge(11)) lockNote();
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
    {
      // joystick watchdog: drop a drag that went silent for 1 s and can no longer be live
      const J = joyRef.current;
      if (J.id !== -1) {
        const silent = performance.now() - J.t > 1000;
        if (!isPlay() || (silent && (!J.el || !J.el.isConnected || !livePtr.current.has(J.id) || document.visibilityState !== "visible"))) resetJoy();
      }
    }
    const gg = G.current; const I = inp.current;
    if (!gg || exitAsk || sheet || bigMap || document.hidden) return;
    const [mx, my] = mvVec();
    if (gg.screen === "map") {
      const was = !!gg.combat;
      let chg = rtMap(gg, dt, mx, my, I);
      if (gg.combat && (gg.screen as Screen) === "map") { combatStep(gg, dt, I.atk || I.katk || I.gatk); chg = true; }
      if (!gg.combat) I.atk = false;
      drawRef.current(false);
      if (currentAbPop() && (AB_POPS[0]?.ts ?? 0) !== (I as Inp & { abTs?: number }).abTs) { (I as Inp & { abTs?: number }).abTs = AB_POPS[0]?.ts; setToast(`✨ New ability unlocked: ${currentAbPop()!.name}`); }
      if ((gg.screen as Screen) !== "map" || was !== !!gg.combat) { I.rT = 0; refresh(); }
      else if (chg || currentAbPop() || livePulses(Date.now()).length || gg.buffs.fury > 0 || gg.buffs.iron > 0) { I.rT += dt; if (I.rT >= (gg.combat ? 0.066 : 0.033)) { I.rT = 0; refresh(); } }
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
        {(() => {
          const prestige = (m as Meta & { prestige?: number }).prestige ?? 0;
          const cell = (label: string, value: ReactNode): ReactNode => (
            <div style={{ textAlign: "center", flex: "1 1 72px", minWidth: 68 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#ffe08a", fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "#fff8e8", lineHeight: 1.05, textShadow: "0 1px 0 #000, 0 0 8px rgba(0,0,0,.65)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </div>
          );
          return (
            <div data-runpanel="1" style={{ ...card, background: "linear-gradient(180deg, #2a1a12, #100c14)", border: "2px solid #e8c35a", boxShadow: "0 0 0 1px #000, 0 8px 28px rgba(0,0,0,.6)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 14px 12px" }}>
              <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                <div style={{ fontSize: 13, letterSpacing: 2.2, textTransform: "uppercase", color: "#ffe08a", fontWeight: 800 }}>{saved ? (saved.mode === "story" ? "Floor" : "Depth") : "Best depth"}</div>
                <div style={{ fontSize: "clamp(52px, 14vw, 80px)", fontWeight: 900, color: "#fff6dc", lineHeight: 0.88, textShadow: "0 2px 0 #000, 0 0 22px rgba(232,195,90,.5)", fontVariantNumeric: "tabular-nums" }}>{saved ? saved.floor : (m.best || "—")}</div>
                {saved
                  ? <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 16, fontWeight: 800, color: "#fff8e8" }}><span style={{ display: "inline-block", width: 32, height: 32, flex: "0 0 auto" }}>{spr(saved.cls, 32)}</span>{CLS[saved.cls].name} · {saved.mode === "story" ? "Story" : "Endless"}</div>
                  : <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#ffe6b0" }}>No run in progress</div>}
              </div>
              <div style={{ display: "flex", flex: "2 1 240px", alignItems: "center", justifyContent: "space-around", gap: 8, flexWrap: "wrap" }}>
                {saved ? cell("Level", `Lv ${saved.lvl}`) : null}
                {cell("Prestige", `⭐ ${prestige}`)}
                {cell("Best depth", m.best || "—")}
              </div>
              {saved && <div style={{ flex: "0 1 auto", marginLeft: "auto" }}>{btn("▶ Continue", () => { const gg = parseRun(rawRun()); if (gg) { G.current = gg; log(gg, "💾 Run loaded. Welcome back!", "good"); LAST_SAVE = saveRun(gg); setConfirm(null); refresh(); } }, { tone: "primary", tall: true })}</div>}
            </div>
          );
        })()}
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
          {c.abs.map((a: Ab, i: number) => <div key={a.id} style={{ fontSize: 13 }}><b>{a.icon} {a.name}</b> <span style={{ color: t.text.secondary }}>(Lv {abUnlockAt(i)} · {a.mp} MP{a.cd ? `, ${a.cd}s cd` : ""})</span> — {a.desc}</div>)}
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
  const homeBtn = (): void => { if (G.current && G.current.combat) { lockNote(); return; } goHome(); };
  const hud = (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
      {g.screen !== "map" && fxLayer(g, "p")}
      {g.hurtTs && Date.now() - g.hurtTs < 700 ? splat(g.hurtTs % 100000) : null}
      <div style={{ ...row, justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 42, height: 42, flex: "0 0 auto", borderRadius: 8, background: "radial-gradient(circle at 50% 40%, #3a2a1a, #0d0a10 80%)", border: "1px solid #5a3a2a", overflow: "hidden" }}>{spr(g.cls, 42)}</span>{CLS[g.cls].name} · Lv {g.lvl}</span>
        <span>{g.mode === "story" ? `🏰 Floor ${g.floor}/${STORY_END}` : `∞ Depth ${g.floor}`}</span>
        <span style={{ color: t.text.warning, fontWeight: 700 }}>💰 {g.gold}</span>
        <span style={{ fontSize: 11, color: LAST_SAVE ? t.text.success : t.text.warning }}>{LAST_SAVE ? "💾 Saved" : "⚠️ Session only"}</span>
        <button onClick={homeBtn} aria-disabled={!!g.combat} aria-label="Title screen (copies your save code)" style={{ opacity: g.combat ? 0.4 : 1, minWidth: 40, minHeight: 36, borderRadius: 10, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 16, cursor: "pointer" }}>🏠</button>
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

  const hudNarrow = vp.w < 700;
  const hudMeta = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flex: "0 0 auto" }}>
      <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{g.mode === "story" ? `🏰 ${g.floor}/${STORY_END}` : `∞ ${g.floor}`}</span>
      <span style={{ fontSize: 12, color: t.text.warning, fontWeight: 700, whiteSpace: "nowrap" }}>💰 {g.gold}</span>
      <span style={{ fontSize: 11, color: LAST_SAVE ? t.text.success : t.text.warning, whiteSpace: "nowrap" }}>{LAST_SAVE ? "💾" : "⚠️"}</span>
      <button onClick={homeBtn} aria-disabled={!!g.combat} aria-label="Title screen (copies your save code)" style={{ opacity: g.combat ? 0.4 : 1, minWidth: 36, minHeight: 32, borderRadius: 8, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 15, cursor: "pointer" }}>🏠</button>
    </div>
  );
  const hudBars = <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", gap: 6 }}>{bar(g.hp, f.maxHp, "#e5484d", "HP")}{bar(g.mp, f.maxMp, "#3e8ef7", "MP")}{bar(g.xp, need(g.lvl), "#f5a524", "XP")}</div>;
  const hudC = (
    <div data-hud="1" style={{ ...card, padding: "4px 8px", display: "flex", flexDirection: hudNarrow ? "column" : "row", alignItems: hudNarrow ? "stretch" : "center", gap: 6, position: "relative", flex: "0 0 auto", width: "100%", boxSizing: "border-box", background: "rgba(10,8,14,.78)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,230,180,.22)", boxShadow: "0 4px 16px rgba(0,0,0,.35)" }}>
      {g.screen !== "map" && fxLayer(g, "p")}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, width: "100%" }}>
        <span style={{ width: 30, height: 30, flex: "0 0 auto", borderRadius: 6, background: "radial-gradient(circle at 50% 40%, #3a2a1a, #0d0a10 80%)", border: "1px solid #5a3a2a", overflow: "hidden" }}>{spr(g.cls, 30)}</span>
        <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{CLS[g.cls].name} {g.lvl}</span>
        {!hudNarrow && hudBars}
        {hudMeta}
      </div>
      {hudNarrow && hudBars}
    </div>
  );
  const playLayout = (g0: Game, viewFn: () => ReactNode, _aspect: number, actions: ReactNode, below: ReactNode) => {
    const padT = sa("top", 8), padR = sa("right", 8), padB = sa("bottom", 8), padL = sa("left", 8);
    const mini = Math.max(88, Math.min(132, Math.round(Math.min(vp.w, vp.h) * 0.2)));
    const panel: CSSProperties = { background: "rgba(10,8,14,.72)", border: "1px solid rgba(255,230,180,.18)", borderRadius: 10, padding: "6px 8px", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", boxShadow: "0 4px 16px rgba(0,0,0,.35)" };
    return (
      <div {...joyH} style={{ position: "fixed", inset: 0, background: "#07060a", color: t.text.primary, fontFamily: t.font.family, userSelect: "none", touchAction: "none", overflow: "hidden" }}>
        {style}
        <div style={{ position: "absolute", inset: 0 }}>{viewFn()}{notes(g0, false)}</div>
        <div style={{ position: "absolute", top: padT, left: padL, right: `calc(${padR} + ${mini + 10}px)`, zIndex: 10, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto", maxWidth: "100%" }}>{hudC}</div>
        </div>
        <div data-noj="1" style={{ position: "absolute", right: padR, bottom: padB, zIndex: 10, maxWidth: vp.h <= 480 ? "min(64vw, 340px)" : vp.w < 720 ? "min(92vw, 420px)" : 380, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", pointerEvents: "auto" }}>
          <div style={{ ...panel, maxWidth: "100%", maxHeight: vp.h <= 480 ? 52 : undefined, overflow: vp.h <= 480 ? "hidden" : undefined, fontSize: vp.h <= 480 ? 10 : undefined }}>{below}</div>
          {actions}
        </div>
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
  // ---------- VAULT (after every 10th-floor boss) ----------
  if (g.screen === "vault") {
    const v = vaultGet();
    const items: Inv[] = [...GEAR.map((k: GearSlot) => g.eq[k]).filter((x: Inv | undefined): x is Inv => !!x && !locked(x)), ...g.inv];
    const pend = g.vaultSel !== undefined ? items.find((i: Inv) => i.uid === g.vaultSel) : undefined;
    const doDeposit = (uid: number): void => run((gg: Game) => { if (vaultDeposit(gg, uid)) vaultLeave(gg); });
    return (
      <div style={root}>{style}
        {hud}
        <div data-screen="vault" style={{ fontSize: 20, fontWeight: 800 }}>🏦 The Echo Vault</div>
        <div style={small}>You may seal ONE item here. It leaves this run, keeps its rolled bonuses, and survives death and permadeath. At the start of your next run you can choose to bring it along. Optional — you can skip.</div>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 6, border: `2px solid ${v ? RCOL[3] : t.border.default}` }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Currently stored</div>
          {v ? instDetail(v.item, g) : <div style={small}>The vault is empty.</div>}
        </div>
        {pend && v && (
          <div data-vaultconfirm="1" style={{ ...card, display: "flex", flexDirection: "column", gap: 8, border: `2px solid ${t.text.danger}` }}>
            <div style={{ fontWeight: 800 }}>Replace {instName(v.item)} with {instName(pend)}?</div>
            <div style={small}>The item currently in the vault will be lost for good.</div>
            <div style={row}>{btn("Replace", () => doDeposit(pend.uid), { tone: "danger", grow: true })}{btn("Cancel", () => run((gg: Game) => { gg.vaultSel = undefined; }), { grow: true })}</div>
          </div>
        )}
        <div style={row}><div style={{ ...head, flex: "1 1 auto" }}>DEPOSIT ONE ITEM</div>{btn("Continue without depositing", () => run((gg: Game) => vaultLeave(gg)), { tone: "primary" })}</div>
        {items.map((inv: Inv) => (
          <div key={inv.uid} data-vitem={inv.uid} style={{ ...card, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}>{GEAR.some((k: GearSlot) => g.eq[k]?.uid === inv.uid) && <div style={{ fontSize: 11, color: t.text.accent }}>EQUIPPED</div>}{instDetail(inv, g)}</div>
            {btn("🏦 Deposit", () => { if (v) run((gg: Game) => { gg.vaultSel = inv.uid; }); else doDeposit(inv.uid); }, { tone: "accent" })}
          </div>
        ))}
      </div>
    );
  }

  if (g.screen === "upgrade") {
    return (
      <div style={root}>{style}
        {hud}
        <div data-screen={g.startPick ? "starter" : g.vaultOffer ? "vaultoffer" : "upgrade"} style={{ fontSize: 20, fontWeight: 800 }}>{g.startPick ? "✨ Choose your starting perk" : g.vaultOffer ? "🏦 Bring vaulted item?" : "∞ Boss slain — choose a perk"}</div>
        <div style={small}>{g.startPick ? `Pick one of these 3 Common perks for this ${g.mode === "story" ? "Story" : "Endless"} run. The choice is rolled once — reloading won't reroll it.` : g.vaultOffer ? "Your starting perk is locked in. You can still bring the sealed item or leave it in the vault." : g.floor % 10 === 0 ? "A 10th-floor reward: at least one of these is Epic or Legendary. The offer is saved — reloading won't reroll it." : "Pick one perk. Offers are rolled once and saved — reloading won't reroll them. Deeper floors favour rarer tiers."}</div>
        {g.vaultOffer && (() => { const v = vaultGet(); if (!v) return null; return (
          <div data-vaultoffer="1" style={{ ...card, display: "flex", flexDirection: "column", gap: 8, border: `2px solid ${RCOL[3]}` }}>
            <div style={{ fontWeight: 800 }}>🏦 Bring vaulted item?</div>
            <div style={small}>Stored from a {CLS[v.cls].name} run ({v.mode === "story" ? "Floor" : "Depth"} {v.floor}). Taking it empties the vault; leaving it keeps it safe for a later run.</div>
            {instDetail(v.item, g)}
            <div style={row}>{btn("🎒 Bring it", () => run((gg: Game) => vaultTake(gg)), { tone: "primary", grow: true })}{btn("Leave it vaulted", () => run((gg: Game) => { gg.vaultOffer = false; if (!gg.startPick && gg.offers.length === 0) gg.screen = "map"; }), { grow: true })}</div>
          </div>
        ); })()}
        {g.offers.map((p: Perk) => {
          const rc = perkCol(p);
          return (
          <button key={p.id} data-perkrar={p.rar ?? RAR[perkRar(p)]} onClick={() => run((gg: Game) => applyPerk(gg, p))} style={{ ...card, textAlign: "left", cursor: "pointer", color: t.text.primary, fontFamily: "inherit", border: `2px solid ${rc}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: rc }}>{p.rar ?? RAR[perkRar(p)]}{p.cls ? ` · ${CLS[p.cls].name}` : ""}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{p.icon} {p.name}</div>
            <div style={{ fontSize: 13 }}>{p.desc}</div>
          </button>
          );
        })}
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
        {g.shop.map((inv: Inv, i: number) => {
          const left = g.stock?.[i] ?? 0, out = left <= 0, consumable = IT[inv.id].slot === "consumable";
          return (
          <div key={inv.uid} data-shop={i} data-sold={out ? "1" : "0"} style={{ ...card, position: "relative", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", background: out ? "rgba(255,255,255,.02)" : card.background }}>
            <div style={{ flex: "1 1 180px", minWidth: 0, opacity: out ? 0.45 : 1, filter: out ? "grayscale(1)" : undefined }}>{instDetail(inv, g)}{consumable && !out && <div style={{ fontSize: 12, color: t.text.secondary, marginTop: 2 }}>{left} left in stock</div>}</div>
            {out
              ? <div style={{ padding: "6px 12px", border: "2px solid #c0392b", color: "#e74c3c", borderRadius: 6, fontWeight: 900, letterSpacing: 2, transform: "rotate(-8deg)", fontSize: 14 }}>SOLD OUT</div>
              : btn(`Buy ${priceOf(inv)}g`, () => run((gg: Game) => {
              const st = gg.stock ?? (gg.stock = gg.shop.map(stockOf));
              if ((st[i] ?? 0) <= 0) { log(gg, "Sold out."); return; }
              const p = priceOf(inv);
              if (gg.gold < p) { log(gg, "Not enough gold."); return; }
              if (gg.inv.length >= MAXINV) { log(gg, "Your bag is full."); return; }
              gg.gold -= p;
              st[i] = st[i] - 1;
              addItem(gg, consumable ? makeInst(inv.id, gg.floor, false, "shop") : { ...inv, bon: { ...inv.bon }, affs: inv.affs ? inv.affs.map((a: RolledAff) => ({ ...a })) : undefined, uid: UID++ });
              log(gg, `Bought ${instName(inv)}.${st[i] <= 0 ? " (sold out)" : ""}`, "loot");
            }), { disabled: g.gold < priceOf(inv), tone: "accent" })}
          </div>
          );
        })}
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
    const sc = setCounts(g);
    const toggleSel = (uid: number): void => run((gg: Game) => { gg.sel = gg.sel === uid ? -1 : uid; });
    const itemPanel = (sel: Inv, from: "inv" | "eq", slot?: GearSlot): ReactNode => {
      const selInv = from === "inv" ? sel : undefined;
      const selSlot = from === "eq" ? slot : undefined;
      return (
        <div ref={detRef} data-itempanel={sel.uid} style={{ gridColumn: "1 / -1", ...card, display: "flex", flexDirection: "column", gap: 8, border: `2px solid ${sel.ident ? RCOL[IT[sel.id].r] : t.border.strong}` }}>
          {instDetail(sel, g)}
          <div style={row}>
            {selSlot && btn(locked(sel) ? "🔒 Cursed" : "Unequip", () => run((gg: Game) => { unequip(gg, selSlot); if (!gg.eq[selSlot]) gg.sel = -1; }), { grow: true, disabled: locked(sel) })}
            {selInv && IT[selInv.id].slot !== "consumable" && btn(selInv.ident ? "Equip" : "Equip (reveal)", () => run((gg: Game) => { equip(gg, selInv.uid); }), { tone: "primary", grow: true })}
            {selInv && IT[selInv.id].slot === "consumable" && btn("Use", () => run((gg: Game) => { const r = useConsumable(gg, selInv); if (r === "turn") gg.sel = -1; }), { tone: "primary", grow: true })}
            {selInv && ["heal", "both", "mana", "cleanse", "bomb", "frost", "fury", "iron"].includes(IT[selInv.id].fx ?? "") && btn(g.qs === selInv.id ? "★ Quick-slot" : "☆ Quick-slot", () => run((gg: Game) => { gg.qs = gg.qs === selInv.id ? undefined : selInv.id; log(gg, gg.qs ? `${IT[selInv.id].icon} ${IT[selInv.id].name} set as your combat quick-slot (R / 4 / Select).` : "Quick-slot reset to your first healing potion."); }), { grow: true, key: "qs" })}
            {selInv && btn("Drop", () => run((gg: Game) => { gg.inv = gg.inv.filter((x: Inv) => x.uid !== selInv.uid); log(gg, `Dropped ${instName(selInv)}.`); gg.sel = -1; }), { tone: "danger", grow: true })}
          </div>
          {selInv && IT[selInv.id].slot !== "consumable" && (() => {
            const cur = g.eq[IT[selInv.id].slot as GearSlot];
            return cur ? <div style={small}>Currently worn: {instName(cur)}{locked(cur) ? " (cursed, locked)" : ""}</div> : null;
          })()}
        </div>
      );
    };
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
            <div style={{ fontWeight: 700, fontSize: 13, color: RCOL[4] }}>PERKS</div>
            {g.perks.map((pid: string) => { const p = PERK_BY_ID[pid]; return p ? <div key={pid} style={{ fontSize: 13 }}>{p.icon} <b>{p.name}</b> <span style={{ color: perkCol(p), fontWeight: 700, fontSize: 11 }}>{p.rar ?? RAR[perkRar(p)]}</span> — {p.desc}</div> : null; })}
          </div>
        )}
        {(g.pets ?? []).length > 0 && (
          <div data-petpanel="1" style={{ ...card, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>🐾 COMPANIONS</div>
            {(g.pets ?? []).map((p: Pet, i: number) => <div key={i} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 24, height: 24, display: "inline-block" }}>{spr(petSpr(p.k), "100%")}</span><b>{PETS[p.k].name}</b><span style={{ color: p.ko > 0 ? t.text.danger : t.text.success }}>{p.ko > 0 ? "💫 knocked out" : `${Math.max(0, Math.round(p.hp))}/${p.max} HP`}</span><span style={{ color: t.text.secondary }}>· {PETS[p.k].desc}</span></div>)}
          </div>
        )}
        {Object.keys(sc).filter((s: string) => sc[s] >= 1 && SETS[s]).map((s: string) => <div key={s}>{setLines(s, sc[s])}</div>)}
        <div style={head}>EQUIPPED</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
          {GEAR.map((k: GearSlot) => {
            const it = g.eq[k]; const on = !!(it && g.sel === it.uid);
            return (
              <div key={k} style={{ display: "contents" }}>
                <button onClick={() => it ? toggleSel(it.uid) : run((gg: Game) => { gg.sel = -1; })} style={{ minWidth: 0, minHeight: 64, backgroundColor: on ? t.fill.accentSubtle : t.bg.elevated, backgroundImage: it && k !== "ring" && k !== "amulet" ? bloodBg(it.uid) : undefined, border: `2px solid ${it ? RCOL[IT[it.id].r] : t.border.default}`, borderRadius: 10, color: t.text.primary, fontFamily: "inherit", padding: 4, cursor: "pointer" }}>
                  <div style={{ fontSize: 22, filter: it && k === "weapon" ? "drop-shadow(0 2px 2px rgba(170,0,0,.75))" : undefined }}>{it ? IT[it.id].icon : SLOT_ICON[k]}{it && locked(it) ? "🔒" : ""}</div>
                  <div style={{ fontSize: 11, color: t.text.secondary }}>{it ? instName(it) : `No ${SLOT_NAME[k].toLowerCase()}`}</div>
                </button>
                {on && it ? itemPanel(it, "eq", k) : null}
              </div>
            );
          })}
        </div>
        </div><div style={colS}>
        <div style={head}>BAG ({g.inv.length}/{MAXINV})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6 }}>
          {g.inv.map((it: Inv) => {
            const tt = IT[it.id]; const on = g.sel === it.uid;
            return (
              <div key={it.uid} style={{ display: "contents" }}>
                <button onClick={() => toggleSel(it.uid)} style={{ minHeight: 64, backgroundColor: on ? t.fill.accentSubtle : t.bg.elevated, backgroundImage: tt.slot === "weapon" || tt.slot === "armor" || tt.slot === "helmet" ? bloodBg(it.uid) : undefined, border: `2px ${it.ident ? "solid" : "dashed"} ${it.ident ? RCOL[tt.r] : t.border.strong}`, borderRadius: 10, color: t.text.primary, fontFamily: "inherit", padding: 2, cursor: "pointer", minWidth: 0 }}>
                  <div style={{ fontSize: 24, filter: tt.slot === "weapon" ? "drop-shadow(0 2px 2px rgba(170,0,0,.75))" : undefined }}>{instIcon(it)}</div>
                  <div style={{ fontSize: 9, color: t.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.ident ? tt.name : "???"}</div>
                </button>
                {on ? itemPanel(it, "inv") : null}
              </div>
            );
          })}
        </div>
        {notes(g, true)}
        </div></div>
      </div>
    );
  }

  // ---------- MAP ----------
  const remAt = new Map<number, string>();
  for (const r of g.rem ?? []) { const [a, b] = r.split(":"); remAt.set(Number(a), b); }
  const bio: Biome = g.biome ?? biomeOf(g.floor);
  const VHX = Math.ceil(VTX / 2) + 2, VHY = Math.ceil(VTY / 2) + 2;
  const tPos = (x: number, y: number): CSSProperties => ({ position: "absolute", left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${100 / W}%`, height: `${100 / H}%` });
  const objs: ReactNode[] = [];
  for (let y = Math.max(0, g.py - VHY); y <= Math.min(H - 1, g.py + VHY); y++) for (let x = Math.max(0, g.px - VHX); x <= Math.min(W - 1, g.px + VHX); x++) {
    if (!g.seen[y][x]) continue;
    const v = g.map[y][x]; const rk = remAt.get(y * W + x);
    const isObj = v === 2 || v === 3 || v === 4;
    if (!isObj && !rk) continue;
    const lit = litT(g, x, y);
    if (rk) objs.push(<div key={`r${x},${y}`} style={{ ...tPos(x, y), opacity: lit ? 1 : 0.5 }}>{remSvg(rk)}</div>);
    if (isObj) objs.push(
      <div key={`o${x},${y}`} data-obj={v === 2 ? "stairs" : v === 3 ? "chest" : "merchant"} style={tPos(x, y)}>
        {v === 4 && lit ? <div style={{ position: "absolute", left: "-35%", top: "-35%", width: "170%", height: "170%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,90,.28), rgba(255,160,60,0) 65%)", animation: "doeFlick 1.8s ease-in-out infinite" }} /> : null}
        <div style={{ position: "absolute", inset: v === 4 ? "-6%" : "5%", filter: lit ? "drop-shadow(0 2px 2px rgba(0,0,0,.7))" : "brightness(.55)", animation: v === 4 ? "doeBob 2.4s ease-in-out infinite" : undefined }}>{spr(v === 2 ? "stairs" : v === 3 ? "chest" : "merchant", "100%")}</div>
      </div>
    );
  }
  for (const mm of g.mons) {
    const mfx = mm.fx ?? mm.x + 0.5, mfy = mm.fy ?? mm.y + 0.5;
    if (Math.abs(mm.x - g.px) > VHX || Math.abs(mm.y - g.py) > VHY || !g.seen[mm.y]?.[mm.x]) continue;
    const vis = litT(g, mm.x, mm.y);
    if (!vis && !mm.boss) continue;
    const kind = mm.boss ? (mm.t === "lord" ? "lord" : (mm.t === "brood" ? "brood" : mm.t)) : mm.t;
    const ghost = kind === "wraith" || kind === "shade" || kind === "lich";
    const chasing = mm.awake && vis;
    const sty: CSSProperties | undefined = !vis && mm.boss ? { filter: "brightness(0)", opacity: 0.55 } : mm.stun > 0 ? { opacity: 0.6 } : mm.el ? { filter: "drop-shadow(0 0 6px rgba(200,30,30,.95)) drop-shadow(0 0 10px rgba(255,160,40,.65))" } : mm.boss ? { filter: "drop-shadow(0 0 7px rgba(140,0,0,.95)) drop-shadow(0 0 12px rgba(80,0,40,.7))" } : { filter: "drop-shadow(0 2px 3px rgba(0,0,0,.9))" };
    const anim = ghost ? "doeFlicker 2.1s ease-in-out infinite" : chasing ? "doeLean 0.7s ease-in-out infinite" : "doeBreath 2.4s ease-in-out infinite";
    objs.push(
      <div key={`m${mm.id}`} data-mon={kind} data-elite={mm.el ? "1" : undefined} style={{ ...tPos(mfx - 0.5, mfy - 0.5), overflow: "visible" }}>
        {mm.el || mm.boss ? <div style={{ position: "absolute", left: "-20%", top: "-10%", width: "140%", height: "120%", borderRadius: "50%", background: mm.el ? "radial-gradient(circle, rgba(180,20,20,.35), rgba(255,140,40,.12) 45%, transparent 70%)" : "radial-gradient(circle, rgba(80,0,0,.4), transparent 70%)", animation: "doeAura 1.6s ease-in-out infinite", pointerEvents: "none" }} /> : null}
        <div style={{ position: "absolute", inset: mm.boss ? "-16% -10% 0" : "-10% -6% 0", transformOrigin: "50% 88%", animation: anim, overflow: "visible" }}>{spr(kind, "100%", sty)}</div>
      </div>
    );
  }
  const nowMs = Date.now();
  const c = g.combat;
  const wBox = (x: number, y: number, sz: number): CSSProperties => ({ position: "absolute", left: `${((x - sz / 2) / W) * 100}%`, top: `${((y - sz / 2) / H) * 100}%`, width: `${(sz / W) * 100}%`, height: `${(sz / H) * 100}%` });
  const pfx = g.wx ?? g.px + 0.5, pfy = g.wy ?? g.py + 0.5;
  const cBoss = c ? c.enemies.find((e: Enemy) => e.boss && !e.dead) : undefined;
  const inViewP = (x: number, y: number): boolean => Math.abs(x - pfx) < VTX / 2 + 2 && Math.abs(y - pfy) < VTY / 2 + 2;
  if (c) {
    const inView = (x: number, y: number): boolean => Math.abs(x - pfx) < VTX / 2 + 2 && Math.abs(y - pfy) < VTY / 2 + 2;
    for (const tl of c.tele ?? []) objs.push(
      <div key={`t${tl.id}`} data-tele={tl.kind} data-tid={tl.id} style={{ ...wBox(tl.x, tl.y, tl.r * 2), borderRadius: "50%", border: `2px solid ${tl.kind === "acid" ? "#7dff4a" : tl.kind === "cata" ? "#c07bff" : "#ff5a2a"}`, background: "rgba(0,0,0,.15)", boxSizing: "border-box", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: tl.kind === "acid" ? "rgba(110,220,60,.4)" : tl.kind === "cata" ? "rgba(150,60,255,.45)" : "rgba(255,80,20,.42)", transform: `scale(${Math.max(0, Math.min(1, 1 - tl.t / tl.max))})` }} />
      </div>
    );
    c.enemies.forEach((e: Enemy, i: number) => {
      const ex = e.x ?? 0, ey = e.y ?? 0;
      if (e.away || !inView(ex, ey)) return;
      const sz = e.boss ? 1.8 : 1.05;
      if (e.dead) {
        objs.push(<div key={`k${e.uid}`} style={{ ...wBox(ex, ey, sz), zIndex: 3 }}>{g.fx.filter((x: Fx) => x.at === "e" + e.uid && x.text.startsWith("-") && nowMs - x.ts < 900).map((x: Fx) => splat(x.id))}{arenaFx(g, "e" + e.uid)}</div>);
        return;
      }
      if (e.wk === "melee" && (e.wind ?? 0) > 0) {
        const rr = (e.boss ? (e.bk === "lord" ? 17 : 16) : (RTB[e.b] ?? RTB.brute)[1]) / U + 5 / U;
        objs.push(
          <div key={`w${e.uid}`} data-wind={e.uid} data-sz={rr * 2} style={{ ...wBox(ex, ey, rr * 2), borderRadius: "50%", border: "2px solid rgba(255,40,40,.9)", boxSizing: "border-box", zIndex: 1 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(220,0,0,.35)", transform: `scale(${Math.max(0, Math.min(1, 1 - (e.wind ?? 0) / (e.wm || 1)))})` }} />
          </div>
        );
      }
      if ((e.wk === "arrow" || e.wk === "spit" || e.wk === "hex") && (e.wind ?? 0) > 0 && e.ax !== undefined && e.ay !== undefined) {
        const pr = Math.max(0, Math.min(1, 1 - (e.wind ?? 0) / (e.wm || 1)));
        if (e.wk === "spit") objs.push(<div key={`sp${e.uid}`} data-aim="spit" style={{ ...wBox(e.ax, e.ay, 2.2), borderRadius: "50%", border: "2px dashed rgba(140,255,80,.9)", boxSizing: "border-box", zIndex: 1, opacity: 0.4 + pr * 0.6 }} />);
        else { const vx = e.ax - ex, vy = e.ay - ey, vl = Math.hypot(vx, vy) || 1, L = 7; objs.push(<svg key={`aim${e.uid}`} data-aim={e.wk} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }}><line x1={ex} y1={ey} x2={ex + vx / vl * L} y2={ey + vy / vl * L} stroke={e.wk === "hex" ? "#c04cff" : "#ff3b30"} strokeWidth={0.06 + pr * 0.06} strokeDasharray="0.25 0.18" opacity={0.35 + pr * 0.6} /></svg>); }
      }
      const on = i === c.target;
      objs.push(
        <div key={`e${e.uid}`} data-enemy={e.uid} data-noj="1" onPointerDown={() => run((gg: Game) => { const cc = gg.combat; if (!cc) return; const k = cc.enemies.findIndex((x: Enemy) => x.uid === e.uid && !x.dead); if (k >= 0) cc.target = k; })} style={{ ...wBox(ex, ey, sz), zIndex: 4, pointerEvents: "auto", cursor: "pointer", overflow: "visible" }}>
          {on && <div style={{ position: "absolute", inset: "-12%", borderRadius: "50%", border: "2px dashed #ffcc4d", pointerEvents: "none" }} />}
          <div style={{ position: "absolute", inset: e.boss ? "-8% -4% 0" : "-8% -4% 0", transformOrigin: "50% 88%", filter: e.stun > 0 ? "brightness(1.5) saturate(.4)" : e.elite ? "drop-shadow(0 0 6px rgba(200,30,30,.95)) drop-shadow(0 0 10px rgba(255,160,40,.6))" : e.boss ? "drop-shadow(0 0 8px rgba(160,0,0,1)) drop-shadow(0 0 14px rgba(80,0,40,.8))" : "drop-shadow(0 2px 3px rgba(0,0,0,.9))", animation: (e.wk === "cast" || e.wk === "hex" || e.wk === "spit") && (e.wind ?? 0) > 0 ? "doePulse .4s infinite" : (e.wk === "melee" && (e.wind ?? 0) > 0) ? "doeLean 0.45s ease-in-out infinite" : (sprOf(e) === "wraith" || sprOf(e) === "shade" || sprOf(e) === "lich") ? "doeFlicker 2.1s ease-in-out infinite" : "doeBreath 2.4s ease-in-out infinite" }}>{spr(sprOf(e), "100%")}</div>
          <div style={{ position: "absolute", left: "5%", right: "5%", top: "-14%", height: 4, borderRadius: 2, background: "rgba(0,0,0,.65)", overflow: "hidden", outline: e.elite ? "1px solid #ffcc4d" : undefined }}><div style={{ width: `${(Math.max(0, e.hp) / e.max) * 100}%`, height: "100%", background: e.boss ? "#a855f7" : e.elite ? "#f5a524" : "#e5484d" }} /></div>
          {e.elite && <div data-elite="1" style={{ position: "absolute", left: "-12%", top: "-30%", fontSize: 10, color: "#ffcc4d", textShadow: "0 1px 2px #000", pointerEvents: "none" }}>★</div>}
          {(e.stun > 0 || e.burnT > 0 || e.poisT > 0) && <div style={{ position: "absolute", left: 0, right: 0, bottom: "-30%", textAlign: "center", fontSize: 10, pointerEvents: "none" }}>{e.stun > 0 ? "😵" : ""}{e.burnT > 0 ? "🔥" : ""}{e.poisT > 0 ? "☠️" : ""}</div>}
          {g.fx.filter((x: Fx) => x.at === "e" + e.uid && x.text.startsWith("-") && nowMs - x.ts < 900).map((x: Fx) => splat(x.id))}
          {arenaFx(g, "e" + e.uid)}
        </div>
      );
    });
    for (const p of c.proj ?? []) objs.push(<div key={`p${p.id}`} data-proj={p.id} style={{ ...wBox(p.x, p.y, 0.4), borderRadius: "50%", background: p.c, boxShadow: `0 0 8px ${p.c}`, zIndex: 5 }} />);
    const sh = (c.shots ?? []).filter((x: Shot) => x.ts <= nowMs && nowMs - x.ts < 160);
    if (sh.length > 0) objs.push(<svg key="shots" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 5 }}>{sh.map((x: Shot) => <line key={x.id} x1={x.x1} y1={x.y1} x2={x.x2} y2={x.y2} stroke={x.c} strokeWidth={0.11} strokeLinecap="round" opacity={0.9} />)}</svg>);
  }
  (g.pets ?? []).forEach((p: Pet, i: number) => {
    if (!inViewP(p.x, p.y)) return;
    const ko = p.ko > 0;
    const sz = petSz(p.k);
    objs.push(
      <div key={`pet${i}`} data-pet={i} data-petk={p.k} data-ko={ko ? "1" : "0"} data-sz={sz} style={{ ...wBox(p.x, p.y, sz), zIndex: 3, pointerEvents: "none", overflow: "visible" }}>
        <div data-pet-an="1" style={{ position: "absolute", inset: 0, transformOrigin: "50% 70%" }}>{spr(petSpr(p.k), "100%")}</div>
        <svg data-pet-fx="1" viewBox="0 0 20 20" style={{ position: "absolute", inset: "-20%", width: "140%", height: "140%", overflow: "visible", opacity: 0, pointerEvents: "none" }}><path d="M4 3 L14 15 M8 2 L17 12 M2 7 L11 18" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="#ffb24a" /></svg>
        {ko ? <div style={{ position: "absolute", left: 0, right: 0, top: "-45%", textAlign: "center", fontSize: 10 }}>💫</div>
          : c && <div style={{ position: "absolute", left: "8%", right: "8%", top: "-16%", height: 3, borderRadius: 2, background: "rgba(0,0,0,.65)", overflow: "hidden" }}><div style={{ width: `${(Math.max(0, p.hp) / p.max) * 100}%`, height: "100%", background: "#3fcf6a" }} /></div>}
        {arenaFx(g, "pt" + i)}
      </div>
    );
  });
  const tileW = `${100 / VTX}%`, tileH = `${100 / VTY}%`;
  const tilePx = Math.min(vp.w, vp.h) / VT_MIN;
  const mini = Math.max(88, Math.min(132, Math.round(Math.min(vp.w, vp.h) * 0.2)));
  const floats = g.fx.filter((x: Fx) => x.at === "m" && nowMs - x.ts < 1250);
  const onMerchant = nearMerchant(g);
  const mapView = (): ReactNode => (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: "100%", height: "100%", background: "#07060a" }}>
        <canvas ref={mapCv} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at 50% 50%, ${bio === "warren" ? "rgba(255,170,80,.13)" : "rgba(220,150,255,.11)"} 0, rgba(0,0,0,0) ${2.6 * tilePx}px), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${1.3 * tilePx}px, rgba(0,0,0,.6) ${(R + 1.4) * tilePx}px)` }} />
        <div ref={worldEl} style={{ position: "absolute", left: 0, top: 0, width: `${(W / VTX) * 100}%`, height: `${(H / VTY) * 100}%`, transform: worldTf(g), pointerEvents: "none", willChange: "transform" }}>{objs}</div>
        <div data-hero="1" style={{ position: "absolute", left: "50%", top: "50%", width: tileW, height: tileH, transform: "translate(-50%,-50%)", pointerEvents: "none", filter: "drop-shadow(0 0 3px rgba(0,0,0,.9))", opacity: c && (c.iT ?? 0) > 0 ? 0.55 : 1, zIndex: 4, overflow: "visible" }}>
          <div data-hero-an="1" style={{ position: "absolute", inset: 0, transformOrigin: "50% 70%" }}>
            {spr(g.cls, "100%")}
          </div>
          <svg data-hero-fx="1" viewBox="-32 -32 64 64" style={{ position: "absolute", left: "-50%", top: "-50%", width: "200%", height: "200%", overflow: "visible", pointerEvents: "none" }}>
              <g data-fx="slash" style={{ opacity: 0, transformOrigin: "0 4px" }}>
                <path d="M8 -18 A28 28 0 0 1 22 16" fill="none" stroke="rgba(255,240,210,.95)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M4 -16 A24 24 0 0 1 18 12" fill="none" stroke="rgba(255,220,140,.55)" strokeWidth="6" strokeLinecap="round" />
                <path d="M10 -10 A18 18 0 0 1 16 8" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.4" strokeLinecap="round" />
              </g>
              <g data-fx="bow" style={{ opacity: 0, transformOrigin: "0 0" }}>
                <path d="M8 -16 Q20 0 8 16" fill="none" stroke="#c9a06a" strokeWidth="2.2" strokeLinecap="round" />
                <line data-part="string" x1="8" y1="-16" x2="8" y2="16" stroke="#f4e4c4" strokeWidth="1.1" />
                <line data-part="arrow" x1="-6" y1="0" x2="18" y2="0" stroke="#e8d9a8" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g data-fx="staff" style={{ opacity: 0, transformOrigin: "0 0" }}>
                <line x1="-8" y1="0" x2="16" y2="0" stroke="#b18cff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="0" r="4" fill="rgba(180,140,255,.85)" />
              </g>
              <g data-fx="mace" style={{ opacity: 0, transformOrigin: "0 6px" }}>
                <path d="M6 -20 A30 30 0 0 1 24 14" fill="none" stroke="rgba(220,200,160,.95)" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="22" cy="12" r="6" fill="rgba(255,200,80,.0)" stroke="rgba(255,210,90,.9)" strokeWidth="2" />
              </g>
              <g data-fx="thrust" style={{ opacity: 0, transformOrigin: "0 0" }}>
                <line x1="-10" y1="0" x2="22" y2="0" stroke="#d8e6ff" strokeWidth="2.2" strokeLinecap="round" />
                <polygon points="22,-4 30,0 22,4" fill="#d8e6ff" />
              </g>
            </svg>
          {livePulses(nowMs).map((p: PulseFx) => {
            if (p.k === "smash") {
              const u = Math.min(1, (nowMs - p.ts) / 440), d = (0.5 + 2.4 * 2 * u) * tilePx;
              return <div key={p.ts} data-smash="1" style={{ position: "absolute", left: "50%", top: "50%", width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: "50%", border: "3px solid rgba(255,210,90,.9)", boxShadow: "0 0 14px rgba(255,160,40,.7), inset 0 0 10px rgba(255,200,80,.25)", opacity: 1 - u, pointerEvents: "none", boxSizing: "border-box" }} />;
            }
            const u = Math.min(1, (nowMs - p.ts) / 280), deg = FACE * 180 / Math.PI, r = 3.25 * tilePx;
            return <svg key={p.ts} data-cleave="1" viewBox="0 0 100 100" style={{ position: "absolute", left: "50%", top: "50%", width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, overflow: "visible", opacity: 1 - u, pointerEvents: "none", transform: `rotate(${deg}deg)` }}><path d="M50 50 L95 20 A48 48 0 0 1 95 80 Z" fill="rgba(255,230,160,.28)" stroke="rgba(255,240,200,.9)" strokeWidth="2" /></svg>;
          })}
          <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 8 }}>
            {g.fx.filter((x: Fx) => x.at === "p" && nowMs - x.ts < 1000).map((x: Fx) => <span key={x.id} style={{ animation: "doeFloat 1s ease-out forwards", fontWeight: 800, fontSize: 13, color: col(x.c), textShadow: "0 1px 3px #000" }}>{x.text}</span>)}
          </div>
        </div>
        {g.hurtTs && nowMs - g.hurtTs < 700 ? <div key={`h${g.hurtTs}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 40%, rgba(190,0,0,.5) 100%)", animation: "doeFlash .55s ease-out forwards", zIndex: 6 }} /> : null}
        {(g.buffs.fury > 0 || g.buffs.iron > 0) ? (
          <div data-scrollbuffs="1" style={{ position: "absolute", left: "max(8px, env(safe-area-inset-left))", top: c ? "max(94px, calc(env(safe-area-inset-top) + 86px))" : "max(64px, calc(env(safe-area-inset-top) + 56px))", display: "flex", gap: 6, pointerEvents: "none", zIndex: 7 }}>
            {g.buffs.fury > 0 && <span title="Scroll of Fury: +50% ATK" style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#fff0d0", background: "rgba(80,30,10,.78)", border: "1px solid rgba(255,180,80,.7)", textShadow: "0 1px 2px #000" }}>📜 Fury {fmtBuff(g.buffs.fury)}</span>}
            {g.buffs.iron > 0 && <span title="Scroll of Ironskin: +50% DEF" style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#e8f0ff", background: "rgba(20,30,70,.78)", border: "1px solid rgba(140,180,255,.7)", textShadow: "0 1px 2px #000" }}>📃 Ironskin {fmtBuff(g.buffs.iron)}</span>}
          </div>
        ) : null}
        {c ? <div data-incombat="1" style={{ position: "absolute", left: "max(8px, env(safe-area-inset-left))", top: "max(64px, calc(env(safe-area-inset-top) + 56px))", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#ffe0d0", background: "rgba(120,10,10,.72)", border: "1px solid rgba(255,90,70,.7)", textShadow: "0 1px 2px #000", pointerEvents: "none", zIndex: 7 }}>{alive(c).length === 0 ? "✅ Clear…" : cBoss ? `☠️ ${cBoss.name.replace(/^The /, "")} · Phase ${c.phase}/${cBoss.bk === "lord" ? 3 : 2}` : `⚔️ In combat · ${alive(c).length}`}{(g.buffs.hex ?? 0) > 0 ? " · 🌀 Hexed" : ""}</div> : null}
        {c && c.charging ? <div style={{ position: "absolute", left: 0, right: 0, top: "30%", textAlign: "center", fontWeight: 800, fontSize: 12, color: "#ffb0ff", animation: "doePulse .8s infinite", textShadow: "0 1px 3px #000", pointerEvents: "none", zIndex: 7 }}>⚠️ CATACLYSM — leave the purple ring!</div> : null}
        <div style={{ position: "absolute", left: "50%", bottom: `${50 + 50 / VTY}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 1, pointerEvents: "none", zIndex: 6 }}>
          {floats.map((x: Fx) => <span key={x.id} data-float="1" style={{ fontWeight: 800, fontSize: 13, color: col(x.c), textShadow: "0 1px 3px #000, 0 0 2px #000", whiteSpace: "nowrap", animation: `doeRise 1.2s ease-out ${-(nowMs - x.ts)}ms forwards` }}>{x.text}</span>)}
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {bio === "warren"
            ? [0, 1, 2, 3, 4, 5, 6, 7].map((i: number) => <span key={i} style={{ position: "absolute", left: `${(i * 37 + 8) % 92}%`, top: `${60 + (i * 23) % 35}%`, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: i % 3 === 0 ? "rgba(230,230,240,.7)" : "rgba(160,255,90,.7)", opacity: 0, animation: `doeDrift ${5 + (i % 4)}s linear ${i * 0.7}s infinite` }} />)
            : [0, 1, 2].map((i: number) => <span key={i} style={{ position: "absolute", left: "-20%", width: "140%", top: `${10 + i * 30}%`, height: "30%", background: "radial-gradient(ellipse at center, rgba(150,70,220,.22), transparent 70%)", animation: `doeMist ${9 + i * 3}s ease-in-out ${i}s infinite alternate` }} />)}
        </div>
        <button data-noj="1" data-minimap="1" aria-disabled={!!c} aria-label={c ? "Map locked in combat" : "Open map (M)"} title={c ? "Locked in combat" : "Map (M)"} onClick={c ? lockNote : toggleMap} style={{ position: "absolute", right: "max(8px, env(safe-area-inset-right))", top: "max(8px, env(safe-area-inset-top))", width: mini, height: mini, padding: 0, border: `1px solid ${c ? "rgba(255,90,70,.55)" : "rgba(255,230,180,.4)"}`, borderRadius: 8, background: "transparent", overflow: "hidden", zIndex: 8, cursor: c ? "default" : "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
          <canvas ref={miniCv} style={{ width: "100%", height: "100%", display: "block" }} />
          <span style={{ position: "absolute", left: 3, bottom: 1, fontSize: 9, fontWeight: 800, color: "rgba(255,240,210,.85)", textShadow: "0 1px 2px #000" }}>{c ? "🔒" : "M"}</span>
        </button>
        {g.bannerTs && Date.now() - g.bannerTs < 3500 ? (
          <div key={g.bannerTs} style={{ position: "absolute", left: 0, right: 0, top: "36%", display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 8 }}>
            <div style={{ width: "min(88%, 520px)", textAlign: "center", padding: "10px 8px", borderRadius: 10, background: "rgba(8,6,12,.85)", border: `1px solid ${bio === "warren" ? "#6aa83a" : "#8a4ad0"}`, color: "#f0e8ff", animation: "doeBanner 3.2s ease-in-out forwards", boxSizing: "border-box" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>{g.mode === "story" ? `FLOOR ${g.floor}` : `DEPTH ${g.floor}`}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{BIOME[bio].name}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{BIOME[bio].sub}</div>
            </div>
          </div>
        ) : null}
        {(() => { const pop = currentAbPop(); return pop ? (
          <div key={pop.ts} style={{ position: "absolute", left: 0, right: 0, top: "28%", display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 9 }}>
            <div style={{ width: "min(88%, 480px)", textAlign: "center", padding: "12px 10px", borderRadius: 10, background: "rgba(8,6,12,.88)", border: "1px solid #e8c35a", color: "#fff4d0", animation: "doeBanner 3.2s ease-in-out forwards", boxSizing: "border-box", boxShadow: "0 8px 28px rgba(0,0,0,.55)" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>NEW ABILITY UNLOCKED</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{pop.icon} {pop.name}</div>
            </div>
          </div>
        ) : null; })()}
      </div>
  );
  const lockStyle: CSSProperties = { opacity: 0.4, filter: "grayscale(1)" };
  const lk = (label: string, aria: string): ReactNode => <button key={aria} onClick={lockNote} aria-disabled="true" aria-label={`${aria} (locked in combat)`} title="Locked in combat" style={{ ...lockStyle, flex: "1 1 0", minHeight: 38, borderRadius: 10, border: `1px solid ${t.border.default}`, background: t.fill.secondary, color: t.text.primary, fontFamily: "inherit", fontSize: 15, cursor: "not-allowed", padding: 0 }}>{label}</button>;
  const ring = (fr: number): ReactNode => fr > 0 ? <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(rgba(0,0,0,.72) ${Math.round(fr * 360)}deg, transparent 0deg)`, pointerEvents: "none" }} /> : null;
  const roundBtn: CSSProperties = { position: "relative", width: 56, height: 56, borderRadius: "50%", border: "2px solid #c9a24a", background: "radial-gradient(circle at 40% 35%, #3a2a44, #140e1a)", color: "#fff", fontFamily: "inherit", fontSize: 22, cursor: "pointer", overflow: "hidden", touchAction: "manipulation", padding: 0, flex: "0 0 auto" };
  const atkUp = (): void => { inp.current.atk = false; };
  const qi = qsItem(g);
  const qn = qi ? g.inv.filter((x: Inv) => x.id === qi.id).length : 0;
  const combatActions = c ? (
    <div data-combat-actions="1" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {CLS[g.cls].abs.map((a: Ab, i: number) => {
          const locked = !abReady(g, i); const lv = abUnlockAt(i);
          const cd = g.cds[a.id] ?? 0; const cost = abCost(g, a); const span = Math.max(0.01, cdSec(g, a)); const fr = cd > 0 ? Math.min(1, cd / span) : 0; const noMp = g.mp < cost;
          return (
            <button key={a.id} onClick={() => abil(i)} aria-label={locked ? `${a.name} unlocks at level ${lv}` : `${a.name} (key ${i + 1})`} title={locked ? `Unlocks at level ${lv}` : `${a.name}: ${a.desc}`} style={{ ...roundBtn, borderColor: locked ? "#665" : cd > 0 || noMp ? t.border.default : "#c9a24a", opacity: locked ? 0.55 : noMp && cd <= 0 ? 0.55 : 1, filter: locked ? "grayscale(.7)" : undefined }}>
              <span>{locked ? "🔒" : a.icon}</span>{locked ? null : ring(fr)}
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontSize: 9, fontWeight: 700, color: locked ? "#ffe08a" : "#ffe6b0", textShadow: "0 1px 2px #000" }}>{locked ? `Lv ${lv}` : cd > 0 ? `${Math.ceil(cd)}s` : `${cost}MP`}</span>
              <span style={{ position: "absolute", left: 0, right: 0, top: 2, fontSize: 9, color: "#bbb" }}>{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
        <button data-potion="1" onClick={quick} disabled={!qi} aria-label={qi ? `Quick-slot: ${IT[qi.id].name} ×${qn} (R)` : "No potion"} title={qi ? `${IT[qi.id].name} (R / 4 / Select)` : "No potion"} style={{ ...roundBtn, width: 50, height: 50, borderColor: qi ? "#e5484d" : t.border.default, opacity: qi ? 1 : 0.45, fontSize: 20 }}>
          <span>{qi ? IT[qi.id].icon : "🧪"}</span>
          <span style={{ position: "absolute", right: 4, bottom: 2, fontSize: 11, fontWeight: 800, color: "#fff", textShadow: "0 1px 2px #000" }}>{qn}</span>
        </button>
        <button onClick={dodge} aria-label="Dodge roll" style={{ ...roundBtn, borderColor: (c.dashCd ?? 0) > 0 ? t.border.default : "#7ab8ff" }}><span>💨</span>{ring(Math.min(1, (c.dashCd ?? 0) / 2.2))}<span style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontSize: 9, fontWeight: 700, color: "#cfe6ff" }}>Dodge</span></button>
        <button onPointerDown={() => { inp.current.atk = true; run((gg: Game) => rtAttack(gg)); }} onPointerUp={atkUp} onPointerCancel={atkUp} onPointerLeave={atkUp} onClick={() => run((gg: Game) => rtAttack(gg))} onContextMenu={(e: { preventDefault: () => void }) => e.preventDefault()} aria-label="Attack (hold)" style={{ ...roundBtn, width: 80, height: 80, fontSize: 32, border: "3px solid #e0b25a", background: "radial-gradient(circle at 40% 35%, #8a2a1a, #2a0a08)" }}>
          <span>{g.cls === "mage" ? "🪄" : g.cls === "ranger" ? "🏹" : g.cls === "cleric" ? "🔨" : g.cls === "rogue" ? "🗡️" : "⚔️"}</span>{ring(Math.min(1, (c.atkCd ?? 0) / ARATE[g.cls]))}
        </button>
      </div>
      {g.perks.includes("shadowmeld") && <div style={{ display: "flex", justifyContent: "flex-end" }}>{btn(g.usedShadow ? "🌫️ used" : "🌫️ Meld", () => run((gg: Game) => combatAct(gg, "vanish", "")), { disabled: g.usedShadow || !!cBoss, key: "vanish" })}</div>}
      <div data-locked="1" style={{ display: "flex", gap: 6, width: "100%" }}>
        {lk("🎒", "Bag")}{lk("📖", "Codex")}{lk("❓", "Help")}{lk("🏠", "Title")}{lk("💾", "Save code")}
      </div>
    </div>
  ) : null;
  const mapActions = c ? combatActions : (
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
  const b = g.buffs;
  const chips: string[] = [];
  if (b.fury > 0) chips.push(`📜 Fury ${fmtBuff(b.fury)}`);
  if (b.iron > 0) chips.push(`📃 Iron ${fmtBuff(b.iron)}`);
  if (c) {
    if (b.rage > 0) chips.push(`📣 Rage ${fmtBuff(b.rage)}`);
    if (b.holy > 0) chips.push(`🔆 Holy ${fmtBuff(b.holy)}`);
    if (b.evade > 0) chips.push(`💨 Evade ×${b.evade}`);
    if (b.shield > 0) chips.push(`🔮 Shield ${b.shield}`);
    if (b.frenzy > 0) chips.push(`📯 Frenzy ${fmtBuff(b.frenzy)}`);
    if ((b.hex ?? 0) > 0) chips.push(`🌀 Hex ${fmtBuff(b.hex ?? 0)}`);
  }
  if (b.dotT > 0) chips.push(`☠️ DoT ${b.dotD} for ${fmtBuff(b.dotT * 1.5)}`);
  const legend = c ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {chips.length > 0 && <div data-buffs="1" style={{ ...row, gap: 6, flexWrap: "wrap" }}>{chips.map((x: string) => <span key={x} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: t.fill.secondary, border: "1px solid rgba(255,230,180,.25)", fontWeight: 700 }}>{x}</span>)}</div>}
      <div style={{ ...small, fontSize: 11 }}>⚔️ <b>In combat</b> — bag, map, codex, shops and stairs are locked. Red rings are incoming hits: step out or dodge. Tap an enemy to target it. Break line of sight for ~4 s to lose pursuers. {CLS[g.cls].passive}</div>
    </div>
  ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {chips.length > 0 && <div data-buffs="1" style={{ ...row, gap: 6, flexWrap: "wrap" }}>{chips.map((x: string) => <span key={x} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: t.fill.secondary, border: "1px solid rgba(255,230,180,.25)", fontWeight: 700 }}>{x}</span>)}</div>}
            <div style={{ ...small, fontSize: 11 }}><b>{BIOME[bio].name}</b> · {bio === "warren" ? "🕸️ webs slow you and wake the warren" : "🔮 runes drain 8% HP and wake the dead"} · 🔽 stairs · 📦 chest · 💰 merchant (walk onto it){g.floor % 5 === 0 ? ` · ${bossKind(g.floor) === "lord" ? "Echo Lord" : "Broodmother"} guards the stairs` : ""}{g.mode === "endless" ? " · ☠️ permadeath" : ""}{g.perks.length ? ` · ${g.perks.length} perk${g.perks.length > 1 ? "s" : ""}` : ""} · monsters roam in real time</div>
          </div>
  );
  return playLayout(g, mapView, 1, mapActions, legend);
}


