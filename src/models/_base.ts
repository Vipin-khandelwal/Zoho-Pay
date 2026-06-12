/** Shared model utilities */

export function optStr(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === "string" ? v : undefined;
}

export function optNum(data: Record<string, unknown>, key: string): number | undefined {
  const v = data[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function optBool(data: Record<string, unknown>, key: string): boolean | undefined {
  const v = data[key];
  return typeof v === "boolean" ? v : undefined;
}

export function optObj<T>(
  data: Record<string, unknown>,
  key: string,
  fromDict: (d: Record<string, unknown>) => T
): T | undefined {
  const v = data[key];
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return fromDict(v as Record<string, unknown>);
  }
  return undefined;
}

export function optList<T>(
  data: Record<string, unknown>,
  key: string,
  fromDict: (d: Record<string, unknown>) => T
): T[] {
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map(fromDict);
}

export function optStrList(data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}
