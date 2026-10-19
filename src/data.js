import {parseData} from "@/models/parser.js";

// Fichier de données servi à côté du site (public/data.yaml), donc modifiable sans recompiler
export const DATA_URL = `${import.meta.env.BASE_URL}data.yaml`;

/**
 * Loads and parses the data file of the map.
 *
 * @param {string} url - URL of the YAML file.
 * @returns {Promise<{title: string, outline: string, locations: LocatedEvent[]}>}
 *   The outline URL is resolved relatively to the YAML file.
 * @throws {DataError|Error} If the file cannot be loaded or is not valid.
 */
export async function loadData(url = DATA_URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${url} (erreur ${response.status})`);
  }
  const data = parseData(await response.text());
  if (data.outline) {
    data.outline = new URL(data.outline, new URL(url, document.baseURI)).href;
  }
  return data;
}
