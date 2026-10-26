import { describe, it, expect } from "vitest";
import {
  createNewDiceTable,
  reRollDices,
  dicesToStr,
  validateDice,
  strToDices,
} from "./dice.ts";

describe("dice utilities", () => {
  it("creates an empty dice table", () => {
    const table = createNewDiceTable();
    expect(table.d4).toEqual({ number: null, roll: null });
    expect(table.d6).toEqual({ number: null, roll: null });
    expect(table.d8).toEqual({ number: null, roll: null });
    expect(table.d10).toEqual({ number: null, roll: null });
    expect(table.d12).toEqual({ number: null, roll: null });
    expect(table.d20).toEqual({ number: null, roll: null });
    expect(table.d100).toEqual({ number: null, roll: null });
  });

  it("rolls dices within expected ranges", () => {
    const table = createNewDiceTable();
    table.d6.number = 2;
    table.d20.number = 1;
    reRollDices(table);

    expect(table.d6.roll).toBeGreaterThanOrEqual(2);
    expect(table.d6.roll).toBeLessThanOrEqual(12);
    expect(table.d20.roll).toBeGreaterThanOrEqual(1);
    expect(table.d20.roll).toBeLessThanOrEqual(20);
    expect(table.d4.roll).toBe(0);
  });

  it("converts dice table to string and back", () => {
    const table = createNewDiceTable();
    table.d6.number = 3;
    table.d6.roll = 11;
    table.d20.number = 1;
    table.d20.roll = 19;

    const str = dicesToStr(table);
    expect(str).toContain("3:d6:11");
    expect(str).toContain("1:d20:19");

    const parsed = strToDices(str);
    expect(parsed.d6).toEqual({ number: 3, roll: 11 });
    expect(parsed.d20).toEqual({ number: 1, roll: 19 });
    expect(parsed.d4).toEqual({ number: null, roll: null });
  });

  it("validates dice inputs correctly", () => {
    const table = createNewDiceTable();
    table.d4.number = -5;
    table.d6.number = 150;
    table.d8.number = 3.7;
    table.d10.number = 0;

    validateDice(table);
    expect(table.d4.number).toBeNull();
    expect(table.d6.number).toBe(99);
    expect(table.d8.number).toBe(4);
    expect(table.d10.number).toBeNull();
  });
});
