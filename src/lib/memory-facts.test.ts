import { factLabel, groupMemoryFacts } from "./memory-facts";

function eq(name: string, got: unknown, want: unknown) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) throw new Error(`${name}: got ${a} want ${b}`);
  console.log("ok", name);
}

eq("building strips prefix", factLabel({ predicate: "is_building", object: "building zynd" }), "zynd");
eq("seeking enum", factLabel({ predicate: "is_seeking", object: "co_founder" }), "a co-founder");

const groups = groupMemoryFacts([
  { predicate: "is_building", object: "agent marketplace" },
  { predicate: "believes", object: "privacy" },
  { predicate: "is_building", object: "agent marketplace" },
  { predicate: "is_located_in", object: "Berlin" },
]);
eq("groups public only", groups.map((g) => g.key), ["is_building", "is_located_in"]);
eq("dedupes", groups[0]?.items.map((i) => i.text), ["agent marketplace"]);
