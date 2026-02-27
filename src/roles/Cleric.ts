import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect, RemoveDrinkEffect } from '../effects/DrinkEffect';

export class Cleric extends BaseRole {
  readonly name = 'Cleric';
  readonly description = 'Channel divine mercy. Or suffer divine punishment.';
  usePowerUp(context: RoleContext): Effect[] {
    const targets = context.allPlayers.filter((p) => p.drinkCount > 0);
    if (!targets.length) return [];
    const target = targets.sort((a, b) => b.drinkCount - a.drinkCount)[0];
    return [new RemoveDrinkEffect(target.id, 2)];
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 2, 'Divine Punishment')];
  }
}
