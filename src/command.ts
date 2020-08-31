export interface Command {
  aggregateName: string;
  aggregateId?: string;
  name: string;
  dto: object;
}

