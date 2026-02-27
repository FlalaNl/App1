import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../core/Player';
import type { EffectResolver } from '../effects/EffectResolver';
import { DrinkEffect } from '../effects/DrinkEffect';

export class TimeTraveler extends BaseRole {
  readonly name = 'Time Traveler';
  readonly description = 'What happened will happen again. Time is a flat circle.';
  private effectResolverRef: EffectResolver | null = null;

  onRegister(engine: GameEngine, _player: Player): void {
    this.effectResolverRef = engine.effectResolver;
  }

  usePowerUp(context: RoleContext): Effect[] {
    if (this.effectResolverRef) {
      this.effectResolverRef.replayLast(3, { sourcePlayer: context.player, engine: context.engine, logger: context.logger });
    }
    return [];
  }

  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 3, 'Temporal Paradox')];
  }
}
