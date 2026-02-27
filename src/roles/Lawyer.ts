import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect } from '../effects/DrinkEffect';
import { EffectType } from '../effects/Effect';
import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../core/Player';

export class Lawyer extends BaseRole {
  readonly name = 'Lawyer';
  readonly description = 'Legally, they do not have to drink. For now.';
  private objections = 2;
  private shieldedPlayerId: string | null = null;

  onRegister(engine: GameEngine, player: Player): void {
    engine.effectResolver.addInterceptor(`lawyer-${player.id}`, (effect) => {
      if (effect.type === EffectType.DRINK && effect.targetPlayerId === player.id && this.objections > 0) {
        this.objections--;
        return false;
      }
      if (effect.type === EffectType.DRINK && this.shieldedPlayerId && effect.targetPlayerId === this.shieldedPlayerId) {
        this.shieldedPlayerId = null;
        return false;
      }
      return true;
    });
  }

  usePowerUp(context: RoleContext): Effect[] {
    const targets = context.allPlayers.filter((p) => p.id !== context.player.id);
    if (!targets.length) return [];
    this.shieldedPlayerId = context.random.pick(targets).id;
    return [];
  }

  triggerPowerDown(context: RoleContext): Effect[] {
    this.objections = 0;
    this.shieldedPlayerId = null;
    return [new DrinkEffect(context.player.id, 2, 'Lawyer Disbarment')];
  }
}
