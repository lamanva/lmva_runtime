import { RuntimeSourceTree, AggregateSourceTree } from "./source_trees.ts";
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
  private source: RuntimeSourceTree;
  private _aggregates: Array<AggregateDeclaration>;

  constructor(source: RuntimeSourceTree) {
    this.source = source;
    this._aggregates = source.aggregates.map(this.loadAggregate);
  }

  private loadAggregate = (source: AggregateSourceTree) => {
    return new AggregateDeclaration(source);
  };

  aggregate = (name: string): Result<AggregateDeclaration, RuntimeError> => {
    const found = this._aggregates.find((a) => a.name == name);
    return found ? Ok(found) : Err({ code: "aggregate_unk" });
  };

  event = (
    aggregate_name: string,
    name: string,
  ): Result<EventDeclaration, RuntimeError> => {
    return this.aggregate(aggregate_name).match({
      ok: (val) => val.event(name),
      err: (val) => Err(val),
    });
  };

  command = (
    aggregate_name: string,
    name: string,
  ): Result<CommandDeclaration, RuntimeError> => {
    return this.aggregate(aggregate_name).match({
      ok: (val) => val.command(name),
      err: (val) => Err(val),
    });
  };

  execute = (command: Command): Result<Aggregate, RuntimeError[]> => {
    return this.command(command.aggregate_name, command.name).match({
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
