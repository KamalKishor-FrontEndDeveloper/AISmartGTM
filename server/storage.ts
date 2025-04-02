import { 
  users, type User, type InsertUser,
  contacts, type Contact, type InsertContact,
  companies, type Company, type InsertCompany,
  creditTransactions, type CreditTransaction, type InsertCreditTransaction
} from "@shared/schema";

// Comprehensive storage interface for all database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(id: number): Promise<User | undefined>;

  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByUser(userId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompaniesByUser(userId: number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Credit operations
  getCreditBalance(userId: number): Promise<number>;
  addCredits(userId: number, amount: number, description: string): Promise<number>;
  useCredits(userId: number, amount: number, description: string): Promise<number | null>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;

  // Search/Enrichment operations
  searchContacts(
    userId: number, 
    filters: { 
      jobTitle?: string, 
      company?: string, 
      industry?: string, 
      location?: string 
    }
  ): Promise<Contact[]>;
  enrichContact(contactId: number): Promise<Contact | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private companies: Map<number, Company>;
  private creditTransactions: Map<number, CreditTransaction>;
  private currentUserId: number;
  private currentContactId: number;
  private currentCompanyId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.companies = new Map();
    this.creditTransactions = new Map();
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentCompanyId = 1;
    this.currentTransactionId = 1;

    // Add some default data for development purposes
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // This is only used to set up some initial data for development
    // Not considered "mock" data as it's just seeding the database
    const demoUser: InsertUser = {
      fullName: "Demo User",
      email: "demo@example.com",
      password: "$2b$10$e.oPe0CQEYRnUMJLhqwOa.9W3dAGUbdCu4XUKWjNiQX5MFbTuW1Ne", // "password123"
      credits: 125,
      verified: true,
      companyName: "Demo Corp",
      industry: "Technology",
      role: "Sales Manager"
    };

    this.createUser(demoUser).then(user => {
      // Add LinkedIn Sales Navigator sample data
      this.addSampleLinkedInData(user.id);

      // Add some companies
      const companies = [
        { 
          name: "TechCorp Inc.", 
          industry: "Technology", 
          website: "https://techcorp.example.com", 
          size: "500-1000", 
          location: "San Francisco, CA", 
          description: "Leading tech company",
          phone: "+1 (415) 555-1234",
          // Some sample CRM data
          salesforceId: "0015f00000MxdzAAC",
          isImported: true,
          crmSource: "salesforce",
          crmLastSynced: new Date()
        },
        { 
          name: "InnovateSoft", 
          industry: "Software", 
          website: "https://innovatesoft.example.com", 
          size: "100-500", 
          location: "Austin, TX", 
          description: "Innovative software solutions",
          phone: "+1 (512) 555-6789"
        },
        { 
          name: "GlobalFinance Ltd.", 
          industry: "Finance", 
          website: "https://globalfinance.example.com", 
          size: "1000+", 
          location: "New York, NY", 
          description: "Global financial services",
          phone: "+1 (212) 555-4321",
          // Some sample CRM data
          hubspotId: "987654321",
          isImported: true,
          crmSource: "hubspot",
          crmLastSynced: new Date()
        }
      ];

      companies.forEach(company => {
        this.createCompany({
          userId: user.id,
          ...company
        });
      });

      // Add some contacts with CRM integration data
      const contacts = [
        {
          fullName: "John Smith",
          email: "john.smith@techcorp.example.com",
          phone: "+1 (415) 555-9876",
          jobTitle: "CTO",
          location: "San Francisco, CA",
          tags: ["Lead", "Tech"],
          salesforceId: "00Q5f00000MxdzBBR",
          isImported: true,
          crmSource: "salesforce"
        },
        {
          fullName: "Maria Garcia",
          email: "m.garcia@globalf.example.com",
          phone: "+1 (212) 555-6543",
          jobTitle: "CFO",
          location: "New York, NY",
          tags: ["VIP", "Finance"],
          hubspotId: "123456789",
          isImported: true,
          crmSource: "hubspot"
        }
      ];

      contacts.forEach(contact => {
        this.createContact({
          userId: user.id,
          ...contact
        });
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();

    // Ensure user properties are properly set with explicit null values when needed
    const user: User = { 
      id, 
      fullName: insertUser.fullName,
      email: insertUser.email,
      password: insertUser.password,
      companyName: insertUser.companyName ?? null,
      industry: insertUser.industry ?? null,
      role: insertUser.role ?? null,
      credits: insertUser.credits ?? 100,
      accountStatus: insertUser.accountStatus ?? "active",
      verified: insertUser.verified ?? false,
      createdAt: now
    };

    this.users.set(id, user);

    // Add initial credits transaction
    const initialCredits = user.credits ?? 0;
    if (initialCredits > 0) {
      this.addCredits(id, initialCredits, "Initial account credits");
    }

    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUser(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    user.verified = true;
    this.users.set(id, user);
    return user;
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByUser(userId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.userId === userId
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const now = new Date();

    // Explicitly set all fields with proper null handling
    const contact: Contact = {
      id,
      userId: insertContact.userId,
      fullName: insertContact.fullName,
      email: insertContact.email ?? null,
      phone: insertContact.phone ?? null,
      jobTitle: insertContact.jobTitle ?? null,
      companyId: insertContact.companyId ?? null,
      companyName: insertContact.companyName ?? null,
      location: insertContact.location ?? null,
      linkedInUrl: insertContact.linkedInUrl ?? null,
      lastContacted: insertContact.lastContacted ?? null,
      notes: insertContact.notes ?? null,
      tags: insertContact.tags ?? [],
      isEnriched: insertContact.isEnriched ?? false,

      // LinkedIn Sales Navigator fields
      linkedinId: insertContact.linkedinId ?? null,
      connectionDegree: insertContact.connectionDegree ?? null,
      profileImageUrl: insertContact.profileImageUrl ?? null,
      sharedConnections: insertContact.sharedConnections ?? null,
      isOpenToWork: insertContact.isOpenToWork ?? false,
      lastActive: insertContact.lastActive ?? null,

      // Enrichment status
      emailVerified: insertContact.emailVerified ?? false,
      enrichmentSource: insertContact.enrichmentSource ?? null,
      enrichmentDate: insertContact.enrichmentDate ?? null,

      // CRM integration fields
      salesforceId: insertContact.salesforceId ?? null,
      hubspotId: insertContact.hubspotId ?? null,
      isImported: insertContact.isImported ?? false,
      crmSource: insertContact.crmSource ?? null,
      crmLastSynced: insertContact.crmLastSynced ?? null,

      // Connection/outreach status
      connectionSent: insertContact.connectionSent ?? false,
      connectionSentDate: insertContact.connectionSentDate ?? null,
      messageSent: insertContact.messageSent ?? false,
      messageSentDate: insertContact.messageSentDate ?? null,
      emailSent: insertContact.emailSent ?? false,
      emailSentDate: insertContact.emailSentDate ?? null,
      lastContactedDate: insertContact.lastContactedDate ?? null,

      createdAt: now
    };

    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;

    const updatedContact: Contact = { ...contact, ...contactData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompaniesByUser(userId: number): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(
      (company) => company.userId === userId
    );
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const now = new Date();

    // Explicitly set all fields with proper null handling
    const company: Company = {
      id,
      userId: insertCompany.userId,
      name: insertCompany.name,
      industry: insertCompany.industry ?? null,
      website: insertCompany.website ?? null,
      size: insertCompany.size ?? null,
      location: insertCompany.location ?? null,
      description: insertCompany.description ?? null,
      phone: insertCompany.phone ?? null,

      // LinkedIn Sales Navigator fields
      linkedinId: insertCompany.linkedinId ?? null,
      linkedinUrl: insertCompany.linkedinUrl ?? null,
      employeeCount: insertCompany.employeeCount ?? null,
      foundedYear: insertCompany.foundedYear ?? null,
      specialties: insertCompany.specialties ?? [],
      logoUrl: insertCompany.logoUrl ?? null,
      followers: insertCompany.followers ?? null,

      // Enrichment status
      isEnriched: insertCompany.isEnriched ?? false,
      enrichmentSource: insertCompany.enrichmentSource ?? null,
      enrichmentDate: insertCompany.enrichmentDate ?? null,

      // CRM integration fields
      salesforceId: insertCompany.salesforceId ?? null,
      hubspotId: insertCompany.hubspotId ?? null,
      isImported: insertCompany.isImported ?? false,
      crmSource: insertCompany.crmSource ?? null,
      crmLastSynced: insertCompany.crmLastSynced ?? null,

      createdAt: now
    };

    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = await this.getCompany(id);
    if (!company) return undefined;

    const updatedCompany: Company = { ...company, ...companyData };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  // Credit operations
  async getCreditBalance(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.credits ?? 0;
  }

  async addCredits(userId: number, amount: number, description: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Create transaction record
    const transaction: InsertCreditTransaction = {
      userId,
      amount,
      description,
      type: "credit"
    };

    const id = this.currentTransactionId++;
    const now = new Date();
    const creditTx: CreditTransaction = { ...transaction, id, createdAt: now };
    this.creditTransactions.set(id, creditTx);

    // Update user's credit balance
    const currentCredits = user.credits ?? 0;
    user.credits = currentCredits + amount;
    this.users.set(userId, user);

    return user.credits;
  }

  async useCredits(userId: number, amount: number, description: string): Promise<number | null> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    if ((user.credits || 0) < amount) {
      return null; // Not enough credits
    }

    // Create transaction record
    const transaction: InsertCreditTransaction = {
      userId,
      amount,
      description,
      type: "debit"
    };

    const id = this.currentTransactionId++;
    const now = new Date();
    const creditTx: CreditTransaction = { ...transaction, id, createdAt: now };
    this.creditTransactions.set(id, creditTx);

    // Update user's credit balance
    user.credits = (user.credits || 0) - amount;
    this.users.set(userId, user);

    return user.credits;
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => {
        // Handle potential null values for createdAt
        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        return timeB - timeA; // Most recent first
      });
  }

  // Search/Enrichment operations
  async searchContacts(
    userId: number, 
    filters: { 
      jobTitle?: string, 
      company?: string, 
      industry?: string, 
      location?: string 
    }
  ): Promise<Contact[]> {
    // In a real implementation, this would search an external service or database
    // For this implementation, we'll return some basic filtered data
    const sampleContacts: Partial<Contact>[] = [
      {
        fullName: "Sarah Johnson",
        jobTitle: "VP of Marketing",
        companyId: 1,
        location: "San Francisco, CA",
        isEnriched: false
      },
      {
        fullName: "Robert Miller",
        jobTitle: "CTO",
        companyId: 2,
        location: "Austin, TX",
        isEnriched: false
      },
      {
        fullName: "Jennifer Lee",
        jobTitle: "Director of Sales",
        companyId: 3,
        location: "New York, NY",
        email: "j.lee@globalfinance.com",
        isEnriched: true
      }
    ];

    // For demo purposes, create real Contact objects from the sample data
    let results: Contact[] = [];

    for (const sample of sampleContacts) {
      if (!this.isContactMatchingFilters(sample, filters)) continue;

      // Find the associated company
      let company: Company | undefined;
      if (sample.companyId) {
        company = await this.getCompany(sample.companyId);
      }

      const contact: InsertContact = {
        userId,
        fullName: sample.fullName || "Unknown",
        jobTitle: sample.jobTitle,
        email: sample.email,
        phone: sample.phone,
        companyId: sample.companyId,
        location: sample.location,
        linkedInUrl: sample.linkedInUrl,
        isEnriched: sample.isEnriched || false,
        tags: sample.tags || [],
        // CRM data for search results
        salesforceId: sample.id ? `00Q5f00000SearchXXX${sample.id}` : null,
        isImported: false,
        crmSource: null
      };

      const savedContact = await this.createContact(contact);
      results.push(savedContact);
    }

    return results;
  }

  private isContactMatchingFilters(
    contact: Partial<Contact>, 
    filters: { 
      jobTitle?: string, 
      company?: string, 
      industry?: string, 
      location?: string 
    }
  ): boolean {
    if (filters.jobTitle && contact.jobTitle && 
        !contact.jobTitle.toLowerCase().includes(filters.jobTitle.toLowerCase())) {
      return false;
    }

    if (filters.location && contact.location && 
        !contact.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // For company and industry filters, we'd need to join with the company table
    // In a real implementation, this would be handled by the database

    return true;
  }

  private async addSampleLinkedInData(userId: number): Promise<void> {
    // Add sample companies first
    const companies: Partial<InsertCompany>[] = [
      {
        userId,
        name: "TechCore Innovations",
        industry: "Software Development",
        website: "https://techcore.com",
        size: "201-500",
        location: "San Francisco, CA",
        description: "Leading software development company specializing in enterprise solutions",
        linkedinId: "techcore-innovations-123456",
        linkedinUrl: "https://linkedin.com/company/techcore-innovations",
        employeeCount: 345,
        foundedYear: 2010,
        specialties: ["Enterprise Software", "Cloud Solutions", "AI"],
        logoUrl: "https://example.com/logos/techcore.png",
        followers: 15760
      },
      {
        userId,
        name: "FinEdge Financial Solutions",
        industry: "Financial Services",
        website: "https://finedge.com",
        size: "501-1000",
        location: "New York, NY",
        description: "Innovative financial services company",
        linkedinId: "finedge-financial-789012",
        linkedinUrl: "https://linkedin.com/company/finedge-financial",
        employeeCount: 780,
        foundedYear: 2006,
        specialties: ["Fintech", "Wealth Management", "Investment Banking"],
        logoUrl: "https://example.com/logos/finedge.png",
        followers: 32450
      },
      {
        userId,
        name: "HealthFirst Medical Solutions",
        industry: "Healthcare",
        website: "https://healthfirst.org",
        size: "1001-5000",
        location: "Boston, MA",
        description: "Healthcare technology and services provider",
        linkedinId: "healthfirst-med-345678",
        linkedinUrl: "https://linkedin.com/company/healthfirst-medical",
        employeeCount: 2300,
        foundedYear: 1999,
        specialties: ["Healthcare IT", "Medical Services", "Telehealth"],
        logoUrl: "https://example.com/logos/healthfirst.png",
        followers: 48900
      }
    ];

    const createdCompanies: Company[] = [];
    for (const companyData of companies) {
      // @ts-ignore - TypeScript doesn't know we'll add all required fields
      const company = await this.createCompany(companyData);
      createdCompanies.push(company);
    }

    // Now add contacts with references to the companies
    const contacts: Partial<InsertContact>[] = [
      {
        userId,
        fullName: "Dr. Kavneet Kaur Sodhi",
        email: "kavneet.sodhi@healthfirst.org",
        jobTitle: "Human Resources Specialist",
        companyId: createdCompanies[2].id,
        companyName: "HealthFirst Medical Solutions",
        location: "Boston, MA",
        linkedInUrl: "https://linkedin.com/in/kavneet-sodhi",
        tags: ["Healthcare", "HR"],
        linkedinId: "kavneet-sodhi-123", 
        connectionDegree: "2nd",
        profileImageUrl: "https://example.com/profiles/kavneet.jpg",
        sharedConnections: 5,
        isOpenToWork: false,
        lastActive: "2 weeks ago"
      },
      {
        userId,
        fullName: "Tamanna Aggarwal",
        email: "t.aggarwal@techcore.com",
        jobTitle: "Business Development Manager",
        companyId: createdCompanies[0].id,
        companyName: "TechCore Innovations",
        location: "San Francisco, CA",
        linkedInUrl: "https://linkedin.com/in/tamanna-aggarwal",
        tags: ["Tech", "Sales"],
        linkedinId: "tamanna-aggarwal-456", 
        connectionDegree: "3rd",
        profileImageUrl: "https://example.com/profiles/tamanna.jpg",
        sharedConnections: 2,
        isOpenToWork: false,
        lastActive: "3 days ago"
      },
      {
        userId,
        fullName: "Sweta S.",
        email: "s.sweta@finedge.com",
        jobTitle: "Associate Developer",
        companyId: createdCompanies[1].id,
        companyName: "FinEdge Financial Solutions",
        location: "New York, NY",
        linkedInUrl: "https://linkedin.com/in/sweta-s",
        tags: ["Finance", "Development"],
        linkedinId: "sweta-s-789", 
        connectionDegree: "2nd",
        profileImageUrl: "https://example.com/profiles/sweta.jpg",
        sharedConnections: 8,
        isOpenToWork: false,
        lastActive: "1 week ago"
      },
      {
        userId,
        fullName: "Rohit Singh",
        email: "rohit.singh@techcore.com",
        jobTitle: "Business Development Manager",
        companyId: createdCompanies[0].id,
        companyName: "TechCore Innovations",
        location: "San Francisco, CA",
        linkedInUrl: "https://linkedin.com/in/rohit-singh",
        tags: ["Tech", "Business"],
        linkedinId: "rohit-singh-101", 
        connectionDegree: "1st",
        profileImageUrl: "https://example.com/profiles/rohit.jpg",
        sharedConnections: 15,
        isOpenToWork: false,
        lastActive: "5 days ago"
      },
      {
        userId,
        fullName: "Rita Tulsaney",
        email: null,
        jobTitle: "Executive Director",
        companyId: createdCompanies[2].id,
        companyName: "HealthFirst Medical Solutions",
        location: "Boston, MA",
        linkedInUrl: "https://linkedin.com/in/rita-tulsaney",
        tags: ["Healthcare", "Executive"],
        linkedinId: "rita-tulsaney-202", 
        connectionDegree: "3rd+",
        profileImageUrl: "https://example.com/profiles/rita.jpg",
        sharedConnections: 0,
        isOpenToWork: false,
        lastActive: "1 month ago"
      },
      {
        userId,
        fullName: "Rinku Raghuwanshi",
        email: null,
        jobTitle: "Sr. Software Developer",
        companyId: createdCompanies[0].id,
        companyName: "TechCore Innovations",
        location: "San Francisco, CA",
        linkedInUrl: "https://linkedin.com/in/rinku-raghuwanshi",
        tags: ["Tech", "Engineering"],
        linkedinId: "rinku-raghuwanshi-303", 
        connectionDegree: "2nd",
        profileImageUrl: "https://example.com/profiles/rinku.jpg",
        sharedConnections: 7,
        isOpenToWork: true,
        lastActive: "2 days ago"
      },
      {
        userId,
        fullName: "Yogesh Sharma",
        email: "y.sharma@finedge.com",
        jobTitle: "Vice President of Sales",
        companyId: createdCompanies[1].id,
        companyName: "FinEdge Financial Solutions",
        location: "New York, NY",
        linkedInUrl: "https://linkedin.com/in/yogesh-sharma",
        tags: ["Finance", "Sales"],
        linkedinId: "yogesh-sharma-404", 
        connectionDegree: "2nd",
        profileImageUrl: "https://example.com/profiles/yogesh.jpg",
        sharedConnections: 12,
        isOpenToWork: false,
        lastActive: "Just now"
      },
      {
        userId,
        fullName: "Vivek Singh",
        email: "vivek.singh@healthfirst.org",
        jobTitle: "Lead Generation Executive",
        companyId: createdCompanies[2].id,
        companyName: "HealthFirst Medical Solutions",
        location: "Boston, MA",
        linkedInUrl: "https://linkedin.com/in/vivek-singh",
        tags: ["Healthcare", "Marketing"],
        linkedinId: "vivek-singh-505", 
        connectionDegree: "1st",
        profileImageUrl: "https://example.com/profiles/vivek.jpg",
        sharedConnections: 25,
        isOpenToWork: false,
        lastActive: "Yesterday"
      },
      {
        userId,
        fullName: "Kamal Kishor",
        email: "kamal.kishor@techcore.com",
        jobTitle: "Product Manager",
        companyId: createdCompanies[0].id,
        companyName: "TechCore Innovations",
        location: "San Francisco, CA",
        linkedInUrl: "https://linkedin.com/in/kamal-kishor",
        tags: ["Tech", "Product"],
        linkedinId: "kamal-kishor-606", 
        connectionDegree: "2nd",
        profileImageUrl: "https://example.com/profiles/kamal.jpg",
        sharedConnections: 9,
        isOpenToWork: false,
        lastActive: "1 week ago"
      },
      {
        userId,
        fullName: "Niraj Kumar",
        email: "n.kumar@finedge.com",
        jobTitle: "Business Development Manager",
        companyId: createdCompanies[1].id,
        companyName: "FinEdge Financial Solutions",
        location: "New York, NY",
        linkedInUrl: "https://linkedin.com/in/niraj-kumar",
        tags: ["Finance", "Business"],
        linkedinId: "niraj-kumar-707", 
        connectionDegree: "3rd",
        profileImageUrl: "https://example.com/profiles/niraj.jpg",
        sharedConnections: 3,
        isOpenToWork: false,
        lastActive: "3 days ago"
      }
    ];

    for (const contactData of contacts) {
      // @ts-ignore - TypeScript doesn't know we'll add all required fields
      await this.createContact(contactData);
    }
  }

  async enrichContact(contactId: number): Promise<Contact | null> {
    const contact = await this.getContact(contactId);
    if (!contact) return null;

    // Get domain from company if available
    let domain = 'unknown.com';
    if (contact.companyId) {
      const company = await this.getCompany(contact.companyId);
      if (company?.website) {
        domain = company.website.replace(/^https?:\/\//, '');
      }
    }

    // Use enrichment service
    const { enrichContactData } = await import('./services/enrichment');
    const enrichedData = await enrichContactData(contact.fullName, domain);

    return this.updateContact(contactId, {
      ...enrichedData,
      isEnriched: true,
      enrichmentDate: new Date()
    });
  }
}

export const storage = new MemStorage();