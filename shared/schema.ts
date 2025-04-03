import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name"),
  industry: text("industry"),
  role: text("role"),
  credits: integer("credits").default(100),
  accountStatus: text("account_status").default("active"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contacts table for managing leads and contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  industry: text("industry"),
  teamSize: text("team_size"),
  location: text("location"),
  linkedInUrl: text("linkedin_url"),
  lastContacted: timestamp("last_contacted"),
  notes: text("notes"),
  tags: text("tags").array(),
  isEnriched: boolean("is_enriched").default(false),
  // LinkedIn Sales Navigator fields
  linkedinId: text("linkedin_id"),
  connectionDegree: text("connection_degree"),
  profileImageUrl: text("profile_image_url"),
  sharedConnections: integer("shared_connections"),
  isOpenToWork: boolean("is_open_to_work").default(false),
  lastActive: text("last_active"),
  // Enrichment status
  emailVerified: boolean("email_verified").default(false),
  enrichmentSource: text("enrichment_source"),
  enrichmentDate: timestamp("enrichment_date"),
  // CRM integration fields
  salesforceId: text("salesforce_id"),
  hubspotId: text("hubspot_id"),
  isImported: boolean("is_imported").default(false),
  crmSource: text("crm_source"), // 'salesforce', 'hubspot', or null
  crmLastSynced: timestamp("crm_last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
  // Connection/outreach status
  connectionSent: boolean("connection_sent").default(false),
  connectionSentDate: timestamp("connection_sent_date"),
  messageSent: boolean("message_sent").default(false),
  messageSentDate: timestamp("message_sent_date"),
  emailSent: boolean("email_sent").default(false),
  emailSentDate: timestamp("email_sent_date"),
  lastContactedDate: timestamp("last_contacted_date"),
  lastInteractionDate: timestamp("last_interaction_date"),
});

// Companies table for tracking organizations
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  size: text("size"),
  location: text("location"),
  description: text("description"),
  phone: text("phone"),
  // LinkedIn Sales Navigator fields
  linkedinId: text("linkedin_id"),
  linkedinUrl: text("linkedin_url"),
  employeeCount: integer("employee_count"),
  foundedYear: integer("founded_year"),
  specialties: text("specialties").array(),
  logoUrl: text("logo_url"),
  followers: integer("followers"),
  // Enrichment status
  isEnriched: boolean("is_enriched").default(false),
  enrichmentSource: text("enrichment_source"),
  enrichmentDate: timestamp("enrichment_date"),
  // CRM integration fields
  salesforceId: text("salesforce_id"),
  hubspotId: text("hubspot_id"),
  isImported: boolean("is_imported").default(false),
  crmSource: text("crm_source"), // 'salesforce', 'hubspot', or null
  crmLastSynced: timestamp("crm_last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit transactions to track usage
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "debit" or "credit"
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for insertions and validations
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    email: z.string().email("Invalid email address"),
  });

export const insertContactSchema = createInsertSchema(contacts)
  .omit({ id: true, createdAt: true, tags: true })
  .extend({
    tags: z.array(z.string()).optional(),
  });

export const insertCompanySchema = createInsertSchema(companies)
  .omit({ id: true, createdAt: true, specialties: true })
  .extend({
    specialties: z.array(z.string()).optional(),
  });

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions)
  .omit({ id: true, createdAt: true });

// Step-specific schemas for multi-step registration
export const stepOneSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const stepTwoSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
  role: z.string().min(2, "Role is required"),
});

export const stepThreeSchema = z.object({
  verificationCode: z.string().length(6, "Verification code must be 6 digits"),
});

export const stepFourSchema = z.object({
  preferences: z.array(z.string()).min(1, "Select at least one preference"),
});

// Types for usage in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// Step-specific types
export type StepOneData = z.infer<typeof stepOneSchema>;
export type StepTwoData = z.infer<typeof stepTwoSchema>;
export type StepThreeData = z.infer<typeof stepThreeSchema>;
export type StepFourData = z.infer<typeof stepFourSchema>;
