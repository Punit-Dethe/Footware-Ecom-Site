import "server-only";

/**
 * Thrown when untrusted user input or client payload fails validation
 * (e.g. invalid UUID, file size limit, disallowed MIME, path binding mismatch).
 * Safe to display directly to administrators.
 */
export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

/**
 * Thrown by the Media DAL when business or domain constraints fail
 * (e.g. media item does not belong to product, duplicate reorder IDs).
 * Safe to display directly to administrators.
 */
export class MediaDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaDomainError";
  }
}
