
export interface RuntimeConfig {
    aggregates: AggregateConfig[];
}

export interface AggregateConfig {
    name: string;
    eventStore: string;
    opts?: object
}