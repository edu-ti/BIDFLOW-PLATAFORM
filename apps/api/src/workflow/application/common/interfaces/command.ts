export abstract class Command<T = void> {
  abstract readonly commandName: string;
  public readonly commandId: string;
  public readonly ocurredAt: Date;

  constructor() {
    this.commandId = crypto.randomUUID();
    this.ocurredAt = new Date();
  }
}

export abstract class Query<T = unknown> {
  abstract readonly queryName: string;
}

import crypto from 'crypto';
