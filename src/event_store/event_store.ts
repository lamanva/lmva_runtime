
import { Event } from "../event.ts";
import { RuntimeError } from '../runtime.ts';
import { Option, Some, None, Result, Ok, Err } from "https://deno.land/x/monads/mod.ts";
import { AggregateConfig } from "../runtime_config.ts";

export interface EventStore {
    appendToStreamAsync(stream: string, event: Event): Promise<any>;
    readLastEvent(stream: string): Result<StoredEvent, RuntimeError[]>;
}

export function eventStoreFactory(config: AggregateConfig): Result<EventStore, RuntimeError> {
    return config.eventStore == "MemEventStore"
    ? Ok(new MemEventStore())
    : Err({code: "event_store_unk"});
}

interface StoredEvent {stream: string, eventNumber: bigint, event: Event};

export class MemEventStore implements EventStore {
    private _events: StoredEvent[];
    constructor() {
        this._events = [];
    }

    appendToStreamAsync = async (stream: string, event: Event) => {
        const eventNumber = BigInt(this._events.length + 1);
        this._events.push({stream: stream, eventNumber: eventNumber, event: event});
    }

    readLastEvent = (stream: string): Result<StoredEvent, RuntimeError[]> => {
        const events = this._events.filter(es => es.stream == stream)
        const eventNumbers = events.map(e => Number(e.eventNumber));
        const index = Math.max(...eventNumbers) - 1;

        const eventWithMaxNumber = events.length == 0
        ? undefined
        : this._events.filter(es => es.stream == stream)[index];

        return eventWithMaxNumber
        ? Ok(eventWithMaxNumber)
        : Err([{code: "event_instance_unk"}]);
    }
}
/*
export class EventStoreMgr {
    private static instance: EventStore;
    private constructor() {};
    public static get = (): Result<EventStore, RuntimeError[]> => {
        return EventStoreMgr.instance 
        ? Ok(EventStoreMgr.instance) 
        : Err([{code: "event_store_ini"}])
    }
    public static init = (eventStoreType: string): Option<RuntimeError[]> => {
        return EventStoreMgr.instance
        ? Some([{code: "event_store_dup"}])
        : EventStoreMgr.newEventStore(eventStoreType).match({
            ok: res => EventStoreMgr.setEventStore(res),
            err: res => Some(res)
        })
    }
    private static newEventStore = (eventStoreType: string): Result<EventStore, RuntimeError[]> => {
        return eventStoreType == "MemEventStore"
        ? Ok(new MemEventStore())
        : Err([{code: "event_store_unk"}])
    }
    private static setEventStore = (eventStore: EventStore): Option<RuntimeError[]> => {
        EventStoreMgr.instance = eventStore;
        return None;
    } 
}
*/

