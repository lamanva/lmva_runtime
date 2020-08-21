import { Attribute } from "./attribute.ts";

export interface Aggregate {
  identifier: string;
  attributes: Array<Attribute>;
}
