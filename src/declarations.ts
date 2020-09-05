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
import { filterErrs, filterOks } from './utils.ts';

export { AggregateDeclaration, EventDeclaration, CommandDeclaration };
export type ScalarType = "Int" | "Float" | "String" | "Boolean";

const typeMap = [
  ["Int", "bigint"],
  ["Float", "number"],
  ["String", "string"],
  ["Boolean", "boolean"],
];

interface AggregateParams {
  readonly source: AggregateTypeNode;
  readonly config: AggregateConfig;
  readonly eventStore: EventStore;
  readonly valueTypes: ValueTypeDeclaration[];
  readonly dataTransferClasses: DataTransferDeclaration[];
  readonly eventTypes: EventDeclaration[];
  readonly commandTypes: CommandDeclaration[];
}

class AggregateDeclaration {
  private _source: AggregateTypeNode;
  private _config: AggregateConfig;
  private _eventStore: EventStore;
  private _valueDeclarations: Array<ValueTypeDeclaration>;
  private _eventDeclarations: Array<EventDeclaration>;
  private _commandDeclarations: Array<CommandDeclaration>;
  private _dataTransferDeclarations: Array<DataTransferDeclaration>;

  static create = (source: AggregateTypeNode, config: AggregateConfig): Result<AggregateDeclaration, RuntimeError> => {
    const eventStore = eventStoreFactory(config);
    const valueTypes = source.valueObjects.map(AggregateDeclaration.valueDeclarations);
    const attributes = source.attributes.map(AttributeDeclaration.create(valueTypes));
    const dtts = source.dtos.map(DataTransferDeclaration.create(valueTypes));
    const dttsOk = filterOks(dtts) as DataTransferDeclaration[]; 
    const events = source.events.map(EventDeclaration.create(dttsOk));
    const commands = source.commands.map(CommandDeclaration.create(dttsOk)); 
    const errs = filterErrs(attributes).concat(filterErrs(dtts)).concat(filterErrs(events)).concat(filterErrs(commands));
    return errs.length > 0
    ? Err(eventStore.unwrapErr())
    : Ok(new AggregateDeclaration({
      source, 
      config,
      eventStore: eventStore.unwrap(), 
      valueTypes, 
      dataTransferClasses: filterOks(dtts),
      eventTypes: filterOks(events),
      commandTypes: filterOks(commands)
    }));
  }

  constructor(params: AggregateParams) {
    this._source = params.source;
    this._config = params.config;
    this._eventStore = params.eventStore;
    this._valueDeclarations = params.valueTypes;
    this._dataTransferDeclarations = params.dataTransferClasses;
    this._eventDeclarations = params.eventTypes;
    this._commandDeclarations = params.commandTypes;
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

  valueDeclaration = (name: string): Option<ValueTypeDeclaration> => {
    const result = this._valueDeclarations.find((v) => v.name == name);
    return result ? Some(result) : None;
  };

  static valueDeclarations = (source: ValueTypeNode) => {
    return new ValueTypeDeclaration(source);
  }

  private loadValueDeclaration = (source: ValueTypeNode) => {
    return new ValueTypeDeclaration(source);
  };

  static dataTransferTypes = (source: DataTransferTypeNode) => {
    
  }


  private loadAttribute = (source: AttributeNode) => {
    const attr = this.valueDeclaration(source.valueTypeName).match({
      some: (res) => res,
      none: new ValueTypeDeclaration({ name: "", scalarType: "String" }),
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

class ValueTypeDeclaration {
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

  static create = (valueTypes: ValueTypeDeclaration[]) => {
    return (source: DataTransferTypeNode): Result<DataTransferDeclaration, RuntimeError[]> => {
      const createAttributeFn = AttributeDeclaration.create(valueTypes);
      const results = source.attributes.map(createAttributeFn);
      const attrErrs = results.filter(a => a.isErr()).map(a => a.unwrapErr());
      const attrs = attrErrs.length > 0 ? [] : results.filter(a => a.isOk).map(a => a.unwrap());
      return attrErrs.length > 0
      ? Err(attrErrs)
      : Ok(new DataTransferDeclaration(source, attrs))
    }
  }



  private _source: DataTransferTypeNode | undefined;
  private _attributeDeclarations: Array<AttributeDeclaration>;
  constructor(
    source: DataTransferTypeNode,
    attributes: AttributeDeclaration[],
  ) {
    this._source = source;
    this._attributeDeclarations = attributes;
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
  private _valueObject: ValueTypeDeclaration;

  static create = (valueTypes: ValueTypeDeclaration[]) => {
    return (source: AttributeNode): Result<AttributeDeclaration, RuntimeError> => {
      const valueType = valueTypes.find(v => v.name == source.valueTypeName);
      return valueType
      ? Ok(new AttributeDeclaration(source, valueType))
      : Err({code: "value_type_unk"});
    }
  }

  constructor(
    source: AttributeNode,
    valueObject: ValueTypeDeclaration | undefined,
  ) {
    this._source = source;
    this._valueObject = valueObject ||
      new ValueTypeDeclaration({ name: "", scalarType: "String" });
  }
  get name() {
    return this._source.valueTypeName;
  }
  get valueDeclaration(): ValueTypeDeclaration {
    return this._valueObject;
  }
}

class EventDeclaration {
  private _source: EventTypeNode;
  private _dataTransferDeclaration: DataTransferDeclaration;

  static create = (dtos: DataTransferDeclaration[]) => {
    return (source: EventTypeNode): Result<EventDeclaration, RuntimeError> => {
      const dto = dtos.find(d => d.name == source.dto);
      return dtos.length > 0
      ? Ok(new EventDeclaration(source, dto))
      : Err({code: "data_type_unk"});
    }
  }

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

  static create = (dtts: DataTransferDeclaration[]) => {
    return (source: CommandTypeNode) => {
      const dtt = dtts.find(d => d.name == source.dtoName);
      return dtts.length > 0
      ? Ok(new CommandDeclaration(source, dtt))
      : Err({code: "data_type_unk"});
    }
  }


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
