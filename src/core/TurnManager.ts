import { GameEventType, type TurnEndedPayload, type TurnStartedPayload, type RoundStartedPayload } from './GameEvents';
import type { GameEngine } from './GameEngine';
import type { Player } from './Player';

export class TurnManager {
  constructor(private readonly engine: GameEngine) {}

  startRound(): void {
    this.engine.incrementRound();
    this.engine.emit<RoundStartedPayload>(GameEventType.ROUND_STARTED, { round: this.engine.round });
  }

  async processTurn(player: Player): Promise<void> {
    if (player.isSkipped) {
      player.setSkipped(false);
      this.engine.logger.info(`${player.name} is skipped this turn.`);
      return;
    }

    this.engine.emit<TurnStartedPayload>(GameEventType.TURN_STARTED, {
      playerId: player.id,
      round: this.engine.round,
      turnIndex: this.engine.turnIndex,
    });

    this.engine.incrementTurn();

    this.engine.emit<TurnEndedPayload>(GameEventType.TURN_ENDED, {
      playerId: player.id,
      round: this.engine.round,
      turnIndex: this.engine.turnIndex,
    });
  }
}
