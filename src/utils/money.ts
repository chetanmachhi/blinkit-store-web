export const paiseToRupeeString = (paise: number): string => {
  if (typeof paise !== "number" || isNaN(paise)) return "0.00";
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.trunc(paise));
  const paiseStr = absPaise.toString().padStart(3, "0");
  const rupees = paiseStr.slice(0, -2);
  const cents = paiseStr.slice(-2);
  return `${isNegative ? "-" : ""}${rupees}.${cents}`;
};

/** Display format with Indian digit grouping: 419000 -> "₹4,190.00". Not for inputs. */
export const formatRupees = (paise: number): string => {
  const raw = paiseToRupeeString(paise);
  const isNegative = raw.startsWith("-");
  const [rupees, cents] = raw.replace("-", "").split(".");
  const grouped = Number(rupees).toLocaleString("en-IN");
  return `${isNegative ? "-" : ""}₹${grouped}.${cents}`;
};

/** Compact display without paise for charts and KPIs: 419000 -> "₹4,190". */
export const formatRupeesShort = (paise: number): string =>
  `₹${Math.round((paise || 0) / 100).toLocaleString("en-IN")}`;

export const rupeeStringToPaise = (input: string | number): number => {
  if (typeof input === "number") {
    if (isNaN(input)) return 0;
    input = input.toString();
  }
  let str = input.trim();
  if (!str) return 0;
  str = str.replace(/[₹$,\s]/g, "");
  const isNegative = str.startsWith("-");
  if (isNegative) {
    str = str.slice(1);
  }
  const parts = str.split(".");
  const rupeesPart = parts[0] || "0";
  let paisePart = (parts[1] || "").slice(0, 2);
  while (paisePart.length < 2) {
    paisePart += "0";
  }
  const rupeesInt = parseInt(rupeesPart, 10) || 0;
  const paiseInt = parseInt(paisePart, 10) || 0;
  const total = rupeesInt * 100 + paiseInt;
  return isNegative ? -total : total;
};
