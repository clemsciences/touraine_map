import {parse, YAMLParseError} from "yaml";
import {LocatedEvent} from "@/models/types.js";

/**
 * Error raised when the data file is not valid. The message is meant to be shown to the user.
 */
export class DataError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataError";
  }
}

const ROOT_KEYS = ["title", "outline", "locations"];
const LOCATION_KEYS = ["id", "name", "coordinates", "description", "year", "wikidataUrl"];
const COORDINATES_KEYS = ["lat", "lng"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkKeys(value, allowed, where) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new DataError(`${where} : clé(s) inconnue(s) ${unknown.join(", ")} (clés possibles : ${allowed.join(", ")})`);
  }
}

function optionalString(value, where) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new DataError(`${where} doit être un texte`);
  }
  return value;
}

function requiredString(value, where) {
  const text = optionalString(value, where).trim();
  if (text === "") {
    throw new DataError(`${where} est obligatoire`);
  }
  return text;
}

function coordinate(value, min, max, where) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new DataError(`${where} doit être un nombre`);
  }
  if (value < min || value > max) {
    throw new DataError(`${where} doit être compris entre ${min} et ${max}`);
  }
  return value;
}

function parseLocation(raw, index) {
  let where = `locations[${index}]`;
  if (!isObject(raw)) {
    throw new DataError(`${where} doit être un lieu (id, name, coordinates…)`);
  }
  if (typeof raw.name === "string" && raw.name.trim() !== "") {
    where += ` (${raw.name.trim()})`;
  }
  checkKeys(raw, LOCATION_KEYS, where);

  // Un identifiant écrit sans guillemets (id: 1) est lu comme un nombre
  const id = typeof raw.id === "number" ? String(raw.id) : requiredString(raw.id, `${where}.id`);
  const name = requiredString(raw.name, `${where}.name`);

  if (!isObject(raw.coordinates)) {
    throw new DataError(`${where}.coordinates est obligatoire, sous la forme {lat: 47.39, lng: 0.68}`);
  }
  checkKeys(raw.coordinates, COORDINATES_KEYS, `${where}.coordinates`);
  const coordinates = {
    lat: coordinate(raw.coordinates.lat, -90, 90, `${where}.coordinates.lat`),
    lng: coordinate(raw.coordinates.lng, -180, 180, `${where}.coordinates.lng`),
  };

  let year = null;
  if (raw.year !== undefined && raw.year !== null) {
    if (!Number.isInteger(raw.year)) {
      throw new DataError(`${where}.year doit être une année (nombre entier)`);
    }
    year = raw.year;
  }

  return new LocatedEvent(
    name,
    id,
    coordinates,
    optionalString(raw.description, `${where}.description`),
    year,
    optionalString(raw.wikidataUrl, `${where}.wikidataUrl`),
  );
}

/**
 * Parses the YAML data file of the map.
 *
 * @param {string} text - Content of the YAML file.
 * @returns {{title: string, outline: string, locations: LocatedEvent[]}}
 * @throws {DataError} If the file is not valid YAML or does not follow the expected format.
 */
export function parseData(text) {
  let raw;
  try {
    raw = parse(text);
  } catch (error) {
    if (error instanceof YAMLParseError) {
      const line = error.linePos?.[0]?.line;
      throw new DataError(`YAML invalide${line ? ` à la ligne ${line}` : ""} : ${error.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "")}`);
    }
    throw error;
  }

  if (!isObject(raw)) {
    throw new DataError("Le fichier doit contenir au moins une clé locations");
  }
  checkKeys(raw, ROOT_KEYS, "Racine du fichier");

  if (!Array.isArray(raw.locations) || raw.locations.length === 0) {
    throw new DataError("locations doit être une liste contenant au moins un lieu");
  }
  const locations = raw.locations.map(parseLocation);

  const seen = new Set();
  for (const location of locations) {
    if (seen.has(location.id)) {
      throw new DataError(`L'identifiant "${location.id}" est utilisé par plusieurs lieux`);
    }
    seen.add(location.id);
  }

  return {
    title: optionalString(raw.title, "title"),
    outline: optionalString(raw.outline, "outline"),
    locations,
  };
}
