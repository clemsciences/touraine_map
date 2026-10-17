

/**
 * Represents a city with certain attributes.
 */
export class LocatedEvent {
  /**
   * The City class constructor.
   *
   * @param {string} name - The name of the city.
   * @param {string} id - id
   * @param {Object} coordinates - The geographical coordinates of the city. An object containing latitude and longitude properties.
   * @param {string} description - A brief description of the city.
   * @param {number} year - A year associated with the city.
   * @param {string} wikidataUrl - .
   */
  constructor(name, id, coordinates, description, year, wikidataUrl) {
    this.name = name;
    this.id = id
    this.coordinates = coordinates;
    this.description = description;
    this.year = year;
    this.wikidataUrl = wikidataUrl;
  }
}