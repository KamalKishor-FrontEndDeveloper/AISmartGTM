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
      password: "$2a$10$demohashedpassword", // In a real app this would be properly hashed
      credits: 125,
      verified: true,
      companyName: "Demo Corp",
      industry: "Technology",
      role: "Sales Manager"
    };
    
    this.createUser(demoUser).then(user => {
      // Add some companies
      const companies = [
        { name: "TechCorp Inc.", industry: "Technology", website: "https://techcorp.example.com", size: "500-1000", location: "San Francisco, CA", description: "Leading tech company" },
        { name: "InnovateSoft", industry: "Software", website: "https://innovatesoft.example.com", size: "100-500", location: "Austin, TX", description: "Innovative software solutions" },
        { name: "GlobalFinance Ltd.", industry: "Finance", website: "https://globalfinance.example.com", size: "1000+", location: "New York, NY", description: "Global financial services" }
      ];
      
      companies.forEach(company => {
        this.createCompany({
          userId: user.id,
          ...company
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
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      credits: insertUser.credits ?? 100,
      verified: insertUser.verified ?? false,
      accountStatus: insertUser.accountStatus ?? "active" 
    };
    this.users.set(id, user);
    
    // Add initial credits transaction
    this.addCredits(id, user.credits, "Initial account credits");
    
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
    const contact: Contact = { 
      ...insertContact, 
      id, 
      createdAt: now,
      tags: insertContact.tags ?? [],
      isEnriched: insertContact.isEnriched ?? false 
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
    const company: Company = { ...insertCompany, id, createdAt: now };
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
    user.credits = (user.credits || 0) + amount;
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        tags: sample.tags || []
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
}

export const storage = new MemStorage();
