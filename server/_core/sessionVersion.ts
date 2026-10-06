export function isCurrentSessionVersion(
  tokenVersion: unknown,
  storedVersion: number
) {
  const normalizedTokenVersion =
    typeof tokenVersion === "number" && Number.isInteger(tokenVersion)
      ? tokenVersion
      : 0;
  return normalizedTokenVersion === storedVersion;
}
