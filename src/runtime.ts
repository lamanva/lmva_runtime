import { RuntimeDefinition, AggregateDefinition } from "./definitions/runtime_definition.ts";
import { Aggregate } from "./aggregate.ts";




export class Runtime {
  private _definition: RuntimeDefinition;
  private _aggregates: Array<Aggregate>;

  constructor(definition: RuntimeDefinition) {
    this._definition = definition;
    this._aggregates = definition.aggregates.map(this.loadAggregate);
  }

  private loadAggregate = (definition: AggregateDefinition) => {
    return new Aggregate(definition);
  }

  aggregate(name: string) {
    return this._aggregates.find(a => a.name == name);
  }
}