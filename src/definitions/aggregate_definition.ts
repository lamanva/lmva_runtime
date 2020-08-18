
export interface AggregateDefinition {
  readonly name: string;
  readonly attributes: Array<AttributeDefinition>;
  readonly dtos: Array<DataTransferDefinition>;
  readonly events: Array<EventDefinition>;
  readonly commands: Array<CommandDefinition>;
}

export interface DataTransferDefinition {
  readonly name: string;
  readonly attributes: Array<AttributeDefinition>;
}

export interface AttributeDefinition {
  readonly name: string;
  readonly type: string;
}

export interface EventDefinition {
  readonly name: string;
  readonly type: string;
  readonly dto: string;
}

export interface CommandDefinition {
  readonly name: string;
  readonly type: string;
  readonly dto: string;
  readonly ast: object;
}