import Hubspot from 'node-hubspot';
import { Contact, Company } from '@shared/schema';

// HubSpot connection configuration
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

// HubSpot client instance
let hubspotClient: any = null;

/**
 * Initialize and get a HubSpot client
 */
export function getHubspotClient(): Hubspot {
  if (!hubspotClient) {
    if (!HUBSPOT_API_KEY) {
      throw new Error('HubSpot API key is missing');
    }

    hubspotClient = new Hubspot({
      apiKey: HUBSPOT_API_KEY
    });
  }

  return hubspotClient;
}

/**
 * Export contacts to HubSpot
 */
export async function exportContactsToHubspot(contacts: Contact[]): Promise<{ success: boolean; results: any[] }> {
  try {
    const client = getHubspotClient();
    const results = [];

    // Process each contact (we can't do batch creates with the API key approach)
    for (const contact of contacts) {
      // Get company name from DB if needed
      let companyName = '';
      if (contact.companyId) {
        // In a real implementation, we'd fetch company by ID 
        // For now, use empty string since we don't have companyName directly
        companyName = ''; // In real code: await storage.getCompany(contact.companyId)?.name
      }
      
      // Format contact for HubSpot
      const hsContact = {
        properties: [
          { property: 'firstname', value: contact.fullName.split(' ')[0] || '' },
          { property: 'lastname', value: contact.fullName.split(' ').slice(1).join(' ') || '' },
          { property: 'jobtitle', value: contact.jobTitle || '' },
          { property: 'email', value: contact.email || '' },
          { property: 'phone', value: contact.phone || '' },
          { property: 'company', value: companyName }
        ]
      };

      try {
        // Create contact in HubSpot
        const result = await client.contacts.create(hsContact);
        results.push({ success: true, result });
      } catch (contactError) {
        console.error('Error creating HubSpot contact:', contactError);
        results.push({ success: false, error: contactError });
      }
    }

    return { 
      success: results.every(r => r.success), 
      results 
    };
  } catch (error) {
    console.error('Error exporting contacts to HubSpot:', error);
    throw error;
  }
}

/**
 * Export companies to HubSpot
 */
export async function exportCompaniesToHubspot(companies: Company[]): Promise<{ success: boolean; results: any[] }> {
  try {
    const client = getHubspotClient();
    const results = [];

    // Process each company (we can't do batch creates with the API key approach)
    for (const company of companies) {
      // Format company for HubSpot
      const hsCompany = {
        properties: [
          { name: 'name', value: company.name },
          { name: 'website', value: company.website || '' },
          { name: 'industry', value: company.industry || '' },
          { name: 'phone', value: company.phone || '' },
          { name: 'description', value: company.description || '' }
        ]
      };

      try {
        // Create company in HubSpot
        const result = await client.companies.create(hsCompany);
        results.push({ success: true, result });
      } catch (companyError) {
        console.error('Error creating HubSpot company:', companyError);
        results.push({ success: false, error: companyError });
      }
    }

    return { 
      success: results.every(r => r.success), 
      results 
    };
  } catch (error) {
    console.error('Error exporting companies to HubSpot:', error);
    throw error;
  }
}

/**
 * Import contacts from HubSpot
 */
export async function importContactsFromHubspot(): Promise<any[]> {
  try {
    const client = getHubspotClient();
    
    // Query HubSpot for contacts
    const contactsResponse = await client.contacts.getAll({
      count: 100,
      properties: ['firstname', 'lastname', 'jobtitle', 'email', 'phone', 'company']
    });
    
    // Map HubSpot contacts to our contact format
    const contacts = contactsResponse.contacts.map((hsContact: any) => {
      const props = hsContact.properties;
      return {
        fullName: `${props.firstname?.value || ''} ${props.lastname?.value || ''}`.trim(),
        jobTitle: props.jobtitle?.value || null,
        email: props.email?.value || null,
        phone: props.phone?.value || null,
        // We'd use companyId instead of companyName in real implementation
        // For now, we'll store the company name in a note field or similar
        notes: `Company: ${props.company?.value || 'Unknown'}`,
        hubspotId: hsContact.vid.toString(),
        isImported: true,
        crmSource: 'hubspot'
      };
    });
    
    return contacts;
  } catch (error) {
    console.error('Error importing contacts from HubSpot:', error);
    throw error;
  }
}

/**
 * Import companies from HubSpot
 */
export async function importCompaniesFromHubspot(): Promise<any[]> {
  try {
    const client = getHubspotClient();
    
    // Query HubSpot for companies
    const companiesResponse = await client.companies.getAll({
      limit: 100,
      properties: ['name', 'website', 'industry', 'phone', 'description']
    });
    
    // Map HubSpot companies to our company format
    const companies = companiesResponse.companies.map((hsCompany: any) => {
      const props = hsCompany.properties;
      return {
        name: props.name?.value || 'Unknown Company',
        website: props.website?.value || null,
        industry: props.industry?.value || null,
        phone: props.phone?.value || null,
        description: props.description?.value || null,
        hubspotId: hsCompany.companyId.toString(),
        isImported: true,
        crmSource: 'hubspot'
      };
    });
    
    return companies;
  } catch (error) {
    console.error('Error importing companies from HubSpot:', error);
    throw error;
  }
}

/**
 * Test HubSpot connection
 */
export async function testHubspotConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getHubspotClient();
    
    // Make a simple API call to test the connection
    await client.contacts.getAll({ count: 1 });
    
    return {
      success: true,
      message: 'Successfully connected to HubSpot'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      message: `Failed to connect to HubSpot: ${errorMessage}`
    };
  }
}