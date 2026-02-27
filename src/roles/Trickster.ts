import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { RedirectEffect } from '../effects/RedirectEffect';
import { DrinkEffect } from '../effects/DrinkEffect';

export class Trickster extends BaseRole {
  readonly name = 'Trickster';
  readonly description = 'Nothing is as it seems. Drinks have a way of finding new targets.';
  private lastIncomingDrink: DrinkEffect | null = null;

  usePowerUp(context: RoleContext): Effect[] {
    if (!this.lastIncomingDrink) return [];
    const targets = context.allPlayers.filter((p) => p.id !== context.player.id);
    if (!targets.length) return [];
    return [new RedirectEffect(context.random.pick(targets).id, this.lastIncomingDrink, context.player.name)];
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 2, 'Trickster Backfire')];
  }
}
