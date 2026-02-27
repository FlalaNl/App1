export enum GameEventType {
  GAME_STARTED = 'GAME_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  ROUND_STARTED = 'ROUND_STARTED',
  ROUND_ENDED = 'ROUND_ENDED',
  TURN_STARTED = 'TURN_STARTED',
  TURN_ENDED = 'TURN_ENDED',
  DRINK_ASSIGNED = 'DRINK_ASSIGNED',
  DRINK_TAKEN = 'DRINK_TAKEN',
  POWER_UP_USED = 'POWER_UP_USED',
  POWER_DOWN_USED = 'POWER_DOWN_USED',
  EFFECT_APPLIED = 'EFFECT_APPLIED',
  EFFECT_CANCELLED = 'EFFECT_CANCELLED',
  EFFECT_REDIRECTED = 'EFFECT_REDIRECTED',
  PLAYER_SKIPPED = 'PLAYER_SKIPPED',
  RULE_ADDED = 'RULE_ADDED',
}

export interface GameEvent<TPayload = unknown> {
  readonly type: GameEventType;
  readonly payload: TPayload;
  readonly timestamp: number;
  readonly sequence: number;
}

export interface TurnStartedPayload { readonly playerId: string; readonly round: number; readonly turnIndex: number; }
export interface TurnEndedPayload { readonly playerId: string; readonly round: number; readonly turnIndex: number; }
export interface DrinkAssignedPayload { readonly fromPlayerId: string; readonly toPlayerId: string; readonly amount: number; readonly reason: string; }
export interface DrinkTakenPayload { readonly playerId: string; readonly amount: number; }
export interface PowerUsedPayload { readonly playerId: string; readonly roleName: string; readonly powerType: 'up' | 'down'; }
export interface EffectAppliedPayload { readonly effectType: string; readonly targetPlayerId: string; readonly amount?: number; }
export interface EffectCancelledPayload { readonly effectType: string; readonly cancelledBy: string; }
export interface RoundStartedPayload { readonly round: number; }
export interface RuleAddedPayload { readonly rule: string; readonly addedBy: string; }
