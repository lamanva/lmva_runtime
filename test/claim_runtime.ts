import { RuntimeSourceTree } from "../src/source_trees.ts";

export const testSource: RuntimeSourceTree = {
  aggregates: [
    {
      name: "expense_claim",
      valueObjects: [
        { name: "title", scalarType: "String" },
      ],
      attributes: [
        { name: "title" },
      ],
      dtos: [
        {
          name: "new_claim",
          attributes: [
            { name: "title" },
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
            type: aggregateName,
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
