export interface Country {
    code: string
    name: string
    states?: State[]
}

export interface State {
    code: string
    name: string
}

export const countryList: Country[] = [
    {
        code: 'US',
        name: 'United States',
        states: [
            { code: 'AL', name: 'Alabama' },
            { code: 'AK', name: 'Alaska' },
            { code: 'AZ', name: 'Arizona' },
            { code: 'AR', name: 'Arkansas' },
            { code: 'CA', name: 'California' },
            { code: 'CO', name: 'Colorado' },
            { code: 'CT', name: 'Connecticut' },
            { code: 'DE', name: 'Delaware' },
            { code: 'FL', name: 'Florida' },
            { code: 'GA', name: 'Georgia' },
            { code: 'HI', name: 'Hawaii' },
            { code: 'ID', name: 'Idaho' },
            { code: 'IL', name: 'Illinois' },
            { code: 'IN', name: 'Indiana' },
            { code: 'IA', name: 'Iowa' },
            { code: 'KS', name: 'Kansas' },
            { code: 'KY', name: 'Kentucky' },
            { code: 'LA', name: 'Louisiana' },
            { code: 'ME', name: 'Maine' },
            { code: 'MD', name: 'Maryland' },
            { code: 'MA', name: 'Massachusetts' },
            { code: 'MI', name: 'Michigan' },
            { code: 'MN', name: 'Minnesota' },
            { code: 'MS', name: 'Mississippi' },
            { code: 'MO', name: 'Missouri' },
            { code: 'MT', name: 'Montana' },
            { code: 'NE', name: 'Nebraska' },
            { code: 'NV', name: 'Nevada' },
            { code: 'NH', name: 'New Hampshire' },
            { code: 'NJ', name: 'New Jersey' },
            { code: 'NM', name: 'New Mexico' },
            { code: 'NY', name: 'New York' },
            { code: 'NC', name: 'North Carolina' },
            { code: 'ND', name: 'North Dakota' },
            { code: 'OH', name: 'Ohio' },
            { code: 'OK', name: 'Oklahoma' },
            { code: 'OR', name: 'Oregon' },
            { code: 'PA', name: 'Pennsylvania' },
            { code: 'RI', name: 'Rhode Island' },
            { code: 'SC', name: 'South Carolina' },
            { code: 'SD', name: 'South Dakota' },
            { code: 'TN', name: 'Tennessee' },
            { code: 'TX', name: 'Texas' },
            { code: 'UT', name: 'Utah' },
            { code: 'VT', name: 'Vermont' },
            { code: 'VA', name: 'Virginia' },
            { code: 'WA', name: 'Washington' },
            { code: 'WV', name: 'West Virginia' },
            { code: 'WI', name: 'Wisconsin' },
            { code: 'WY', name: 'Wyoming' }
        ]
    },
    {
        code: 'CA',
        name: 'Canada',
        states: [
            { code: 'AB', name: 'Alberta' },
            { code: 'BC', name: 'British Columbia' },
            { code: 'MB', name: 'Manitoba' },
            { code: 'NB', name: 'New Brunswick' },
            { code: 'NL', name: 'Newfoundland and Labrador' },
            { code: 'NS', name: 'Nova Scotia' },
            { code: 'ON', name: 'Ontario' },
            { code: 'PE', name: 'Prince Edward Island' },
            { code: 'QC', name: 'Quebec' },
            { code: 'SK', name: 'Saskatchewan' }
        ]
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        states: [
            { code: 'ENG', name: 'England' },
            { code: 'SCT', name: 'Scotland' },
            { code: 'WLS', name: 'Wales' },
            { code: 'NIR', name: 'Northern Ireland' }
        ]
    },
    {
        code: 'AU',
        name: 'Australia',
        states: [
            { code: 'NSW', name: 'New South Wales' },
            { code: 'VIC', name: 'Victoria' },
            { code: 'QLD', name: 'Queensland' },
            { code: 'WA', name: 'Western Australia' },
            { code: 'SA', name: 'South Australia' },
            { code: 'TAS', name: 'Tasmania' },
            { code: 'ACT', name: 'Australian Capital Territory' },
            { code: 'NT', name: 'Northern Territory' }
        ]
    },
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
]

export const getCountryByCode = (code: string): Country | undefined => {
    return countryList.find(country => country.code === code)
}

export const getStatesByCountry = (countryCode: string): State[] => {
    const country = getCountryByCode(countryCode)
    return country?.states || []
}
