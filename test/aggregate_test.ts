import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { AggregateDefinition, RuntimeDefinition } from '../src/definitions/runtime_definition.ts';
import { Runtime } from "../src/runtime.ts";
import { DataTransferDefinition } from "../src/definitions/aggregate_definition.ts";

const testDefinition: RuntimeDefinition = {
  aggregates: [
    {
      name: "expense_claim",
      attributes: [
        {name: "title", type: "FreeText"}
      ],
      dtos: [
        {name: "new_claim",
         attributes: [
           {name: "title", type: "FreeText"}
         ]}
      ],
      events: [
        {name: "created_claim",
         type: "create",
         dto: "new_claim"
        }
      ],
      commands: [
        {name: "create_claim",
         type: "create",
         dto: "new_claim",
         ast: 
           {
            "type": "Program",
            "body": [
              {
                "type": "FunctionDeclaration",
                "id": {
                  "type": "Identifier",
                  "name": "command"
                },
                "params": [
                  {
                    "type": "Identifier",
                    "name": "expense_claim"
                  },
                  {
                    "type": "Identifier",
                    "name": "title"
                  }
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
                            "name": "expense_claim"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "title"
                          }
                        },
                        "right": {
                          "type": "Identifier",
                          "name": "title"
                        }
                      }
                    }
                  ]
                },
                "generator": false,
                "expression": false,
                "async": false
              }
            ],
            "sourceType": "script"
           }
        }
      ]
    }
  ]

} 

const runtime = new Runtime(testDefinition);

Deno.test("Query aggregate metadata", () => {
  assertEquals(runtime.aggregate("expense_claim")?.name, "expense_claim");
});

Deno.test("Query event metadata", () => {
  assertEquals(runtime.aggregate("expense_claim")?.event("created_claim")?.name, "created_claim");
});

Deno.test("Query command metadata", () => {
  assertEquals(runtime.aggregate("expense_claim")?.command("create_claim")?.name, "create_claim");
});

Deno.test("Execute command", () => {
  const agg = runtime.aggregate("expense_claim");
  const command = agg?.command("create_claim");
  const dto_def = agg?.dto("new_claim");
  assertEquals(dto_def?.name, "new_claim"); 
  const dto = {
    title: "My new claim"
  };
  command?.execute(dto);
});
