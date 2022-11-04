export default class EventEmitter<T> {
  private callbacks: ((t: T) => (void | Promise<void>))[] = [];

  public subscribe(callback: ((t: T) => (void | Promise<void>))): void {
    this.callbacks.push(callback);
  }

  public emit(data: T) {
    this.callbacks.forEach(l => l(data));
  }
  public async emitWait(data: T) {
    for (const c of this.callbacks) {
      await c(data);
    }
  }
}