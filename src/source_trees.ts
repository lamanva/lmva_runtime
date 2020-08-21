import { ScalarType } from "./declarations.ts";

export interface RuntimeSourceTree {
  aggregates: Array<AggregateSourceTree>;
}

export interface AggregateSourceTree {
  readonly name: string;
  readonly valueObjects: Array<ValueObjectSourceTree>;
  readonly attributes: Array<AttributeSourceTree>;
  readonly dtos: Array<DataTransferSourceTree>;
  readonly events: Array<EventSourceTree>;
  readonly commands: Array<CommandSourceTree>;
}

export interface ValueObjectSourceTree {
  readonly name: string;
  readonly scalarType: ScalarType;
}

export interface DataTransferSourceTree {
  readonly name: string;
  readonly attributes: Array<AttributeSourceTree>;
}

export interface AttributeSourceTree {
  readonly name: string;
}

export interface EventSourceTree {
  readonly name: string;
  readonly type: string;
  readonly dto: string;
}

export interface CommandSourceTree {
  readonly name: string;
  readonly type: string;
  readonly dto_name: string;
  readonly ast: object;
}
