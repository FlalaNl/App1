import { EffectType, type Effect, type EffectContext } from './Effect';

export class ImmunityEffect implements Effect {
  readonly type = EffectType.IMMUNITY;
  constructor(readonly targetPlayerId: string, private readonly active: boolean) {}
  execute(context: EffectContext): void {
    const target = context.engine.getPlayer(this.targetPlayerId);
    target.setImmune(this.active);
    context.logger.info(`${target.name} immunity set to ${this.active}.`);
  }
  describe(): string { return `ImmunityEffect(target=${this.targetPlayerId}, active=${this.active})`; }
  serialize(): Record<string, unknown> { return { type: this.type, targetPlayerId: this.targetPlayerId, active: this.active }; }
}
