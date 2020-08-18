
import { AttributeDefinition, AggregateDefinition, EventDefinition, CommandDefinition, DataTransferDefinition } from "./definitions/aggregate_definition.ts";
import {ancestor} from 'https://cdn.skypack.dev/acorn-walk?dts';

export { Aggregate, Event }

class Aggregate {
  private _definition: AggregateDefinition;
  private _events: Array<Event>;
  private _commands: Array<Command>;
  private _dtos: Array<DataTransferObject>;
  constructor(definition: AggregateDefinition ) {
    this._definition = definition;
    this._events = definition.events.map(this.loadEvent);
    this._commands = definition.commands.map(this.loadCommand);
    this._dtos = definition.dtos.map(this.loadDataTransferObject);
  }

  get name() {
    return this._definition.name;
  }

  event = (name: string) => {
    return this._events.find(e => e.name == name);
  }

  command = (name: string) => {
    return this._commands.find(c => c.name == name);
  }

  dto = (name: string) => {
    return this._dtos.find(d => d.name == name);
  }

  private loadDataTransferObject = (definition: DataTransferDefinition) => {
    return new DataTransferObject(definition);
  }

  private loadEvent = (defintion: EventDefinition) => {
    return new Event(defintion);
  }

  private loadCommand = (definition: CommandDefinition) => {
    return new Command(definition);
  }

}

class DataTransferObject {
  private _definition: DataTransferDefinition;
  constructor(definition: DataTransferDefinition) {
    this._definition = definition;
  }
  get name() {
    return this._definition.name;
  }
}

class Event {
  private _definition: EventDefinition;
  constructor(definition: EventDefinition) {
    this._definition = definition;
  }

  get name() {
    return this._definition.name;
  }

}

interface AttributeValue {
  attribute: AttributeDefinition,
  value: any;
}

class Command {
  private _definition: CommandDefinition;
  constructor(definition: CommandDefinition) {
    this._definition = definition;
  }
  get name() {
    return this._definition.name;
  }

  execute = (dto: object) => {
    //validate dto
    this.emitMessage(dto);
  }

  private emitMessage = (dto: object) => {
    console.log("==");
    console.log(dto);

  }

}