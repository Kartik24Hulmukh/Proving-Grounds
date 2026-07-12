import { pluginManifestSchema } from './schema.js';
import type { PluginManifest } from './domain.js';

export function validatePluginManifest(value: unknown): PluginManifest {
  return pluginManifestSchema.parse(value);
}
