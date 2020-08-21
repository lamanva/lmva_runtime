import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Runtime } from "../src/runtime.ts";
import { testSource } from "./claim_runtime.ts";

const runtime = new Runtime(testSource);

Deno.test("Send valid create command", () => {
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { title: "My claim" },
    },
  );
  assertEquals(result.unwrap().attributes[0].value, "My claim");
});

Deno.test("Send invalid create command", () => {
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "xxx",
      dto: { title: "My claim" },
    },
  );
  assertEquals(result.unwrapErr()[0].code, "command_unk");
});

Deno.test("Send valid command with unknown attribute", () => {
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { unknown: "My claim", title: "My claim" },
    },
  );
  assertEquals(result.unwrapErr()[0].code, "attribute_unk");
});

Deno.test("Send valid command with invalid data type", () => {
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { title: 5 },
    },
  );
  assertEquals(result.unwrapErr()[0].code, "attribute_typ");
});

Deno.test("Send valid command missing required attribute", () => {
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { unknown: 5 },
    },
  );
  assertEquals(result.unwrapErr()[0].code, "attribute_req");
});
