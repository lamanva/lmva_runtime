import { Event } from '../aggregate.ts'

export class EventStore {
  private _events: Array<StoredEvent>;
  private _next_serial: number;

  constructor() {
    this._events = [];
    this._next_serial = 0;
  }

  store(aggregate_name: string, event: Event) {
    this._events.push({
      serial_number: this._next_serial,
      aggregate_name: aggregate_name,
      event: event
    });
    this._next_serial++;
  }

  rerun(aggregate_name: string) {
    
  }
}

export interface StoredEvent {
  serial_number: number;
  aggregate_name: string;
  event: Event
}