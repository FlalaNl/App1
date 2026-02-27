import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect } from '../effects/DrinkEffect';

export class Berserker extends BaseRole {
  readonly name = 'Berserker';
  readonly description = 'Rage fuels retaliation. Every drink received is repaid in kind.';
  usePowerUp(context: RoleContext): Effect[] {
    const targets = context.allPlayers.filter((p) => p.id !== context.player.id);
    if (!targets.length) return [];
    const target = context.random.pick(targets);
    return [new DrinkEffect(target.id, 2, 'Berserker Rage')];
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 2, 'Berserker Exhaustion')];
  }
}
