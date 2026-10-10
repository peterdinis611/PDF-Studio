import { PDFDocument } from "@cantoo/pdf-lib";

/** Encrypt PDF bytes with a user password via @cantoo/pdf-lib. */
export async function encryptPdfBytes(
  bytes: Uint8Array,
  userPassword: string,
): Promise<Uint8Array> {
  const password = userPassword.trim();
  if (!password) return bytes;

  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
  });
  return doc.save();
}
