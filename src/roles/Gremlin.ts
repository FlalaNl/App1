import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect } from '../effects/DrinkEffect';

export class Gremlin extends BaseRole {
  readonly name = 'Gremlin';
  readonly description = 'Pure chaos. No one is safe, not even the Gremlin.';
  usePowerUp(context: RoleContext): Effect[] {
    const effects: Effect[] = [];
    for (let i = 0; i < 3; i++) effects.push(new DrinkEffect(context.random.pick(context.allPlayers).id, 1, 'Gremlin Chaos'));
    return effects;
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new DrinkEffect(context.player.id, 3, 'Gremlin Self-Chaos')];
  }
}
