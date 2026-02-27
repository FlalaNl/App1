import { EffectType, type Effect, type EffectContext } from './Effect';

export class SwapEffect implements Effect {
  readonly type = EffectType.SWAP_DRINKS;

  constructor(readonly targetPlayerId: string, private readonly otherPlayerId: string) {}

  execute(context: EffectContext): void {
    const a = context.engine.getPlayer(this.targetPlayerId);
    const b = context.engine.getPlayer(this.otherPlayerId);
    const aCount = a.drinkCount;
    const bCount = b.drinkCount;
    a.removeDrinks(aCount);
    b.removeDrinks(bCount);
    a.addDrinks(bCount);
    b.addDrinks(aCount);
    context.logger.info(`Swapped drink counts: ${a.name}(${bCount}) ↔ ${b.name}(${aCount})`);
  }

  describe(): string { return `SwapEffect(a=${this.targetPlayerId}, b=${this.otherPlayerId})`; }
  serialize(): Record<string, unknown> { return { type: this.type, a: this.targetPlayerId, b: this.otherPlayerId }; }
}
