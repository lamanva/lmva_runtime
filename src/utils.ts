
import { Result, Ok, Err } from "https://deno.land/x/monads/mod.ts";

export function filterErrs(results: Result<any, any>[]) {
    return results.filter(r => r.isErr()).map(r => r.unwrapErr());
}

export function filterOks(results: Result<any, any>[]) {
    return results.filter(r => r.isOk()).map(r => r.unwrap());
}
