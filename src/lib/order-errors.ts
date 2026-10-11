const SLOT_ERRORS = new Set(["DATE_BLOCKED", "DAY_CLOSED", "DATE_TOO_FAR", "TIME_OUTSIDE_HOURS", "LEAD_TIME", "INVALID_SLOT"]);

/** Maps error codes raised by `place_order` to customer-facing Hebrew. */
export function orderErrorMessage(raw: string | undefined) {
  const message = raw ?? "";
  const [code, detail] = message.split(":");
  if (SLOT_ERRORS.has(code)) return "מועד האיסוף שבחרתם כבר לא פנוי. בחרו מועד אחר.";
  switch (code) {
    case "ORDERS_CLOSED":
      return "כרגע לא מקבלים הזמנות חדשות דרך האתר. אפשר להתקשר ולהזמין בטלפון.";
    case "INVALID_NAME":
      return "נא למלא שם מלא.";
    case "INVALID_PHONE":
      return "מספר הטלפון לא תקין. לדוגמה: 050-1234567";
    case "EMPTY_CART":
      return "הסל ריק. הוסיפו מוצר כדי להזמין.";
    case "PRODUCT_UNAVAILABLE":
      return `״${detail}״ אזל בינתיים. הסירו אותו מהסל כדי להמשיך.`;
    case "VARIANT_REQUIRED":
      return `צריך לבחור אפשרות עבור ״${detail}״.`;
    case "PRODUCT_NOT_FOUND":
      return "אחד המוצרים בסל כבר לא נמצא בתפריט. הסירו אותו ונסו שוב.";
    case "INVALID_QUANTITY":
    case "TOO_MANY_ITEMS":
      return "הכמות בסל גדולה מדי להזמנה אחת. להזמנות גדולות התקשרו אלינו.";
    default:
      return "ההזמנה לא נשלחה. בדקו את החיבור לאינטרנט ונסו שוב.";
  }
}

export function isSlotError(raw: string | undefined) {
  return SLOT_ERRORS.has((raw ?? "").split(":")[0]);
}

export function isProductError(raw: string | undefined) {
  const code = (raw ?? "").split(":")[0];
  return code.startsWith("PRODUCT_") || code === "VARIANT_REQUIRED";
}
