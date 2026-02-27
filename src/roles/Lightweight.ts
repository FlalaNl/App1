import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect } from '../effects/Effect';
import { DrinkEffect } from '../effects/DrinkEffect';
import { ImmunityEffect } from '../effects/ImmunityEffect';

export class Lightweight extends BaseRole {
  readonly name = 'Lightweight';
  readonly description = 'Fragile but surprisingly resilient in short bursts.';
  usePowerUp(context: RoleContext): Effect[] {
    return [new ImmunityEffect(context.player.id, true)];
  }
  triggerPowerDown(context: RoleContext): Effect[] {
    return [new ImmunityEffect(context.player.id, false), new DrinkEffect(context.player.id, 2, 'Lightweight Crash')];
  }
}
