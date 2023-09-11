import { run } from "./challenge";

it("should move the robots to their final positions", async () => {
  expect(await run()).toEqual(["1 1 E", "3 3 N LOST", "2 3 S"]);
});
