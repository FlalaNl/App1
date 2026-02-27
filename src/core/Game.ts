import type { GameEngine } from './GameEngine';
import type { TurnManager } from './TurnManager';
import type { Logger } from '../services/Logger';

export class Game {
  constructor(
    private readonly engine: GameEngine,
    private readonly turnManager: TurnManager,
    private readonly logger: Logger,
  ) {}

  async runRound(): Promise<void> {
    this.turnManager.startRound();
    const players = this.engine.getAllPlayers();
    for (const player of players) await this.turnManager.processTurn(player);
    this.logger.info(`Round ${this.engine.round} complete.`);
  }
}
