import { describe, expect, it, vi } from "vitest";
import { createSingleFlight } from "./singleFlight";

/** A promise the test settles by hand. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createSingleFlight", () => {
  it("runs once for overlapping calls, and every caller gets the same promise", async () => {
    const gate = deferred<string>();
    const run = vi.fn(() => gate.promise);
    const call = createSingleFlight(run);

    const a = call();
    const b = call();
    const c = call();
    expect(run).toHaveBeenCalledTimes(1);
    expect(b).toBe(a);
    expect(c).toBe(a);

    gate.resolve("done");
    await expect(Promise.all([a, b, c])).resolves.toEqual(["done", "done", "done"]);
  });

  it("starts a fresh run once the previous one has settled", async () => {
    let n = 0;
    const call = createSingleFlight(async () => ++n);
    expect(await call()).toBe(1);
    expect(await call()).toBe(2);
  });

  it("does not start a second run while the first is still in flight, even after a tick", async () => {
    const gate = deferred();
    const run = vi.fn(() => gate.promise);
    const call = createSingleFlight(run);
    void call();
    await Promise.resolve();
    void call();
    expect(run).toHaveBeenCalledTimes(1);
    gate.resolve();
  });

  it("propagates a rejection to every waiting caller, then recovers for the next call", async () => {
    const gate = deferred();
    const run = vi.fn<() => Promise<string>>().mockImplementationOnce(() => gate.promise.then(() => "unreachable"));
    const call = createSingleFlight(run);

    const a = call();
    const b = call();
    const failures = Promise.allSettled([a, b]);
    gate.reject(new Error("boom"));
    const [ra, rb] = await failures;
    expect(ra.status).toBe("rejected");
    expect(rb.status).toBe("rejected");

    run.mockResolvedValueOnce("recovered");
    await expect(call()).resolves.toBe("recovered");
    expect(run).toHaveBeenCalledTimes(2);
  });
});
