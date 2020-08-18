import { AggregateDefinition } from "./aggregate_definition.ts";

export {RuntimeDefinition, AggregateDefinition};

interface RuntimeDefinition {
  aggregates: Array<AggregateDefinition>
}