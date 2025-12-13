/**
 * Service interface for generating unique identifiers
 * This is a port - implementation can use UUID v4 or other strategies
 */
export interface IIdGenerator {
  /**
   * Generates a new unique identifier
   * @returns A unique string identifier (UUID)
   */
  generate(): string;
}
