// Using fetch API instead of axios to avoid additional dependency

export interface Country {
  id: number;
  name: string;
  country_name: string | null;
  currency: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CountryOption {
  code: string;
  name: string;
  id?: number;
  currency?: string | null;
}

export class CountriesService {
  private static API_URL = process.env.NEXT_PUBLIC_API_URL_ELEMENT || "http://localhost:29000";
  private static countries: Country[] = [];
  private static countriesLoaded = false;
  private static countriesPromise: Promise<Country[]> | null = null;

  /**
   * Get all countries from API and cache them
   */
  static async getAllCountries(): Promise<Country[]> {
    // Return cached data if available
    if (this.countriesLoaded && this.countries.length > 0) {
      return this.countries;
    }

    // Return existing promise if one is already in progress
    if (this.countriesPromise) {
      return this.countriesPromise;
    }

    // Create new promise and cache it
    this.countriesPromise = this.fetchCountriesFromAPI();

    try {
      const result = await this.countriesPromise;
      return result;
    } finally {
      // Clear the promise when done (success or error)
      this.countriesPromise = null;
    }
  }

  /**
   * Private method to actually fetch countries from API
   */
  private static async fetchCountriesFromAPI(): Promise<Country[]> {
    try {
      const response = await fetch(
        `${this.API_URL}/adlibs/findproduct/countries?all=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.countries = data.data || [];
      this.countriesLoaded = true;
      return this.countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Don't set countriesLoaded = true on error, so it can retry next time
      return [];
    }
  }

  /**
   * Get countries formatted for select dropdown
   * @returns Promise with array of country options compatible with UI components
   */
  static async getCountriesForSelect(): Promise<CountryOption[]> {
    try {
      const apiCountries = await this.getAllCountries();

      // Transform API countries to the format expected by the select component
      const countryOptions: CountryOption[] = apiCountries.map(country => ({
        code: country.name, // Use country.name directly for Stripe
        name:country.name, // Display full country_name
        id: country.id,
        currency: country.currency
      }));

      // If API fails or returns empty, fallback to static list
      if (countryOptions.length === 0) {
        return this.getStaticCountries();
      }

      return countryOptions;
    } catch (error) {
      // Fallback to static countries if API fails
      return this.getStaticCountries();
    }
  }

  /**
   * Get country ID by name
   */
  static async getCountryIdByName(countryName: string): Promise<number | null> {
    const countries = await this.getAllCountries();
    const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? country.id : null;
  }

  /**
   * Get country name by ID
   */
  static async getCountryNameById(countryId: number): Promise<string | null> {
    const countries = await this.getAllCountries();
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : null;
  }

  /**
   * Find country by code from the API or fallback list
   */
  static async findCountryByCode(code: string): Promise<CountryOption | null> {
    const countries = await this.getCountriesForSelect();
    return countries.find(country =>
      country.code.toLowerCase() === code.toLowerCase()
    ) || null;
  }

  /**
   * Static fallback countries for when API is unavailable
   */
  private static getStaticCountries(): CountryOption[] {
    return [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AU', name: 'Australia' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'BE', name: 'Belgium' },
      { code: 'AT', name: 'Austria' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'SE', name: 'Sweden' },
      { code: 'NO', name: 'Norway' },
      { code: 'DK', name: 'Denmark' },
      { code: 'FI', name: 'Finland' },
      { code: 'PL', name: 'Poland' },
      { code: 'CZ', name: 'Czech Republic' },
      { code: 'HU', name: 'Hungary' },
      { code: 'PT', name: 'Portugal' },
      { code: 'GR', name: 'Greece' },
      { code: 'IE', name: 'Ireland' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'JP', name: 'Japan' },
      { code: 'SG', name: 'Singapore' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'CN', name: 'China' },
      { code: 'IN', name: 'India' },
      { code: 'BR', name: 'Brazil' },
      { code: 'MX', name: 'Mexico' },
    ];
  }

  
  /**
   * Reset cache - useful for testing or when data might have changed
   */
  static resetCache(): void {
    this.countries = [];
    this.countriesLoaded = false;
    this.countriesPromise = null;
  }
}

// Export singleton instance for backward compatibility
class CountryService {
  async getAllCountries(): Promise<Country[]> {
    return CountriesService.getAllCountries();
  }

  async getCountryById(id: number): Promise<Country | null> {
    try {
      const countries = await this.getAllCountries();
      return countries.find(country => country.id === id) || null;
    } catch (error) {
      console.error(`Error fetching country with ID ${id}:`, error);
      return null;
    }
  }

  async getCountriesForSelect(): Promise<CountryOption[]> {
    return CountriesService.getCountriesForSelect();
  }

  async findCountryByCode(code: string): Promise<CountryOption | null> {
    return CountriesService.findCountryByCode(code);
  }
}

export const countryService = new CountryService();
export default countryService;
