import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Runtime } from "../src/runtime.ts";
import { testSource, testConfig } from "./claim_runtime.ts";
import { MemEventStore } from "../src/event_store/event_store.ts";


Deno.test("Send valid create command", () => {
  const runtime = (Runtime.create(testSource, testConfig)).unwrap();
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { title: "My claim" },
    },
  );
  assertEquals(typeof result.unwrap(), "string", "returns a guid as a string");
});

Deno.test("Send invalid create command", () => {
  const runtime = (Runtime.create(testSource, testConfig)).unwrap();
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
  const runtime = (Runtime.create(testSource, testConfig)).unwrap();
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
  const runtime = (Runtime.create(testSource, testConfig)).unwrap();
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
  const runtime = (Runtime.create(testSource, testConfig)).unwrap();
  var result = runtime.execute(
    {
      aggregateName: "expense_claim",
      name: "create_claim",
      dto: { unknown: 5 },
    },
  );
  assertEquals(result.unwrapErr()[0].code, "attribute_req");
});
