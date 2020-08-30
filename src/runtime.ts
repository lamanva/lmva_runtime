import { RuntimeNode, AggregateTypeNode } from "./source_nodes.ts";
import {
  AggregateDeclaration,
  EventDeclaration,
  CommandDeclaration,
} from "./declarations.ts";
import { Command } from "./command.ts";
import { Aggregate } from "./aggregate.ts";
import { Result, Err, Ok } from "https://deno.land/x/monads/mod.ts";
import { RuntimeConfig } from "./runtime_config.ts";

export { AggregateDeclaration };

export class Runtime {
  private _source: RuntimeNode;
  private _aggregates: Array<AggregateDeclaration>;
  private _config: RuntimeConfig;

  static create = (source: RuntimeNode, config: RuntimeConfig): Result<Runtime, RuntimeError[]> => {
    const f = Runtime.createAggregateDeclaration(config);
    const results = source.aggregates.map(f);
    const errs = results.filter(r => r.isErr()).map(r => r.unwrapErr());
    const aggs = results.filter(r => r.isOk()).map(r => r.unwrap());
    return errs.length == 0
    ? Ok(new Runtime(source, config, aggs))
    : Err(errs)
    
  }

  static createAggregateDeclaration = (config: RuntimeConfig) => {
    return (source: AggregateTypeNode): Result<AggregateDeclaration, RuntimeError> => {
      const aggConfig = config.aggregates.find((c) => c.name == source.name);
      return aggConfig
      ? AggregateDeclaration.create(source, aggConfig)
      : Err({code: "config_unk"})
    }
  }

  constructor(source: RuntimeNode, config: RuntimeConfig, aggregates: AggregateDeclaration[]) {
    this._source = source;
    this._config = config;
    this._aggregates = aggregates;
  }


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
