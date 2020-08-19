import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {
  AggregateDefinition,
  RuntimeDefinition,
} from "../src/definitions/runtime_definition.ts";
import { Runtime } from "../src/runtime.ts";
import { DataTransferDefinition } from "../src/definitions/aggregate_definition.ts";
import { testDefinition } from "./claim_runtime.ts";

const runtime = new Runtime(testDefinition);

Deno.test("Query aggregate metadata", () => {
  assertEquals(runtime.aggregate("expense_claim")?.name, "expense_claim");
});

Deno.test("Query event metadata", () => {
  assertEquals(
    runtime.aggregate("expense_claim")?.event("created_claim")?.name,
    "created_claim",
  );
});

Deno.test("Query command metadata", () => {
  assertEquals(
    runtime.aggregate("expense_claim")?.command("create_claim")?.name,
    "create_claim",
  );
});

Deno.test("Execute command", () => {
  const agg = runtime.aggregate("expense_claim");
  const command = agg?.command("create_claim");
  const dto_def = agg?.dto("new_claim");
  assertEquals(dto_def?.name, "new_claim");
  const dto = {
    title: "My new claim",
  };
  command?.execute(dto);
});
