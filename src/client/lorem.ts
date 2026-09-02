const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
] as const;

export type LoremSize = "short" | "medium" | "long";

const SIZE_WORDS: Record<LoremSize, [number, number]> = {
  short: [8, 14],
  medium: [28, 48],
  long: [70, 110],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWord(): string {
  return WORDS[randInt(0, WORDS.length - 1)];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Build one sentence of approximately `wordCount` words. */
export function loremSentence(wordCount = randInt(6, 14)): string {
  const n = Math.max(3, wordCount);
  const parts: string[] = [capitalize(pickWord())];
  for (let i = 1; i < n; i++) parts.push(pickWord());
  return `${parts.join(" ")}.`;
}

/** Random lorem ipsum text. */
export function loremIpsum(size: LoremSize = "medium"): string {
  const [minW, maxW] = SIZE_WORDS[size];
  let remaining = randInt(minW, maxW);
  const sentences: string[] = [];
  while (remaining > 0) {
    const take = Math.min(remaining, randInt(5, 16));
    sentences.push(loremSentence(take));
    remaining -= take;
  }
  if (size === "long") {
    // Two paragraphs for long blocks
    const mid = Math.ceil(sentences.length / 2);
    return `${sentences.slice(0, mid).join(" ")}\n\n${sentences.slice(mid).join(" ")}`;
  }
  return sentences.join(" ");
}
