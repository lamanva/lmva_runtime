import { ScalarType } from "./declarations.ts";

export interface RuntimeNode {
  aggregates: Array<AggregateTypeNode>;
}

export interface AggregateTypeNode {
  readonly name: string;
  readonly valueObjects: Array<ValueTypeNode>;
  readonly attributes: Array<AttributeNode>;
  readonly dtos: Array<DataTransferTypeNode>;
  readonly events: Array<EventTypeNode>;
  readonly commands: Array<CommandTypeNode>;
}

export interface ValueTypeNode {
  readonly name: string;
  readonly scalarType: ScalarType;
}

export interface DataTransferTypeNode {
  readonly name: string;
  readonly attributes: Array<AttributeNode>;
}

export interface AttributeNode {
  readonly valueTypeName: string;
}

export interface EventTypeNode {
  readonly name: string;
  readonly type: string;
  readonly dto: string;
}

export interface CommandTypeNode {
  readonly name: string;
  readonly type: string;
  readonly dtoName: string;
  readonly events: [string];
  readonly functionSource: string;
}
