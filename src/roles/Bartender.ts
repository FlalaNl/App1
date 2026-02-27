import { BaseRole, type RoleContext } from './BaseRole';
import type { Effect, EffectContext } from '../effects/Effect';
import type { GameEngine, GameRuleModifier } from '../core/GameEngine';
import type { Player } from '../core/Player';
import { DrinkEffect } from '../effects/DrinkEffect';
import { EffectType } from '../effects/Effect';
import { SwapEffect } from '../effects/SwapEffect';

const BARTENDER_MODIFIER_ID = 'bartender-house-rule';

export class Bartender extends BaseRole {
  readonly name = 'Bartender';
  readonly description = 'Their bar, their rules. House always wins.';

  onRegister(engine: GameEngine, _player: Player): void {
    const modifier: GameRuleModifier = {
      id: BARTENDER_MODIFIER_ID,
      description: 'Last Call: Single drinks are doubled',
      apply(effects: Effect[], _context: EffectContext): Effect[] {
        return effects.map((effect) => {
          if (effect.type !== EffectType.DRINK) return effect;
          const s = effect.serialize();
          if (s.amount === 1) {
            return new DrinkEffect(String(s.targetPlayerId), 2, `${String(s.reason)} [Last Call]`);
          }
          return effect;
        });
      },
    };
    engine.addRuleModifier(modifier);
  }

  usePowerUp(context: RoleContext): Effect[] {
    if (context.allPlayers.length < 2) return [];
    const shuffled = context.random.shuffle([...context.allPlayers]);
    return [new SwapEffect(shuffled[0].id, shuffled[1].id)];
  }

  triggerPowerDown(context: RoleContext): Effect[] {
    context.engine.removeRuleModifier(BARTENDER_MODIFIER_ID);
    return [new DrinkEffect(context.player.id, 2, 'Bartender Shutdown')];
  }
}
