export class Input {
  public keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keys.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
  };

  public isDown(key: string): boolean {
    return this.keys.has(key);
  }

  public cleanup() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}