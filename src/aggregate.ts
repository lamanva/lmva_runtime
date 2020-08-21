import { Attribute } from "./attribute.ts";

export interface Aggregate {
  aggregateName: string;
  identifier: string;
  attributes: Array<Attribute>;
}


