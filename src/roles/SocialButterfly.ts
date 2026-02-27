import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect } from '../effects/DrinkEffect';

export class SocialButterfly extends BaseRole {
  readonly name = 'Social Butterfly';
  readonly description = 'Life of the party — everyone drinks when they say so.';
  usePowerUp(context: RoleContext): Effect[] {
    const others = context.allPlayers.filter((p) => p.id !== context.player.id);
    return others.map((p) => new DrinkEffect(p.id, 1, 'Social Butterfly Toast'));
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    const n = context.allPlayers.filter((p) => p.id !== context.player.id).length;
    return [new DrinkEffect(context.player.id, n, 'Social Butterfly Debt')];
  }
}
