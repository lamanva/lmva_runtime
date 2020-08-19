import { RuntimeDefinition } from "../src/definitions/runtime_definition.ts";

export const testDefinition: RuntimeDefinition = {
  aggregates: [
    {
      name: "expense_claim",
      valueObjects: [
        { name: "title", type: "string" },
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
          dto: "new_claim",
          ast: {
            "type": "Program",
            "body": [
              {
                "type": "FunctionDeclaration",
                "id": {
                  "type": "Identifier",
                  "name": "command",
                },
                "params": [
                  {
                    "type": "Identifier",
                    "name": "expense_claim",
                  },
                  {
                    "type": "Identifier",
                    "name": "title",
                  },
                ],
                "body": {
                  "type": "BlockStatement",
                  "body": [
                    {
                      "type": "ExpressionStatement",
                      "expression": {
                        "type": "AssignmentExpression",
                        "operator": "=",
                        "left": {
                          "type": "MemberExpression",
                          "computed": false,
                          "object": {
                            "type": "Identifier",
                            "name": "expense_claim",
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "title",
                          },
                        },
                        "right": {
                          "type": "Identifier",
                          "name": "title",
                        },
                      },
                    },
                  ],
                },
                "generator": false,
                "expression": false,
                "async": false,
              },
            ],
            "sourceType": "script",
          },
        },
      ],
    },
  ],
};
