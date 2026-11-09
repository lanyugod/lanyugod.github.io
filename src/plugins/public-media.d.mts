import type { Root } from "hast";
export function normalizeOrigin(value?: string): string;
export function mediaUrl(path: string, origin?: string): string;
export function rehypeMedia(options?: { origin?: string }): (tree: Root) => void;
