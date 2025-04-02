declare module 'node-hubspot' {
  interface HubspotConfig {
    apiKey?: string;
    accessToken?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    baseUrl?: string;
    maxUse?: number;
    useBetaClient?: boolean;
  }

  interface Contact {
    vid?: number;
    properties?: any;
    [key: string]: any;
  }

  interface Company {
    companyId?: number;
    properties?: any;
    [key: string]: any;
  }

  interface ContactsClient {
    create(contact: any): Promise<any>;
    getAll(options?: any): Promise<{ contacts: Contact[] }>;
    get(vid: number, options?: any): Promise<Contact>;
    update(vid: number, contact: any): Promise<any>;
    delete(vid: number): Promise<any>;
  }

  interface CompaniesClient {
    create(company: any): Promise<any>;
    getAll(options?: any): Promise<{ companies: Company[] }>;
    get(companyId: number, options?: any): Promise<Company>;
    update(companyId: number, company: any): Promise<any>;
    delete(companyId: number): Promise<any>;
  }

  export default class Hubspot {
    constructor(config: HubspotConfig);
    contacts: ContactsClient;
    companies: CompaniesClient;
  }
}