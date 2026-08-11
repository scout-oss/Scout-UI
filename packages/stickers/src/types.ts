export type StickerCategory =
  "signal" | "expression" | "direction" | "object" | "label";

export type StickerFormat = "svg" | "png" | "webp";

export type StickerAttributionStatus = "not-required" | "required" | "included";

export interface StickerTransparentBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StickerDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: StickerCategory;
  readonly tags: readonly string[];
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly viewBox?: string;
  readonly transparentBounds: StickerTransparentBounds;
  readonly dominantTone: string;
  readonly format: StickerFormat;
  readonly creator: string;
  readonly source: string;
  readonly license: string;
  readonly attributionStatus: StickerAttributionStatus;
  readonly attribution?: string;
  readonly sourceFile: string;
  readonly editableSource: string;
  readonly aiAssistance?: string;
  readonly checksum: string;
}

export interface StickerPackManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly artworkLicense: string;
  readonly codeLicense: string;
  readonly stickers: readonly StickerDefinition[];
}
