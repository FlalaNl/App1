import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect, RemoveDrinkEffect } from '../effects/DrinkEffect';

export class Tank extends BaseRole {
  readonly name = 'Tank';
  readonly description = 'Built different. Drinks for the team, punishes enemies.';
  usePowerUp(context: RoleContext): Effect[] {
    const targets = context.allPlayers.filter((p) => p.id !== context.player.id);
    if (!targets.length) return [];
    const target = context.random.pick(targets);
    return [new DrinkEffect(target.id, 2, 'Tank Strike'), new RemoveDrinkEffect(context.player.id, 1)];
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 3, 'Tank Overextension')];
  }
}
