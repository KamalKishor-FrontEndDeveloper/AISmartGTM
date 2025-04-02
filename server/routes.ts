import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./dbStorage";
import { 
  insertUserSchema, 
  stepOneSchema, 
  stepTwoSchema, 
  stepThreeSchema, 
  stepFourSchema,
  insertContactSchema,
  insertCompanySchema,
  InsertUser
} from "@shared/schema";
import { z } from "zod";
import { generateMessage, MessagePurpose, MessageTone } from "./services/gemini";

const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";
const MOCK_VERIFICATION_CODE = "123456"; // For demonstration purposes only

// JWT token authentication (simplified)
function generateToken(userId: number): string {
  return `token_${userId}_${Date.now()}`;
}

function verifyToken(token: string): number | null {
  // In a real implementation, this would validate a JWT
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'token') {
    return parseInt(parts[1], 10);
  }
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for authenticating requests
  const authenticateRequest = async (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    
    // Attach user to request for route handlers to use
    (req as any).user = user;
    next();
  };

  // AUTH ROUTES
  app.post("/api/auth/signup/step1", async (req, res) => {
    try {
      const validatedData = stepOneSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Store in session or return data
      return res.status(200).json({ 
        message: "Step 1 completed", 
        data: validatedData 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/signup/step2", async (req, res) => {
    try {
      const validatedData = stepTwoSchema.parse(req.body);
      
      // In a real app, you would store this in a session
      return res.status(200).json({ 
        message: "Step 2 completed", 
        data: validatedData 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/signup/step3", async (req, res) => {
    try {
      const validatedData = stepThreeSchema.parse(req.body);
      
      // In a real app, you would verify against a code sent via email
      // Here we just check against our mock code
      if (validatedData.verificationCode !== MOCK_VERIFICATION_CODE) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      return res.status(200).json({ 
        message: "Email verified successfully", 
        data: validatedData 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/signup/step4", async (req, res) => {
    try {
      const validatedData = stepFourSchema.parse(req.body);
      
      // In a real app, you would combine all steps from session
      // For this example, we need all data in the request
      if (!req.body.userData) {
        return res.status(400).json({ message: "Missing user data from previous steps" });
      }
      
      const userData: InsertUser = {
        fullName: req.body.userData.fullName,
        email: req.body.userData.email,
        password: req.body.userData.password,
        companyName: req.body.userData.companyName,
        industry: req.body.userData.industry,
        role: req.body.userData.role,
        credits: 100, // Default starting credits
        verified: true // Since we've verified in step 3
      };
      
      const user = await storage.createUser(userData);
      
      // Generate token
      const token = generateToken(user.id);
      
      return res.status(201).json({
        message: "Account created successfully",
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          credits: user.credits
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would verify the password hash
      // For this demo, we'll just check the raw value
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          credits: user.credits
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // USER ROUTES
  app.get("/api/user/profile", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    
    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        industry: user.industry,
        role: user.role,
        credits: user.credits
      }
    });
  });

  app.get("/api/user/credits", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const credits = await storage.getCreditBalance(user.id);
    
    return res.status(200).json({ credits });
  });

  app.get("/api/user/credit-transactions", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const transactions = await storage.getCreditTransactions(user.id);
    
    return res.status(200).json({ transactions });
  });

  // CONTACT ROUTES
  app.get("/api/contacts", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const contacts = await storage.getContactsByUser(user.id);
    
    return res.status(200).json({ contacts });
  });

  app.post("/api/contacts", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const contactData = { ...req.body, userId: user.id };
      
      const validatedData = insertContactSchema.parse(contactData);
      const contact = await storage.createContact(validatedData);
      
      return res.status(201).json({ contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/contacts/:id", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const contactId = parseInt(req.params.id);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    
    const contact = await storage.getContact(contactId);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    if (contact.userId !== user.id) {
      return res.status(403).json({ message: "Unauthorized: Contact belongs to another user" });
    }
    
    return res.status(200).json({ contact });
  });

  // COMPANY ROUTES
  app.get("/api/companies", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const companies = await storage.getCompaniesByUser(user.id);
    
    return res.status(200).json({ companies });
  });

  app.post("/api/companies", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const companyData = { ...req.body, userId: user.id };
      
      const validatedData = insertCompanySchema.parse(companyData);
      const company = await storage.createCompany(validatedData);
      
      return res.status(201).json({ company });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ENRICHMENT ROUTES
  app.post("/api/enrich/search", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { jobTitle, company, industry, location } = req.body;
      
      // Check if user has enough credits
      const searchCost = 5; // Credits per search
      const updatedCredits = await storage.useCredits(
        user.id, 
        searchCost, 
        "Contact search: " + (jobTitle || company || industry || location || "General search")
      );
      
      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      // Perform search
      const results = await storage.searchContacts(user.id, {
        jobTitle,
        company,
        industry,
        location
      });
      
      return res.status(200).json({ 
        results,
        creditsUsed: searchCost,
        creditsRemaining: updatedCredits
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/enrich/reveal-email", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId } = req.body;
      
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      
      // Check if user has enough credits
      const revealCost = 2; // Credits per email reveal
      const updatedCredits = await storage.useCredits(
        user.id, 
        revealCost, 
        "Email reveal for contact ID: " + contactId
      );
      
      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // In a real implementation, this would call an external service
      // For this demo, we'll generate a fake email
      const companyDomain = contact.companyId ? 
        (await storage.getCompany(contact.companyId))?.website?.split('https://')[1] || 'example.com' : 
        'example.com';
      
      const email = contact.email || 
        `${contact.fullName.toLowerCase().replace(/\s+/g, '.')}@${companyDomain}`;
      
      await storage.updateContact(contactId, { 
        email, 
        isEnriched: true 
      });
      
      return res.status(200).json({
        email,
        creditsUsed: revealCost,
        creditsRemaining: updatedCredits
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // AI WRITER ROUTES
  app.post("/api/ai-writer/generate", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId, purpose, tone, customPrompt } = req.body;
      
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      
      if (!Object.values(MessagePurpose).includes(purpose as MessagePurpose)) {
        return res.status(400).json({ message: "Invalid message purpose" });
      }
      
      if (!Object.values(MessageTone).includes(tone as MessageTone)) {
        return res.status(400).json({ message: "Invalid message tone" });
      }
      
      // Check if user has enough credits
      const generateCost = 3; // Credits per message generation
      const updatedCredits = await storage.useCredits(
        user.id, 
        generateCost, 
        "AI message generation for contact ID: " + contactId
      );
      
      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Get company information if contact is associated with a company
      let companyName = null;
      if (contact.companyId) {
        const company = await storage.getCompany(contact.companyId);
        companyName = company?.name || null;
      }
      
      // Generate AI message using Gemini
      const message = await generateMessage({
        contactFullName: contact.fullName,
        contactJobTitle: contact.jobTitle || undefined,
        contactCompanyName: companyName || undefined,
        userFullName: user.fullName,
        userCompanyName: user.companyName || undefined,
        userJobTitle: user.role || undefined,
        purpose: purpose as MessagePurpose,
        tone: tone as MessageTone,
        customPrompt: customPrompt
      });
      
      return res.status(200).json({
        message,
        creditsUsed: generateCost,
        creditsRemaining: updatedCredits
      });
    } catch (error) {
      console.error("Error generating AI message:", error);
      return res.status(500).json({ message: "Failed to generate message. Please try again." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
