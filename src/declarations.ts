import {
  ValueObjectSourceTree,
  AttributeSourceTree,
  AggregateSourceTree,
  EventSourceTree,
  CommandSourceTree,
  DataTransferSourceTree,
} from "./source_trees.ts";
import { Command } from "./command.ts";
import { Aggregate } from "./aggregate.ts";
import {
  Result,
  Err,
  Ok,
  Option,
  None,
  Some,
} from "https://deno.land/x/monads/mod.ts";
import { RuntimeError } from "./runtime.ts";

export { AggregateDeclaration, EventDeclaration, CommandDeclaration };
export type ScalarType = "Int" | "Float" | "String" | "Boolean";

const typeMap = [
  ["Int", "bigint"],
  ["Float", "number"],
  ["String", "string"],
  ["Boolean", "boolean"],
];

class AggregateDeclaration {
  private _source: AggregateSourceTree;
  private _valueDeclarations: Array<ValueDeclaration>;
  private _eventDeclarations: Array<EventDeclaration>;
  private _commandDeclarations: Array<CommandDeclaration>;
  private _dataTransferDeclarations: Array<DataTransferDeclaration>;
  constructor(source: AggregateSourceTree) {
    this._source = source;
    this._valueDeclarations = source.valueObjects.map(this.loadValueObject);
    this._dataTransferDeclarations = source.dtos.map(
      this.loadDataTransferObject,
    );
    this._eventDeclarations = source.events.map(this.loadEvent);
    this._commandDeclarations = source.commands.map(this.loadCommand);
  }

  get name() {
    return this._source.name;
  }

  event = (name: string): Result<EventDeclaration, RuntimeError> => {
    const result = this._eventDeclarations.find((e) => e.name == name);
    return result ? Ok(result) : Err({ code: "event_unk" });
  };

  command = (name: string): Result<CommandDeclaration, RuntimeError> => {
    const result = this._commandDeclarations.find((c) => c.name == name);
    return result ? Ok(result) : Err({ code: "command_unk" });
  };

  dto = (name: string) => {
    return this._dataTransferDeclarations.find((d) => d.name == name);
  };

  valueDeclaration = (name: string): Option<ValueDeclaration> => {
    const result = this._valueDeclarations.find((v) => v.name == name);
    return result ? Some(result) : None;
  };

  private loadValueObject = (source: ValueObjectSourceTree) => {
    return new ValueDeclaration(source);
  };

  private loadDataTransferObject = (
    source: DataTransferSourceTree | undefined,
  ) => {
    return new DataTransferDeclaration(
      source,
      source?.attributes.map(this.loadAttribute),
    );
  };

  private loadAttribute = (source: AttributeSourceTree) => {
    const attr = this.valueDeclaration(source.name).match({
      some: (res) => res,
      none: new ValueDeclaration({ name: "", scalarType: "String" }),
    });
    return new AttributeDeclaration(source, attr);
  };

  private loadEvent = (source: EventSourceTree) => {
    return new EventDeclaration(source, this.dto(source.name));
  };

  private loadCommand = (source: CommandSourceTree) => {
    return new CommandDeclaration(source, this.dto(source.dto_name));
  };
}

class ValueDeclaration {
  private _source: ValueObjectSourceTree;
  constructor(source: ValueObjectSourceTree) {
    this._source = source;
  }
  get name() {
    return this._source.name;
  }
  get scalarType() {
    return this._source.scalarType;
  }
  validateValue = (value: any): Option<RuntimeError> => {
    const expectedScalarType = typeMap.find((m) => m[1] == typeof value);

    return expectedScalarType && expectedScalarType[0] == this.scalarType
      ? None
      : Some({ code: "attribute_typ" });
  };
}

class DataTransferDeclaration {
  private _source: DataTransferSourceTree | undefined;
  private _attributeDeclarations: Array<AttributeDeclaration>;
  constructor(
    source: DataTransferSourceTree | undefined,
    attributes: AttributeDeclaration[] | undefined,
  ) {
    this._source = source;
    this._attributeDeclarations = attributes || [];
  }
  get name() {
    return this._source?.name || "";
  }
  attributeDefinition(name: string): Option<AttributeDeclaration> {
    const attr = this._attributeDeclarations?.find((a) => a.name == name);
    return attr ? Some(attr) : None;
  }
  validateDto = (dto: object): RuntimeError[] => {
    const f = this.validateRequiredAttributes(dto);
    const reqErrors = this._attributeDeclarations?.map(f).filter((r) =>
      r.isSome()
    ).map((r) => r.unwrap());
    const valueErrs = Object.entries(dto).map(this.validateAttributeValue)
      .filter((r) => r.isSome()).map((r) => r.unwrap());
    return reqErrors.concat(valueErrs);
  };
  private validateAttributeValue = (
    kv: [string, any],
  ): Option<RuntimeError> => {
    const def = this.attributeDefinition(kv[0]);
    return def.match({
      some: (res) => res.valueDeclaration.validateValue(kv[1]),
      none: Some({ code: "attribute_unk" }),
    });
  };

  private validateRequiredAttributes = (dto: object) => {
    return (
      attributeDefinition: AttributeDeclaration,
    ): Option<RuntimeError> => {
      return Object.keys(dto).find((k) => k == attributeDefinition.name)
        ? None
        : Some({ code: "attribute_req" });
    };
  };

  private validateAttributeName = (attributes: object) => {
    return (
      attributeDeclaration: AttributeDeclaration,
    ): Result<object, RuntimeError> => {
      const n =
        Object.keys(attributes).filter((k) => k == attributeDeclaration.name)
          .length;
      return n == 1
        ? Ok(attributes)
        : n > 1
        ? Err({ code: "attribute_dup" })
        : Err({ code: "attribute_unk" });
    };
  };
}

class AttributeDeclaration {
  private _source: AttributeSourceTree;
  private _valueObject: ValueDeclaration;
  constructor(
    source: AttributeSourceTree,
    valueObject: ValueDeclaration | undefined,
  ) {
    this._source = source;
    this._valueObject = valueObject ||
      new ValueDeclaration({ name: "", scalarType: "String" });
  }
  get name() {
    return this._source.name;
  }
  get valueDeclaration(): ValueDeclaration {
    return this._valueObject;
  }
}

class EventDeclaration {
  private _source: EventSourceTree;
  private _dto: DataTransferDeclaration | undefined;
  constructor(
    source: EventSourceTree,
    dto: DataTransferDeclaration | undefined,
  ) {
    this._source = source;
    this._dto = dto;
  }

  get name() {
    return this._source.name || "";
  }
}

class CommandDeclaration {
  private _source: CommandSourceTree;
  private _dataTransferDeclaration: DataTransferDeclaration | undefined;
  constructor(
    source: CommandSourceTree,
    dataTransferDeclaration: DataTransferDeclaration | undefined,
  ) {
    this._source = source;
    this._dataTransferDeclaration = dataTransferDeclaration;
  }
  get name() {
    return this._source.name || "";
  }

  execute = (command: Command): Result<Aggregate, RuntimeError[]> => {
    const errs = this._dataTransferDeclaration !== undefined
      ? this._dataTransferDeclaration.validateDto(command.dto)
      : [];
    const aggregate: Aggregate = {
      identifier: "xyz",
      attributes: [
        { name: "title", type: "string", value: "My claim" },
      ],
    };
    return errs.length == 0 ? Ok(aggregate) : Err(errs);
  };
}