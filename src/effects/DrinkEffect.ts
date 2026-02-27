import { EffectType, type Effect, type EffectContext } from './Effect';
import { GameEventType } from '../core/GameEvents';

export class DrinkEffect implements Effect {
  readonly type = EffectType.DRINK;

  constructor(
    readonly targetPlayerId: string,
    private readonly amount: number,
    private readonly reason: string,
  ) {}

  execute(context: EffectContext): void {
    const target = context.engine.getPlayer(this.targetPlayerId);
    if (target.isImmune) {
      context.logger.info(`${target.name} is immune — drink blocked.`);
      return;
    }
    target.addDrinks(this.amount);
    context.engine.emit(GameEventType.DRINK_TAKEN, { playerId: target.id, amount: this.amount });
    context.logger.info(`${target.name} drinks ${this.amount}x. [${this.reason}] (Total: ${target.drinkCount})`);
  }

  describe(): string {
    return `DrinkEffect(target=${this.targetPlayerId}, amount=${this.amount}, reason="${this.reason}")`;
  }

  serialize(): Record<string, unknown> {
    return { type: this.type, targetPlayerId: this.targetPlayerId, amount: this.amount, reason: this.reason };
  }
}

export class RemoveDrinkEffect implements Effect {
  readonly type = EffectType.REMOVE_DRINK;

  constructor(readonly targetPlayerId: string, private readonly amount: number) {}

  execute(context: EffectContext): void {
    const target = context.engine.getPlayer(this.targetPlayerId);
    target.removeDrinks(this.amount);
    context.logger.info(`${target.name} loses ${this.amount} drink(s). (Total: ${target.drinkCount})`);
  }

  describe(): string { return `RemoveDrinkEffect(target=${this.targetPlayerId}, amount=${this.amount})`; }
  serialize(): Record<string, unknown> { return { type: this.type, targetPlayerId: this.targetPlayerId, amount: this.amount }; }
}
