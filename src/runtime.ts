import { RuntimeNode, AggregateTypeNode } from "./source_nodes.ts";
import {
  AggregateDeclaration,
  EventDeclaration,
  CommandDeclaration,
} from "./declarations.ts";
import { Command } from "./command.ts";
import { Aggregate } from "./aggregate.ts";
import { Result, Err, Ok } from "https://deno.land/x/monads/mod.ts";

export { AggregateDeclaration };

export class Runtime {
  private source: RuntimeNode;
  private _aggregates: Array<AggregateDeclaration>;

  constructor(source: RuntimeNode) {
    this.source = source;
    this._aggregates = source.aggregates.map(this.loadAggregate);
  }

  private loadAggregate = (source: AggregateTypeNode) => {
    return new AggregateDeclaration(source);
  };

  aggregate = (name: string): Result<AggregateDeclaration, RuntimeError> => {
    const found = this._aggregates.find((a) => a.name == name);
    return found ? Ok(found) : Err({ code: "aggregate_unk" });
  };

  event = (
    aggregateName: string,
    name: string,
  ): Result<EventDeclaration, RuntimeError> => {
    return this.aggregate(aggregateName).match({
      ok: (val) => val.event(name),
      err: (val) => Err(val),
    });
  };

  command = (
    aggregateName: string,
    name: string,
  ): Result<CommandDeclaration, RuntimeError> => {
    return this.aggregate(aggregateName).match({
      ok: (val) => val.command(name),
      err: (val) => Err(val),
    });
  };

  execute = (command: Command): Result<Aggregate, RuntimeError[]> => {
    return this.command(command.aggregateName, command.name).match({
      ok: (res) => res.execute(command),
      err: (res) => Err([res]),
    });
  };

  /*
  execute(aggregate_name: string, command_name: string, dto: object): Result<Aggregate, RuntimeError> {
    
   
  }
  */
}

export interface RuntimeError {
  code: string;
}
