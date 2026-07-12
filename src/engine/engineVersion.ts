import { EngineName } from "../types/enums";

export const CUSTOM_ENGINE_VERSION = "custom-core-v2-search-v3";

export function getEngineCacheVersion(engine: EngineName): string {
  if (engine === EngineName.Custom) return CUSTOM_ENGINE_VERSION;

  return `${engine}:stable`;
}
