import { RuntimeNode } from "../src/source_nodes.ts";
import { RuntimeConfig } from "../src/runtime_config.ts";

export const testConfig = {
  aggregates: [
    {
      name: "expense_claim",
      eventStore: "MemEventStore"   
    }
  ]
}

export const testSource: RuntimeNode = {
  aggregates: [
    {
      name: "expense_claim",
      valueObjects: [
        { name: "title", scalarType: "String" },
      ],
      attributes: [
        { valueTypeName: "title" },
      ],
      dtos: [
        {
          name: "new_claim",
          attributes: [
            { valueTypeName: "title" },
          ],
        },
      ],
      events: [
        { name: "created_claim", type: "create", dto: "new_claim" },
      ],
      commands: [
        {
          name: "create_claim",
          type: "create",
          dtoName: "new_claim",
          functionSource: `const agg = {
            aggregateName: aggregateName,
            identifier: "xyz",
            attributes: [
              { name: "title", type: "string", value: "My claim" },
            ],
          };
          return agg;` 
        },
      ],
    },
  ],
};
