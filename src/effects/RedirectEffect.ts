import { EffectType, type Effect, type EffectContext } from './Effect';
import { DrinkEffect } from './DrinkEffect';

export class RedirectEffect implements Effect {
  readonly type = EffectType.REDIRECT;

  constructor(
    readonly targetPlayerId: string,
    private readonly originalEffect: DrinkEffect,
    private readonly redirectorName: string,
  ) {}

  execute(context: EffectContext): void {
    const original = context.engine.getPlayer(this.originalEffect.targetPlayerId);
    const redirect = context.engine.getPlayer(this.targetPlayerId);
    context.logger.info(`${this.redirectorName} redirects drink from ${original.name} → ${redirect.name}`);
    const serialized = this.originalEffect.serialize();
    const amount = Number(serialized.amount ?? 1);
    const newEffect = new DrinkEffect(this.targetPlayerId, amount, 'Redirected by Trickster');
    newEffect.execute(context);
  }

  describe(): string { return `RedirectEffect(from=${this.originalEffect.targetPlayerId}, to=${this.targetPlayerId})`; }

  serialize(): Record<string, unknown> {
    return { type: this.type, from: this.originalEffect.targetPlayerId, to: this.targetPlayerId, redirectorName: this.redirectorName };
  }
}
