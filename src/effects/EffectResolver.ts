import type { Effect, EffectContext } from './Effect';
import type { GameEngine } from '../core/GameEngine';
import { GameEventType, type EffectAppliedPayload } from '../core/GameEvents';

export type EffectInterceptor = (effect: Effect, context: EffectContext) => boolean;

export class EffectResolver {
  private readonly interceptors: Map<string, EffectInterceptor> = new Map();
  private readonly history: Effect[] = [];

  addInterceptor(id: string, fn: EffectInterceptor): void { this.interceptors.set(id, fn); }
  removeInterceptor(id: string): void { this.interceptors.delete(id); }
  get effectHistory(): ReadonlyArray<Effect> { return this.history; }

  resolve(effects: Effect[], context: EffectContext, engine: GameEngine): void {
    for (const effect of effects) {
      const cancelled = this.runInterceptors(effect, context, engine);
      if (cancelled) continue;
      context.logger.debug(`Executing: ${effect.describe()}`);
      effect.execute(context);
      this.history.push(effect);
      engine.emit<EffectAppliedPayload>(GameEventType.EFFECT_APPLIED, {
        effectType: effect.type,
        targetPlayerId: effect.targetPlayerId,
      });
    }
  }

  private runInterceptors(effect: Effect, context: EffectContext, engine: GameEngine): boolean {
    for (const [id, interceptor] of this.interceptors.entries()) {
      if (!interceptor(effect, context)) {
        context.logger.warn(`Effect [${effect.describe()}] CANCELLED by interceptor "${id}"`);
        engine.emit(GameEventType.EFFECT_CANCELLED, { effectType: effect.type, cancelledBy: id });
        return true;
      }
    }
    return false;
  }

  replayLast(n: number, context: EffectContext): void {
    const toReplay = this.history.slice(-n);
    context.logger.info(`[TimeTraveler] Replaying last ${toReplay.length} effect(s)`);
    for (const effect of toReplay) {
      context.logger.info(`↩ Replaying: ${effect.describe()}`);
      effect.execute(context);
    }
  }
}
