import type { Player } from '../core/Player';
import type { Logger } from '../services/Logger';
import type { GameEngine } from '../core/GameEngine';

export enum EffectType {
  DRINK = 'DRINK',
  REMOVE_DRINK = 'REMOVE_DRINK',
  REDIRECT = 'REDIRECT',
  SWAP_DRINKS = 'SWAP_DRINKS',
  SKIP_TURN = 'SKIP_TURN',
  IMMUNITY = 'IMMUNITY',
  STATUS = 'STATUS',
  CANCEL = 'CANCEL',
}

export interface EffectContext {
  readonly sourcePlayer: Player;
  readonly engine: GameEngine;
  readonly logger: Logger;
}

export interface Effect {
  readonly type: EffectType;
  readonly targetPlayerId: string;
  execute(context: EffectContext): void;
  describe(): string;
  serialize(): Record<string, unknown>;
}
