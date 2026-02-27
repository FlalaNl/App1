import { ConsoleLogger } from '../services/Logger';
import { SeededRandomProvider } from '../services/RandomProvider';
import { EffectResolver } from '../effects/EffectResolver';
import { GameEngine } from '../core/GameEngine';

export function buildDemoEngine(seed = 42) {
  const logger = new ConsoleLogger('PourDecisions');
  const random = new SeededRandomProvider(seed);
  const effectResolver = new EffectResolver();
  return new GameEngine(logger, random, effectResolver);
}
