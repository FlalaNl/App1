import { EffectType, type Effect, type EffectContext } from './Effect';

export class SkipEffect implements Effect {
  readonly type = EffectType.SKIP_TURN;
  constructor(readonly targetPlayerId: string) {}
  execute(context: EffectContext): void {
    const target = context.engine.getPlayer(this.targetPlayerId);
    target.setSkipped(true);
    context.logger.info(`${target.name} will skip their next turn.`);
  }
  describe(): string { return `SkipEffect(target=${this.targetPlayerId})`; }
  serialize(): Record<string, unknown> { return { type: this.type, targetPlayerId: this.targetPlayerId }; }
}
