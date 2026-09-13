// Configuration
export {
  getWholesaleChannelCode,
  isWholesaleEnabled,
} from "./config";

// Cookie management
export {
  canPersistCookies,
  clearAllCartCookies,
  clearCartCookies,
  clearCartToken,
  getCartId,
  getCartToken,
  isPoisonedDtcCartId,
  requireCartId,
  setCartCookies,
} from "./cookies";

// Legacy cookie migration bridge
export {
  CART_TOKEN_MAX_AGE,
  clearLegacyCartCookies,
  clearLegacyCartToken,
  expireLegacyAuthCookies,
  expireLegacyLocaleCookies,
  hasLegacyAuthCookies,
  hasLegacyCartCookies,
  hasLegacyLocaleCookies,
  migrateLegacyCartCookies,
  MIRZA_CART_ID_COOKIE,
  MIRZA_CART_TOKEN_COOKIE,
  MIRZA_COUNTRY_COOKIE,
  MIRZA_LOCALE_COOKIE,
  MIRZA_WHOLESALE_CART_ID_COOKIE,
  MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
  resolveCartCookieState,
  resolveCartId,
  resolveCartToken,
  resolveCountry,
  resolveLocale,
  type ResolvedCartCookieState,
} from "./legacy-cookie-migration";

// Locale resolution (reads country/locale from cookies)
export { getLocaleOptions } from "./locale";

// Surface (DTC vs wholesale sales context)
export {
  cacheTagSuffix,
  cartCookieBaseName,
  DEFAULT_SURFACE,
  SURFACES,
  type Surface,
} from "./surface";
