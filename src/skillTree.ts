/**
 * Dungeon of Echoes — in-run skill tree (Diablo 4 style: categories, ranks,
 * Enhanced, mutually exclusive specializations). Original names and mechanics;
 * not a Paragon board.
 */

export type ClassId = "warrior" | "mage" | "rogue" | "ranger" | "cleric";
export type CatId = "basic" | "core" | "defensive" | "flavor" | "mastery" | "ultimate" | "key";
export type NodeKind = "skill" | "enh" | "fork" | "passive" | "key";

export interface SkillMod {
  dmg?: number; cd?: number; rad?: number; dur?: number; dist?: number; stun?: number; root?: number;
  misc?: Record<string, number>;
}
export interface SkillFx { k: string; dmg?: number; rad?: number; dist?: number; dur?: number; tick?: number;
  stun?: number; root?: number; n?: number; max?: number; fade?: number; delay?: number; pct?: number; pets?: boolean;
  pctMp?: number; heal?: number; slow?: number; atkMul?: number; healPct?: number; key?: string;
  misc?: Record<string, number>;
}
export interface TreeNode {
  id: string; name: string; icon: string; desc: string; kind: NodeKind;
  x: number; y: number; new?: boolean;
  mp?: number; cd?: number; ranks?: number;
  fx?: SkillFx; mod?: SkillMod; st?: Record<string, number>; misc?: Record<string, number>;
  parent?: string; enh?: string; mutex?: string[];
}
export interface CatDef {
  id: CatId; name: string; icon: string; gate: number; blurb: string; nodes: TreeNode[];
}

export const CAT_GATES: Record<CatId, number> = {"basic": 0, "core": 2, "defensive": 6, "flavor": 8, "mastery": 11, "ultimate": 16, "key": 23};
export const CAT_ORDER: CatId[] = ["basic","core","defensive","flavor","mastery","ultimate","key"];

export const CLASS_TREE: Record<ClassId, CatDef[]> = {
  warrior: [
    { id: "basic", name: "Basic", icon: "⚔️", gate: 0, blurb: "Cheap, short-cooldown skills you can use while moving.", nodes: [
      { id: "bash", name: "Shield Bash", icon: "🛡️", desc: "130% damage and stuns for 2 s.", kind: "skill", x: 1, y: 0, mp: 5, cd: 5, ranks: 5, fx: {"k": "hit", "dmg": 1.3, "stun": 2} },
      { id: "bash_enh", name: "Enhanced Shield Bash", icon: "🛡️", desc: "Stun lasts 0.6 s longer.", kind: "enh", x: 1, y: 2, mod: {"stun": 0.6}, parent: "bash" },
      { id: "bash_rim", name: "Rim Slam", icon: "🛡️", desc: "The bash also hits foes beside the target for 50%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"splash": 0.5}}, parent: "bash", mutex: ["bash_pin"] },
      { id: "bash_pin", name: "Pinning Bash", icon: "🛡️", desc: "The target is rooted in place for 1.5 s after the stun.", kind: "fork", x: 2, y: 4, mod: {"misc": {"root": 1.5}}, parent: "bash", mutex: ["bash_rim"] },
      { id: "shcheck", name: "Shoulder Check", icon: "🦬", desc: "A short lunge: 95% damage and a 0.8 s stagger.", kind: "skill", x: 4, y: 0, new: true, mp: 6, cd: 5, ranks: 5, fx: {"k": "dash", "dist": 2.2, "dmg": 0.95, "stun": 0.8} },
      { id: "shcheck_enh", name: "Enhanced Shoulder Check", icon: "🦬", desc: "Lunge travels 1 extra tile.", kind: "enh", x: 4, y: 2, mod: {"dist": 1}, parent: "shcheck" },
      { id: "shcheck_wedge", name: "Wedge Check", icon: "🦬", desc: "Foes you pass through take 60% and are shoved aside.", kind: "fork", x: 3, y: 4, mod: {"misc": {"pierce": 0.6}}, parent: "shcheck", mutex: ["shcheck_plate"] },
      { id: "shcheck_plate", name: "Plated Check", icon: "🦬", desc: "Gain a brief 12% max-HP absorb after the hit.", kind: "fork", x: 5, y: 4, mod: {"misc": {"absorb": 0.12}}, parent: "shcheck", mutex: ["shcheck_wedge"] },
      { id: "stoss", name: "Shield Toss", icon: "🥏", desc: "Hurl your shield: 85% damage to a foe up to 5 tiles away.", kind: "skill", x: 7, y: 0, new: true, mp: 8, cd: 6, ranks: 5, fx: {"k": "proj", "dmg": 0.85, "dist": 5} },
      { id: "stoss_enh", name: "Enhanced Shield Toss", icon: "🥏", desc: "The shield can bounce to one extra foe at 70%.", kind: "enh", x: 7, y: 2, mod: {"misc": {"bounce": 1, "bounceDmg": 0.7}}, parent: "stoss" },
      { id: "stoss_curve", name: "Curving Toss", icon: "🥏", desc: "The bounce always seeks a new target within 4 tiles.", kind: "fork", x: 6, y: 4, mod: {"misc": {"seek": 4}}, parent: "stoss", mutex: ["stoss_edge"] },
      { id: "stoss_edge", name: "Razor Rim", icon: "🥏", desc: "Each hit applies a 3 s bleed (18% ATK per second).", kind: "fork", x: 8, y: 4, mod: {"misc": {"bleed": 3}}, parent: "stoss", mutex: ["stoss_curve"] },
      { id: "w_p_iron", name: "Iron Grip", icon: "✊", desc: "Stuns you land last 10/20/30% longer.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"stunP": 10} },
      { id: "w_p_proven", name: "Proven Steel", icon: "🗡️", desc: "Basic skills deal 6/12/18% more damage.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"basicDmg": 6} },
    ] },
    { id: "core", name: "Core", icon: "✴️", gate: 2, blurb: "Your main damage and pressure tools.", nodes: [
      { id: "cleave", name: "Cleave", icon: "🪓", desc: "100% damage in a frontal cone.", kind: "skill", x: 1, y: 0, mp: 8, cd: 6, ranks: 5, fx: {"k": "cone", "dmg": 1.0, "rad": 2.4} },
      { id: "cleave_enh", name: "Enhanced Cleave", icon: "🪓", desc: "Cone reaches 0.5 tiles farther.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.5}, parent: "cleave" },
      { id: "cleave_split", name: "Splitting Cleave", icon: "🪓", desc: "The cone leaves a 2 s cut that ticks 25% twice.", kind: "fork", x: 0, y: 4, mod: {"misc": {"zoneTick": 0.25, "zoneDur": 2}}, parent: "cleave", mutex: ["cleave_heavy"] },
      { id: "cleave_heavy", name: "Weighted Cleave", icon: "🪓", desc: "The first foe struck is staggered for 1.2 s.", kind: "fork", x: 2, y: 4, mod: {"stun": 1.2}, parent: "cleave", mutex: ["cleave_split"] },
      { id: "smash", name: "Smash", icon: "💥", desc: "120% damage in a circle around you, with a shockwave.", kind: "skill", x: 4, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "nova", "dmg": 1.2, "rad": 2.0} },
      { id: "smash_enh", name: "Enhanced Smash", icon: "💥", desc: "Radius +0.4 tiles.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.4}, parent: "smash" },
      { id: "smash_fault", name: "Faultline Smash", icon: "💥", desc: "A 5-tile fissure shoots forward for 80% more.", kind: "fork", x: 3, y: 4, mod: {"misc": {"line": 5, "lineDmg": 0.8}}, parent: "smash", mutex: ["smash_after"] },
      { id: "smash_after", name: "Aftershock", icon: "💥", desc: "A second pulse hits for 50% one second later.", kind: "fork", x: 5, y: 4, mod: {"misc": {"echo": 0.5, "echoDelay": 1}}, parent: "smash", mutex: ["smash_fault"] },
      { id: "sunder", name: "Sundering Blow", icon: "🪓", desc: "110% damage. The target's DEF is reduced by 6 for 5 s.", kind: "skill", x: 7, y: 0, new: true, mp: 12, cd: 8, ranks: 5, fx: {"k": "hit", "dmg": 1.1, "misc": {"shred": 6, "shredT": 5}} },
      { id: "sunder_enh", name: "Enhanced Sundering Blow", icon: "🪓", desc: "DEF shred lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"misc": {"shredT": 2}}, parent: "sunder" },
      { id: "sunder_wide", name: "Wide Sundering", icon: "🪓", desc: "Foes within 1.6 tiles of the target are also shredded.", kind: "fork", x: 6, y: 4, mod: {"misc": {"shredRad": 1.6}}, parent: "sunder", mutex: ["sunder_open"] },
      { id: "sunder_open", name: "Open Wound", icon: "🪓", desc: "Shredded foes take 15% more damage from you.", kind: "fork", x: 8, y: 4, mod: {"misc": {"vuln": 0.15}}, parent: "sunder", mutex: ["sunder_wide"] },
      { id: "ribs", name: "Ribbreaker", icon: "💀", desc: "105% damage. If the target is stunned, this hits for 170% instead.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 9, ranks: 5, fx: {"k": "hit", "dmg": 1.05, "misc": {"stunBonus": 0.65}} },
      { id: "ribs_enh", name: "Enhanced Ribbreaker", icon: "💀", desc: "The stunned bonus also applies vs slowed or rooted foes.", kind: "enh", x: 10, y: 2, mod: {"misc": {"statusBonus": 1}}, parent: "ribs" },
      { id: "ribs_crack", name: "Cracked Ribs", icon: "💀", desc: "The target deals 20% less damage for 4 s.", kind: "fork", x: 9, y: 4, mod: {"misc": {"atkDown": 0.2}}, parent: "ribs", mutex: ["ribs_follow"] },
      { id: "ribs_follow", name: "Follow-through", icon: "💀", desc: "If this kills, your next basic skill has no cooldown.", kind: "fork", x: 11, y: 4, mod: {"misc": {"resetBasic": 1}}, parent: "ribs", mutex: ["ribs_crack"] },
      { id: "w_p_cleaveform", name: "Cleaving Form", icon: "🪓", desc: "Cone and smash skills gain 8/16/24% radius.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"aoeRad": 8} },
      { id: "w_p_bloodied", name: "Bloodied Edge", icon: "☠️", desc: "You deal 8/16/24% more damage to foes below 30% HP.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"lowHpDmg": 8} },
    ] },
    { id: "defensive", name: "Defensive", icon: "🛡️", gate: 6, blurb: "Wards, peels and ways to stay standing.", nodes: [
      { id: "reflect", name: "Shield Reflect", icon: "🪞", desc: "Reflect enemy projectiles for 4 s.", kind: "skill", x: 1, y: 0, mp: 12, cd: 16, ranks: 5, fx: {"k": "buff", "key": "reflect", "dur": 4} },
      { id: "reflect_enh", name: "Enhanced Shield Reflect", icon: "🪞", desc: "Lasts 1.2 s longer.", kind: "enh", x: 1, y: 2, mod: {"dur": 1.2}, parent: "reflect" },
      { id: "reflect_glare", name: "Glare Guard", icon: "🪞", desc: "While active, you take 15% less damage.", kind: "fork", x: 0, y: 4, mod: {"misc": {"dr": 0.15}}, parent: "reflect", mutex: ["reflect_spike"] },
      { id: "reflect_spike", name: "Spike Mirror", icon: "🪞", desc: "Reflected hits deal 40% extra.", kind: "fork", x: 2, y: 4, mod: {"misc": {"reflectDmg": 0.4}}, parent: "reflect", mutex: ["reflect_glare"] },
      { id: "cry", name: "Battle Cry", icon: "📣", desc: "+50% ATK for 8 s, heal 15%.", kind: "skill", x: 4, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "buff", "key": "rage", "dur": 8, "healPct": 0.15, "atkMul": 0.5} },
      { id: "cry_enh", name: "Enhanced Battle Cry", icon: "📣", desc: "The shout also heals pets for 15%.", kind: "enh", x: 4, y: 2, mod: {"misc": {"healPets": 0.15}}, parent: "cry" },
      { id: "cry_iron", name: "Iron Cry", icon: "📣", desc: "Gain 8 DEF for the duration.", kind: "fork", x: 3, y: 4, mod: {"misc": {"def": 8}}, parent: "cry", mutex: ["cry_terror"] },
      { id: "cry_terror", name: "Terror Cry", icon: "📣", desc: "Foes within 4 tiles are slowed 30% for 4 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"slowRad": 4, "slow": 0.3}}, parent: "cry", mutex: ["cry_iron"] },
      { id: "bulwark", name: "Bulwark", icon: "🧱", desc: "For 2 s, you take 60% less damage.", kind: "skill", x: 7, y: 0, new: true, mp: 14, cd: 16, ranks: 5, fx: {"k": "buff", "key": "bulwark", "dur": 2, "misc": {"dr": 0.6}} },
      { id: "bulwark_enh", name: "Enhanced Bulwark", icon: "🧱", desc: "Lasts 0.6 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 0.6}, parent: "bulwark" },
      { id: "bulwark_brace", name: "Braced Bulwark", icon: "🧱", desc: "When it ends, heal 10% of the damage you absorbed.", kind: "fork", x: 6, y: 4, mod: {"misc": {"endHeal": 0.1}}, parent: "bulwark", mutex: ["bulwark_shove"] },
      { id: "bulwark_shove", name: "Shoving Bulwark", icon: "🧱", desc: "Foes within 2 tiles are pushed back when you start it.", kind: "fork", x: 8, y: 4, mod: {"misc": {"push": 2}}, parent: "bulwark", mutex: ["bulwark_brace"] },
      { id: "brace", name: "Brace", icon: "🪵", desc: "Absorb the next hit within 5 s and gain +20% ATK for 4 s.", kind: "skill", x: 10, y: 0, new: true, mp: 8, cd: 10, ranks: 5, fx: {"k": "buff", "key": "brace", "dur": 5, "misc": {"nextAbsorb": 1, "atkAfter": 0.2}} },
      { id: "brace_enh", name: "Enhanced Brace", icon: "🪵", desc: "The ATK surge lasts 2 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 2}, parent: "brace" },
      { id: "brace_store", name: "Stored Brace", icon: "🪵", desc: "The absorbed hit also restores 8% HP.", kind: "fork", x: 9, y: 4, mod: {"misc": {"healOnAbs": 0.08}}, parent: "brace", mutex: ["brace_snap"] },
      { id: "brace_snap", name: "Snap Brace", icon: "🪵", desc: "If no hit lands, refund half the cooldown.", kind: "fork", x: 11, y: 4, mod: {"misc": {"refundCd": 0.5}}, parent: "brace", mutex: ["brace_store"] },
      { id: "holdf", name: "Hold Fast", icon: "🚩", desc: "For 6 s you and your pets take 20% less damage.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "buff", "key": "holdf", "dur": 6, "misc": {"dr": 0.2, "pets": 1}} },
      { id: "holdf_enh", name: "Enhanced Hold Fast", icon: "🚩", desc: "The ward lasts 2 s longer.", kind: "enh", x: 13, y: 2, mod: {"dur": 2}, parent: "holdf" },
      { id: "holdf_root", name: "Rooted Fast", icon: "🚩", desc: "You cannot be pushed or pulled for the duration.", kind: "fork", x: 12, y: 4, mod: {"misc": {"immovable": 1}}, parent: "holdf", mutex: ["holdf_thorn"] },
      { id: "holdf_thorn", name: "Thorned Fast", icon: "🚩", desc: "Attackers take 30% ATK as damage.", kind: "fork", x: 14, y: 4, mod: {"misc": {"thorns": 0.3}}, parent: "holdf", mutex: ["holdf_root"] },
      { id: "w_p_hide", name: "Thick Hide", icon: "🧱", desc: "+10/20/30 HP and +1/2/3 DEF.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"hp": 10, "def": 1} },
      { id: "w_p_defiant", name: "Defiant Heart", icon: "❤️", desc: "Heal 2/4/6% HP when you use a Defensive skill.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"defHeal": 2} },
    ] },
    { id: "flavor", name: "Brawling", icon: "🐏", gate: 8, blurb: "Class-defining brawling techniques.", nodes: [
      { id: "troar", name: "Taunting Roar", icon: "🦁", desc: "Force foes within 5 tiles to attack you for 6 s.", kind: "skill", x: 1, y: 0, mp: 10, cd: 14, ranks: 5, fx: {"k": "taunt", "rad": 5, "dur": 6} },
      { id: "troar_enh", name: "Enhanced Taunting Roar", icon: "🦁", desc: "Radius +1 tile.", kind: "enh", x: 1, y: 2, mod: {"rad": 1}, parent: "troar" },
      { id: "troar_boom", name: "Booming Roar", icon: "🦁", desc: "Also deals 70% damage in the radius.", kind: "fork", x: 0, y: 4, mod: {"misc": {"dmg": 0.7}}, parent: "troar", mutex: ["troar_shake"] },
      { id: "troar_shake", name: "Shaking Roar", icon: "🦁", desc: "Taunted foes are slowed 25%.", kind: "fork", x: 2, y: 4, mod: {"misc": {"slow": 0.25}}, parent: "troar", mutex: ["troar_boom"] },
      { id: "gpull", name: "Ground Pull", icon: "🧲", desc: "Yank enemies within 5 tiles in toward you.", kind: "skill", x: 4, y: 0, mp: 14, cd: 12, ranks: 5, fx: {"k": "pull", "rad": 5} },
      { id: "gpull_enh", name: "Enhanced Ground Pull", icon: "🧲", desc: "Pull radius +1 tile.", kind: "enh", x: 4, y: 2, mod: {"rad": 1}, parent: "gpull" },
      { id: "gpull_spike", name: "Spiked Pull", icon: "🧲", desc: "Foes take 80% as they land.", kind: "fork", x: 3, y: 4, mod: {"misc": {"dmg": 0.8}}, parent: "gpull", mutex: ["gpull_cling"] },
      { id: "gpull_cling", name: "Clinging Pull", icon: "🧲", desc: "Pulled foes are rooted 1.2 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"root": 1.2}}, parent: "gpull", mutex: ["gpull_spike"] },
      { id: "lslam", name: "Leaping Slam", icon: "⬇️", desc: "Leap up to 5 tiles; 140% AoE (r 2.0) and a 1.2 s stun on landing.", kind: "skill", x: 7, y: 0, mp: 16, cd: 10, ranks: 5, fx: {"k": "dash", "dist": 5, "dmg": 1.4, "rad": 2.0, "stun": 1.2} },
      { id: "lslam_enh", name: "Enhanced Leaping Slam", icon: "⬇️", desc: "Landing radius +0.4 tiles.", kind: "enh", x: 7, y: 2, mod: {"rad": 0.4}, parent: "lslam" },
      { id: "lslam_crash", name: "Crater Slam", icon: "⬇️", desc: "Leave a 2.5 s dust cloud that slows 30%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"zoneSlow": 0.3, "zoneDur": 2.5}}, parent: "lslam", mutex: ["lslam_hunt"] },
      { id: "lslam_hunt", name: "Hunting Slam", icon: "⬇️", desc: "If you land on a marked or taunted foe, damage is 180%.", kind: "fork", x: 8, y: 4, mod: {"misc": {"markBonus": 0.4}}, parent: "lslam", mutex: ["lslam_crash"] },
      { id: "ccharge", name: "Crushing Charge", icon: "🐏", desc: "Dash up to 4 tiles, dealing 120% and knocking foes down 0.8 s.", kind: "skill", x: 10, y: 0, new: true, mp: 14, cd: 11, ranks: 5, fx: {"k": "dash", "dist": 4, "dmg": 1.2, "stun": 0.8, "rad": 1.2} },
      { id: "ccharge_enh", name: "Enhanced Crushing Charge", icon: "🐏", desc: "Dash 1 tile farther.", kind: "enh", x: 10, y: 2, mod: {"dist": 1}, parent: "ccharge" },
      { id: "ccharge_ram", name: "Ram Charge", icon: "🐏", desc: "The first foe is knocked back 2 tiles.", kind: "fork", x: 9, y: 4, mod: {"misc": {"knock": 2}}, parent: "ccharge", mutex: ["ccharge_guard"] },
      { id: "ccharge_guard", name: "Guarded Charge", icon: "🐏", desc: "You take 25% less damage during the dash.", kind: "fork", x: 11, y: 4, mod: {"misc": {"dashDr": 0.25}}, parent: "ccharge", mutex: ["ccharge_ram"] },
      { id: "wstomp", name: "War Stomp", icon: "🦶", desc: "120% damage in a 2.2-tile circle and a 1 s stun.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 10, ranks: 5, fx: {"k": "nova", "dmg": 1.2, "rad": 2.2, "stun": 1} },
      { id: "wstomp_enh", name: "Enhanced War Stomp", icon: "🦶", desc: "Stun lasts 0.4 s longer.", kind: "enh", x: 13, y: 2, mod: {"stun": 0.4}, parent: "wstomp" },
      { id: "wstomp_wave", name: "Wave Stomp", icon: "🦶", desc: "A second ring hits at 3.2 tiles for 70%.", kind: "fork", x: 12, y: 4, mod: {"misc": {"ring": 3.2, "ringDmg": 0.7}}, parent: "wstomp", mutex: ["wstomp_crack"] },
      { id: "wstomp_crack", name: "Cracked Earth", icon: "🦶", desc: "The circle is difficult ground (slow 35%) for 3 s.", kind: "fork", x: 14, y: 4, mod: {"misc": {"zoneSlow": 0.35, "zoneDur": 3}}, parent: "wstomp", mutex: ["wstomp_wave"] },
      { id: "throwd", name: "Throw Down", icon: "🤼", desc: "Seize a target, slam it for 160%, and briefly stun (1 s).", kind: "skill", x: 16, y: 0, new: true, mp: 14, cd: 12, ranks: 5, fx: {"k": "hit", "dmg": 1.6, "stun": 1, "dist": 1.8} },
      { id: "throwd_enh", name: "Enhanced Throw Down", icon: "🤼", desc: "Reach +0.8 tiles.", kind: "enh", x: 16, y: 2, mod: {"dist": 0.8}, parent: "throwd" },
      { id: "throwd_maul", name: "Muling Slam", icon: "🤼", desc: "Nearby foes take 60% when the body hits.", kind: "fork", x: 15, y: 4, mod: {"misc": {"splash": 0.6}}, parent: "throwd", mutex: ["throwd_daze"] },
      { id: "throwd_daze", name: "Dazing Slam", icon: "🤼", desc: "The stun lasts 0.8 s longer on non-bosses.", kind: "fork", x: 17, y: 4, mod: {"stun": 0.8}, parent: "throwd", mutex: ["throwd_maul"] },
      { id: "w_p_grapple", name: "Grappler", icon: "🧲", desc: "Pull, charge and slam skills deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"brawlDmg": 8} },
      { id: "w_p_moment", name: "Momentum", icon: "➡️", desc: "After a dash skill, your next hit is 10/20/30% stronger.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"dashNext": 10} },
    ] },
    { id: "mastery", name: "Mastery", icon: "💎", gate: 11, blurb: "Deeper specializations and control.", nodes: [
      { id: "whirl", name: "Steel Tempest", icon: "🌀", desc: "Spin for 2 s: 55% damage every 0.4 s in a 2.2-tile radius.", kind: "skill", x: 1, y: 0, mp: 18, cd: 12, ranks: 5, fx: {"k": "spin", "dmg": 0.55, "rad": 2.2, "dur": 2, "tick": 0.4} },
      { id: "whirl_enh", name: "Enhanced Steel Tempest", icon: "🌀", desc: "Radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "whirl" },
      { id: "whirl_razor", name: "Razor Orbit", icon: "🌀", desc: "Each tick can critically strike.", kind: "fork", x: 0, y: 4, mod: {"misc": {"canCrit": 1}}, parent: "whirl", mutex: ["whirl_gyre"] },
      { id: "whirl_gyre", name: "Crushing Gyre", icon: "🌀", desc: "Foes in the spin are slowed 25%.", kind: "fork", x: 2, y: 4, mod: {"misc": {"slow": 0.25}}, parent: "whirl", mutex: ["whirl_razor"] },
      { id: "exec", name: "Execute", icon: "☠️", desc: "130% damage, or 260% if the target is below 25% HP.", kind: "skill", x: 4, y: 0, mp: 14, cd: 8, ranks: 5, fx: {"k": "hit", "dmg": 1.3, "misc": {"execTh": 0.25, "execMul": 2}} },
      { id: "exec_enh", name: "Enhanced Execute", icon: "☠️", desc: "The threshold is 30% HP.", kind: "enh", x: 4, y: 2, mod: {"misc": {"execTh": 0.05}}, parent: "exec" },
      { id: "exec_clean", name: "Clean Execute", icon: "☠️", desc: "Kills with this refund 30% of the cooldown.", kind: "fork", x: 3, y: 4, mod: {"misc": {"killRefund": 0.3}}, parent: "exec", mutex: ["exec_fear"] },
      { id: "exec_fear", name: "Grim Execute", icon: "☠️", desc: "Nearby wounded foes (below 30%) also take 80%.", kind: "fork", x: 5, y: 4, mod: {"misc": {"cleaveLow": 0.8}}, parent: "exec", mutex: ["exec_clean"] },
      { id: "qsplit", name: "Quake Split", icon: "〰️", desc: "A 6-tile fissure deals 150% to every foe in a line.", kind: "skill", x: 7, y: 0, new: true, mp: 16, cd: 12, ranks: 5, fx: {"k": "line", "dmg": 1.5, "dist": 6} },
      { id: "qsplit_enh", name: "Enhanced Quake Split", icon: "〰️", desc: "The fissure is wider (+0.4 tiles).", kind: "enh", x: 7, y: 2, mod: {"rad": 0.4}, parent: "qsplit" },
      { id: "qsplit_ridge", name: "Ridged Split", icon: "〰️", desc: "The line lingers 2 s and ticks 30%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"zoneDur": 2, "zoneTick": 0.3}}, parent: "qsplit", mutex: ["qsplit_upheave"] },
      { id: "qsplit_upheave", name: "Upheaval", icon: "〰️", desc: "Foes at the far end are stunned 1 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"endStun": 1}}, parent: "qsplit", mutex: ["qsplit_ridge"] },
      { id: "rslam", name: "Reverb Slam", icon: "🔊", desc: "140% smash around you, then a 90% aftershock 0.8 s later.", kind: "skill", x: 10, y: 0, new: true, mp: 16, cd: 13, ranks: 5, fx: {"k": "nova", "dmg": 1.4, "rad": 2.2, "misc": {"echo": 0.9, "echoDelay": 0.8}} },
      { id: "rslam_enh", name: "Enhanced Reverb Slam", icon: "🔊", desc: "Aftershock radius +0.5 tiles.", kind: "enh", x: 10, y: 2, mod: {"rad": 0.5}, parent: "rslam" },
      { id: "rslam_tune", name: "Tuned Reverb", icon: "🔊", desc: "The aftershock also slows 30% for 2 s.", kind: "fork", x: 9, y: 4, mod: {"misc": {"echoSlow": 0.3}}, parent: "rslam", mutex: ["rslam_crack"] },
      { id: "rslam_crack", name: "Cracked Reverb", icon: "🔊", desc: "If the first hit stuns, the aftershock is 130%.", kind: "fork", x: 11, y: 4, mod: {"misc": {"echoStunBonus": 0.4}}, parent: "rslam", mutex: ["rslam_tune"] },
      { id: "wbind", name: "Weapon Bind", icon: "⛓️", desc: "Bind a foe: they deal 35% less damage for 5 s and take 90% immediately.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "hit", "dmg": 0.9, "misc": {"atkDown": 0.35, "atkDownT": 5}} },
      { id: "wbind_enh", name: "Enhanced Weapon Bind", icon: "⛓️", desc: "The bind lasts 2 s longer.", kind: "enh", x: 13, y: 2, mod: {"dur": 2}, parent: "wbind" },
      { id: "wbind_break", name: "Binding Break", icon: "⛓️", desc: "When the bind ends, deal 80% again.", kind: "fork", x: 12, y: 4, mod: {"misc": {"endHit": 0.8}}, parent: "wbind", mutex: ["wbind_share"] },
      { id: "wbind_share", name: "Shared Bind", icon: "⛓️", desc: "A second nearby foe is bound for half duration.", kind: "fork", x: 14, y: 4, mod: {"misc": {"spread": 1}}, parent: "wbind", mutex: ["wbind_break"] },
      { id: "w_p_after", name: "Aftershock", icon: "🌋", desc: "Nova and line skills repeat 10/20/30% of their damage 0.6 s later.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"echoP": 10} },
      { id: "w_p_temper", name: "Tempered Edge", icon: "🔥", desc: "Mastery skills have 6/12/18% shorter cooldowns.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"mastCd": 6} },
    ] },
    { id: "ultimate", name: "Ultimate", icon: "☀️", gate: 16, blurb: "Long-cooldown signature skills.", nodes: [
      { id: "ebreak", name: "Earthbreaker", icon: "⛰️", desc: "Leap toward a point, then slam for 260% in a 3-tile crater and stun 1.5 s.", kind: "skill", x: 1, y: 0, new: true, mp: 24, cd: 22, ranks: 5, fx: {"k": "dash", "dist": 6, "dmg": 2.6, "rad": 3, "stun": 1.5} },
      { id: "ebreak_enh", name: "Enhanced Earthbreaker", icon: "⛰️", desc: "Crater radius +0.5 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.5}, parent: "ebreak" },
      { id: "ebreak_fault", name: "World Fault", icon: "⛰️", desc: "Three smaller craters erupt around the impact for 80%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"satellites": 3, "satDmg": 0.8}}, parent: "ebreak", mutex: ["ebreak_core"] },
      { id: "ebreak_core", name: "Core Breach", icon: "⛰️", desc: "Bosses are staggered at least 1 s; the crater burns 3 s.", kind: "fork", x: 2, y: 4, mod: {"misc": {"bossStun": 1, "burn": 3}}, parent: "ebreak", mutex: ["ebreak_fault"] },
      { id: "verdict", name: "Verdict", icon: "⚖️", desc: "Mark a foe for 5 s, then a 300% judgment (450% if they are below 35% HP).", kind: "skill", x: 4, y: 0, new: true, mp: 22, cd: 20, ranks: 5, fx: {"k": "hit", "dmg": 3.0, "misc": {"delay": 0.4, "execTh": 0.35, "execMul": 1.5}} },
      { id: "verdict_enh", name: "Enhanced Verdict", icon: "⚖️", desc: "The low-HP threshold is 40%.", kind: "enh", x: 4, y: 2, mod: {"misc": {"execTh": 0.05}}, parent: "verdict" },
      { id: "verdict_seal", name: "Sealed Verdict", icon: "⚖️", desc: "The mark slows 40% until it lands.", kind: "fork", x: 3, y: 4, mod: {"misc": {"markSlow": 0.4}}, parent: "verdict", mutex: ["verdict_spread"] },
      { id: "verdict_spread", name: "Shared Verdict", icon: "⚖️", desc: "If it kills, a nearby foe takes 150%.", kind: "fork", x: 5, y: 4, mod: {"misc": {"onKill": 1.5}}, parent: "verdict", mutex: ["verdict_seal"] },
      { id: "lbanner", name: "Last Banner", icon: "🎌", desc: "Plant a banner for 8 s: you and pets heal 3% HP per second and take 20% less damage in a 3.2-tile ring.", kind: "skill", x: 7, y: 0, new: true, mp: 20, cd: 24, ranks: 5, fx: {"k": "zone", "rad": 3.2, "dur": 8, "tick": 1, "heal": 0.03, "misc": {"dr": 0.2}} },
      { id: "lbanner_enh", name: "Enhanced Last Banner", icon: "🎌", desc: "The banner lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "lbanner" },
      { id: "lbanner_war", name: "War Banner", icon: "🎌", desc: "Allies in the ring also gain +25% ATK.", kind: "fork", x: 6, y: 4, mod: {"misc": {"atkMul": 0.25}}, parent: "lbanner", mutex: ["lbanner_stand"] },
      { id: "lbanner_stand", name: "Last Stand", icon: "🎌", desc: "The first time you would drop in the ring, survive at 1 HP (once).", kind: "fork", x: 8, y: 4, mod: {"misc": {"cheat": 1}}, parent: "lbanner", mutex: ["lbanner_war"] },
      { id: "w_p_epic", name: "Epic Resolve", icon: "⭐", desc: "Ultimate skills cost 8/16/24% less MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"ultMp": 8} },
    ] },
    { id: "key", name: "Key Passive", icon: "⭐", gate: 23, blurb: "Choose one keystone. You may respec later.", nodes: [
      { id: "w_k_titan", name: "Titan's Due", icon: "🏔️", desc: "After you stun a foe, your next hit within 4 s deals 35% more damage and cannot miss.", kind: "key", x: 1, y: 0, new: true, ranks: 1, misc: {"stunNext": 0.35} },
      { id: "w_k_unbroken", name: "Unbroken Line", icon: "🛡️", desc: "Whenever you use a Defensive skill, heal 8% HP and gain 4 DEF for 6 s.", kind: "key", x: 4, y: 0, new: true, ranks: 1, misc: {"defSkillHeal": 0.08} },
      { id: "w_k_hymn", name: "Slaughter Hymn", icon: "📯", desc: "While you are below 40% HP, Core skills deal 30% more damage and refund 1 s of cooldown.", kind: "key", x: 7, y: 0, new: true, ranks: 1, misc: {"lowCore": 0.3} },
    ] },
  ],
  mage: [
    { id: "basic", name: "Basic", icon: "⚔️", gate: 0, blurb: "Cheap, short-cooldown skills you can use while moving.", nodes: [
      { id: "fireball", name: "Fireball", icon: "🔥", desc: "220% fire damage + burn for 4.5 s.", kind: "skill", x: 1, y: 0, mp: 12, cd: 0, ranks: 5, fx: {"k": "hit", "dmg": 2.2, "misc": {"burn": 4.5}} },
      { id: "fireball_enh", name: "Enhanced Fireball", icon: "🔥", desc: "Burn lasts 1.5 s longer.", kind: "enh", x: 1, y: 2, mod: {"misc": {"burn": 1.5}}, parent: "fireball" },
      { id: "fire_cinder", name: "Cinder Fireball", icon: "🔥", desc: "The burn also slows 20%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"burnSlow": 0.2}}, parent: "fireball", mutex: ["fire_burst"] },
      { id: "fire_burst", name: "Burst Fireball", icon: "🔥", desc: "On impact, a 1.6-tile puff deals 50% to nearby foes.", kind: "fork", x: 2, y: 4, mod: {"misc": {"splash": 0.5, "splashRad": 1.6}}, parent: "fireball", mutex: ["fire_cinder"] },
      { id: "edart", name: "Ember Dart", icon: "✨", desc: "A quick 80% ember that applies a 2 s burn.", kind: "skill", x: 4, y: 0, new: true, mp: 6, cd: 3, ranks: 5, fx: {"k": "proj", "dmg": 0.8, "dist": 6, "misc": {"burn": 2}} },
      { id: "edart_enh", name: "Enhanced Ember Dart", icon: "✨", desc: "Cooldown is 0.6 s shorter.", kind: "enh", x: 4, y: 2, mod: {"cd": 0.6}, parent: "edart" },
      { id: "edart_twin", name: "Twin Embers", icon: "✨", desc: "Loose a second dart at 50%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"extra": 0.5}}, parent: "edart", mutex: ["edart_spark"] },
      { id: "edart_spark", name: "Spark Dart", icon: "✨", desc: "If the target is already burning, deal 120% instead.", kind: "fork", x: 5, y: 4, mod: {"misc": {"burnBonus": 0.4}}, parent: "edart", mutex: ["edart_twin"] },
      { id: "fshard", name: "Frost Shard", icon: "❄️", desc: "90% ice bolt that slows 30% for 3 s.", kind: "skill", x: 7, y: 0, new: true, mp: 7, cd: 4, ranks: 5, fx: {"k": "proj", "dmg": 0.9, "dist": 6, "misc": {"slow": 0.3, "slowT": 3}} },
      { id: "fshard_enh", name: "Enhanced Frost Shard", icon: "❄️", desc: "Slow lasts 1 s longer.", kind: "enh", x: 7, y: 2, mod: {"misc": {"slowT": 1}}, parent: "fshard" },
      { id: "fshard_pierce", name: "Piercing Shard", icon: "❄️", desc: "The shard continues through one foe.", kind: "fork", x: 6, y: 4, mod: {"misc": {"pierce": 1}}, parent: "fshard", mutex: ["fshard_rime"] },
      { id: "fshard_rime", name: "Rime Shard", icon: "❄️", desc: "If the target is already slowed, freeze it 1 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"freezeIfSlow": 1}}, parent: "fshard", mutex: ["fshard_pierce"] },
      { id: "m_p_kindle", name: "Kindling", icon: "🔥", desc: "Burns you apply last 10/20/30% longer.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"burnP": 10} },
      { id: "m_p_aim", name: "Steady Aim", icon: "🎯", desc: "Basic projectiles deal 6/12/18% more damage.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"basicDmg": 6} },
    ] },
    { id: "core", name: "Core", icon: "✴️", gate: 2, blurb: "Your main damage and pressure tools.", nodes: [
      { id: "nova", name: "Frost Nova", icon: "❄️", desc: "120% to ALL enemies, freezes for 3 s.", kind: "skill", x: 1, y: 0, mp: 16, cd: 10, ranks: 5, fx: {"k": "nova", "dmg": 1.2, "rad": 4.5, "stun": 3} },
      { id: "nova_enh", name: "Enhanced Frost Nova", icon: "❄️", desc: "Freeze lasts 0.6 s longer.", kind: "enh", x: 1, y: 2, mod: {"stun": 0.6}, parent: "nova" },
      { id: "nova_shatter", name: "Shatter Nova", icon: "❄️", desc: "When freeze ends, foes take 60%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"endHit": 0.6}}, parent: "nova", mutex: ["nova_rim"] },
      { id: "nova_rim", name: "Rim Nova", icon: "❄️", desc: "A second icy ring hits at the edge for 50%.", kind: "fork", x: 2, y: 4, mod: {"misc": {"ring": 1, "ringDmg": 0.5}}, parent: "nova", mutex: ["nova_shatter"] },
      { id: "missiles", name: "Arcane Missiles", icon: "🔮", desc: "Three 70% missiles at the current or nearest foes.", kind: "skill", x: 4, y: 0, mp: 14, cd: 6, ranks: 5, fx: {"k": "missiles", "dmg": 0.7, "n": 3} },
      { id: "missiles_enh", name: "Enhanced Arcane Missiles", icon: "🔮", desc: "Fire a fourth missile.", kind: "enh", x: 4, y: 2, mod: {"misc": {"n": 1}}, parent: "missiles" },
      { id: "mis_seek", name: "Seeking Missiles", icon: "🔮", desc: "Missiles retarget if their foe dies mid-flight.", kind: "fork", x: 3, y: 4, mod: {"misc": {"seek": 1}}, parent: "missiles", mutex: ["mis_splinter"] },
      { id: "mis_splinter", name: "Splinter Missiles", icon: "🔮", desc: "Each missile splits 30% to a nearby foe.", kind: "fork", x: 5, y: 4, mod: {"misc": {"split": 0.3}}, parent: "missiles", mutex: ["mis_seek"] },
      { id: "chain", name: "Chain Lightning", icon: "⚡", desc: "Hit up to 4 enemies; 115% then 75% per bounce.", kind: "skill", x: 7, y: 0, mp: 16, cd: 6, ranks: 5, fx: {"k": "chain", "dmg": 1.15, "n": 4, "fade": 0.75} },
      { id: "chain_enh", name: "Enhanced Chain Lightning", icon: "⚡", desc: "Can bounce to one more foe.", kind: "enh", x: 7, y: 2, mod: {"misc": {"n": 1}}, parent: "chain" },
      { id: "chain_fork", name: "Forked Surge", icon: "⚡", desc: "The first bounce also hits a second nearby foe at 60%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"fork": 0.6}}, parent: "chain", mutex: ["chain_clap"] },
      { id: "chain_clap", name: "Thunderclap", icon: "⚡", desc: "The first target is stunned 0.8 s.", kind: "fork", x: 8, y: 4, mod: {"stun": 0.8}, parent: "chain", mutex: ["chain_fork"] },
      { id: "flance", name: "Flame Lance", icon: "🔱", desc: "A 4.5-tile lance of fire: 140% to all foes in a line, plus a 3 s burn.", kind: "skill", x: 10, y: 0, new: true, mp: 14, cd: 8, ranks: 5, fx: {"k": "line", "dmg": 1.4, "dist": 4.5, "misc": {"burn": 3}} },
      { id: "flance_enh", name: "Enhanced Flame Lance", icon: "🔱", desc: "The line reaches 1 tile farther.", kind: "enh", x: 10, y: 2, mod: {"dist": 1}, parent: "flance" },
      { id: "flance_bore", name: "Boring Lance", icon: "🔱", desc: "The first foe takes 180%.", kind: "fork", x: 9, y: 4, mod: {"misc": {"firstBonus": 0.4}}, parent: "flance", mutex: ["flance_oil"] },
      { id: "flance_oil", name: "Oil Lance", icon: "🔱", desc: "Burning foes also spread a 1.4-tile burn puff.", kind: "fork", x: 11, y: 4, mod: {"misc": {"spreadBurn": 1.4}}, parent: "flance", mutex: ["flance_bore"] },
      { id: "rspike", name: "Rime Spike", icon: "🧊", desc: "135% ice spike. If the target is frozen or slowed, deal 180% and shatter the slow.", kind: "skill", x: 13, y: 0, new: true, mp: 14, cd: 9, ranks: 5, fx: {"k": "hit", "dmg": 1.35, "misc": {"slowBonus": 0.45}} },
      { id: "rspike_enh", name: "Enhanced Rime Spike", icon: "🧊", desc: "The bonus also applies vs stunned foes.", kind: "enh", x: 13, y: 2, mod: {"misc": {"statusBonus": 1}}, parent: "rspike" },
      { id: "rspike_grid", name: "Grid Spike", icon: "🧊", desc: "Icicles strike two nearby foes for 60%.", kind: "fork", x: 12, y: 4, mod: {"misc": {"splash": 0.6}}, parent: "rspike", mutex: ["rspike_lock"] },
      { id: "rspike_lock", name: "Locking Spike", icon: "🧊", desc: "Re-apply a 2 s slow after the hit.", kind: "fork", x: 14, y: 4, mod: {"misc": {"slow": 0.3, "slowT": 2}}, parent: "rspike", mutex: ["rspike_grid"] },
      { id: "m_p_conduct", name: "Conductor", icon: "⚡", desc: "Chain and line skills deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"lineDmg": 8} },
      { id: "m_p_cold", name: "Cold Focus", icon: "❄️", desc: "Slows you apply are 8/16/24% stronger.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"slowP": 8} },
    ] },
    { id: "defensive", name: "Defensive", icon: "🛡️", gate: 6, blurb: "Wards, peels and ways to stay standing.", nodes: [
      { id: "arcane", name: "Arcane Shield", icon: "🔮", desc: "Absorb shield worth 40% of max MP.", kind: "skill", x: 1, y: 0, mp: 10, cd: 14, ranks: 5, fx: {"k": "shield", "pctMp": 0.4} },
      { id: "arcane_enh", name: "Enhanced Arcane Shield", icon: "🔮", desc: "The shield is 10% larger.", kind: "enh", x: 1, y: 2, mod: {"misc": {"pctMp": 0.1}}, parent: "arcane" },
      { id: "arc_prism", name: "Prism Shield", icon: "🔮", desc: "While it holds, you take 10% less damage after the shield.", kind: "fork", x: 0, y: 4, mod: {"misc": {"dr": 0.1}}, parent: "arcane", mutex: ["arc_bloom"] },
      { id: "arc_bloom", name: "Bloom Shield", icon: "🔮", desc: "When it breaks, deal 80% in a 2-tile burst.", kind: "fork", x: 2, y: 4, mod: {"misc": {"breakNova": 0.8}}, parent: "arcane", mutex: ["arc_prism"] },
      { id: "blink", name: "Blink", icon: "✨", desc: "Teleport 4 tiles in your move direction and drop distant aggro.", kind: "skill", x: 4, y: 0, mp: 10, cd: 8, ranks: 5, fx: {"k": "blink", "dist": 4} },
      { id: "blink_enh", name: "Enhanced Blink", icon: "✨", desc: "Range +1 tile.", kind: "enh", x: 4, y: 2, mod: {"dist": 1}, parent: "blink" },
      { id: "blink_trail", name: "Trail Blink", icon: "✨", desc: "Leave a 2 s after-image that foes may swing at.", kind: "fork", x: 3, y: 4, mod: {"misc": {"decoy": 2}}, parent: "blink", mutex: ["blink_frost"] },
      { id: "blink_frost", name: "Frost Blink", icon: "✨", desc: "Foes near your landing are slowed 30% for 2 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"landSlow": 0.3}}, parent: "blink", mutex: ["blink_trail"] },
      { id: "prism", name: "Prism Shell", icon: "💠", desc: "For 5 s, the next three hits you take are reduced by 40%.", kind: "skill", x: 7, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "buff", "key": "prism", "dur": 5, "misc": {"hits": 3, "dr": 0.4}} },
      { id: "prism_enh", name: "Enhanced Prism Shell", icon: "💠", desc: "Absorbs a fourth hit.", kind: "enh", x: 7, y: 2, mod: {"misc": {"hits": 1}}, parent: "prism" },
      { id: "prism_flare", name: "Flare Shell", icon: "💠", desc: "Each absorbed hit flashes 40% to the attacker.", kind: "fork", x: 6, y: 4, mod: {"misc": {"thorns": 0.4}}, parent: "prism", mutex: ["prism_store"] },
      { id: "prism_store", name: "Stored Shell", icon: "💠", desc: "When it ends, heal 4% HP per remaining charge.", kind: "fork", x: 8, y: 4, mod: {"misc": {"endHealCharge": 0.04}}, parent: "prism", mutex: ["prism_flare"] },
      { id: "mward", name: "Mana Ward", icon: "🔷", desc: "Convert 12% of max MP into a ward that lasts 6 s (unused MP is refunded as 50% HP).", kind: "skill", x: 10, y: 0, new: true, mp: 10, cd: 12, ranks: 5, fx: {"k": "shield", "pctMp": 0.12, "dur": 6} },
      { id: "mward_enh", name: "Enhanced Mana Ward", icon: "🔷", desc: "The ward is 4% larger.", kind: "enh", x: 10, y: 2, mod: {"misc": {"pctMp": 0.04}}, parent: "mward" },
      { id: "mward_loop", name: "Looping Ward", icon: "🔷", desc: "If the ward expires unused, refund 30% of the cooldown.", kind: "fork", x: 9, y: 4, mod: {"misc": {"refundCd": 0.3}}, parent: "mward", mutex: ["mward_surge"] },
      { id: "mward_surge", name: "Surge Ward", icon: "🔷", desc: "While it holds, your next spell deals 15% more.", kind: "fork", x: 11, y: 4, mod: {"misc": {"spellDmg": 0.15}}, parent: "mward", mutex: ["mward_loop"] },
      { id: "pveil", name: "Phase Veil", icon: "🌫️", desc: "For 2.5 s, ranged projectiles pass through you.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 16, ranks: 5, fx: {"k": "buff", "key": "pveil", "dur": 2.5, "misc": {"projImmune": 1}} },
      { id: "pveil_enh", name: "Enhanced Phase Veil", icon: "🌫️", desc: "Lasts 0.7 s longer.", kind: "enh", x: 13, y: 2, mod: {"dur": 0.7}, parent: "pveil" },
      { id: "pveil_step", name: "Stepping Veil", icon: "🌫️", desc: "You may Blink once for free during the veil.", kind: "fork", x: 12, y: 4, mod: {"misc": {"freeBlink": 1}}, parent: "pveil", mutex: ["pveil_sting"] },
      { id: "pveil_sting", name: "Stinging Veil", icon: "🌫️", desc: "Moving through a foe deals 70%.", kind: "fork", x: 14, y: 4, mod: {"misc": {"passDmg": 0.7}}, parent: "pveil", mutex: ["pveil_step"] },
      { id: "m_p_mind", name: "Mind Lattice", icon: "🧠", desc: "+8/16/24 max MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"mp": 8} },
      { id: "m_p_warded", name: "Warded Flesh", icon: "💠", desc: "After using a Defensive skill, take 6/12/18% less damage for 3 s.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"defDr": 6} },
    ] },
    { id: "flavor", name: "Conjuration", icon: "📜", gate: 8, blurb: "Class-defining conjuration techniques.", nodes: [
      { id: "gwell", name: "Gravity Well", icon: "🌌", desc: "4 s pull and 50% slow in a 2.8-tile well.", kind: "skill", x: 1, y: 0, mp: 16, cd: 14, ranks: 5, fx: {"k": "zone", "rad": 2.8, "dur": 4, "tick": 0.5, "dmg": 0.2, "slow": 0.5, "misc": {"pull": 1}} },
      { id: "gwell_enh", name: "Enhanced Gravity Well", icon: "🌌", desc: "Radius +0.5 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.5}, parent: "gwell" },
      { id: "gwell_crush", name: "Crushing Well", icon: "🌌", desc: "Each tick deals 35% instead of 20%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"tickDmg": 0.15}}, parent: "gwell", mutex: ["gwell_lock"] },
      { id: "gwell_lock", name: "Locking Well", icon: "🌌", desc: "Foes in the well are rooted for the last second.", kind: "fork", x: 2, y: 4, mod: {"misc": {"endRoot": 1}}, parent: "gwell", mutex: ["gwell_crush"] },
      { id: "poly", name: "Polymorph", icon: "🐑", desc: "Turn a non-boss enemy harmless for 4 s.", kind: "skill", x: 4, y: 0, mp: 18, cd: 20, ranks: 5, fx: {"k": "hex", "dur": 4} },
      { id: "poly_enh", name: "Enhanced Polymorph", icon: "🐑", desc: "Lasts 1 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 1}, parent: "poly" },
      { id: "poly_brittle", name: "Brittle Hex", icon: "🐑", desc: "When it ends, the foe takes 90%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"endHit": 0.9}}, parent: "poly", mutex: ["poly_herd"] },
      { id: "poly_herd", name: "Herd Hex", icon: "🐑", desc: "A second nearby non-boss is hexed for 2 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"spread": 2}}, parent: "poly", mutex: ["poly_brittle"] },
      { id: "iwall", name: "Ice Wall", icon: "🧊", desc: "Raise a blocking barrier in front of you for 5 s.", kind: "skill", x: 7, y: 0, mp: 16, cd: 16, ranks: 5, fx: {"k": "wall", "dur": 5} },
      { id: "iwall_enh", name: "Enhanced Ice Wall", icon: "🧊", desc: "The wall lasts 1.5 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 1.5}, parent: "iwall" },
      { id: "iwall_spikes", name: "Spiked Wall", icon: "🧊", desc: "Foes that touch it take 70% and are slowed 2 s.", kind: "fork", x: 6, y: 4, mod: {"misc": {"touch": 0.7}}, parent: "iwall", mutex: ["iwall_shatter"] },
      { id: "iwall_shatter", name: "Shatter Wall", icon: "🧊", desc: "When it falls, a 2-tile burst deals 100%.", kind: "fork", x: 8, y: 4, mod: {"misc": {"breakNova": 1.0}}, parent: "iwall", mutex: ["iwall_spikes"] },
      { id: "sfam", name: "Stone Familiar", icon: "🗿", desc: "Summon a stone companion for 8 s that taunts and deals 40% every 1.2 s.", kind: "skill", x: 10, y: 0, new: true, mp: 16, cd: 18, ranks: 5, fx: {"k": "summon", "dur": 8, "dmg": 0.4, "tick": 1.2, "misc": {"taunt": 1}} },
      { id: "sfam_enh", name: "Enhanced Stone Familiar", icon: "🗿", desc: "It lasts 2 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 2}, parent: "sfam" },
      { id: "sfam_bulwark", name: "Bulwark Familiar", icon: "🗿", desc: "You take 15% less damage while it lives.", kind: "fork", x: 9, y: 4, mod: {"misc": {"dr": 0.15}}, parent: "sfam", mutex: ["sfam_crack"] },
      { id: "sfam_crack", name: "Cracking Familiar", icon: "🗿", desc: "When it ends, it explodes for 120%.", kind: "fork", x: 11, y: 4, mod: {"misc": {"endNova": 1.2}}, parent: "sfam", mutex: ["sfam_bulwark"] },
      { id: "lspark", name: "Living Sparks", icon: "⚡", desc: "Three sparks orbit you for 5 s, each zapping a nearby foe for 45% once per second.", kind: "skill", x: 13, y: 0, new: true, mp: 14, cd: 12, ranks: 5, fx: {"k": "orbit", "n": 3, "dmg": 0.45, "dur": 5, "tick": 1} },
      { id: "lspark_enh", name: "Enhanced Living Sparks", icon: "⚡", desc: "A fourth spark joins the orbit.", kind: "enh", x: 13, y: 2, mod: {"misc": {"n": 1}}, parent: "lspark" },
      { id: "lspark_storm", name: "Storm Sparks", icon: "⚡", desc: "Zaps can bounce once at 30%.", kind: "fork", x: 12, y: 4, mod: {"misc": {"bounce": 1, "bounceDmg": 0.3}}, parent: "lspark", mutex: ["lspark_heat"] },
      { id: "lspark_heat", name: "Heat Sparks", icon: "⚡", desc: "Each zap applies a 2 s burn.", kind: "fork", x: 14, y: 4, mod: {"misc": {"burn": 2}}, parent: "lspark", mutex: ["lspark_storm"] },
      { id: "bsigil", name: "Binding Sigil", icon: "🔯", desc: "Place a sigil for 5 s. Foes in 2.4 tiles are slowed 35% and take 40% every second.", kind: "skill", x: 16, y: 0, new: true, mp: 14, cd: 14, ranks: 5, fx: {"k": "zone", "rad": 2.4, "dur": 5, "tick": 1, "dmg": 0.4, "slow": 0.35} },
      { id: "bsigil_enh", name: "Enhanced Binding Sigil", icon: "🔯", desc: "Radius +0.4 tiles.", kind: "enh", x: 16, y: 2, mod: {"rad": 0.4}, parent: "bsigil" },
      { id: "bsigil_tether", name: "Tethered Sigil", icon: "🔯", desc: "Foes are pulled 1 tile toward the center each tick.", kind: "fork", x: 15, y: 4, mod: {"misc": {"pull": 1}}, parent: "bsigil", mutex: ["bsigil_seal"] },
      { id: "bsigil_seal", name: "Sealing Sigil", icon: "🔯", desc: "The first foe to enter is silenced from specials for 2 s.", kind: "fork", x: 17, y: 4, mod: {"misc": {"silence": 2}}, parent: "bsigil", mutex: ["bsigil_tether"] },
      { id: "m_p_conjure", name: "Conjurer's Craft", icon: "📜", desc: "Zones and summons last 10/20/30% longer.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"zoneDur": 10} },
      { id: "m_p_bind", name: "Tight Bindings", icon: "🔗", desc: "Slows and hexes last 8/16/24% longer.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"ccDur": 8} },
    ] },
    { id: "mastery", name: "Mastery", icon: "💎", gate: 11, blurb: "Deeper specializations and control.", nodes: [
      { id: "meteor", name: "Meteor", icon: "☄️", desc: "After 0.9 s, 220% impact (r 2.4) then a 3 s burn patch.", kind: "skill", x: 1, y: 0, mp: 22, cd: 14, ranks: 5, fx: {"k": "meteor", "dmg": 2.2, "rad": 2.4, "delay": 0.9, "misc": {"burnZone": 3}} },
      { id: "meteor_enh", name: "Enhanced Meteor", icon: "☄️", desc: "Impact radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "meteor" },
      { id: "meteor_fiery", name: "Fiery Meteor", icon: "☄️", desc: "The burn patch lasts 2 s longer and ticks harder.", kind: "fork", x: 0, y: 4, mod: {"misc": {"burnZone": 2, "tickDmg": 0.15}}, parent: "meteor", mutex: ["meteor_shatter"] },
      { id: "meteor_shatter", name: "Shattering Meteor", icon: "☄️", desc: "The impact stuns 1.2 s and skips the patch.", kind: "fork", x: 2, y: 4, mod: {"stun": 1.2, "misc": {"noPatch": 1}}, parent: "meteor", mutex: ["meteor_fiery"] },
      { id: "pbeam", name: "Piercing Beam", icon: "📡", desc: "A 7-tile beam deals 130% to every foe in a line.", kind: "skill", x: 4, y: 0, new: true, mp: 16, cd: 10, ranks: 5, fx: {"k": "line", "dmg": 1.3, "dist": 7} },
      { id: "pbeam_enh", name: "Enhanced Piercing Beam", icon: "📡", desc: "The beam is wider.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.3}, parent: "pbeam" },
      { id: "pbeam_over", name: "Overcharged Beam", icon: "📡", desc: "The first two foes take 160%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"firstN": 2, "firstBonus": 0.3}}, parent: "pbeam", mutex: ["pbeam_lens"] },
      { id: "pbeam_lens", name: "Lensed Beam", icon: "📡", desc: "The far end explodes for 70% in 1.6 tiles.", kind: "fork", x: 5, y: 4, mod: {"misc": {"endNova": 0.7}}, parent: "pbeam", mutex: ["pbeam_over"] },
      { id: "oshards", name: "Orbital Shards", icon: "💎", desc: "Four shards fly out, then return: 60% each way.", kind: "skill", x: 7, y: 0, new: true, mp: 16, cd: 12, ranks: 5, fx: {"k": "orbit", "n": 4, "dmg": 0.6, "dur": 1.6, "tick": 0.8, "misc": {"return": 1}} },
      { id: "oshards_enh", name: "Enhanced Orbital Shards", icon: "💎", desc: "Each shard deals 15% more.", kind: "enh", x: 7, y: 2, mod: {"dmg": 0.15}, parent: "oshards" },
      { id: "oshards_razor", name: "Razor Shards", icon: "💎", desc: "Shards can critically strike.", kind: "fork", x: 6, y: 4, mod: {"misc": {"canCrit": 1}}, parent: "oshards", mutex: ["oshards_frost"] },
      { id: "oshards_frost", name: "Frosted Shards", icon: "💎", desc: "Hits slow 20% for 2 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"slow": 0.2, "slowT": 2}}, parent: "oshards", mutex: ["oshards_razor"] },
      { id: "rseal", name: "Rift Seal", icon: "🕳️", desc: "Open a 2.6-tile rift for 4 s that eats projectiles and deals 50% per second to foes inside.", kind: "skill", x: 10, y: 0, new: true, mp: 18, cd: 16, ranks: 5, fx: {"k": "zone", "rad": 2.6, "dur": 4, "tick": 1, "dmg": 0.5, "misc": {"eatProj": 1}} },
      { id: "rseal_enh", name: "Enhanced Rift Seal", icon: "🕳️", desc: "The rift lasts 1 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 1}, parent: "rseal" },
      { id: "rseal_hunger", name: "Hungry Rift", icon: "🕳️", desc: "When it closes, deal 100% to remaining foes inside.", kind: "fork", x: 9, y: 4, mod: {"misc": {"endHit": 1.0}}, parent: "rseal", mutex: ["rseal_anchor"] },
      { id: "rseal_anchor", name: "Anchored Rift", icon: "🕳️", desc: "Foes inside are slowed 40%.", kind: "fork", x: 11, y: 4, mod: {"misc": {"slow": 0.4}}, parent: "rseal", mutex: ["rseal_hunger"] },
      { id: "m_p_impact", name: "Heavy Impact", icon: "☄️", desc: "Nova and meteor skills deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"novaDmg": 8} },
      { id: "m_p_focus", name: "Arcane Focus", icon: "🔮", desc: "Mastery skills have 6/12/18% shorter cooldowns.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"mastCd": 6} },
    ] },
    { id: "ultimate", name: "Ultimate", icon: "☀️", gate: 16, blurb: "Long-cooldown signature skills.", nodes: [
      { id: "skyfall", name: "Skyfall", icon: "🌠", desc: "Call three staggered meteors (0.4 s apart), each 160% in a 2-tile blast.", kind: "skill", x: 1, y: 0, new: true, mp: 26, cd: 24, ranks: 5, fx: {"k": "meteor", "dmg": 1.6, "rad": 2.0, "delay": 0.5, "misc": {"count": 3, "gap": 0.4}} },
      { id: "skyfall_enh", name: "Enhanced Skyfall", icon: "🌠", desc: "Each blast radius +0.3 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.3}, parent: "skyfall" },
      { id: "skyfall_hail", name: "Hail of Stone", icon: "🌠", desc: "A fourth meteor falls.", kind: "fork", x: 0, y: 4, mod: {"misc": {"count": 1}}, parent: "skyfall", mutex: ["skyfall_glass"] },
      { id: "skyfall_glass", name: "Glass Sky", icon: "🌠", desc: "Blasts stun 0.8 s and leave brief slow fields.", kind: "fork", x: 2, y: 4, mod: {"stun": 0.8, "misc": {"zoneSlow": 0.3}}, parent: "skyfall", mutex: ["skyfall_hail"] },
      { id: "tfrac", name: "Time Fracture", icon: "⌛", desc: "For 5 s, foes within 4 tiles move and attack 40% slower, and your spells deal 20% more.", kind: "skill", x: 4, y: 0, new: true, mp: 22, cd: 22, ranks: 5, fx: {"k": "zone", "rad": 4, "dur": 5, "tick": 1, "slow": 0.4, "misc": {"spellDmg": 0.2}} },
      { id: "tfrac_enh", name: "Enhanced Time Fracture", icon: "⌛", desc: "Lasts 1.5 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 1.5}, parent: "tfrac" },
      { id: "tfrac_echo", name: "Echo Fracture", icon: "⌛", desc: "Your next spell is recast at 50% a beat later.", kind: "fork", x: 3, y: 4, mod: {"misc": {"echoSpell": 0.5}}, parent: "tfrac", mutex: ["tfrac_lock"] },
      { id: "tfrac_lock", name: "Locked Moment", icon: "⌛", desc: "One foe in the field is frozen 1.5 s when it starts.", kind: "fork", x: 5, y: 4, mod: {"stun": 1.5}, parent: "tfrac", mutex: ["tfrac_echo"] },
      { id: "anomaly", name: "Anomaly", icon: "🌀", desc: "Create a 3.2-tile anomaly for 6 s: pull, 40% per second, and at the end a 200% burst.", kind: "skill", x: 7, y: 0, new: true, mp: 24, cd: 26, ranks: 5, fx: {"k": "zone", "rad": 3.2, "dur": 6, "tick": 1, "dmg": 0.4, "misc": {"pull": 1, "endNova": 2.0}} },
      { id: "anomaly_enh", name: "Enhanced Anomaly", icon: "🌀", desc: "The burst is 40% stronger.", kind: "enh", x: 7, y: 2, mod: {"misc": {"endNova": 0.4}}, parent: "anomaly" },
      { id: "anomaly_void", name: "Void Anomaly", icon: "🌀", desc: "The pull is stronger and slows 50%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"slow": 0.5}}, parent: "anomaly", mutex: ["anomaly_flare"] },
      { id: "anomaly_flare", name: "Flare Anomaly", icon: "🌀", desc: "The burst also burns for 4 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"burn": 4}}, parent: "anomaly", mutex: ["anomaly_void"] },
      { id: "m_p_epic", name: "Grand Design", icon: "⭐", desc: "Ultimate skills cost 8/16/24% less MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"ultMp": 8} },
    ] },
    { id: "key", name: "Key Passive", icon: "⭐", gate: 23, blurb: "Choose one keystone. You may respec later.", nodes: [
      { id: "m_k_cinder", name: "Cinderheart", icon: "🔥", desc: "Burns you apply also deal 20% of ATK when first applied, and burning foes take 10% more from you.", kind: "key", x: 1, y: 0, new: true, ranks: 1, misc: {"burnSnap": 0.2, "burnVuln": 0.1} },
      { id: "m_k_still", name: "Still Air", icon: "❄️", desc: "Whenever you freeze or slow a foe, gain 6% MP. Frozen foes take 20% more from your next hit.", kind: "key", x: 4, y: 0, new: true, ranks: 1, misc: {"ccMana": 0.06, "freezeVuln": 0.2} },
      { id: "m_k_weave", name: "Weave of Cores", icon: "🔮", desc: "After you cast a Core skill, your next Basic skill is instant (no cooldown) and deals 25% more.", kind: "key", x: 7, y: 0, new: true, ranks: 1, misc: {"coreBasic": 0.25} },
    ] },
  ],
  rogue: [
    { id: "basic", name: "Basic", icon: "⚔️", gate: 0, blurb: "Cheap, short-cooldown skills you can use while moving.", nodes: [
      { id: "backstab", name: "Backstab", icon: "🗡️", desc: "220% damage; guaranteed crit in the first 3 s of a fight or vs stunned.", kind: "skill", x: 1, y: 0, mp: 8, cd: 5, ranks: 5, fx: {"k": "hit", "dmg": 2.2, "misc": {"openCrit": 3}} },
      { id: "backstab_enh", name: "Enhanced Backstab", icon: "🗡️", desc: "The opening crit window lasts 1 s longer.", kind: "enh", x: 1, y: 2, mod: {"misc": {"openCrit": 1}}, parent: "backstab" },
      { id: "back_twist", name: "Twisting Stab", icon: "🗡️", desc: "If it crits, apply a 3 s bleed.", kind: "fork", x: 0, y: 4, mod: {"misc": {"bleed": 3}}, parent: "backstab", mutex: ["back_fade"] },
      { id: "back_fade", name: "Fading Stab", icon: "🗡️", desc: "After a crit, gain 1 s of Evade-like slip (next hit misses).", kind: "fork", x: 2, y: 4, mod: {"misc": {"slip": 1}}, parent: "backstab", mutex: ["back_twist"] },
      { id: "poison", name: "Poison Blade", icon: "🧪", desc: "100% damage + strong poison for 6 s.", kind: "skill", x: 4, y: 0, mp: 8, cd: 6, ranks: 5, fx: {"k": "hit", "dmg": 1.0, "misc": {"poison": 6}} },
      { id: "poison_enh", name: "Enhanced Poison Blade", icon: "🧪", desc: "Poison lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"misc": {"poison": 2}}, parent: "poison" },
      { id: "pois_viru", name: "Virulent Blade", icon: "🧪", desc: "Poison spreads to a nearby foe at half duration.", kind: "fork", x: 3, y: 4, mod: {"misc": {"spread": 0.5}}, parent: "poison", mutex: ["pois_deep"] },
      { id: "pois_deep", name: "Deep Toxin", icon: "🧪", desc: "Poisoned foes take 10% more from you.", kind: "fork", x: 5, y: 4, mod: {"misc": {"vuln": 0.1}}, parent: "poison", mutex: ["pois_viru"] },
      { id: "qcut", name: "Quiet Cut", icon: "🤫", desc: "A 90% nick that does not wake sleeping monsters if it kills.", kind: "skill", x: 7, y: 0, new: true, mp: 6, cd: 4, ranks: 5, fx: {"k": "hit", "dmg": 0.9, "misc": {"quiet": 1}} },
      { id: "qcut_enh", name: "Enhanced Quiet Cut", icon: "🤫", desc: "Damage +15%.", kind: "enh", x: 7, y: 2, mod: {"dmg": 0.15}, parent: "qcut" },
      { id: "qcut_bleed", name: "Hushing Bleed", icon: "🤫", desc: "Applies a 3 s bleed.", kind: "fork", x: 6, y: 4, mod: {"misc": {"bleed": 3}}, parent: "qcut", mutex: ["qcut_step"] },
      { id: "qcut_step", name: "Hushing Step", icon: "🤫", desc: "After a quiet kill, your next Umbral Step has no cooldown.", kind: "fork", x: 8, y: 4, mod: {"misc": {"resetSstep": 1}}, parent: "qcut", mutex: ["qcut_bleed"] },
      { id: "nflick", name: "Needle Flick", icon: "📌", desc: "Flick a 70% needle up to 5 tiles. Cheap and quick.", kind: "skill", x: 10, y: 0, new: true, mp: 6, cd: 3, ranks: 5, fx: {"k": "proj", "dmg": 0.7, "dist": 5} },
      { id: "nflick_enh", name: "Enhanced Needle Flick", icon: "📌", desc: "Cooldown is 0.5 s shorter.", kind: "enh", x: 10, y: 2, mod: {"cd": 0.5}, parent: "nflick" },
      { id: "nflick_pin", name: "Pinning Needle", icon: "📌", desc: "Slows 25% for 2 s.", kind: "fork", x: 9, y: 4, mod: {"misc": {"slow": 0.25, "slowT": 2}}, parent: "nflick", mutex: ["nflick_twin"] },
      { id: "nflick_twin", name: "Twin Needles", icon: "📌", desc: "Loose a second needle at 50%.", kind: "fork", x: 11, y: 4, mod: {"misc": {"extra": 0.5}}, parent: "nflick", mutex: ["nflick_pin"] },
      { id: "r_p_edge", name: "Keen Edge", icon: "🗡️", desc: "Basic skills deal 6/12/18% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"basicDmg": 6} },
      { id: "r_p_quiet", name: "Soft Sole", icon: "👣", desc: "Opening-window bonuses last 10/20/30% longer.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"openP": 10} },
    ] },
    { id: "core", name: "Core", icon: "✴️", gate: 2, blurb: "Your main damage and pressure tools.", nodes: [
      { id: "fan", name: "Thrown Blades", icon: "🗡️", desc: "85% radial burst (r 3.2) that applies poison for 3 s.", kind: "skill", x: 1, y: 0, mp: 14, cd: 9, ranks: 5, fx: {"k": "nova", "dmg": 0.85, "rad": 3.2, "misc": {"poison": 3}} },
      { id: "fan_enh", name: "Enhanced Thrown Blades", icon: "🗡️", desc: "Radius +0.5 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.5}, parent: "fan" },
      { id: "fan_venom", name: "Venom Spray", icon: "🗡️", desc: "Poison lasts 2 s longer and is stronger.", kind: "fork", x: 0, y: 4, mod: {"misc": {"poison": 2}}, parent: "fan", mutex: ["fan_seek"] },
      { id: "fan_seek", name: "Seeker Spread", icon: "🗡️", desc: "Blades prefer marked foes and deal 20% more to them.", kind: "fork", x: 2, y: 4, mod: {"misc": {"markBonus": 0.2}}, parent: "fan", mutex: ["fan_venom"] },
      { id: "shuri", name: "Shuriken Ricochet", icon: "✴️", desc: "80% shuriken that bounces up to 3 times.", kind: "skill", x: 4, y: 0, mp: 12, cd: 8, ranks: 5, fx: {"k": "proj", "dmg": 0.8, "dist": 6, "misc": {"bounce": 3}} },
      { id: "shuri_enh", name: "Enhanced Shuriken Ricochet", icon: "✴️", desc: "One extra bounce.", kind: "enh", x: 4, y: 2, mod: {"misc": {"bounce": 1}}, parent: "shuri" },
      { id: "shuri_cut", name: "Cutting Disk", icon: "✴️", desc: "Each bounce can bleed for 2 s.", kind: "fork", x: 3, y: 4, mod: {"misc": {"bleed": 2}}, parent: "shuri", mutex: ["shuri_aim"] },
      { id: "shuri_aim", name: "Homing Disk", icon: "✴️", desc: "Bounces prefer a new target within 4 tiles.", kind: "fork", x: 5, y: 4, mod: {"misc": {"seek": 4}}, parent: "shuri", mutex: ["shuri_cut"] },
      { id: "mdeath", name: "Mark for Death", icon: "☠️", desc: "Mark a foe for 8 s: they take 20% more from you and are revealed.", kind: "skill", x: 7, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "mark", "dur": 8, "misc": {"vuln": 0.2}} },
      { id: "mdeath_enh", name: "Enhanced Mark for Death", icon: "☠️", desc: "The mark lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "mdeath" },
      { id: "mdeath_bleed", name: "Crimson Mark", icon: "☠️", desc: "The mark also bleeds.", kind: "fork", x: 6, y: 4, mod: {"misc": {"bleed": 8}}, parent: "mdeath", mutex: ["mdeath_share"] },
      { id: "mdeath_share", name: "Shared Mark", icon: "☠️", desc: "A nearby foe is marked for 4 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"spread": 4}}, parent: "mdeath", mutex: ["mdeath_bleed"] },
      { id: "tfang", name: "Twin Fang", icon: "🐍", desc: "Two 75% strikes. If both hit the same foe, apply poison for 4 s.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 7, ranks: 5, fx: {"k": "hit", "dmg": 0.75, "misc": {"double": 1, "poisonIfBoth": 4}} },
      { id: "tfang_enh", name: "Enhanced Twin Fang", icon: "🐍", desc: "Each strike deals 10% more.", kind: "enh", x: 10, y: 2, mod: {"dmg": 0.1}, parent: "tfang" },
      { id: "tfang_third", name: "Third Fang", icon: "🐍", desc: "A third 50% nip follows.", kind: "fork", x: 9, y: 4, mod: {"misc": {"extra": 0.5}}, parent: "tfang", mutex: ["tfang_sap"] },
      { id: "tfang_sap", name: "Sapping Fangs", icon: "🐍", desc: "If both hit, steal 6% HP.", kind: "fork", x: 11, y: 4, mod: {"misc": {"lifesteal": 0.06}}, parent: "tfang", mutex: ["tfang_third"] },
      { id: "gutw", name: "Gutwire", icon: "🧵", desc: "110% wire lash that roots 1.2 s.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 9, ranks: 5, fx: {"k": "hit", "dmg": 1.1, "misc": {"root": 1.2}, "dist": 3} },
      { id: "gutw_enh", name: "Enhanced Gutwire", icon: "🧵", desc: "Root lasts 0.5 s longer.", kind: "enh", x: 13, y: 2, mod: {"misc": {"root": 0.5}}, parent: "gutw" },
      { id: "gutw_pull", name: "Reeling Wire", icon: "🧵", desc: "Yank the foe 2 tiles toward you.", kind: "fork", x: 12, y: 4, mod: {"misc": {"pull": 2}}, parent: "gutw", mutex: ["gutw_cut"] },
      { id: "gutw_cut", name: "Barbed Wire", icon: "🧵", desc: "Applies a 4 s bleed.", kind: "fork", x: 14, y: 4, mod: {"misc": {"bleed": 4}}, parent: "gutw", mutex: ["gutw_pull"] },
      { id: "r_p_toxin", name: "Toxin Craft", icon: "🧪", desc: "Poisons you apply deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"poisDmg": 8} },
      { id: "r_p_mark", name: "Death Ink", icon: "☠️", desc: "Marked foes take 5/10/15% more from all your skills.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"markDmg": 5} },
    ] },
    { id: "defensive", name: "Defensive", icon: "🛡️", gate: 6, blurb: "Wards, peels and ways to stay standing.", nodes: [
      { id: "evade", name: "Evade", icon: "💨", desc: "Automatically dodge the next 2 attacks.", kind: "skill", x: 1, y: 0, mp: 6, cd: 10, ranks: 5, fx: {"k": "buff", "key": "evade", "dur": 8, "misc": {"charges": 2}} },
      { id: "evade_enh", name: "Enhanced Evade", icon: "💨", desc: "Gain a third dodge charge.", kind: "enh", x: 1, y: 2, mod: {"misc": {"charges": 1}}, parent: "evade" },
      { id: "evade_rep", name: "Reprisal Evade", icon: "💨", desc: "After a dodge, your next hit is a crit.", kind: "fork", x: 0, y: 4, mod: {"misc": {"nextCrit": 1}}, parent: "evade", mutex: ["evade_fade"] },
      { id: "evade_fade", name: "Fading Evade", icon: "💨", desc: "Also drop distant aggro when you first dodge.", kind: "fork", x: 2, y: 4, mod: {"misc": {"dropAggro": 1}}, parent: "evade", mutex: ["evade_rep"] },
      { id: "smoke", name: "Smoke Bomb", icon: "💨", desc: "A 6 s cloud (r 2.8). You are hard to target; foes inside miss more.", kind: "skill", x: 4, y: 0, mp: 12, cd: 14, ranks: 5, fx: {"k": "zone", "rad": 2.8, "dur": 6, "tick": 1, "misc": {"conceal": 1, "miss": 0.3}} },
      { id: "smoke_enh", name: "Enhanced Smoke Bomb", icon: "💨", desc: "The cloud lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 2}, parent: "smoke" },
      { id: "smoke_sting", name: "Stinging Smoke", icon: "💨", desc: "Foes in the cloud take 30% per second.", kind: "fork", x: 3, y: 4, mod: {"misc": {"tickDmg": 0.3}}, parent: "smoke", mutex: ["smoke_exit"] },
      { id: "smoke_exit", name: "Exit Smoke", icon: "💨", desc: "Leaving the cloud grants 1 s of projectile immunity.", kind: "fork", x: 5, y: 4, mod: {"misc": {"exitVeil": 1}}, parent: "smoke", mutex: ["smoke_sting"] },
      { id: "slipv", name: "Slipveil", icon: "🧥", desc: "For 3 s you take 35% less damage and cannot be rooted.", kind: "skill", x: 7, y: 0, new: true, mp: 10, cd: 12, ranks: 5, fx: {"k": "buff", "key": "slipv", "dur": 3, "misc": {"dr": 0.35, "immovable": 1}} },
      { id: "slipv_enh", name: "Enhanced Slipveil", icon: "🧥", desc: "Lasts 1 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 1}, parent: "slipv" },
      { id: "slipv_clean", name: "Cleansing Veil", icon: "🧥", desc: "Also clear one slow or bleed on you.", kind: "fork", x: 6, y: 4, mod: {"misc": {"cleanse": 1}}, parent: "slipv", mutex: ["slipv_knife"] },
      { id: "slipv_knife", name: "Veil Knife", icon: "🧥", desc: "Your next hit during the veil deals 30% more.", kind: "fork", x: 8, y: 4, mod: {"misc": {"nextDmg": 0.3}}, parent: "slipv", mutex: ["slipv_clean"] },
      { id: "dshade", name: "Dummy Shade", icon: "👤", desc: "Leave a shade for 4 s that foes may attack. You gain 20% DR while it lasts.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 16, ranks: 5, fx: {"k": "decoy", "dur": 4, "misc": {"dr": 0.2}} },
      { id: "dshade_enh", name: "Enhanced Dummy Shade", icon: "👤", desc: "The shade lasts 1.5 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 1.5}, parent: "dshade" },
      { id: "dshade_burst", name: "Burst Shade", icon: "👤", desc: "When it ends, 100% in 2 tiles.", kind: "fork", x: 9, y: 4, mod: {"misc": {"endNova": 1.0}}, parent: "dshade", mutex: ["dshade_swap"] },
      { id: "dshade_swap", name: "Swap Shade", icon: "👤", desc: "Activate again to swap places with it once.", kind: "fork", x: 11, y: 4, mod: {"misc": {"swap": 1}}, parent: "dshade", mutex: ["dshade_burst"] },
      { id: "r_p_ghost", name: "Ghosted", icon: "👻", desc: "+2/4/6 Dodge.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"dodge": 2} },
      { id: "r_p_film", name: "Thin Film", icon: "🧥", desc: "After a Defensive skill, take 6/12/18% less damage for 3 s.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"defDr": 6} },
    ] },
    { id: "flavor", name: "Agility", icon: "🏃", gate: 8, blurb: "Class-defining agility techniques.", nodes: [
      { id: "sstep", name: "Umbral Step", icon: "👤", desc: "Teleport behind the target; next hit within 3 s is a crit.", kind: "skill", x: 1, y: 0, mp: 12, cd: 9, ranks: 5, fx: {"k": "blink", "dist": 5, "misc": {"behind": 1, "nextCrit": 3}} },
      { id: "sstep_enh", name: "Enhanced Umbral Step", icon: "👤", desc: "The crit window lasts 1 s longer.", kind: "enh", x: 1, y: 2, mod: {"misc": {"nextCrit": 1}}, parent: "sstep" },
      { id: "sstep_cut", name: "Cutting Step", icon: "👤", desc: "Deal 80% as you arrive.", kind: "fork", x: 0, y: 4, mod: {"misc": {"arrive": 0.8}}, parent: "sstep", mutex: ["sstep_veil"] },
      { id: "sstep_veil", name: "Veiled Step", icon: "👤", desc: "Drop aggro from foes more than 3 tiles away.", kind: "fork", x: 2, y: 4, mod: {"misc": {"dropAggro": 1}}, parent: "sstep", mutex: ["sstep_cut"] },
      { id: "caltr", name: "Caltrops", icon: "⭐", desc: "Scatter spikes in a 2.4-tile field for 5 s: slow 35% and 25% per tick.", kind: "skill", x: 4, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "zone", "rad": 2.4, "dur": 5, "tick": 1, "dmg": 0.25, "slow": 0.35} },
      { id: "caltr_enh", name: "Enhanced Caltrops", icon: "⭐", desc: "The field lasts 1.5 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 1.5}, parent: "caltr" },
      { id: "caltr_rust", name: "Rusted Caltrops", icon: "⭐", desc: "Foes in the field deal 15% less.", kind: "fork", x: 3, y: 4, mod: {"misc": {"atkDown": 0.15}}, parent: "caltr", mutex: ["caltr_barbs"] },
      { id: "caltr_barbs", name: "Barbed Caltrops", icon: "⭐", desc: "Ticks also bleed for 2 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"bleed": 2}}, parent: "caltr", mutex: ["caltr_rust"] },
      { id: "vkick", name: "Vault Kick", icon: "🦵", desc: "Vault 3 tiles and kick for 120%, briefly staggering (0.8 s).", kind: "skill", x: 7, y: 0, new: true, mp: 10, cd: 8, ranks: 5, fx: {"k": "dash", "dist": 3, "dmg": 1.2, "stun": 0.8} },
      { id: "vkick_enh", name: "Enhanced Vault Kick", icon: "🦵", desc: "Vault 1 tile farther.", kind: "enh", x: 7, y: 2, mod: {"dist": 1}, parent: "vkick" },
      { id: "vkick_sweep", name: "Sweeping Kick", icon: "🦵", desc: "Foes beside the target take 60%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"splash": 0.6}}, parent: "vkick", mutex: ["vkick_up"] },
      { id: "vkick_up", name: "Up-kick", icon: "🦵", desc: "The stagger lasts 0.6 s longer.", kind: "fork", x: 8, y: 4, mod: {"stun": 0.6}, parent: "vkick", mutex: ["vkick_sweep"] },
      { id: "bdash", name: "Blackout Dash", icon: "⬛", desc: "Dash 4 tiles. You cannot be targeted for 0.6 s mid-dash.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 10, ranks: 5, fx: {"k": "dash", "dist": 4, "misc": {"iframe": 0.6}} },
      { id: "bdash_enh", name: "Enhanced Blackout Dash", icon: "⬛", desc: "Dash 1 tile farther.", kind: "enh", x: 10, y: 2, mod: {"dist": 1}, parent: "bdash" },
      { id: "bdash_cut", name: "Cutting Dark", icon: "⬛", desc: "Foes you pass take 90%.", kind: "fork", x: 9, y: 4, mod: {"misc": {"pierce": 0.9}}, parent: "bdash", mutex: ["bdash_cloak"] },
      { id: "bdash_cloak", name: "Cloaked Dark", icon: "⬛", desc: "After the dash, gain 2 s of 20% DR.", kind: "fork", x: 11, y: 4, mod: {"misc": {"dr": 0.2, "drT": 2}}, parent: "bdash", mutex: ["bdash_cut"] },
      { id: "r_p_vault", name: "Vault Work", icon: "🦵", desc: "Dash skills deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"dashDmg": 8} },
      { id: "r_p_shade", name: "Shade Practice", icon: "👤", desc: "After a dash or step, next hit is 8/16/24% stronger.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"dashNext": 8} },
    ] },
    { id: "mastery", name: "Mastery", icon: "💎", gate: 11, blurb: "Deeper specializations and control.", nodes: [
      { id: "vbq", name: "Venom Bouquet", icon: "💐", desc: "Toss a 2.6-tile vial: 80% and a 5 s poison, plus lingering fumes (30% per s for 3 s).", kind: "skill", x: 1, y: 0, new: true, mp: 16, cd: 12, ranks: 5, fx: {"k": "zone", "rad": 2.6, "dur": 3, "tick": 1, "dmg": 0.3, "misc": {"impact": 0.8, "poison": 5}} },
      { id: "vbq_enh", name: "Enhanced Venom Bouquet", icon: "💐", desc: "Fumes last 1.5 s longer.", kind: "enh", x: 1, y: 2, mod: {"dur": 1.5}, parent: "vbq" },
      { id: "vbq_acid", name: "Acid Bouquet", icon: "💐", desc: "Also shreds 4 DEF for 5 s.", kind: "fork", x: 0, y: 4, mod: {"misc": {"shred": 4}}, parent: "vbq", mutex: ["vbq_mist"] },
      { id: "vbq_mist", name: "Drifting Bouquet", icon: "💐", desc: "The fumes creep 1 tile outward after 1 s.", kind: "fork", x: 2, y: 4, mod: {"misc": {"expand": 1}}, parent: "vbq", mutex: ["vbq_acid"] },
      { id: "bledg", name: "Blood Ledger", icon: "📒", desc: "110% slash. For 6 s, 20% of the damage you deal to that foe heals you.", kind: "skill", x: 4, y: 0, new: true, mp: 14, cd: 11, ranks: 5, fx: {"k": "hit", "dmg": 1.1, "misc": {"leechMark": 6, "leech": 0.2}} },
      { id: "bledg_enh", name: "Enhanced Blood Ledger", icon: "📒", desc: "The ledger lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 2}, parent: "bledg" },
      { id: "bledg_deep", name: "Deep Ledger", icon: "📒", desc: "Leech is 30% instead of 20%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"leech": 0.1}}, parent: "bledg", mutex: ["bledg_page"] },
      { id: "bledg_page", name: "Open Ledger", icon: "📒", desc: "If the foe dies while ledgers run, heal 8% HP.", kind: "fork", x: 5, y: 4, mod: {"misc": {"killHeal": 0.08}}, parent: "bledg", mutex: ["bledg_deep"] },
      { id: "snet", name: "Silent Network", icon: "🕸️", desc: "A 3-tile web for 5 s: root on first contact (1 s) and slow 30% after.", kind: "skill", x: 7, y: 0, new: true, mp: 16, cd: 14, ranks: 5, fx: {"k": "zone", "rad": 3, "dur": 5, "tick": 1, "slow": 0.3, "misc": {"firstRoot": 1}} },
      { id: "snet_enh", name: "Enhanced Silent Network", icon: "🕸️", desc: "Web radius +0.5 tiles.", kind: "enh", x: 7, y: 2, mod: {"rad": 0.5}, parent: "snet" },
      { id: "snet_hook", name: "Hooked Network", icon: "🕸️", desc: "The first root lasts 0.6 s longer.", kind: "fork", x: 6, y: 4, mod: {"misc": {"firstRoot": 0.6}}, parent: "snet", mutex: ["snet_toxin"] },
      { id: "snet_toxin", name: "Toxic Network", icon: "🕸️", desc: "The web poisons for 3 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"poison": 3}}, parent: "snet", mutex: ["snet_hook"] },
      { id: "r_p_bleed", name: "Red Work", icon: "🩸", desc: "Bleeds you apply deal 8/16/24% more.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"bleedDmg": 8} },
      { id: "r_p_cool", name: "Cool Hands", icon: "🧊", desc: "Mastery skills have 6/12/18% shorter cooldowns.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"mastCd": 6} },
    ] },
    { id: "ultimate", name: "Ultimate", icon: "☀️", gate: 16, blurb: "Long-cooldown signature skills.", nodes: [
      { id: "naudit", name: "Night's Audit", icon: "🌑", desc: "Dash through all foes in a 5-tile line: 160% each, then appear at the end.", kind: "skill", x: 1, y: 0, new: true, mp: 22, cd: 22, ranks: 5, fx: {"k": "dash", "dist": 5, "dmg": 1.6, "misc": {"pierceAll": 1}} },
      { id: "naudit_enh", name: "Enhanced Night's Audit", icon: "🌑", desc: "The line reaches 1 tile farther.", kind: "enh", x: 1, y: 2, mod: {"dist": 1}, parent: "naudit" },
      { id: "naudit_ink", name: "Ink Audit", icon: "🌑", desc: "Each foe is marked for 4 s.", kind: "fork", x: 0, y: 4, mod: {"misc": {"mark": 4}}, parent: "naudit", mutex: ["naudit_quiet"] },
      { id: "naudit_quiet", name: "Quiet Audit", icon: "🌑", desc: "You cannot be targeted for 1 s after arriving.", kind: "fork", x: 2, y: 4, mod: {"misc": {"iframe": 1}}, parent: "naudit", mutex: ["naudit_ink"] },
      { id: "tcuts", name: "Thousand Cuts", icon: "✂️", desc: "For 4 s, your hits in a 2.8-tile radius around you also slash nearby foes for 40%.", kind: "skill", x: 4, y: 0, new: true, mp: 20, cd: 20, ranks: 5, fx: {"k": "buff", "key": "tcuts", "dur": 4, "misc": {"splash": 0.4, "rad": 2.8}} },
      { id: "tcuts_enh", name: "Enhanced Thousand Cuts", icon: "✂️", desc: "Lasts 1 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 1}, parent: "tcuts" },
      { id: "tcuts_red", name: "Red Cuts", icon: "✂️", desc: "The slashes bleed for 2 s.", kind: "fork", x: 3, y: 4, mod: {"misc": {"bleed": 2}}, parent: "tcuts", mutex: ["tcuts_focus"] },
      { id: "tcuts_focus", name: "Focused Cuts", icon: "✂️", desc: "The primary target takes 20% more during the effect.", kind: "fork", x: 5, y: 4, mod: {"misc": {"vuln": 0.2}}, parent: "tcuts", mutex: ["tcuts_red"] },
      { id: "vcourt", name: "Vanishing Court", icon: "👑", desc: "Drop a 3-tile court for 6 s: you are concealed inside, foes are slowed 40%, and exiting deals 180%.", kind: "skill", x: 7, y: 0, new: true, mp: 24, cd: 26, ranks: 5, fx: {"k": "zone", "rad": 3, "dur": 6, "tick": 1, "slow": 0.4, "misc": {"conceal": 1, "exitHit": 1.8}} },
      { id: "vcourt_enh", name: "Enhanced Vanishing Court", icon: "👑", desc: "The court lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "vcourt" },
      { id: "vcourt_knives", name: "Court Knives", icon: "👑", desc: "Foes inside take 40% per second.", kind: "fork", x: 6, y: 4, mod: {"misc": {"tickDmg": 0.4}}, parent: "vcourt", mutex: ["vcourt_exit"] },
      { id: "vcourt_exit", name: "Royal Exit", icon: "👑", desc: "The exit hit stuns 1 s.", kind: "fork", x: 8, y: 4, mod: {"stun": 1}, parent: "vcourt", mutex: ["vcourt_knives"] },
      { id: "r_p_epic", name: "Night Purse", icon: "⭐", desc: "Ultimate skills cost 8/16/24% less MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"ultMp": 8} },
    ] },
    { id: "key", name: "Key Passive", icon: "⭐", gate: 23, blurb: "Choose one keystone. You may respec later.", nodes: [
      { id: "r_k_open", name: "Open Vein", icon: "🩸", desc: "The first skill you use in a fight deals 25% more and applies a 4 s bleed.", kind: "key", x: 1, y: 0, new: true, ranks: 1, misc: {"openAll": 0.25} },
      { id: "r_k_shade", name: "Shade Ledger", icon: "👤", desc: "After Evade, Slipveil or Umbral Step, your next skill refunds 20% of its cooldown.", kind: "key", x: 4, y: 0, new: true, ranks: 1, misc: {"defReset": 0.2} },
      { id: "r_k_toxin", name: "Twin Toxins", icon: "🧪", desc: "Poison and bleed can stack together for 15% more damage, and a poisoned kill restores 6% HP.", kind: "key", x: 7, y: 0, new: true, ranks: 1, misc: {"dotStack": 0.15, "killHeal": 0.06} },
    ] },
  ],
  ranger: [
    { id: "basic", name: "Basic", icon: "⚔️", gate: 0, blurb: "Cheap, short-cooldown skills you can use while moving.", nodes: [
      { id: "multi", name: "Multi-Shot", icon: "🏹", desc: "4 arrows at random foes, 70% each.", kind: "skill", x: 1, y: 0, mp: 10, cd: 5, ranks: 5, fx: {"k": "missiles", "dmg": 0.7, "n": 4} },
      { id: "multi_enh", name: "Enhanced Multi-Shot", icon: "🏹", desc: "Loose a fifth arrow.", kind: "enh", x: 1, y: 2, mod: {"misc": {"n": 1}}, parent: "multi" },
      { id: "multi_fan", name: "Fan Nock", icon: "🏹", desc: "Arrows prefer different targets when possible.", kind: "fork", x: 0, y: 4, mod: {"misc": {"spreadPref": 1}}, parent: "multi", mutex: ["multi_head"] },
      { id: "multi_head", name: "Head Nock", icon: "🏹", desc: "Each arrow has a small chance to slow 20% for 2 s.", kind: "fork", x: 2, y: 4, mod: {"misc": {"slowChance": 0.2}}, parent: "multi", mutex: ["multi_fan"] },
      { id: "qnock", name: "Quick Nock", icon: "➡️", desc: "A 85% arrow with a very short cooldown.", kind: "skill", x: 4, y: 0, new: true, mp: 6, cd: 3, ranks: 5, fx: {"k": "proj", "dmg": 0.85, "dist": 7} },
      { id: "qnock_enh", name: "Enhanced Quick Nock", icon: "➡️", desc: "Cooldown is 0.5 s shorter.", kind: "enh", x: 4, y: 2, mod: {"cd": 0.5}, parent: "qnock" },
      { id: "qnock_split", name: "Split Nock", icon: "➡️", desc: "A second arrow flies at 50%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"extra": 0.5}}, parent: "qnock", mutex: ["qnock_barb"] },
      { id: "qnock_barb", name: "Barbed Nock", icon: "➡️", desc: "Applies a 3 s bleed.", kind: "fork", x: 5, y: 4, mod: {"misc": {"bleed": 3}}, parent: "qnock", mutex: ["qnock_split"] },
      { id: "sspike", name: "Side Spike", icon: "📌", desc: "Throw a 90% hunting spike up to 4 tiles that roots 0.8 s.", kind: "skill", x: 7, y: 0, new: true, mp: 7, cd: 4, ranks: 5, fx: {"k": "proj", "dmg": 0.9, "dist": 4, "misc": {"root": 0.8}} },
      { id: "sspike_enh", name: "Enhanced Side Spike", icon: "📌", desc: "Root lasts 0.4 s longer.", kind: "enh", x: 7, y: 2, mod: {"misc": {"root": 0.4}}, parent: "sspike" },
      { id: "sspike_chain", name: "Chained Spike", icon: "📌", desc: "A second spike drops at the foe's feet as a 2 s snare field.", kind: "fork", x: 6, y: 4, mod: {"misc": {"zoneDur": 2, "zoneSlow": 0.3}}, parent: "sspike", mutex: ["sspike_hook"] },
      { id: "sspike_hook", name: "Hooked Spike", icon: "📌", desc: "Yank the foe 1 tile toward you.", kind: "fork", x: 8, y: 4, mod: {"misc": {"pull": 1}}, parent: "sspike", mutex: ["sspike_chain"] },
      { id: "n_p_nock", name: "Nock Work", icon: "🏹", desc: "Basic shots deal 6/12/18% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"basicDmg": 6} },
      { id: "n_p_eye", name: "Keen Eye", icon: "👁️", desc: "You gain 2/4/6% crit.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"crit": 2} },
    ] },
    { id: "core", name: "Core", icon: "✴️", gate: 2, blurb: "Your main damage and pressure tools.", nodes: [
      { id: "pierce", name: "Piercing Shot", icon: "🎯", desc: "A 120% line shot through every enemy in its path (8 tiles).", kind: "skill", x: 1, y: 0, mp: 12, cd: 8, ranks: 5, fx: {"k": "line", "dmg": 1.2, "dist": 8} },
      { id: "pierce_enh", name: "Enhanced Piercing Shot", icon: "🎯", desc: "The shot travels 1 tile farther.", kind: "enh", x: 1, y: 2, mod: {"dist": 1}, parent: "pierce" },
      { id: "pierce_heavy", name: "Heavy Bolt", icon: "🎯", desc: "The first foe takes 160%.", kind: "fork", x: 0, y: 4, mod: {"misc": {"firstBonus": 0.4}}, parent: "pierce", mutex: ["pierce_split"] },
      { id: "pierce_split", name: "Splitting Bolt", icon: "🎯", desc: "After the first foe, the bolt splits 60% to a side target.", kind: "fork", x: 2, y: 4, mod: {"misc": {"split": 0.6}}, parent: "pierce", mutex: ["pierce_heavy"] },
      { id: "rain", name: "Sky Volley", icon: "🏹", desc: "4 ticks of 45% damage over 2.5 s in a 2.6-tile circle.", kind: "skill", x: 4, y: 0, mp: 16, cd: 12, ranks: 5, fx: {"k": "zone", "rad": 2.6, "dur": 2.5, "tick": 0.62, "dmg": 0.45} },
      { id: "rain_enh", name: "Enhanced Sky Volley", icon: "🏹", desc: "Radius +0.4 tiles.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.4}, parent: "rain" },
      { id: "rain_sear", name: "Searing Volley", icon: "🏹", desc: "Ticks apply a short burn.", kind: "fork", x: 3, y: 4, mod: {"misc": {"burn": 2}}, parent: "rain", mutex: ["rain_pin"] },
      { id: "rain_pin", name: "Pinning Volley", icon: "🏹", desc: "Foes in the volley are slowed 30%.", kind: "fork", x: 5, y: 4, mod: {"misc": {"slow": 0.3}}, parent: "rain", mutex: ["rain_sear"] },
      { id: "hmark", name: "Hunter's Mark", icon: "👁️", desc: "Reveal a foe and slow it 30% for 8 s.", kind: "skill", x: 7, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "mark", "dur": 8, "misc": {"slow": 0.3, "reveal": 1}} },
      { id: "hmark_enh", name: "Enhanced Hunter's Mark", icon: "👁️", desc: "The mark lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "hmark" },
      { id: "hmark_prey", name: "Prey Mark", icon: "👁️", desc: "The marked foe takes 15% more from you.", kind: "fork", x: 6, y: 4, mod: {"misc": {"vuln": 0.15}}, parent: "hmark", mutex: ["hmark_pack"] },
      { id: "hmark_pack", name: "Pack Mark", icon: "👁️", desc: "Pets deal 25% more to the marked foe.", kind: "fork", x: 8, y: 4, mod: {"misc": {"petVuln": 0.25}}, parent: "hmark", mutex: ["hmark_prey"] },
      { id: "sbolt", name: "Splinter Bolt", icon: "🪵", desc: "110% bolt that shatters: two 40% splinters hit nearby foes.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 8, ranks: 5, fx: {"k": "hit", "dmg": 1.1, "misc": {"splinter": 2, "splinterDmg": 0.4}} },
      { id: "sbolt_enh", name: "Enhanced Splinter Bolt", icon: "🪵", desc: "A third splinter flies.", kind: "enh", x: 10, y: 2, mod: {"misc": {"splinter": 1}}, parent: "sbolt" },
      { id: "sbolt_barbs", name: "Barbed Splinters", icon: "🪵", desc: "Splinters bleed for 3 s.", kind: "fork", x: 9, y: 4, mod: {"misc": {"bleed": 3}}, parent: "sbolt", mutex: ["sbolt_stake"] },
      { id: "sbolt_stake", name: "Staking Splinters", icon: "🪵", desc: "The main target is rooted 0.8 s.", kind: "fork", x: 11, y: 4, mod: {"misc": {"root": 0.8}}, parent: "sbolt", mutex: ["sbolt_barbs"] },
      { id: "carrow", name: "Cinder Arrow", icon: "🔥", desc: "120% flaming arrow that leaves a 3 s, 1.8-tile burn patch.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 7, ranks: 5, fx: {"k": "proj", "dmg": 1.2, "dist": 7, "misc": {"burnZone": 3, "zoneRad": 1.8}} },
      { id: "carrow_enh", name: "Enhanced Cinder Arrow", icon: "🔥", desc: "The patch lasts 1.5 s longer.", kind: "enh", x: 13, y: 2, mod: {"misc": {"burnZone": 1.5}}, parent: "carrow" },
      { id: "carrow_burst", name: "Bursting Cinder", icon: "🔥", desc: "Impact also hits 50% in 1.6 tiles.", kind: "fork", x: 12, y: 4, mod: {"misc": {"splash": 0.5}}, parent: "carrow", mutex: ["carrow_oil"] },
      { id: "carrow_oil", name: "Oil Cinder", icon: "🔥", desc: "Burning foes take 10% more.", kind: "fork", x: 14, y: 4, mod: {"misc": {"burnVuln": 0.1}}, parent: "carrow", mutex: ["carrow_burst"] },
      { id: "n_p_pierce", name: "Through-Shot", icon: "🎯", desc: "Line shots deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"lineDmg": 8} },
      { id: "n_p_mark", name: "Marked Prey", icon: "👁️", desc: "Damage vs marked foes +6/12/18%.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"markDmg": 6} },
    ] },
    { id: "defensive", name: "Defensive", icon: "🛡️", gate: 6, blurb: "Wards, peels and ways to stay standing.", nodes: [
      { id: "trap", name: "Snare Trap", icon: "⛓️", desc: "Stun target for 3 s + bleed for 4.5 s.", kind: "skill", x: 1, y: 0, mp: 8, cd: 10, ranks: 5, fx: {"k": "hit", "dmg": 0.6, "stun": 3, "misc": {"bleed": 4.5}} },
      { id: "trap_enh", name: "Enhanced Snare Trap", icon: "⛓️", desc: "Stun lasts 0.6 s longer.", kind: "enh", x: 1, y: 2, mod: {"stun": 0.6}, parent: "trap" },
      { id: "trap_iron", name: "Iron Snare", icon: "⛓️", desc: "The bleed is stronger and lasts 2 s more.", kind: "fork", x: 0, y: 4, mod: {"misc": {"bleed": 2}}, parent: "trap", mutex: ["trap_net"] },
      { id: "trap_net", name: "Net Snare", icon: "⛓️", desc: "Foes within 1.6 tiles are slowed 30% for 3 s.", kind: "fork", x: 2, y: 4, mod: {"misc": {"slowRad": 1.6}}, parent: "trap", mutex: ["trap_iron"] },
      { id: "hook", name: "Grappling Hook", icon: "🪝", desc: "Dash up to 6 tiles toward a point or your target.", kind: "skill", x: 4, y: 0, mp: 10, cd: 10, ranks: 5, fx: {"k": "dash", "dist": 6} },
      { id: "hook_enh", name: "Enhanced Grappling Hook", icon: "🪝", desc: "Range +1 tile.", kind: "enh", x: 4, y: 2, mod: {"dist": 1}, parent: "hook" },
      { id: "hook_yank", name: "Yank Hook", icon: "🪝", desc: "If a foe is targeted, pull them 2 tiles as you arrive.", kind: "fork", x: 3, y: 4, mod: {"misc": {"pull": 2}}, parent: "hook", mutex: ["hook_kick"] },
      { id: "hook_kick", name: "Hook Kick", icon: "🪝", desc: "Deal 90% to a foe at the landing.", kind: "fork", x: 5, y: 4, mod: {"misc": {"arrive": 0.9}}, parent: "hook", mutex: ["hook_yank"] },
      { id: "camou", name: "Camouflage Wrap", icon: "🌿", desc: "For 3.5 s you are hard to target and take 25% less damage. Ends early if you use a damaging skill.", kind: "skill", x: 7, y: 0, new: true, mp: 12, cd: 16, ranks: 5, fx: {"k": "buff", "key": "camou", "dur": 3.5, "misc": {"conceal": 1, "dr": 0.25, "breakOnHit": 1}} },
      { id: "camou_enh", name: "Enhanced Camouflage Wrap", icon: "🌿", desc: "Lasts 1 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 1}, parent: "camou" },
      { id: "camou_ambush", name: "Ambush Wrap", icon: "🌿", desc: "The next skill after it ends deals 30% more.", kind: "fork", x: 6, y: 4, mod: {"misc": {"nextDmg": 0.3}}, parent: "camou", mutex: ["camou_pack"] },
      { id: "camou_pack", name: "Pack Wrap", icon: "🌿", desc: "Pets are also concealed while it lasts.", kind: "fork", x: 8, y: 4, mod: {"misc": {"pets": 1}}, parent: "camou", mutex: ["camou_ambush"] },
      { id: "turfst", name: "Turf Stake", icon: "🪵", desc: "Plant a stake for 6 s. You and pets in 2.8 tiles gain 15% DR.", kind: "skill", x: 10, y: 0, new: true, mp: 10, cd: 12, ranks: 5, fx: {"k": "zone", "rad": 2.8, "dur": 6, "tick": 1, "misc": {"dr": 0.15}} },
      { id: "turfst_enh", name: "Enhanced Turf Stake", icon: "🪵", desc: "The stake lasts 2 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 2}, parent: "turfst" },
      { id: "turfst_thorn", name: "Thorn Stake", icon: "🪵", desc: "Foes in the ring take 30% per second.", kind: "fork", x: 9, y: 4, mod: {"misc": {"tickDmg": 0.3}}, parent: "turfst", mutex: ["turfst_root"] },
      { id: "turfst_root", name: "Rooted Stake", icon: "🪵", desc: "You cannot be pulled while in the ring.", kind: "fork", x: 11, y: 4, mod: {"misc": {"immovable": 1}}, parent: "turfst", mutex: ["turfst_thorn"] },
      { id: "wshot", name: "Withdraw Shot", icon: "↩️", desc: "Fire a 100% arrow and hop 2 tiles backward.", kind: "skill", x: 13, y: 0, new: true, mp: 10, cd: 9, ranks: 5, fx: {"k": "proj", "dmg": 1.0, "dist": 6, "misc": {"backhop": 2}} },
      { id: "wshot_enh", name: "Enhanced Withdraw Shot", icon: "↩️", desc: "The hop is 1 tile farther.", kind: "enh", x: 13, y: 2, mod: {"misc": {"backhop": 1}}, parent: "wshot" },
      { id: "wshot_caltr", name: "Caltrap Withdraw", icon: "↩️", desc: "Leave a 2 s caltrop patch where you were.", kind: "fork", x: 12, y: 4, mod: {"misc": {"zoneDur": 2, "zoneSlow": 0.35}}, parent: "wshot", mutex: ["wshot_aim"] },
      { id: "wshot_aim", name: "Aimed Withdraw", icon: "↩️", desc: "The arrow deals 130% if you hopped at least 2 tiles.", kind: "fork", x: 14, y: 4, mod: {"misc": {"hopBonus": 0.3}}, parent: "wshot", mutex: ["wshot_caltr"] },
      { id: "n_p_hide", name: "Field Hide", icon: "🌿", desc: "+8/16/24 HP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"hp": 8} },
      { id: "n_p_space", name: "Spacing", icon: "↩️", desc: "After a Defensive skill, take 6/12/18% less damage for 3 s.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"defDr": 6} },
    ] },
    { id: "flavor", name: "The Hunt", icon: "🐺", gate: 8, blurb: "Class-defining the hunt techniques.", nodes: [
      { id: "frenzy", name: "Call of the Wild", icon: "📯", desc: "150% shot; pets deal triple for 8 s.", kind: "skill", x: 1, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "proj", "dmg": 1.5, "dist": 7, "misc": {"petTriple": 8}} },
      { id: "frenzy_enh", name: "Enhanced Call of the Wild", icon: "📯", desc: "The pet surge lasts 2 s longer.", kind: "enh", x: 1, y: 2, mod: {"dur": 2}, parent: "frenzy" },
      { id: "frenzy_pack", name: "Pack Call", icon: "📯", desc: "You also deal 15% more for the duration.", kind: "fork", x: 0, y: 4, mod: {"misc": {"selfDmg": 0.15}}, parent: "frenzy", mutex: ["frenzy_howl"] },
      { id: "frenzy_howl", name: "Howling Call", icon: "📯", desc: "Foes near pets are slowed 20%.", kind: "fork", x: 2, y: 4, mod: {"misc": {"petSlow": 0.2}}, parent: "frenzy", mutex: ["frenzy_pack"] },
      { id: "bfren", name: "Beast Frenzy", icon: "🐺", desc: "Pets gain +40% attack speed for 8 s.", kind: "skill", x: 4, y: 0, mp: 12, cd: 16, ranks: 5, fx: {"k": "buff", "key": "pethaste", "dur": 8} },
      { id: "bfren_enh", name: "Enhanced Beast Frenzy", icon: "🐺", desc: "Lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 2}, parent: "bfren" },
      { id: "bfren_fang", name: "Fang Frenzy", icon: "🐺", desc: "Pets also deal 20% more damage.", kind: "fork", x: 3, y: 4, mod: {"misc": {"petDmg": 0.2}}, parent: "bfren", mutex: ["bfren_hide"] },
      { id: "bfren_hide", name: "Hide Frenzy", icon: "🐺", desc: "Pets take 20% less damage during it.", kind: "fork", x: 5, y: 4, mod: {"misc": {"petDr": 0.2}}, parent: "bfren", mutex: ["bfren_fang"] },
      { id: "bthorn", name: "Bond of Thorns", icon: "🌹", desc: "For 6 s, 30% of the damage your pets deal heals you, and 30% of damage you deal heals pets.", kind: "skill", x: 7, y: 0, new: true, mp: 12, cd: 12, ranks: 5, fx: {"k": "buff", "key": "bthorn", "dur": 6, "misc": {"shareHeal": 0.3}} },
      { id: "bthorn_enh", name: "Enhanced Bond of Thorns", icon: "🌹", desc: "Lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "bthorn" },
      { id: "bthorn_spike", name: "Spiked Bond", icon: "🌹", desc: "Pet attackers take 20% ATK as thorns.", kind: "fork", x: 6, y: 4, mod: {"misc": {"petThorns": 0.2}}, parent: "bthorn", mutex: ["bthorn_tide"] },
      { id: "bthorn_tide", name: "Tidal Bond", icon: "🌹", desc: "When it ends, you and pets heal 6% HP.", kind: "fork", x: 8, y: 4, mod: {"misc": {"endHeal": 0.06}}, parent: "bthorn", mutex: ["bthorn_spike"] },
      { id: "phowl", name: "Pack Howl", icon: "🐺", desc: "Pets bark: foes within 4 tiles are slowed 30% for 4 s and take 80%.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "nova", "dmg": 0.8, "rad": 4, "misc": {"slow": 0.3, "slowT": 4, "fromPets": 1}} },
      { id: "phowl_enh", name: "Enhanced Pack Howl", icon: "🐺", desc: "Slow lasts 1 s longer.", kind: "enh", x: 10, y: 2, mod: {"misc": {"slowT": 1}}, parent: "phowl" },
      { id: "phowl_fear", name: "Fear Howl", icon: "🐺", desc: "Non-bosses are staggered 0.8 s.", kind: "fork", x: 9, y: 4, mod: {"stun": 0.8}, parent: "phowl", mutex: ["phowl_heart"] },
      { id: "phowl_heart", name: "Heart Howl", icon: "🐺", desc: "Pets heal 10% HP.", kind: "fork", x: 11, y: 4, mod: {"misc": {"healPets": 0.1}}, parent: "phowl", mutex: ["phowl_fear"] },
      { id: "fward", name: "Feral Ward", icon: "🐾", desc: "For 6 s, pets gain a shield equal to 25% of their max HP and +2 DEF.", kind: "skill", x: 13, y: 0, new: true, mp: 14, cd: 16, ranks: 5, fx: {"k": "buff", "key": "fward", "dur": 6, "misc": {"petShield": 0.25, "petDef": 2}} },
      { id: "fward_enh", name: "Enhanced Feral Ward", icon: "🐾", desc: "The shield is 10% larger.", kind: "enh", x: 13, y: 2, mod: {"misc": {"petShield": 0.1}}, parent: "fward" },
      { id: "fward_share", name: "Shared Ward", icon: "🐾", desc: "You also gain 10% DR.", kind: "fork", x: 12, y: 4, mod: {"misc": {"dr": 0.1}}, parent: "fward", mutex: ["fward_lash"] },
      { id: "fward_lash", name: "Lashing Ward", icon: "🐾", desc: "When a pet shield breaks, deal 80% around that pet.", kind: "fork", x: 14, y: 4, mod: {"misc": {"breakNova": 0.8}}, parent: "fward", mutex: ["fward_share"] },
      { id: "n_p_bond", name: "Beast Bond", icon: "🐺", desc: "Pets deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"petDmg": 8} },
      { id: "n_p_pack", name: "Pack Sense", icon: "🐾", desc: "Pets have 8/16/24% more max HP.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"petHp": 8} },
    ] },
    { id: "mastery", name: "Mastery", icon: "💎", gate: 11, blurb: "Deeper specializations and control.", nodes: [
      { id: "xtrap", name: "Explosive Trap", icon: "💣", desc: "Place a trap (max 2): roots the first foe 2 s, then explodes (120%, r 2).", kind: "skill", x: 1, y: 0, mp: 12, cd: 8, ranks: 5, fx: {"k": "trap", "dmg": 1.2, "rad": 2, "root": 2, "max": 2} },
      { id: "xtrap_enh", name: "Enhanced Explosive Trap", icon: "💣", desc: "Explosion radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "xtrap" },
      { id: "xtrap_mine", name: "Cluster Trap", icon: "💣", desc: "The blast leaves a 2 s burn patch.", kind: "fork", x: 0, y: 4, mod: {"misc": {"burnZone": 2}}, parent: "xtrap", mutex: ["xtrap_snare"] },
      { id: "xtrap_snare", name: "Snaring Trap", icon: "💣", desc: "The root lasts 1 s longer.", kind: "fork", x: 2, y: 4, mod: {"root": 1}, parent: "xtrap", mutex: ["xtrap_mine"] },
      { id: "twire", name: "Tanglewire", icon: "🪢", desc: "A 3-tile wire field for 5 s: slow 40% and 35% per second.", kind: "skill", x: 4, y: 0, new: true, mp: 14, cd: 12, ranks: 5, fx: {"k": "zone", "rad": 3, "dur": 5, "tick": 1, "dmg": 0.35, "slow": 0.4} },
      { id: "twire_enh", name: "Enhanced Tanglewire", icon: "🪢", desc: "The field lasts 1.5 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 1.5}, parent: "twire" },
      { id: "twire_barbs", name: "Barbed Wire Field", icon: "🪢", desc: "Ticks bleed for 2 s.", kind: "fork", x: 3, y: 4, mod: {"misc": {"bleed": 2}}, parent: "twire", mutex: ["twire_lock"] },
      { id: "twire_lock", name: "Locking Wire", icon: "🪢", desc: "The first foe to enter is rooted 1.2 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"firstRoot": 1.2}}, parent: "twire", mutex: ["twire_barbs"] },
      { id: "searth", name: "Salted Earth", icon: "🧂", desc: "Salt a 2.6-tile ring for 4 s: 50% per tick and foes have 4 less DEF.", kind: "skill", x: 7, y: 0, new: true, mp: 14, cd: 13, ranks: 5, fx: {"k": "zone", "rad": 2.6, "dur": 4, "tick": 1, "dmg": 0.5, "misc": {"shred": 4}} },
      { id: "searth_enh", name: "Enhanced Salted Earth", icon: "🧂", desc: "Radius +0.4 tiles.", kind: "enh", x: 7, y: 2, mod: {"rad": 0.4}, parent: "searth" },
      { id: "searth_burn", name: "Brine Burn", icon: "🧂", desc: "Also burns 3 s.", kind: "fork", x: 6, y: 4, mod: {"misc": {"burn": 3}}, parent: "searth", mutex: ["searth_dry"] },
      { id: "searth_dry", name: "Drying Salt", icon: "🧂", desc: "Foes are slowed 25%.", kind: "fork", x: 8, y: 4, mod: {"misc": {"slow": 0.25}}, parent: "searth", mutex: ["searth_burn"] },
      { id: "mvol", name: "Marked Volley", icon: "🎯", desc: "Three 70% arrows that all seek your marked foe, or the nearest if none.", kind: "skill", x: 10, y: 0, new: true, mp: 16, cd: 12, ranks: 5, fx: {"k": "missiles", "dmg": 0.7, "n": 3, "misc": {"preferMark": 1}} },
      { id: "mvol_enh", name: "Enhanced Marked Volley", icon: "🎯", desc: "A fourth arrow flies.", kind: "enh", x: 10, y: 2, mod: {"misc": {"n": 1}}, parent: "mvol" },
      { id: "mvol_pierce", name: "Piercing Volley", icon: "🎯", desc: "Arrows continue 3 tiles past the mark.", kind: "fork", x: 9, y: 4, mod: {"misc": {"pierce": 3}}, parent: "mvol", mutex: ["mvol_burst"] },
      { id: "mvol_burst", name: "Bursting Volley", icon: "🎯", desc: "The last arrow explodes 60% in 1.6 tiles.", kind: "fork", x: 11, y: 4, mod: {"misc": {"endNova": 0.6}}, parent: "mvol", mutex: ["mvol_pierce"] },
      { id: "n_p_trap", name: "Trapper's Art", icon: "💣", desc: "Traps and fields deal 8/16/24% more.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"trapDmg": 8} },
      { id: "n_p_cool", name: "Steady Hands", icon: "🧊", desc: "Mastery skills have 6/12/18% shorter cooldowns.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"mastCd": 6} },
    ] },
    { id: "ultimate", name: "Ultimate", icon: "☀️", gate: 16, blurb: "Long-cooldown signature skills.", nodes: [
      { id: "obarr", name: "Overgrowth Barrage", icon: "🌳", desc: "A 3.4-tile storm for 5 s: 55% every 0.5 s and a 30% slow.", kind: "skill", x: 1, y: 0, new: true, mp: 24, cd: 24, ranks: 5, fx: {"k": "zone", "rad": 3.4, "dur": 5, "tick": 0.5, "dmg": 0.55, "slow": 0.3} },
      { id: "obarr_enh", name: "Enhanced Overgrowth Barrage", icon: "🌳", desc: "Radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "obarr" },
      { id: "obarr_thorn", name: "Thorn Barrage", icon: "🌳", desc: "Ticks also bleed.", kind: "fork", x: 0, y: 4, mod: {"misc": {"bleed": 2}}, parent: "obarr", mutex: ["obarr_close"] },
      { id: "obarr_close", name: "Closing Canopy", icon: "🌳", desc: "The storm shrinks then bursts 180% at the end.", kind: "fork", x: 2, y: 4, mod: {"misc": {"endNova": 1.8}}, parent: "obarr", mutex: ["obarr_thorn"] },
      { id: "equiv", name: "Eclipse Quiver", icon: "🌑", desc: "For 6 s, your shots rip through one extra foe and deal 20% more.", kind: "skill", x: 4, y: 0, new: true, mp: 22, cd: 22, ranks: 5, fx: {"k": "buff", "key": "equiv", "dur": 6, "misc": {"pierce": 1, "shotDmg": 0.2}} },
      { id: "equiv_enh", name: "Enhanced Eclipse Quiver", icon: "🌑", desc: "Lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 2}, parent: "equiv" },
      { id: "equiv_night", name: "Night Quiver", icon: "🌑", desc: "Shots also slow 20% for 2 s.", kind: "fork", x: 3, y: 4, mod: {"misc": {"slow": 0.2}}, parent: "equiv", mutex: ["equiv_moon"] },
      { id: "equiv_moon", name: "Moon Quiver", icon: "🌑", desc: "The first shot is a guaranteed crit.", kind: "fork", x: 5, y: 4, mod: {"misc": {"firstCrit": 1}}, parent: "equiv", mutex: ["equiv_night"] },
      { id: "hden", name: "Heart of the Den", icon: "🐻", desc: "For 8 s, pets heal 4% per second, deal 40% more, and you take 15% less damage.", kind: "skill", x: 7, y: 0, new: true, mp: 22, cd: 26, ranks: 5, fx: {"k": "buff", "key": "hden", "dur": 8, "misc": {"petHeal": 0.04, "petDmg": 0.4, "dr": 0.15}} },
      { id: "hden_enh", name: "Enhanced Heart of the Den", icon: "🐻", desc: "Lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "hden" },
      { id: "hden_rage", name: "Den Rage", icon: "🐻", desc: "Pets also gain the Beast Frenzy haste.", kind: "fork", x: 6, y: 4, mod: {"misc": {"pethaste": 1}}, parent: "hden", mutex: ["hden_guard"] },
      { id: "hden_guard", name: "Den Guard", icon: "🐻", desc: "The first time a pet would fall, it survives at 1 HP.", kind: "fork", x: 8, y: 4, mod: {"misc": {"petCheat": 1}}, parent: "hden", mutex: ["hden_rage"] },
      { id: "n_p_epic", name: "Deep Quiver", icon: "⭐", desc: "Ultimate skills cost 8/16/24% less MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"ultMp": 8} },
    ] },
    { id: "key", name: "Key Passive", icon: "⭐", gate: 23, blurb: "Choose one keystone. You may respec later.", nodes: [
      { id: "n_k_eye", name: "Eagle Eye", icon: "🦅", desc: "Your first shot against a marked foe is a crit, and marks last 3 s longer.", kind: "key", x: 1, y: 0, new: true, ranks: 1, misc: {"markCrit": 1, "markDur": 3} },
      { id: "n_k_snare", name: "Snare Artisan", icon: "⛓️", desc: "Traps and fields last 25% longer and the first foe they catch is rooted 0.8 s.", kind: "key", x: 4, y: 0, new: true, ranks: 1, misc: {"zoneDur": 0.25, "firstRoot": 0.8} },
      { id: "n_k_pack", name: "Alpha Bond", icon: "🐺", desc: "Pets deal 20% more and you heal 4% HP whenever a pet lands a killing blow.", kind: "key", x: 7, y: 0, new: true, ranks: 1, misc: {"petDmg": 0.2, "petKillHeal": 0.04} },
    ] },
  ],
  cleric: [
    { id: "basic", name: "Basic", icon: "⚔️", gate: 0, blurb: "Cheap, short-cooldown skills you can use while moving.", nodes: [
      { id: "smite", name: "Smite", icon: "✨", desc: "200% holy damage to one foe.", kind: "skill", x: 1, y: 0, mp: 10, cd: 0, ranks: 5, fx: {"k": "hit", "dmg": 2.0} },
      { id: "smite_enh", name: "Enhanced Smite", icon: "✨", desc: "Damage +15%.", kind: "enh", x: 1, y: 2, mod: {"dmg": 0.15}, parent: "smite" },
      { id: "smite_glow", name: "Glowing Smite", icon: "✨", desc: "The foe glows 3 s and takes 10% more from you.", kind: "fork", x: 0, y: 4, mod: {"misc": {"vuln": 0.1, "vulnT": 3}}, parent: "smite", mutex: ["smite_rebuke"] },
      { id: "smite_rebuke", name: "Rebuking Smite", icon: "✨", desc: "Undead and bosses take 25% more.", kind: "fork", x: 2, y: 4, mod: {"misc": {"undeadBonus": 0.25}}, parent: "smite", mutex: ["smite_glow"] },
      { id: "hdawn", name: "Hand of Dawn", icon: "🌅", desc: "An 85% beam of light that heals you for 4% HP if it hits.", kind: "skill", x: 4, y: 0, new: true, mp: 6, cd: 4, ranks: 5, fx: {"k": "proj", "dmg": 0.85, "dist": 6, "misc": {"selfHeal": 0.04}} },
      { id: "hdawn_enh", name: "Enhanced Hand of Dawn", icon: "🌅", desc: "Heal 2% more.", kind: "enh", x: 4, y: 2, mod: {"misc": {"selfHeal": 0.02}}, parent: "hdawn" },
      { id: "hdawn_warm", name: "Warm Dawn", icon: "🌅", desc: "Also heals pets 4%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"healPets": 0.04}}, parent: "hdawn", mutex: ["hdawn_sear"] },
      { id: "hdawn_sear", name: "Searing Dawn", icon: "🌅", desc: "Applies a 2 s holy burn.", kind: "fork", x: 5, y: 4, mod: {"misc": {"burn": 2}}, parent: "hdawn", mutex: ["hdawn_warm"] },
      { id: "adm", name: "Admonish", icon: "☝️", desc: "90% word of rebuke that slows 25% for 3 s.", kind: "skill", x: 7, y: 0, new: true, mp: 7, cd: 5, ranks: 5, fx: {"k": "hit", "dmg": 0.9, "misc": {"slow": 0.25, "slowT": 3}} },
      { id: "adm_enh", name: "Enhanced Admonish", icon: "☝️", desc: "Slow lasts 1 s longer.", kind: "enh", x: 7, y: 2, mod: {"misc": {"slowT": 1}}, parent: "adm" },
      { id: "adm_shame", name: "Shame", icon: "☝️", desc: "The foe deals 15% less for 3 s.", kind: "fork", x: 6, y: 4, mod: {"misc": {"atkDown": 0.15}}, parent: "adm", mutex: ["adm_choir"] },
      { id: "adm_choir", name: "Choir", icon: "☝️", desc: "A second nearby foe is slowed as well.", kind: "fork", x: 8, y: 4, mod: {"misc": {"spreadSlow": 1}}, parent: "adm", mutex: ["adm_shame"] },
      { id: "c_p_bright", name: "Bright Words", icon: "✨", desc: "Basic skills deal 6/12/18% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"basicDmg": 6} },
      { id: "c_p_kind", name: "Kind Hands", icon: "✋", desc: "Heals you cause are 8/16/24% stronger.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"healP": 8} },
    ] },
    { id: "core", name: "Core", icon: "✴️", gate: 2, blurb: "Your main damage and pressure tools.", nodes: [
      { id: "heal", name: "Heal", icon: "💚", desc: "Restore a large portion of your HP (and some to pets).", kind: "skill", x: 1, y: 0, mp: 10, cd: 4, ranks: 5, fx: {"k": "heal", "pct": 0.28, "pets": true} },
      { id: "heal_enh", name: "Enhanced Heal", icon: "💚", desc: "Heals 8% more.", kind: "enh", x: 1, y: 2, mod: {"misc": {"pct": 0.08}}, parent: "heal" },
      { id: "heal_wave", name: "Healing Wave", icon: "💚", desc: "Also heal 8% again after 2 s.", kind: "fork", x: 0, y: 4, mod: {"misc": {"echoHeal": 0.08, "echoDelay": 2}}, parent: "heal", mutex: ["heal_clean"] },
      { id: "heal_clean", name: "Cleansing Heal", icon: "💚", desc: "Clear one bleed, burn or poison on you.", kind: "fork", x: 2, y: 4, mod: {"misc": {"cleanse": 1}}, parent: "heal", mutex: ["heal_wave"] },
      { id: "hnova", name: "Holy Nova", icon: "💧", desc: "120% holy burst (r 3.5) around you, and heal yourself 10%.", kind: "skill", x: 4, y: 0, mp: 16, cd: 10, ranks: 5, fx: {"k": "nova", "dmg": 1.2, "rad": 3.5, "misc": {"selfHeal": 0.1}} },
      { id: "hnova_enh", name: "Enhanced Holy Nova", icon: "💧", desc: "Radius +0.4 tiles.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.4}, parent: "hnova" },
      { id: "hnova_dawn", name: "Dawn Nova", icon: "💧", desc: "The heal is 16% instead of 10%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"selfHeal": 0.06}}, parent: "hnova", mutex: ["hnova_sear"] },
      { id: "hnova_sear", name: "Searing Nova", icon: "💧", desc: "Undead take 40% more and burn 3 s.", kind: "fork", x: 5, y: 4, mod: {"misc": {"undeadBonus": 0.4, "burn": 3}}, parent: "hnova", mutex: ["hnova_dawn"] },
      { id: "purify", name: "Purify", icon: "💧", desc: "Cleanse yourself and deal 140% to nearby undead.", kind: "skill", x: 7, y: 0, mp: 12, cd: 14, ranks: 5, fx: {"k": "nova", "dmg": 1.4, "rad": 3.5, "misc": {"cleanse": 1, "undeadOnly": 1}} },
      { id: "purify_enh", name: "Enhanced Purify", icon: "💧", desc: "Radius +0.5 tiles.", kind: "enh", x: 7, y: 2, mod: {"rad": 0.5}, parent: "purify" },
      { id: "purify_wide", name: "Wide Purify", icon: "💧", desc: "Also damages non-undead for 70%.", kind: "fork", x: 6, y: 4, mod: {"misc": {"allDmg": 0.7}}, parent: "purify", mutex: ["purify_ward"] },
      { id: "purify_ward", name: "Warding Purify", icon: "💧", desc: "Gain 15% DR for 3 s after.", kind: "fork", x: 8, y: 4, mod: {"misc": {"dr": 0.15, "drT": 3}}, parent: "purify", mutex: ["purify_wide"] },
      { id: "rbolt", name: "Radiant Bolt", icon: "🌟", desc: "130% holy bolt. If you are above 70% HP, it crits.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 6, ranks: 5, fx: {"k": "proj", "dmg": 1.3, "dist": 7, "misc": {"highHpCrit": 0.7}} },
      { id: "rbolt_enh", name: "Enhanced Radiant Bolt", icon: "🌟", desc: "The crit threshold is 60% HP.", kind: "enh", x: 10, y: 2, mod: {"misc": {"highHpCrit": -0.1}}, parent: "rbolt" },
      { id: "rbolt_split", name: "Split Radiance", icon: "🌟", desc: "A second bolt at 60% seeks another foe.", kind: "fork", x: 9, y: 4, mod: {"misc": {"extra": 0.6}}, parent: "rbolt", mutex: ["rbolt_warm"] },
      { id: "rbolt_warm", name: "Warm Radiance", icon: "🌟", desc: "You heal 5% HP on a crit.", kind: "fork", x: 11, y: 4, mod: {"misc": {"critHeal": 0.05}}, parent: "rbolt", mutex: ["rbolt_split"] },
      { id: "wmercy", name: "Wave of Mercy", icon: "🌊", desc: "A 4-tile wave that heals you 12% and deals 90% to foes it washes over.", kind: "skill", x: 13, y: 0, new: true, mp: 14, cd: 10, ranks: 5, fx: {"k": "line", "dmg": 0.9, "dist": 4, "misc": {"selfHeal": 0.12}} },
      { id: "wmercy_enh", name: "Enhanced Wave of Mercy", icon: "🌊", desc: "The wave travels 1 tile farther.", kind: "enh", x: 13, y: 2, mod: {"dist": 1}, parent: "wmercy" },
      { id: "wmercy_tide", name: "Turning Tide", icon: "🌊", desc: "Pets in the wave also heal 12%.", kind: "fork", x: 12, y: 4, mod: {"misc": {"healPets": 0.12}}, parent: "wmercy", mutex: ["wmercy_salt"] },
      { id: "wmercy_salt", name: "Salt Wave", icon: "🌊", desc: "Foes are slowed 25% for 3 s.", kind: "fork", x: 14, y: 4, mod: {"misc": {"slow": 0.25, "slowT": 3}}, parent: "wmercy", mutex: ["wmercy_tide"] },
      { id: "c_p_mercy", name: "Mercy", icon: "💚", desc: "Healing skills restore 6/12/18% more.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"healP": 6} },
      { id: "c_p_judgement", name: "Judgement", icon: "⚖️", desc: "Holy damage +6/12/18%.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"holyDmg": 6} },
    ] },
    { id: "defensive", name: "Defensive", icon: "🛡️", gate: 6, blurb: "Wards, peels and ways to stay standing.", nodes: [
      { id: "holy", name: "Holy Shield", icon: "🛡️", desc: "A 6 s ward that absorbs a flat amount of damage based on your ATK and MP.", kind: "skill", x: 1, y: 0, mp: 12, cd: 14, ranks: 5, fx: {"k": "shield", "pctMp": 0.3, "dur": 6} },
      { id: "holy_enh", name: "Enhanced Holy Shield", icon: "🛡️", desc: "The ward is 10% larger.", kind: "enh", x: 1, y: 2, mod: {"misc": {"pctMp": 0.1}}, parent: "holy" },
      { id: "holy_thorn", name: "Thorned Shield", icon: "🛡️", desc: "Attackers take 30% ATK as holy damage.", kind: "fork", x: 0, y: 4, mod: {"misc": {"thorns": 0.3}}, parent: "holy", mutex: ["holy_pulse"] },
      { id: "holy_pulse", name: "Pulsing Shield", icon: "🛡️", desc: "While it holds, heal 2% HP per second.", kind: "fork", x: 2, y: 4, mod: {"misc": {"hot": 0.02}}, parent: "holy", mutex: ["holy_thorn"] },
      { id: "sanct", name: "Sanctuary", icon: "🕊️", desc: "A 6 s circle (r 2.8) that heals you and pets and slows foes inside.", kind: "skill", x: 4, y: 0, mp: 20, cd: 18, ranks: 5, fx: {"k": "zone", "rad": 2.8, "dur": 6, "tick": 1, "heal": 0.06, "slow": 0.3} },
      { id: "sanct_enh", name: "Enhanced Sanctuary", icon: "🕊️", desc: "Radius +0.4 tiles.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.4}, parent: "sanct" },
      { id: "sanct_warm", name: "Warm Haven", icon: "🕊️", desc: "Healing per tick is stronger.", kind: "fork", x: 3, y: 4, mod: {"misc": {"heal": 0.03}}, parent: "sanct", mutex: ["sanct_wall"] },
      { id: "sanct_wall", name: "Walled Haven", icon: "🕊️", desc: "You take 15% less damage inside.", kind: "fork", x: 5, y: 4, mod: {"misc": {"dr": 0.15}}, parent: "sanct", mutex: ["sanct_warm"] },
      { id: "ahymn", name: "Aegis Hymn", icon: "🔔", desc: "For 5 s, you and pets gain 25% DR.", kind: "skill", x: 7, y: 0, new: true, mp: 14, cd: 16, ranks: 5, fx: {"k": "buff", "key": "ahymn", "dur": 5, "misc": {"dr": 0.25, "pets": 1}} },
      { id: "ahymn_enh", name: "Enhanced Aegis Hymn", icon: "🔔", desc: "Lasts 1.5 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 1.5}, parent: "ahymn" },
      { id: "ahymn_echo", name: "Echoing Hymn", icon: "🔔", desc: "When it ends, heal 8% HP.", kind: "fork", x: 6, y: 4, mod: {"misc": {"endHeal": 0.08}}, parent: "ahymn", mutex: ["ahymn_bright"] },
      { id: "ahymn_bright", name: "Bright Hymn", icon: "🔔", desc: "Foes that hit you are slowed 20% for 2 s.", kind: "fork", x: 8, y: 4, mod: {"misc": {"thornSlow": 0.2}}, parent: "ahymn", mutex: ["ahymn_echo"] },
      { id: "wbell", name: "Warding Bell", icon: "🛎️", desc: "Ring a 3-tile bell: 80% to foes, and allies gain a 4 s 12% absorb.", kind: "skill", x: 10, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "nova", "dmg": 0.8, "rad": 3, "misc": {"absorb": 0.12, "absorbT": 4}} },
      { id: "wbell_enh", name: "Enhanced Warding Bell", icon: "🛎️", desc: "Radius +0.4 tiles.", kind: "enh", x: 10, y: 2, mod: {"rad": 0.4}, parent: "wbell" },
      { id: "wbell_stun", name: "Stunning Bell", icon: "🛎️", desc: "Foes are staggered 0.8 s.", kind: "fork", x: 9, y: 4, mod: {"stun": 0.8}, parent: "wbell", mutex: ["wbell_pure"] },
      { id: "wbell_pure", name: "Pure Bell", icon: "🛎️", desc: "You are cleansed of one harmful effect.", kind: "fork", x: 11, y: 4, mod: {"misc": {"cleanse": 1}}, parent: "wbell", mutex: ["wbell_stun"] },
      { id: "c_p_ward", name: "Wardcloth", icon: "🧵", desc: "+8/16/24 HP and +1/2/3 DEF.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"hp": 8, "def": 1} },
      { id: "c_p_still", name: "Still Prayer", icon: "🙏", desc: "After a Defensive skill, take 6/12/18% less damage for 3 s.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"defDr": 6} },
    ] },
    { id: "flavor", name: "Devotion", icon: "🕯️", gate: 8, blurb: "Class-defining devotion techniques.", nodes: [
      { id: "chains", name: "Divine Chains", icon: "⛓️", desc: "Bind foes in a 2.6-tile ring for 3 s (root) and deal 90%.", kind: "skill", x: 1, y: 0, mp: 14, cd: 12, ranks: 5, fx: {"k": "nova", "dmg": 0.9, "rad": 2.6, "misc": {"root": 3}} },
      { id: "chains_enh", name: "Enhanced Divine Chains", icon: "⛓️", desc: "The bind lasts 0.6 s longer.", kind: "enh", x: 1, y: 2, mod: {"misc": {"root": 0.6}}, parent: "chains" },
      { id: "chains_tight", name: "Tight Chains", icon: "⛓️", desc: "Bound foes take 15% more.", kind: "fork", x: 0, y: 4, mod: {"misc": {"vuln": 0.15}}, parent: "chains", mutex: ["chains_pull"] },
      { id: "chains_pull", name: "Drawing Chains", icon: "⛓️", desc: "Foes are pulled 1 tile inward.", kind: "fork", x: 2, y: 4, mod: {"misc": {"pull": 1}}, parent: "chains", mutex: ["chains_tight"] },
      { id: "drain", name: "Life Drain", icon: "🩸", desc: "Steal 120% as damage and heal yourself for half of it.", kind: "skill", x: 4, y: 0, mp: 12, cd: 10, ranks: 5, fx: {"k": "hit", "dmg": 1.2, "misc": {"lifesteal": 0.5}} },
      { id: "drain_enh", name: "Enhanced Life Drain", icon: "🩸", desc: "Lifesteal is 65% instead of 50%.", kind: "enh", x: 4, y: 2, mod: {"misc": {"lifesteal": 0.15}}, parent: "drain" },
      { id: "drain_deep", name: "Deep Drain", icon: "🩸", desc: "If the foe is undead, steal 80%.", kind: "fork", x: 3, y: 4, mod: {"misc": {"undeadLeech": 0.3}}, parent: "drain", mutex: ["drain_share"] },
      { id: "drain_share", name: "Shared Drain", icon: "🩸", desc: "Pets also heal 20% of the damage.", kind: "fork", x: 5, y: 4, mod: {"misc": {"healPets": 0.2}}, parent: "drain", mutex: ["drain_deep"] },
      { id: "spirit", name: "Guardian Spirit", icon: "👻", desc: "A spirit watches for 8 s, attacking nearby foes for 50% every 1.2 s.", kind: "skill", x: 7, y: 0, mp: 16, cd: 18, ranks: 5, fx: {"k": "summon", "dur": 8, "dmg": 0.5, "tick": 1.2} },
      { id: "spirit_enh", name: "Enhanced Guardian Spirit", icon: "👻", desc: "It lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "spirit" },
      { id: "spirit_shield", name: "Shielding Spirit", icon: "👻", desc: "You take 12% less damage while it remains.", kind: "fork", x: 6, y: 4, mod: {"misc": {"dr": 0.12}}, parent: "spirit", mutex: ["spirit_wrath"] },
      { id: "spirit_wrath", name: "Wrathful Spirit", icon: "👻", desc: "Its hits deal 70% instead of 50%.", kind: "fork", x: 8, y: 4, mod: {"misc": {"dmg": 0.2}}, parent: "spirit", mutex: ["spirit_shield"] },
      { id: "cground", name: "Consecrated Ground", icon: "✝️", desc: "Bless a 2.8-tile ring for 6 s: you heal 3% per second, foes take 40% per second.", kind: "skill", x: 10, y: 0, new: true, mp: 14, cd: 14, ranks: 5, fx: {"k": "zone", "rad": 2.8, "dur": 6, "tick": 1, "dmg": 0.4, "heal": 0.03} },
      { id: "cground_enh", name: "Enhanced Consecrated Ground", icon: "✝️", desc: "The ring lasts 2 s longer.", kind: "enh", x: 10, y: 2, mod: {"dur": 2}, parent: "cground" },
      { id: "cground_pure", name: "Pure Ground", icon: "✝️", desc: "Foes are slowed 25%.", kind: "fork", x: 9, y: 4, mod: {"misc": {"slow": 0.25}}, parent: "cground", mutex: ["cground_blaze"] },
      { id: "cground_blaze", name: "Blazing Ground", icon: "✝️", desc: "Undead take 30% more each tick.", kind: "fork", x: 11, y: 4, mod: {"misc": {"undeadBonus": 0.3}}, parent: "cground", mutex: ["cground_pure"] },
      { id: "sheph", name: "Shepherd's Call", icon: "🐏", desc: "Pets leap to you, heal 15%, and gain 20% DR for 5 s.", kind: "skill", x: 13, y: 0, new: true, mp: 12, cd: 14, ranks: 5, fx: {"k": "buff", "key": "sheph", "dur": 5, "misc": {"healPets": 0.15, "petDr": 0.2, "recall": 1}} },
      { id: "sheph_enh", name: "Enhanced Shepherd's Call", icon: "🐏", desc: "The ward lasts 2 s longer.", kind: "enh", x: 13, y: 2, mod: {"dur": 2}, parent: "sheph" },
      { id: "sheph_horn", name: "Horned Call", icon: "🐏", desc: "Foes near the landing take 80%.", kind: "fork", x: 12, y: 4, mod: {"misc": {"arrive": 0.8}}, parent: "sheph", mutex: ["sheph_bond"] },
      { id: "sheph_bond", name: "Bonded Call", icon: "🐏", desc: "You also heal 8%.", kind: "fork", x: 14, y: 4, mod: {"misc": {"selfHeal": 0.08}}, parent: "sheph", mutex: ["sheph_horn"] },
      { id: "burden", name: "Burden and Blessing", icon: "⚖️", desc: "A foe is slowed 35% for 5 s; you gain +20% ATK for 5 s.", kind: "skill", x: 16, y: 0, new: true, mp: 14, cd: 12, ranks: 5, fx: {"k": "hit", "dmg": 0.7, "misc": {"slow": 0.35, "slowT": 5, "selfAtk": 0.2, "selfAtkT": 5}} },
      { id: "burden_enh", name: "Enhanced Burden and Blessing", icon: "⚖️", desc: "Both effects last 2 s longer.", kind: "enh", x: 16, y: 2, mod: {"dur": 2}, parent: "burden" },
      { id: "burden_weight", name: "Heavy Burden", icon: "⚖️", desc: "The foe also deals 15% less.", kind: "fork", x: 15, y: 4, mod: {"misc": {"atkDown": 0.15}}, parent: "burden", mutex: ["burden_grace"] },
      { id: "burden_grace", name: "Shared Grace", icon: "⚖️", desc: "Pets gain the same ATK bonus.", kind: "fork", x: 17, y: 4, mod: {"misc": {"petAtk": 0.2}}, parent: "burden", mutex: ["burden_weight"] },
      { id: "c_p_devote", name: "Devoted", icon: "🕯️", desc: "Devotion skills last 8/16/24% longer.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"zoneDur": 8} },
      { id: "c_p_flock", name: "Flock", icon: "🐑", desc: "Pets have 8/16/24% more max HP.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"petHp": 8} },
    ] },
    { id: "mastery", name: "Mastery", icon: "💎", gate: 11, blurb: "Deeper specializations and control.", nodes: [
      { id: "smash", name: "Smash", icon: "💥", desc: "120% damage in a circle around you, with a shockwave.", kind: "skill", x: 1, y: 0, mp: 10, cd: 12, ranks: 5, fx: {"k": "nova", "dmg": 1.2, "rad": 2.0} },
      { id: "smash_enh", name: "Enhanced Smash", icon: "💥", desc: "Radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "smash" },
      { id: "csmash_holy", name: "Hallowed Smash", icon: "💥", desc: "Heals you 8% if it hits anyone.", kind: "fork", x: 0, y: 4, mod: {"misc": {"selfHeal": 0.08}}, parent: "smash", mutex: ["csmash_dust"] },
      { id: "csmash_dust", name: "Dust Smash", icon: "💥", desc: "Foes are slowed 25% for 3 s.", kind: "fork", x: 2, y: 4, mod: {"misc": {"slow": 0.25, "slowT": 3}}, parent: "smash", mutex: ["csmash_holy"] },
      { id: "jring", name: "Judgment Ring", icon: "⭕", desc: "A 3-tile ring slams for 150% after a 0.7 s delay.", kind: "skill", x: 4, y: 0, new: true, mp: 16, cd: 12, ranks: 5, fx: {"k": "meteor", "dmg": 1.5, "rad": 3, "delay": 0.7} },
      { id: "jring_enh", name: "Enhanced Judgment Ring", icon: "⭕", desc: "Radius +0.4 tiles.", kind: "enh", x: 4, y: 2, mod: {"rad": 0.4}, parent: "jring" },
      { id: "jring_sear", name: "Searing Judgment", icon: "⭕", desc: "The ring burns 3 s.", kind: "fork", x: 3, y: 4, mod: {"misc": {"burn": 3}}, parent: "jring", mutex: ["jring_bind"] },
      { id: "jring_bind", name: "Binding Judgment", icon: "⭕", desc: "Foes are rooted 1 s on impact.", kind: "fork", x: 5, y: 4, mod: {"misc": {"root": 1}}, parent: "jring", mutex: ["jring_sear"] },
      { id: "cflame", name: "Censor's Flame", icon: "🕯️", desc: "130% holy fire and a 4 s burn in a 2-tile splash.", kind: "skill", x: 7, y: 0, new: true, mp: 14, cd: 10, ranks: 5, fx: {"k": "hit", "dmg": 1.3, "misc": {"burn": 4, "splash": 0.6, "splashRad": 2}} },
      { id: "cflame_enh", name: "Enhanced Censor's Flame", icon: "🕯️", desc: "Burn lasts 1.5 s longer.", kind: "enh", x: 7, y: 2, mod: {"misc": {"burn": 1.5}}, parent: "cflame" },
      { id: "cflame_wide", name: "Wide Censer", icon: "🕯️", desc: "Splash radius +0.6 tiles.", kind: "fork", x: 6, y: 4, mod: {"rad": 0.6}, parent: "cflame", mutex: ["cflame_pure"] },
      { id: "cflame_pure", name: "Pure Censer", icon: "🕯️", desc: "Undead take 35% more.", kind: "fork", x: 8, y: 4, mod: {"misc": {"undeadBonus": 0.35}}, parent: "cflame", mutex: ["cflame_wide"] },
      { id: "stilld", name: "Still the Dead", icon: "💀", desc: "140% to undead in 3.4 tiles (70% to others) and a 1 s stagger.", kind: "skill", x: 10, y: 0, new: true, mp: 14, cd: 13, ranks: 5, fx: {"k": "nova", "dmg": 0.7, "rad": 3.4, "stun": 1, "misc": {"undeadBonus": 0.7}} },
      { id: "stilld_enh", name: "Enhanced Still the Dead", icon: "💀", desc: "Radius +0.4 tiles.", kind: "enh", x: 10, y: 2, mod: {"rad": 0.4}, parent: "stilld" },
      { id: "stilld_hold", name: "Holding Still", icon: "💀", desc: "Stagger lasts 0.6 s longer.", kind: "fork", x: 9, y: 4, mod: {"stun": 0.6}, parent: "stilld", mutex: ["stilld_ash"] },
      { id: "stilld_ash", name: "Ashen Still", icon: "💀", desc: "Undead also burn 3 s.", kind: "fork", x: 11, y: 4, mod: {"misc": {"burn": 3}}, parent: "stilld", mutex: ["stilld_hold"] },
      { id: "c_p_rite", name: "Rite Work", icon: "📜", desc: "Mastery skills deal 8/16/24% more damage.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"mastDmg": 8} },
      { id: "c_p_cool", name: "Calm Hands", icon: "🧊", desc: "Mastery skills have 6/12/18% shorter cooldowns.", kind: "passive", x: 3, y: 6, new: true, ranks: 3, st: {"mastCd": 6} },
    ] },
    { id: "ultimate", name: "Ultimate", icon: "☀️", gate: 16, blurb: "Long-cooldown signature skills.", nodes: [
      { id: "edict", name: "Edict of Dawn", icon: "🌄", desc: "After 0.8 s, 260% holy damage in a 3.4-tile circle and heal 20% HP.", kind: "skill", x: 1, y: 0, new: true, mp: 24, cd: 24, ranks: 5, fx: {"k": "meteor", "dmg": 2.6, "rad": 3.4, "delay": 0.8, "misc": {"selfHeal": 0.2}} },
      { id: "edict_enh", name: "Enhanced Edict of Dawn", icon: "🌄", desc: "Radius +0.4 tiles.", kind: "enh", x: 1, y: 2, mod: {"rad": 0.4}, parent: "edict" },
      { id: "edict_sun", name: "Sun Edict", icon: "🌄", desc: "The heal is 30% and pets share it.", kind: "fork", x: 0, y: 4, mod: {"misc": {"selfHeal": 0.1, "healPets": 0.3}}, parent: "edict", mutex: ["edict_law"] },
      { id: "edict_law", name: "Law Edict", icon: "🌄", desc: "Foes are stunned 1.2 s.", kind: "fork", x: 2, y: 4, mod: {"stun": 1.2}, parent: "edict", mutex: ["edict_sun"] },
      { id: "mgate", name: "Martyr's Gate", icon: "🚪", desc: "For 6 s you take 40% less damage, and 40% of the damage you take is dealt in a 2.6-tile pulse every 1.5 s.", kind: "skill", x: 4, y: 0, new: true, mp: 22, cd: 26, ranks: 5, fx: {"k": "buff", "key": "mgate", "dur": 6, "misc": {"dr": 0.4, "pulse": 0.4, "pulseR": 2.6, "pulseT": 1.5}} },
      { id: "mgate_enh", name: "Enhanced Martyr's Gate", icon: "🚪", desc: "Lasts 2 s longer.", kind: "enh", x: 4, y: 2, mod: {"dur": 2}, parent: "mgate" },
      { id: "mgate_share", name: "Shared Gate", icon: "🚪", desc: "Pets also gain 20% DR.", kind: "fork", x: 3, y: 4, mod: {"misc": {"petDr": 0.2}}, parent: "mgate", mutex: ["mgate_end"] },
      { id: "mgate_end", name: "Final Gate", icon: "🚪", desc: "When it ends, heal 12% of the damage you absorbed.", kind: "fork", x: 5, y: 4, mod: {"misc": {"endHeal": 0.12}}, parent: "mgate", mutex: ["mgate_share"] },
      { id: "chorus", name: "Chorus of Dust", icon: "📿", desc: "A 4-tile hymn for 6 s: foes take 45% per second, you and pets heal 3% per second, and undead are slowed 40%.", kind: "skill", x: 7, y: 0, new: true, mp: 24, cd: 28, ranks: 5, fx: {"k": "zone", "rad": 4, "dur": 6, "tick": 1, "dmg": 0.45, "heal": 0.03, "misc": {"undeadSlow": 0.4}} },
      { id: "chorus_enh", name: "Enhanced Chorus of Dust", icon: "📿", desc: "The hymn lasts 2 s longer.", kind: "enh", x: 7, y: 2, mod: {"dur": 2}, parent: "chorus" },
      { id: "chorus_grave", name: "Grave Chorus", icon: "📿", desc: "Undead take 30% more each tick.", kind: "fork", x: 6, y: 4, mod: {"misc": {"undeadBonus": 0.3}}, parent: "chorus", mutex: ["chorus_life"] },
      { id: "chorus_life", name: "Living Chorus", icon: "📿", desc: "Healing per tick is 5% instead of 3%.", kind: "fork", x: 8, y: 4, mod: {"misc": {"heal": 0.02}}, parent: "chorus", mutex: ["chorus_grave"] },
      { id: "c_p_epic", name: "High Office", icon: "⭐", desc: "Ultimate skills cost 8/16/24% less MP.", kind: "passive", x: 0, y: 6, new: true, ranks: 3, st: {"ultMp": 8} },
    ] },
    { id: "key", name: "Key Passive", icon: "⭐", gate: 23, blurb: "Choose one keystone. You may respec later.", nodes: [
      { id: "c_k_dawn", name: "Dawn's Promise", icon: "🌅", desc: "Heals also deal 20% of the amount as holy damage to a nearby foe, and you heal 4% HP whenever you smite.", kind: "key", x: 1, y: 0, new: true, ranks: 1, misc: {"healDmg": 0.2, "smiteHeal": 0.04} },
      { id: "c_k_aegis", name: "Aegis of the Flock", icon: "🛡️", desc: "Defensive skills grant pets 15% DR for 6 s, and you take 10% less damage while a ward is active.", kind: "key", x: 4, y: 0, new: true, ranks: 1, misc: {"defPetDr": 0.15, "wardDr": 0.1} },
      { id: "c_k_last", name: "Last Rite", icon: "📿", desc: "Below 35% HP, healing is 30% stronger and your next Core skill costs no MP.", kind: "key", x: 7, y: 0, new: true, ranks: 1, misc: {"lowHeal": 0.3, "lowFreeCore": 1} },
    ] },
  ],
};


export function catsOf(cls: ClassId): CatDef[] { return CLASS_TREE[cls]; }
export function catOf(cls: ClassId, id: CatId): CatDef | undefined { return catsOf(cls).find((c) => c.id === id); }

export function allNodes(cls: ClassId): TreeNode[] {
  const out: TreeNode[] = [];
  for (const c of catsOf(cls)) out.push(...c.nodes);
  return out;
}
export function nodeById(cls: ClassId, id: string): TreeNode | undefined {
  return allNodes(cls).find((n) => n.id === id);
}
export function skillNodes(cls: ClassId): TreeNode[] { return allNodes(cls).filter((n) => n.kind === "skill"); }

export function treeAbilities(cls: ClassId): { id: string; name: string; icon: string; mp: number; cd: number; desc: string; tree?: boolean }[] {
  return skillNodes(cls).filter((n) => n.new).map((n) => ({
    id: n.id, name: n.name, icon: n.icon, mp: n.mp ?? 8, cd: n.cd ?? 8, desc: n.desc, tree: true,
  }));
}

export const RENAME_ABS: Record<string, string> = {
  whirl: "Steel Tempest",
  fan: "Thrown Blades",
  rain: "Sky Volley",
  sstep: "Umbral Step",
};

export interface SkillState {
  cls: ClassId;
  lvl: number;
  skillPts?: number;
  skillVer?: number;
  skillRanks?: Record<string, number>;
  skillEnh?: string[];
  skillPick?: Record<string, string>;
  skillPass?: Record<string, number>;
  skillKey?: string | null;
  skills?: string[];
  slots?: (string | null)[];
  buffs?: { haste?: number };
}

export function pointsSpent(g: SkillState): number {
  let n = 0;
  const r = g.skillRanks ?? {};
  for (const k of Object.keys(r)) n += Math.max(0, r[k] | 0);
  n += (g.skillEnh ?? []).length;
  const pick = g.skillPick ?? {};
  for (const k of Object.keys(pick)) if (pick[k]) n += 1;
  const p = g.skillPass ?? {};
  for (const k of Object.keys(p)) n += Math.max(0, p[k] | 0);
  if (g.skillKey) n += 1;
  return n;
}

export function catUnlocked(g: SkillState, cat: CatId): boolean {
  return pointsSpent(g) >= (CAT_GATES[cat] ?? 0);
}

export function rankOf(g: SkillState, id: string): number {
  return Math.max(0, (g.skillRanks ?? {})[id] | 0);
}

export function hasEnh(g: SkillState, skillId: string): boolean {
  return (g.skillEnh ?? []).includes(skillId + "_enh") || (g.skillEnh ?? []).includes(skillId);
}

export function forkOf(g: SkillState, skillId: string): string | undefined {
  const v = (g.skillPick ?? {})[skillId];
  return v || undefined;
}

export function mergeMod(a: SkillMod, b?: SkillMod): SkillMod {
  if (!b) return a;
  const misc: Record<string, number> = { ...(a.misc ?? {}) };
  if (b.misc) for (const k of Object.keys(b.misc)) misc[k] = (misc[k] ?? 0) + (b.misc[k] ?? 0);
  return {
    dmg: (a.dmg ?? 0) + (b.dmg ?? 0),
    cd: (a.cd ?? 0) + (b.cd ?? 0),
    rad: (a.rad ?? 0) + (b.rad ?? 0),
    dur: (a.dur ?? 0) + (b.dur ?? 0),
    dist: (a.dist ?? 0) + (b.dist ?? 0),
    stun: (a.stun ?? 0) + (b.stun ?? 0),
    root: (a.root ?? 0) + (b.root ?? 0),
    misc,
  };
}

export function modsFor(g: SkillState, skillId: string): SkillMod {
  const n = nodeById(g.cls, skillId);
  const r = Math.max(1, rankOf(g, skillId));
  let m: SkillMod = { dmg: 0.08 * Math.max(0, r - 1), misc: {} };
  if (n && hasEnh(g, skillId)) {
    const enh = allNodes(g.cls).find((x) => x.kind === "enh" && x.parent === skillId);
    if (enh?.mod) m = mergeMod(m, enh.mod);
  }
  const fid = forkOf(g, skillId);
  if (fid) {
    const f = nodeById(g.cls, fid);
    if (f?.mod) m = mergeMod(m, f.mod);
  }
  return m;
}

export function passiveStats(g: SkillState): Record<string, number> {
  const st: Record<string, number> = {};
  const p = g.skillPass ?? {};
  for (const id of Object.keys(p)) {
    const n = nodeById(g.cls, id);
    const r = Math.max(0, p[id] | 0);
    if (!n || !n.st || r <= 0) continue;
    for (const k of Object.keys(n.st)) st[k] = (st[k] ?? 0) + (n.st[k] ?? 0) * r;
  }
  if (g.skillKey) {
    const n = nodeById(g.cls, g.skillKey);
    if (n?.st) for (const k of Object.keys(n.st)) st[k] = (st[k] ?? 0) + (n.st[k] ?? 0);
  }
  return st;
}

export const SKILL_VER = 3;

