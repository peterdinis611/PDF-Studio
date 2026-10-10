import { substituteMergeFields, substituteTokens } from "../tokens.js";

describe("substituteTokens", () => {
  it("replaces page counters and custom fields", () => {
    expect(substituteTokens("{{page}}/{{pages}} {{meno}}", 0, 3, { meno: "Ada" })).toBe(
      "1/3 Ada",
    );
  });

  it("leaves unknown tokens intact", () => {
    expect(substituteTokens("Hi {{unknown}}", 0, 1)).toBe("Hi {{unknown}}");
  });
});

describe("substituteMergeFields", () => {
  it("does not touch page tokens", () => {
    expect(substituteMergeFields("{{meno}} p{{page}}", { meno: "X" })).toBe("X p{{page}}");
  });
});
