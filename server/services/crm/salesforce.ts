import * as jsforce from 'jsforce';
import { Contact, Company } from '@shared/schema';

// Salesforce API credentials
const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET;
const SALESFORCE_USERNAME = process.env.SALESFORCE_USERNAME;
const SALESFORCE_PASSWORD = process.env.SALESFORCE_PASSWORD;

// Salesforce connection instance
let sfConnection: jsforce.Connection | null = null;

/**
 * Initialize and get a Salesforce connection
 */
export async function getSalesforceConnection(): Promise<jsforce.Connection> {
  if (!sfConnection) {
    if (!SALESFORCE_CLIENT_ID || !SALESFORCE_CLIENT_SECRET || !SALESFORCE_USERNAME || !SALESFORCE_PASSWORD) {
      throw new Error('Salesforce credentials are missing');
    }

    sfConnection = new jsforce.Connection({
      loginUrl: 'https://login.salesforce.com',
      version: '54.0',
      clientId: SALESFORCE_CLIENT_ID,
      clientSecret: SALESFORCE_CLIENT_SECRET
    });

    try {
      await sfConnection.login(SALESFORCE_USERNAME, SALESFORCE_PASSWORD);
    } catch (error) {
      console.error('Error logging into Salesforce:', error);
      sfConnection = null;
      throw error;
    }
  }

  return sfConnection;
}

/**
 * Export contacts to Salesforce
 */
export async function exportContactsToSalesforce(contacts: Contact[]): Promise<{ success: boolean; results: any[] }> {
  try {
    const conn = await getSalesforceConnection();
    const results = [];

    // Process each contact
    for (const contact of contacts) {
      // Format contact for Salesforce
      const sfContact = {
        FirstName: contact.fullName.split(' ')[0] || '',
        LastName: contact.fullName.split(' ').slice(1).join(' ') || 'Unknown',
        Email: contact.email || '',
        Phone: contact.phone || '',
        Title: contact.jobTitle || '',
        // Note: Account association would require account lookup/creation
      };

      try {
        // Create contact in Salesforce
        const result = await conn.sobject('Contact').create(sfContact);
        results.push({ success: true, id: result.id });
      } catch (contactError: any) {
        console.error('Error creating Salesforce contact:', contactError);
        results.push({ success: false, error: contactError.message });
      }
    }

    return { 
      success: results.every(r => r.success), 
      results 
    };
  } catch (error) {
    console.error('Error exporting contacts to Salesforce:', error);
    throw error;
  }
}

/**
 * Export companies to Salesforce
 */
export async function exportCompaniesToSalesforce(companies: Company[]): Promise<{ success: boolean; results: any[] }> {
  try {
    const conn = await getSalesforceConnection();
    const results = [];

    // Process each company
    for (const company of companies) {
      // Format company for Salesforce (as Account)
      const sfAccount = {
        Name: company.name,
        Website: company.website || '',
        Industry: company.industry || '',
        Phone: company.phone || '',
        Description: company.description || ''
      };

      try {
        // Create account in Salesforce
        const result = await conn.sobject('Account').create(sfAccount);
        results.push({ success: true, id: result.id });
      } catch (companyError: any) {
        console.error('Error creating Salesforce account:', companyError);
        results.push({ success: false, error: companyError.message });
      }
    }

    return { 
      success: results.every(r => r.success), 
      results 
    };
  } catch (error) {
    console.error('Error exporting companies to Salesforce:', error);
    throw error;
  }
}

/**
 * Import contacts from Salesforce
 */
export async function importContactsFromSalesforce(): Promise<any[]> {
  try {
    const conn = await getSalesforceConnection();
    
    // Query Salesforce for contacts
    const contactsQuery = `
      SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name
      FROM Contact
      LIMIT 100
    `;
    
    const queryResult = await conn.query(contactsQuery);
    
    // Map Salesforce contacts to our contact format
    const contacts = queryResult.records.map((record: any) => {
      return {
        fullName: `${record.FirstName || ''} ${record.LastName || ''}`.trim(),
        email: record.Email || null,
        phone: record.Phone || null,
        jobTitle: record.Title || null,
        companyName: record.Account?.Name || null,
        salesforceId: record.Id,
        isImported: true,
        crmSource: 'salesforce'
      };
    });
    
    return contacts;
  } catch (error) {
    console.error('Error importing contacts from Salesforce:', error);
    throw error;
  }
}

/**
 * Import companies from Salesforce
 */
export async function importCompaniesFromSalesforce(): Promise<any[]> {
  try {
    const conn = await getSalesforceConnection();
    
    // Query Salesforce for accounts
    const accountsQuery = `
      SELECT Id, Name, Website, Industry, Phone, Description
      FROM Account
      LIMIT 100
    `;
    
    const queryResult = await conn.query(accountsQuery);
    
    // Map Salesforce accounts to our company format
    const companies = queryResult.records.map((record: any) => {
      return {
        name: record.Name || 'Unknown Company',
        website: record.Website || null,
        industry: record.Industry || null,
        phone: record.Phone || null,
        description: record.Description || null,
        salesforceId: record.Id,
        isImported: true,
        crmSource: 'salesforce'
      };
    });
    
    return companies;
  } catch (error) {
    console.error('Error importing companies from Salesforce:', error);
    throw error;
  }
}

/**
 * Test Salesforce connection
 */
export async function testSalesforceConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const conn = await getSalesforceConnection();
    
    // Make a simple API call to test the connection
    const userInfo = await conn.identity();
    
    return {
      success: true,
      message: `Successfully connected to Salesforce as ${userInfo.username}`
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    
    return {
      success: false,
      message: `Failed to connect to Salesforce: ${errorMessage}`
    };
  }
}