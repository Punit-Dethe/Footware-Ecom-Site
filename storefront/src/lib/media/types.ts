export type ProductMedia = {
  mainUrl: string;
  lqip?: string;
  dominantColor?: string;
  variants?: {
    320?: { avif?: string; webp?: string };
    480?: { avif?: string; webp?: string };
    640?: { avif?: string; webp?: string };
    960?: { avif?: string; webp?: string };
    1280?: { avif?: string; webp?: string };
    1600?: { avif?: string; webp?: string };
  };
};
