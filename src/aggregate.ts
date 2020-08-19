import {
  ValueObjectDefinition,
  AttributeDefinition,
  AggregateDefinition,
  EventDefinition,
  CommandDefinition,
  DataTransferDefinition,
} from "./definitions/aggregate_definition.ts";

export { Aggregate, Event };

class Aggregate {
  private _definition: AggregateDefinition;
  private _valueObjects: Array<ValueObject>;
  private _events: Array<Event>;
  private _commands: Array<Command>;
  private _dtos: Array<DataTransferObject>;
  constructor(definition: AggregateDefinition) {
    this._definition = definition;
    this._valueObjects = definition.valueObjects.map(this.loadValueObject);
    this._dtos = definition.dtos.map(this.loadDataTransferObject);
    this._events = definition.events.map(this.loadEvent);
    this._commands = definition.commands.map(this.loadCommand);
  }

  get name() {
    return this._definition.name;
  }

  event = (name: string) => {
    return this._events.find((e) => e.name == name);
  };

  command = (name: string) => {
    return this._commands.find((c) => c.name == name);
  };

  dto = (name: string) => {
    return this._dtos.find((d) => d.name == name);
  };

  valueObject = (name: string) => {
    return this._valueObjects.find((v) => v.name == name);
  };

  private loadValueObject = (definition: ValueObjectDefinition) => {
    return new ValueObject(definition);
  };

  private loadDataTransferObject = (
    definition: DataTransferDefinition | undefined,
  ) => {
    return new DataTransferObject(
      definition,
      definition?.attributes.map(this.loadAttribute),
    );
  };

  private loadAttribute = (definition: AttributeDefinition) => {
    return new Attribute(definition, this.valueObject(definition.name));
  };

  private loadEvent = (definition: EventDefinition) => {
    return new Event(definition, this.dto(definition.name));
  };

  private loadCommand = (definition: CommandDefinition) => {
    return new Command(definition, this.dto(definition.name));
  };
}

class ValueObject {
  private _definition: ValueObjectDefinition;
  constructor(definition: ValueObjectDefinition) {
    this._definition = definition;
  }
  get name() {
    return this._definition.name;
  }
}

class DataTransferObject {
  private _definition: DataTransferDefinition | undefined;
  private _attributes: Array<Attribute> | undefined;
  constructor(
    definition: DataTransferDefinition | undefined,
    attributes: Attribute[] | undefined,
  ) {
    this._definition = definition;
    this._attributes = attributes;
  }
  get name() {
    return this._definition?.name || "";
  }
}

class Attribute {
  private _definition: AttributeDefinition;
  private _valueObject: ValueObject | undefined;
  constructor(
    definition: AttributeDefinition,
    valueObject: ValueObject | undefined,
  ) {
    this._definition = definition;
    this._valueObject = valueObject;
  }
  get name() {
    return this._definition.name;
  }
  get valueObject() {
    return this._valueObject;
  }
}

class Event {
  private _definition: EventDefinition;
  private _dto: DataTransferObject | undefined;
  constructor(
    definition: EventDefinition,
    dto: DataTransferObject | undefined,
  ) {
    this._definition = definition;
    this._dto = dto;
  }

  get name() {
    return this._definition.name || "";
  }
}

interface AttributeValue {
  attribute: AttributeDefinition;
  value: any;
}

class Command {
  private _definition: CommandDefinition;
  private _dto: DataTransferObject | undefined;
  constructor(
    definition: CommandDefinition,
    dto: DataTransferObject | undefined,
  ) {
    this._definition = definition;
    this._dto = dto;
  }
  get name() {
    return this._definition.name || "";
  }

  execute = (dto: object) => {
    //validate dto
    this.emitMessage(dto);
  };

  private emitMessage = (dto: object) => {
    console.log("==");
    console.log(dto);
  };
}
