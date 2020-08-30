import { assertEquals, assert } from "https://deno.land/std/testing/asserts.ts";
import { MemEventStore } from "../src/event_store/event_store.ts"

Deno.test("Add and query an event", () => {
    const store = new MemEventStore();
    store.appendToStreamAsync("test-aggregate-001", 
    {
        id: "01",
        name: "test-event",
        aggregateName: "test-aggregate",
        aggregateId: "001",
        dto: {data: "x"}
    });
    const e = store.readLastEvent("test-aggregate-001");
    assertEquals(1n, e.unwrap().eventNumber);

});

Deno.test("Query for an event that doesn't exist", () => {
    const store = new MemEventStore();
    const e = store.readLastEvent("test-aggregate-001");
    assertEquals("event_instance_unk", e.unwrapErr()[0].code);
});