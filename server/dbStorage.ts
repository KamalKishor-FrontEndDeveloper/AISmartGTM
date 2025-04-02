import { db } from "./db";
import { IStorage } from "./storage";
import { 
  User, InsertUser, 
  Contact, InsertContact, 
  Company, InsertCompany, 
  CreditTransaction, InsertCreditTransaction,
  users, contacts, companies, creditTransactions
} from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

/**
 * Database implementation of the storage interface
 */
export class DbStorage implements IStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async verifyUser(id: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ verified: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return result[0];
  }

  async getContactsByUser(userId: number): Promise<Contact[]> {
    const result = await db.select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
    return result;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(contact).returning();
    return result[0];
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    // For Postgres, we need to use the rowCount from the returned ExecutionResult
    // @ts-ignore - This is a valid property on the Postgres driver result
    return result && result.rowCount > 0;
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async getCompaniesByUser(userId: number): Promise<Company[]> {
    const result = await db.select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .orderBy(desc(companies.createdAt));
    return result;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    // For Postgres, we need to use the rowCount from the returned ExecutionResult
    // @ts-ignore - This is a valid property on the Postgres driver result
    return result && result.rowCount > 0;
  }

  // Credit operations
  async getCreditBalance(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.credits || 0;
  }

  async addCredits(userId: number, amount: number, description: string): Promise<number> {
    // Begin transaction
    const result = await db.transaction(async (tx) => {
      // Add credits to user
      const updatedUser = await tx.update(users)
        .set({ 
          credits: sql`${users.credits} + ${amount}`
        })
        .where(eq(users.id, userId))
        .returning();
      
      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount,
        type: "credit",
        description,
        createdAt: new Date()
      });
      
      return updatedUser[0];
    });
    
    return result.credits || 0;
  }

  async useCredits(userId: number, amount: number, description: string): Promise<number | null> {
    // Begin transaction
    const currentUser = await this.getUser(userId);
    if (!currentUser || (currentUser.credits || 0) < amount) {
      return null; // Not enough credits
    }
    
    const result = await db.transaction(async (tx) => {
      // Deduct credits from user
      const updatedUser = await tx.update(users)
        .set({ 
          credits: sql`${users.credits} - ${amount}`
        })
        .where(eq(users.id, userId))
        .returning();
      
      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: -amount,
        type: "debit",
        description,
        createdAt: new Date()
      });
      
      return updatedUser[0];
    });
    
    return result.credits || 0;
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    const result = await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
    return result;
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
    // Start building the where clause
    let whereClause = and(
      eq(contacts.userId, userId),
      eq(contacts.isEnriched, true)
    );
    
    // Add optional filters
    if (filters.jobTitle) {
      whereClause = and(whereClause, like(contacts.jobTitle, `%${filters.jobTitle}%`));
    }
    
    if (filters.location) {
      whereClause = and(whereClause, like(contacts.location, `%${filters.location}%`));
    }
    
    // For company and industry, we need to join with companies table
    if (filters.company || filters.industry) {
      // This is a more complex query, we'll use a raw SQL approach
      // For a more robust implementation, we would structure this better
      const result = await db.select()
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(whereClause);
      
      return result
        .filter(row => {
          if (filters.company && row.companies && !row.companies.name.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
          }
          if (filters.industry && row.companies && !row.companies.industry?.toLowerCase().includes(filters.industry.toLowerCase())) {
            return false;
          }
          return true;
        })
        .map(row => row.contacts);
    }
    
    // Simple query without company/industry filters
    const result = await db.select()
      .from(contacts)
      .where(whereClause)
      .orderBy(desc(contacts.createdAt));
    
    return result;
  }
}

// Export an instance of the database storage
export const dbStorage = new DbStorage();