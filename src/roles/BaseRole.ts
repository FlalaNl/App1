import type { GameEngine } from '../core/GameEngine';
import type { Player } from '../core/Player';
import type { GameEvent } from '../core/GameEvents';
import type { Effect } from '../effects/Effect';
import type { Logger } from '../services/Logger';
import type { RandomProvider } from '../services/RandomProvider';

export interface RoleContext {
  readonly player: Player;
  readonly engine: GameEngine;
  readonly logger: Logger;
  readonly random: RandomProvider;
  readonly allPlayers: Player[];
}

export abstract class BaseRole {
  abstract readonly name: string;
  abstract readonly description: string;
  onRegister?(engine: GameEngine, player: Player): void;
  onEvent?(event: GameEvent<unknown>, context: RoleContext): void;
  abstract usePowerUp(context: RoleContext): Effect[];
  abstract triggerPowerDown(context: RoleContext): Effect[];
}
