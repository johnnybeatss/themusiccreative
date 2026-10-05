// Minimal types for the parts of `qrcode` (npm) this app uses — avoids
// pulling in @types/qrcode for one function. API reference:
// https://github.com/soldair/node-qrcode#tostringtext-options-cb
declare module "qrcode" {
  export type QRCodeToStringOptions = {
    type?: "svg" | "utf8" | "terminal";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  };
  export function toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
}
