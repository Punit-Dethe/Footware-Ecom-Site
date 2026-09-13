export function getCardLabel(ccType: string): string {
  switch (ccType.toLowerCase()) {
    case "visa":
      return "Visa";
    case "mastercard":
    case "master":
      return "Mastercard";
    case "american_express":
    case "amex":
      return "Amex";
    case "discover":
      return "Discover";
    case "jcb":
      return "JCB";
    case "diners_club":
      return "Diners Club";
    case "maestro":
      return "Maestro";
    case "unionpay":
      return "UnionPay";
    default:
      return ccType || "Card";
  }
}
