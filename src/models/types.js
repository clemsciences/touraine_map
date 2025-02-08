

/**
 * Represents a city with certain attributes.
 */
export class LocatedEvent {
  /**
   * The City class constructor.
   *
   * @param {string} name - The name of the city.
   * @param {Object} coordinates - The geographical coordinates of the city. An object containing latitude and longitude properties.
   * @param {string} description - A brief description of the city.
   * @param {number} year - A year associated with the city.
   * @param {string} wikidataUrl - .
   */
  constructor(name, coordinates, description, year, wikidataUrl) {
    this.name = name;
    this.coordinates = coordinates;
    this.description = description;
    this.year = year;
    this.wikidataUrl = wikidataUrl;
  }
}