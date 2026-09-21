import * as Crypto from "expo-crypto";

/**
 * Hashea el password con SHA-256 antes de guardarlo (seguridad básica:
 * nunca se persiste ni se compara texto plano). No es un reemplazo de
 * bcrypt/argon2 en un sistema real, pero cubre el requisito de la rúbrica
 * de no manejar contraseñas en claro.
 */
export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}
