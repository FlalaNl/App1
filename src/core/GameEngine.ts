import type { Logger } from '../services/Logger';
import type { RandomProvider } from '../services/RandomProvider';
import { GameEventType, type GameEvent } from './GameEvents';
import type { Player } from './Player';
import type { Effect, EffectContext } from '../effects/Effect';
import type { BaseRole, RoleContext } from '../roles/BaseRole';
import type { EffectResolver } from '../effects/EffectResolver';

export interface GameRuleModifier {
  readonly id: string;
  readonly description: string;
  apply(effects: Effect[], context: EffectContext): Effect[];
}

type EventListener<TPayload> = (event: GameEvent<TPayload>) => void;

export class GameEngine {
  private readonly players: Map<string, Player> = new Map();
  private readonly roles: Map<string, BaseRole> = new Map();
  private readonly ruleModifiers: Map<string, GameRuleModifier> = new Map();
  private readonly listeners: Map<GameEventType, Set<EventListener<unknown>>> = new Map();
  private _sequence = 0;
  private _round = 0;
  private _turnIndex = 0;

  constructor(
    public readonly logger: Logger,
    public readonly random: RandomProvider,
    public readonly effectResolver: EffectResolver,
  ) {}

  registerPlayer(player: Player, role: BaseRole): void {
    this.players.set(player.id, player);
    this.roles.set(player.id, role);
    role.onRegister?.(this, player);
    this.logger.info(`Registered player "${player.name}" as ${role.name}`);
  }

  getPlayer(id: string): Player {
    const p = this.players.get(id);
    if (!p) throw new Error(`Player not found: ${id}`);
    return p;
  }

  getAllPlayers(): Player[] { return [...this.players.values()]; }

  getRole(playerId: string): BaseRole {
    const r = this.roles.get(playerId);
    if (!r) throw new Error(`Role not found for player: ${playerId}`);
    return r;
  }

  get round(): number { return this._round; }
  get turnIndex(): number { return this._turnIndex; }
  incrementRound(): void { this._round++; }
  incrementTurn(): void { this._turnIndex++; }

  addRuleModifier(modifier: GameRuleModifier): void {
    this.ruleModifiers.set(modifier.id, modifier);
    this.logger.info(`Rule modifier added: "${modifier.description}"`);
  }

  removeRuleModifier(id: string): void { this.ruleModifiers.delete(id); }

  applyRuleModifiers(effects: Effect[], context: EffectContext): Effect[] {
    let result = effects;
    for (const modifier of this.ruleModifiers.values()) result = modifier.apply(result, context);
    return result;
  }

  resolveEffects(effects: Effect[], context: EffectContext): void {
    const modified = this.applyRuleModifiers(effects, context);
    this.effectResolver.resolve(modified, context, this);
  }

  on<TPayload>(type: GameEventType, listener: EventListener<TPayload>): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener as EventListener<unknown>);
  }

  off<TPayload>(type: GameEventType, listener: EventListener<TPayload>): void {
    this.listeners.get(type)?.delete(listener as EventListener<unknown>);
  }

  emit<TPayload>(type: GameEventType, payload: TPayload): void {
    const event: GameEvent<TPayload> = { type, payload, timestamp: Date.now(), sequence: ++this._sequence };
    this.logger.debug(`Event emitted: ${type}`, { sequence: event.sequence });

    for (const [playerId, role] of this.roles.entries()) {
      const player = this.players.get(playerId);
      if (player) role.onEvent?.(event as GameEvent<unknown>, this.makeRoleContext(player));
    }

    const external = this.listeners.get(type);
    if (external) {
      for (const listener of external) listener(event as GameEvent<unknown>);
    }
  }

  makeRoleContext(player: Player): RoleContext {
    return { player, engine: this, logger: this.logger, random: this.random, allPlayers: this.getAllPlayers() };
  }
}
