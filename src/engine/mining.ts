export type Tool = 'none' | 'axe' | 'shovel' | 'pickaxe'

export const MiningTimes = {
  // tuned towards a snappier early-game Terraria feel
  dirt: { withTool: 0.20, withoutTool: 1.20 },
  stone: { withTool: 0.55, withoutTool: 6.00 },
  wood: { withTool: 0.50, withoutTool: 2.00 },
  trunk: { withTool: 0.50, withoutTool: 2.00 },
  leaves: 0.05,
  fallback: 0.90,
}
