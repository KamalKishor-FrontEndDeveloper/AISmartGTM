import axios from 'axios';

interface EnrichmentResult {
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  twitterUrl?: string;
  companyName?: string;
  jobTitle?: string;
  location?: string;
  verified?: boolean;
  enrichmentSource?: string;
}

// API configurations
const ICYPEAS_API_KEY = process.env.ICYPEAS_API_KEY;
const FINDY_API_KEY = process.env.FINDY_API_KEY;
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const CLEARBIT_API_KEY = process.env.CLEARBIT_API_KEY;

async function enrichWithIcypeas(firstName: string, lastName: string, domain: string): Promise<EnrichmentResult> {
  try {
    // Email search
    const searchResponse = await axios.post('https://app.icypeas.com/api/email-search', {
      firstname: firstName,
      lastname: lastName,
      domainOrCompany: domain,
      customObject: {
        externalId: `${firstName}-${lastName}-${domain}`
      }
    }, {
      headers: { 'Authorization': `Bearer ${ICYPEAS_API_KEY}` }
    });

    const email = searchResponse.data.email;

    if (email) {
      // Email verification
      const verifyResponse = await axios.post('https://app.icypeas.com/api/email-verification', {
        email,
        customObject: {
          externalId: `verify-${email}`
        }
      }, {
        headers: { 'Authorization': `Bearer ${ICYPEAS_API_KEY}` }
      });

      return {
        email,
        verified: verifyResponse.data.isValid,
        enrichmentSource: 'icypeas'
      };
    }
    return {
      email: searchResponse.data.email, // Corrected to use searchResponse
      enrichmentSource: 'icypeas'
    };
  } catch (error) {
    console.error('Icypeas enrichment failed:', error);
    return {};
  }
}

async function enrichWithFindy(fullName: string, domain: string): Promise<EnrichmentResult> {
  try {
    const response = await axios.get(`https://api.findy.com/v2/lookup`, {
      headers: { 'X-API-Key': FINDY_API_KEY },
      params: { full_name: fullName, company_domain: domain }
    });
    return {
      email: response.data.email,
      phone: response.data.phone,
      enrichmentSource: 'findy'
    };
  } catch (error) {
    console.error('Findy enrichment failed:', error);
    return {};
  }
}

async function enrichWithApollo(fullName: string, domain: string): Promise<EnrichmentResult> {
  try {
    const response = await axios.post('https://api.apollo.io/v1/people/match', {
      api_key: APOLLO_API_KEY,
      name: fullName,
      domain: domain
    });
    return {
      email: response.data.email,
      linkedInUrl: response.data.linkedin_url,
      jobTitle: response.data.title,
      enrichmentSource: 'apollo'
    };
  } catch (error) {
    console.error('Apollo enrichment failed:', error);
    return {};
  }
}

async function enrichWithHunter(domain: string, fullName: string): Promise<EnrichmentResult> {
  try {
    const response = await axios.get('https://api.hunter.io/v2/email-finder', {
      params: {
        domain,
        full_name: fullName,
        api_key: HUNTER_API_KEY
      }
    });
    return {
      email: response.data.data.email,
      verified: response.data.data.score > 75,
      enrichmentSource: 'hunter'
    };
  } catch (error) {
    console.error('Hunter enrichment failed:', error);
    return {};
  }
}

async function enrichWithClearbit(domain: string): Promise<EnrichmentResult> {
  try {
    const response = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
      headers: { Authorization: `Bearer ${CLEARBIT_API_KEY}` },
      params: { domain }
    });
    return {
      companyName: response.data.name,
      location: response.data.location,
      enrichmentSource: 'clearbit'
    };
  } catch (error) {
    console.error('Clearbit enrichment failed:', error);
    return {};
  }
}

export async function enrichContactData(fullName: string, domain: string): Promise<EnrichmentResult> {
  const results = await Promise.allSettled([
    enrichWithIcypeas(fullName, domain),
    enrichWithFindy(fullName, domain),
    enrichWithApollo(fullName, domain),
    enrichWithHunter(domain, fullName),
    enrichWithClearbit(domain)
  ]);

  // Combine results from all APIs
  const enrichedData: EnrichmentResult = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      Object.entries(result.value).forEach(([key, value]) => {
        if (value && !enrichedData[key as keyof EnrichmentResult]) {
          enrichedData[key as keyof EnrichmentResult] = value;
        }
      });
    }
  });

  return enrichedData;
}

export async function verifyEmail(email: string): Promise<boolean> {
  try {
    const response = await axios.post('https://app.icypeas.com/api/email-verification', {
      email,
      customObject: {
        webhookUrl: `${process.env.API_URL}/api/webhook/email-verification`,
        externalId: `verify_${Date.now()}`
      }
    });

    return response.data.isValid || false;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
}