export interface DisplayRoll {
  user: string;
  msg: string;
  roll: DiceTable;
  timestamp: number;
  userId: string;
}

export interface DiceTable {
  [key: string]: { number: number | null; roll: number | null };
  d4: { number: number | null; roll: number | null };
  d6: { number: number | null; roll: number | null };
  d8: { number: number | null; roll: number | null };
  d10: { number: number | null; roll: number | null };
  d12: { number: number | null; roll: number | null };
  d20: { number: number | null; roll: number | null };
  d100: { number: number | null; roll: number | null };
}

export const createNewDiceTable = function () {
  return {
    d4: { number: null, roll: null },
    d6: { number: null, roll: null },
    d8: { number: null, roll: null },
    d10: { number: null, roll: null },
    d12: { number: null, roll: null },
    d20: { number: null, roll: null },
    d100: { number: null, roll: null },
  } as DiceTable;
};

const rollDice = function (sides: string) {
  const min = parseInt(sides.substring(1));
  return Math.floor(Math.random() * min + 1);
};

export const reRollDices = function (dices: DiceTable) {
  for (const [diceType, diceData] of Object.entries(dices)) {
    diceData.roll = 0;
    const numberOfDices = diceData.number ? diceData.number : 0;
    for (let i = 0; i < numberOfDices; ++i) {
      diceData.roll += rollDice(diceType);
    }
  }
};

export const dicesToStr = function (dices: DiceTable) {
  let text = "";
  for (const [diceType, diceData] of Object.entries(dices)) {
    if (diceData.number && diceData.number > 0) {
      text += `${diceData.number}:${diceType}:${diceData.roll},`;
    }
  }
  return text.slice(0, -1);
};

export const validateDice = function (dices: DiceTable) {
  for (const [diceKey, diceData] of Object.entries(dices)) {
    if (!diceData.number) {
      dices[diceKey].number = null;
      continue;
    }
    if (!Number.isInteger(diceData.number)) {
      dices[diceKey].number = Math.round(diceData.number);
    }
    if (diceData.number < 0) {
      dices[diceKey].number = null;
    }
    if (diceData.number > 99) {
      dices[diceKey].number = 99;
    }
  }
};

export const strToDices = function (strDices: string) {
  const dices = createNewDiceTable();
  for (const dice of strDices.split(",")) {
    const diceData = dice.split(":");
    if (diceData[1] === "d4") {
      dices.d4.number = parseInt(diceData[0]);
      dices.d4.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d6") {
      dices.d6.number = parseInt(diceData[0]);
      dices.d6.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d8") {
      dices.d8.number = parseInt(diceData[0]);
      dices.d8.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d10") {
      dices.d10.number = parseInt(diceData[0]);
      dices.d10.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d12") {
      dices.d12.number = parseInt(diceData[0]);
      dices.d12.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d20") {
      dices.d20.number = parseInt(diceData[0]);
      dices.d20.roll = parseInt(diceData[2]);
    } else if (diceData[1] === "d100") {
      dices.d100.number = parseInt(diceData[0]);
      dices.d100.roll = parseInt(diceData[2]);
    }
  }
  return dices;
};
