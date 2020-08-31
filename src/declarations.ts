import {
  ValueTypeNode,
  AttributeNode,
  AggregateTypeNode,
  EventTypeNode,
  CommandTypeNode,
  DataTransferTypeNode,
} from "./source_nodes.ts";
import { Command } from "./command.ts";
import { AggregateConfig } from "./runtime_config.ts";
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
import { EventStore, eventStoreFactory } from "./event_store/event_store.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

export { AggregateDeclaration, EventDeclaration, CommandDeclaration };
export type ScalarType = "Int" | "Float" | "String" | "Boolean";

const typeMap = [
  ["Int", "bigint"],
  ["Float", "number"],
  ["String", "string"],
  ["Boolean", "boolean"],
];

class AggregateDeclaration {
  private _source: AggregateTypeNode;
  private _config: AggregateConfig;
  private _eventStore: EventStore;
  private _valueDeclarations: Array<ValueDeclaration>;
  private _eventDeclarations: Array<EventDeclaration>;
  private _commandDeclarations: Array<CommandDeclaration>;
  private _dataTransferDeclarations: Array<DataTransferDeclaration>;

  static create = (source: AggregateTypeNode, config: AggregateConfig): Result<AggregateDeclaration, RuntimeError> => {
    const eventStore = eventStoreFactory(config);
    return eventStore.isOk() 
    ? Ok(new AggregateDeclaration(source, config, eventStore.unwrap()))
    : Err(eventStore.unwrapErr())
  }

  constructor(source: AggregateTypeNode, config: AggregateConfig, eventStore: EventStore) {
    this._source = source;
    this._config = config;
    this._eventStore = eventStore;
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

  private loadValueObject = (source: ValueTypeNode) => {
    return new ValueDeclaration(source);
  };

  private loadDataTransferObject = (
    source: DataTransferTypeNode | undefined,
  ) => {
    return new DataTransferDeclaration(
      source,
      source?.attributes.map(this.loadAttribute),
    );
  };

  private loadAttribute = (source: AttributeNode) => {
    const attr = this.valueDeclaration(source.valueTypeName).match({
      some: (res) => res,
      none: new ValueDeclaration({ name: "", scalarType: "String" }),
    });
    return new AttributeDeclaration(source, attr);
  };

  private loadEvent = (source: EventTypeNode) => {
    return new EventDeclaration(source, this.dto(source.name));
  };

  private loadCommand = (source: CommandTypeNode) => {
    return new CommandDeclaration(source, this.dto(source.dtoName));
  };
}

class ValueDeclaration {
  private _source: ValueTypeNode;
  constructor(source: ValueTypeNode) {
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
  private _source: DataTransferTypeNode | undefined;
  private _attributeDeclarations: Array<AttributeDeclaration>;
  constructor(
    source: DataTransferTypeNode | undefined,
    attributes: AttributeDeclaration[] | undefined,
  ) {
    this._source = source;
    this._attributeDeclarations = attributes || [];
  }
  get name() {
    return this._source?.name || "";
  }
  attributeDefinition(name: string): Option<AttributeDeclaration> {
    const attr = this._attributeDeclarations.find((a) => a.name == name);
    return attr ? Some(attr) : None;
  }
  validateDto = (dto: object): Option<RuntimeError[]> => {
    const f = this.validateRequiredAttributes(dto);
    const reqErrors = this._attributeDeclarations.map(f).filter((r) =>
      r.isSome()
    ).map((r) => r.unwrap());

    const valErrors = Object.entries(dto).map(this.validateAttributeValue)
      .filter((r) => r.isSome()).map((r) => r.unwrap());
    
    const allErrors = reqErrors.concat(valErrors);

    return allErrors.length > 0 
      ? Some(allErrors) 
      : None;
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
  private _source: AttributeNode;
  private _valueObject: ValueDeclaration;
  constructor(
    source: AttributeNode,
    valueObject: ValueDeclaration | undefined,
  ) {
    this._source = source;
    this._valueObject = valueObject ||
      new ValueDeclaration({ name: "", scalarType: "String" });
  }
  get name() {
    return this._source.valueTypeName;
  }
  get valueDeclaration(): ValueDeclaration {
    return this._valueObject;
  }
}

class EventDeclaration {
  private _source: EventTypeNode;
  private _dataTransferDeclaration: DataTransferDeclaration;
  constructor(
    source: EventTypeNode,
    dto: DataTransferDeclaration | undefined
  ) {
    this._source = source;
    this._dataTransferDeclaration = dto || new DataTransferDeclaration({name: "", attributes: []}, []);;
  }

  get name() {
    return this._source.name || "";
  }

  emit = (dto: object): Option<RuntimeError[]> => {
    return this._dataTransferDeclaration.validateDto(dto).match({
      some: r => Some(r),
      none: this.emitEvent(dto)
    })  
  }

  private emitEvent(dto: object): Option<RuntimeError[]> {
    return None;
  } 
}

class CommandDeclaration {
  private _source: CommandTypeNode;
  private _dataTransferDeclaration: DataTransferDeclaration;
  constructor(
    source: CommandTypeNode,
    dataTransferDeclaration: DataTransferDeclaration | undefined,
  ) {
    this._source = source;
    this._dataTransferDeclaration = dataTransferDeclaration || new DataTransferDeclaration({name: "", attributes: []}, []);
  }
  get name() {
    return this._source.name || "";
  }

  execute = (command: Command): Result<string, RuntimeError[]> => {
    return this._dataTransferDeclaration.validateDto(command.dto).match({
      none: this.executeCommand(command),
      some: res => Err(res)
    })
  };

  private executeCommand = (command: Command): Result<string, RuntimeError[]> => {
    try {
      const guid: string = command.aggregateId
      ? command.aggregateId
      : String(v4.generate())
      this.executeScript(command);
      return Ok(guid);
    }
    catch(e) {
      return Err([{code: "function_syn"}])
    }
  }

  private executeScript(command: Command) {
    Function("aggregateName", this._source.functionSource)(command.aggregateName);
  }
}
