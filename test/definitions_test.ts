import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Runtime } from "../src/runtime.ts";
import { testSource } from "./claim_runtime.ts";

const runtime = new Runtime(testSource);

Deno.test("Successfully query aggregate definition", () => {
  const result = runtime.aggregate("expense_claim");
  assertEquals(result.unwrap().name, "expense_claim");
});

Deno.test("Fail to query aggregate definition", () => {
  assertEquals(
    runtime.aggregate("xxx").unwrapErr().code,
    "aggregate_unk",
  );
});

Deno.test("Successfully query event definition", () => {
  assertEquals(
    runtime.event("expense_claim", "created_claim").unwrap().name,
    "created_claim",
  );
});

Deno.test("Fail to query event definition", () => {
  assertEquals(
    runtime.event("expense_claim", "xxx").unwrapErr().code,
    "event_unk",
  );
});

Deno.test("Successfully query command definition", () => {
  assertEquals(
    runtime.command("expense_claim", "create_claim").unwrap().name,
    "create_claim",
  );
});

Deno.test("Fail to query command definition", () => {
  assertEquals(
    runtime.command("expense_claim", "xxx").unwrapErr().code,
    "command_unk",
  );
});
/*
Deno.test("Query command metadata", () => {
  assertEquals(
    runtime.aggregate("expense_claim")?.command("create_claim")?.name,
    "create_claim",
  );
});
*/
