export class Player {
  private _drinkCount = 0;
  private _isSkipped = false;
  private _isImmune = false;
  private _statusEffects: Set<string> = new Set();

  constructor(public readonly id: string, public readonly name: string) {}

  get drinkCount(): number { return this._drinkCount; }
  get isSkipped(): boolean { return this._isSkipped; }
  get isImmune(): boolean { return this._isImmune; }
  get statusEffects(): ReadonlySet<string> { return this._statusEffects; }

  addDrinks(amount: number): void {
    if (amount < 0) throw new Error('Drink amount cannot be negative');
    this._drinkCount += amount;
  }

  removeDrinks(amount: number): void {
    this._drinkCount = Math.max(0, this._drinkCount - amount);
  }

  setSkipped(value: boolean): void { this._isSkipped = value; }
  setImmune(value: boolean): void { this._isImmune = value; }
  addStatusEffect(effect: string): void { this._statusEffects.add(effect); }
  removeStatusEffect(effect: string): void { this._statusEffects.delete(effect); }
  hasStatusEffect(effect: string): boolean { return this._statusEffects.has(effect); }

  snapshot(): PlayerSnapshot {
    return {
      id: this.id,
      name: this.name,
      drinkCount: this._drinkCount,
      isSkipped: this._isSkipped,
      isImmune: this._isImmune,
      statusEffects: [...this._statusEffects],
    };
  }

  restoreSnapshot(snap: PlayerSnapshot): void {
    this._drinkCount = snap.drinkCount;
    this._isSkipped = snap.isSkipped;
    this._isImmune = snap.isImmune;
    this._statusEffects = new Set(snap.statusEffects);
  }
}

export interface PlayerSnapshot {
  readonly id: string;
  readonly name: string;
  readonly drinkCount: number;
  readonly isSkipped: boolean;
  readonly isImmune: boolean;
  readonly statusEffects: string[];
}
