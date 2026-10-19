/**
 * A tiny damped-spring integrator for docs-level motion.
 *
 * Values follow SCOUT_UI_DESIGN_SYSTEM.md §11.1: controls use roughly
 * stiffness 420 / damping 30 / mass 0.8, larger stickers 260 / 22 / 1. Springs
 * inherit velocity when retargeted, so every gesture is interruptible.
 */
export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

export const springs = {
  /** Buttons, magnets, small press responses. */
  control: { stiffness: 420, damping: 30, mass: 0.8 },
  /** Sticker-sized objects returning home. One visible overshoot. */
  sticker: { stiffness: 260, damping: 20, mass: 1 },
  /** Letters re-sticking after a throw: heavier, a little more wobble. */
  adhesive: { stiffness: 190, damping: 14, mass: 1 },
  /** The pointer-follow lag while carrying an object. */
  carry: { stiffness: 900, damping: 52, mass: 0.7 },
  /** Gentle pressure swell that never oscillates. */
  pressure: { stiffness: 320, damping: 34, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

const MAX_STEP = 1 / 240;

export class Spring {
  value: number;
  velocity = 0;
  target: number;
  config: SpringConfig;

  constructor(value: number, config: SpringConfig) {
    this.value = value;
    this.target = value;
    this.config = config;
  }

  /** Advance the spring. Returns `true` while it is still moving. */
  step(deltaSeconds: number, restDelta = 0.001, restSpeed = 0.01): boolean {
    const { damping, mass, stiffness } = this.config;
    let remaining = deltaSeconds;
    // Semi-implicit Euler with bounded sub-steps stays stable for stiff
    // controls even when a frame arrives late.
    while (remaining > 0) {
      const dt = Math.min(remaining, MAX_STEP);
      const force =
        -stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += (force / mass) * dt;
      this.value += this.velocity * dt;
      remaining -= dt;
    }
    if (
      Math.abs(this.velocity) < restSpeed &&
      Math.abs(this.value - this.target) < restDelta
    ) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }

  snap(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }
}

/** Clamp `value` to the inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
