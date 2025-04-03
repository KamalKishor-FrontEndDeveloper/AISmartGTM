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
  InsertUser,
} from "@shared/schema";
import { z } from "zod";
import {
  generateMessage,
  MessagePurpose,
  MessageTone,
} from "./services/gemini";
import {
  testSalesforceConnection,
  importContactsFromSalesforce,
  importCompaniesFromSalesforce,
  exportContactsToSalesforce,
  exportCompaniesToSalesforce,
} from "./services/crm/salesforce";
import {
  testHubspotConnection,
  importContactsFromHubspot,
  importCompaniesFromHubspot,
  exportContactsToHubspot,
  exportCompaniesToHubspot,
} from "./services/crm/hubspot";
import { CRMType, CRMConnectionStatus } from "./services/crm/index";

const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";
const MOCK_VERIFICATION_CODE = "123456"; // For demonstration purposes only

// JWT token authentication (simplified)
function generateToken(userId: number): string {
  return `token_${userId}_${Date.now()}`;
}

function verifyToken(token: string): number | null {
  // In a real implementation, this would validate a JWT
  const parts = token.split("_");
  if (parts.length >= 2 && parts[0] === "token") {
    return parseInt(parts[1], 10);
  }
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for authenticating requests
  const authenticateRequest = async (
    req: Request,
    res: Response,
    next: Function,
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
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
      if (!req.body) {
        return res.status(400).json({ message: "Request body is required" });
      }

      const validatedData = stepOneSchema.parse(req.body);

      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Store in session or return data
      return res.status(200).json({
        message: "Step 1 completed",
        data: validatedData,
      });
    } catch (error) {
      console.error("Signup Step 1 Error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        message: "An error occurred during signup. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/auth/signup/step2", async (req, res) => {
    try {
      const validatedData = stepTwoSchema.parse(req.body);

      // In a real app, you would store this in a session
      return res.status(200).json({
        message: "Step 2 completed",
        data: validatedData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
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
        data: validatedData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
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
        return res
          .status(400)
          .json({ message: "Missing user data from previous steps" });
      }

      const userData: InsertUser = {
        fullName: req.body.userData.fullName,
        email: req.body.userData.email,
        password: req.body.userData.password,
        companyName: req.body.userData.companyName,
        industry: req.body.userData.industry,
        role: req.body.userData.role,
        credits: 100, // Default starting credits
        verified: true, // Since we've verified in step 3
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
          credits: user.credits,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Special route for creating a demo account
  app.post("/api/auth/signup/demo", async (req, res) => {
    try {
      const { fullName, email, password, companyName, industry, role } =
        req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("Demo user already exists");

        // Generate token
        const token = generateToken(existingUser.id);

        return res.status(200).json({
          message: "Demo account already exists",
          token,
          user: {
            id: existingUser.id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            credits: existingUser.credits,
          },
        });
      }

      // Create the demo user
      const userData: InsertUser = {
        fullName: fullName || "Demo User",
        email: email || "demo@example.com",
        password: password || "password123",
        companyName: companyName || "Demo Corp",
        industry: industry || "Technology",
        role: role || "Sales Manager",
        credits: 125,
        verified: true,
      };

      console.log("Creating demo user:", userData.email);

      const user = await storage.createUser(userData);

      // Generate token
      const token = generateToken(user.id);

      return res.status(201).json({
        message: "Demo account created successfully",
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          credits: user.credits,
        },
      });
    } catch (error) {
      console.error("Error creating demo account:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log("Login attempt for:", email);

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      console.log("User found:", !!user);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Password check:", password);

      // Allow hardcoded demo login
      if (email === "demo@example.com" && password === "password123") {
        console.log("Demo login successful");
        // Continue to token generation below
      } else {
        console.log("Non-demo login attempt - checking password");
        // Regular login path
        if (user.password !== password) {
          console.log("Password mismatch");
          return res.status(401).json({ message: "Invalid credentials" });
        }
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
          credits: user.credits,
        },
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
        credits: user.credits,
      },
    });
  });

  app.get("/api/user/credits", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const credits = await storage.getCreditBalance(user.id);

    return res.status(200).json({ credits });
  });

  app.get(
    "/api/user/credit-transactions",
    authenticateRequest,
    async (req, res) => {
      const user = (req as any).user;
      const transactions = await storage.getCreditTransactions(user.id);

      return res.status(200).json({ transactions });
    },
  );

  // CONTACT ROUTES
  app.get("/api/contacts", authenticateRequest, async (req, res) => {
    const user = (req as any).user;
    const contacts = await storage.getContactsByUser(user.id);

    return res.status(200).json({ contacts });
  });

  app.post("/api/contacts", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      // If companyName is provided but no companyId, ensure it's saved
      const contactData = {
        ...req.body,
        userId: user.id,
        companyName:
          req.body.companyName ||
          (req.body.companyId ? undefined : req.body.company),
      };

      const validatedData = insertContactSchema.parse(contactData);
      const contact = await storage.createContact(validatedData);

      return res.status(201).json({ contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
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
      return res
        .status(403)
        .json({ message: "Unauthorized: Contact belongs to another user" });
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
          errors: error.errors,
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
        "Contact search: " +
          (jobTitle || company || industry || location || "General search"),
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Perform search
      const results = await storage.searchContacts(user.id, {
        jobTitle,
        company,
        industry,
        location,
      });

      return res.status(200).json({
        results,
        creditsUsed: searchCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post(
    "/api/enrich/reveal-email",
    authenticateRequest,
    async (req, res) => {
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
          "Email reveal for contact ID: " + contactId,
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
        const companyDomain = contact.companyId
          ? (await storage.getCompany(contact.companyId))?.website?.split(
              "https://",
            )[1] || "example.com"
          : "example.com";

        const email =
          contact.email ||
          `${contact.fullName.toLowerCase().replace(/\s+/g, ".")}@${companyDomain}`;

        await storage.updateContact(contactId, {
          email,
          isEnriched: true,
        });

        return res.status(200).json({
          email,
          creditsUsed: revealCost,
          creditsRemaining: updatedCredits,
        });
      } catch (error) {
        return res.status(500).json({ message: "Server error" });
      }
    },
  );

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
        "AI message generation for contact ID: " + contactId,
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
        customPrompt: customPrompt,
      });

      return res.status(200).json({
        message,
        creditsUsed: generateCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error generating AI message:", error);
      return res
        .status(500)
        .json({ message: "Failed to generate message. Please try again." });
    }
  });

  // Send AI message via email
  app.post(
    "/api/ai-writer/send-email",
    authenticateRequest,
    async (req, res) => {
      try {
        const user = (req as any).user;
        const { contactId, message, subject } = req.body;

        if (!contactId || !message) {
          return res
            .status(400)
            .json({ message: "Contact ID and message are required" });
        }

        const contact = await storage.getContact(contactId);
        if (!contact) {
          return res.status(404).json({ message: "Contact not found" });
        }

        if (!contact.email) {
          return res
            .status(400)
            .json({ message: "Contact has no email address" });
        }

        // In a production environment, this would actually send the email
        // For this demo, we'll just simulate it and update the contact record

        // Mark message as sent
        await storage.updateContact(contactId, {
          messageSent: true,
          messageSentDate: new Date(),
          lastContacted: new Date(),
        });

        return res.status(200).json({
          success: true,
          message: `Email sent to ${contact.fullName} at ${contact.email}`,
          contact: await storage.getContact(contactId),
        });
      } catch (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ message: "Failed to send email. Please try again." });
      }
    },
  );

  // Direct message generation for LinkedIn or other platforms
  app.post("/api/message/generate", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const {
        contactFullName,
        contactJobTitle,
        contactCompanyName,
        userFullName,
        userJobTitle,
        userCompanyName,
        purpose,
        tone,
      } = req.body;

      if (!contactFullName || !userFullName) {
        return res
          .status(400)
          .json({ message: "Contact name and user name are required" });
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
        "AI message generation for LinkedIn",
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Generate message
      const message = await generateMessage({
        contactFullName,
        contactJobTitle,
        contactCompanyName,
        userFullName,
        userCompanyName,
        userJobTitle,
        purpose: purpose as MessagePurpose,
        tone: tone as MessageTone,
      });

      return res.status(200).json({
        message,
        creditsUsed: generateCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error generating message:", error);
      return res
        .status(500)
        .json({ message: "Failed to generate message. Please try again." });
    }
  });

  // Send LinkedIn connection request
  app.post("/api/linkedin/connect", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId, message } = req.body;

      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!contact.linkedInUrl) {
        return res
          .status(400)
          .json({ message: "Contact has no LinkedIn profile URL" });
      }

      // In a production environment, this would use LinkedIn API
      // For this demo, we'll just simulate it and update the contact record

      // Mark connection request as sent
      await storage.updateContact(contactId, {
        connectionSent: true,
        connectionSentDate: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: `Connection request sent to ${contact.fullName} on LinkedIn`,
        contact: await storage.getContact(contactId),
      });
    } catch (error) {
      console.error("Error sending LinkedIn connection request:", error);
      return res.status(500).json({
        message: "Failed to send connection request. Please try again.",
      });
    }
  });

  // Send Email
  app.post("/api/email/send", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId, subject, message } = req.body;

      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      if (!subject || !message) {
        return res
          .status(400)
          .json({ message: "Email subject and message are required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!contact.email) {
        return res
          .status(400)
          .json({ message: "Contact has no email address" });
      }

      // Check if user has enough credits
      const emailCost = 3; // Credits per email sent
      const userCredits = await storage.getCreditBalance(user.id);

      if (userCredits < emailCost) {
        return res.status(400).json({
          message: "Insufficient credits",
          required: emailCost,
          available: userCredits,
        });
      }

      // Import the email service
      const { sendContactEmail } = await import("./services/email");

      // Send the email
      const emailResult = await sendContactEmail(user, {
        contact,
        subject,
        message,
      });

      if (!emailResult) {
        return res.status(500).json({
          message: "Failed to send email. Please check SMTP settings.",
        });
      }

      // Use credits
      const newBalance = await storage.useCredits(
        user.id,
        emailCost,
        `Email sent to ${contact.fullName} (${contact.email})`,
      );

      if (newBalance === null) {
        return res.status(400).json({ message: "Failed to process credits" });
      }

      // Update contact with the interaction
      await storage.updateContact(contactId, {
        emailSent: true,
        lastInteractionDate: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: `Email sent to ${contact.fullName} at ${contact.email}`,
        newCreditBalance: newBalance,
        contact: await storage.getContact(contactId),
      });
    } catch (error) {
      console.error("Error sending email to contact:", error);
      return res.status(500).json({
        message: "Failed to send email",
        error: (error as Error).message,
      });
    }
  });

  // Enrich a single contact
  app.post("/api/contact/enrich", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId, options } = req.body;

      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Calculate enrichment cost based on selected options
      const enrichCost =
        options?.reduce((total: number, option: string) => {
          const costs: Record<string, number> = {
            email: 2,
            phone: 3,
            social: 1,
            company: 4,
          };
          return total + (costs[option] || 0);
        }, 0) || 5;

      // Check if user has enough credits
      const updatedCredits = await storage.useCredits(
        user.id,
        enrichCost,
        `Contact enrichment for ${contact.fullName}`,
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // In a production environment, this would call an enrichment API
      // For this demo, we'll just simulate it with sample data

      const enrichedData = {
        email:
          contact.email ||
          `${contact.fullName.toLowerCase().replace(/\s/g, ".")}@${contact.companyName?.toLowerCase().replace(/\s/g, "")}.com`,
        phone: contact.phone || "+1 (555) 123-4567",
        linkedInUrl:
          contact.linkedInUrl ||
          `https://linkedin.com/in/${contact.fullName.toLowerCase().replace(/\s/g, "-")}`,
        isEnriched: true,
        emailVerified: true,
        enrichmentSource: "AI-CRM",
        enrichmentDate: new Date(),
      };

      // Update the contact with enriched data
      const updatedContact = await storage.updateContact(
        contactId,
        enrichedData,
      );

      return res.status(200).json({
        success: true,
        message: `Contact data for ${contact.fullName} has been enriched`,
        contact: updatedContact,
        creditsUsed: enrichCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error enriching contact:", error);
      return res
        .status(500)
        .json({ message: "Failed to enrich contact. Please try again." });
    }
  });

  // Email verification function
  async function verifyEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        "https://app.icypeas.com/api/email-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${process.env.ICYPEAS_API_KEY}`,
          },
          body: JSON.stringify({
            email,
            customobject: {
              webhookUrl: process.env.WEBHOOK_URL,
              externalId: Date.now().toString(),
            },
          }),
        },
      );

      const data = await response.json();
      return data.isValid || false;
    } catch (error) {
      console.error("Error verifying email:", error);
      return false;
    }
  }

  // Email finder endpoint
  app.post("/api/email/find", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { firstName, lastName, domainOrCompany } = req.body;

      // Check if user has enough credits
      const findCost = 1;
      const updatedCredits = await storage.useCredits(
        user.id,
        findCost,
        `Email finder for ${firstName} ${lastName}`,
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      const icypeasKey = process.env.ICYPEAS_API_KEY;
      if (!icypeasKey) {
        throw new Error("ICYPEAS_API_KEY is not configured");
      }

      let resultData = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts && !resultData) {
        const response = await fetch(
          "https://app.icypeas.com/api/email-search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${icypeasKey}`,
            },
            body: JSON.stringify({
              firstname: firstName,
              lastname: lastName,
              domain: domainOrCompany,
              customObject: {
                externalId: `${firstName}-${lastName}-${Date.now()}`,
              },
            }),
          },
        );

        const data = await response.json();

        if (data.success && data.item && data.item.email) {
          resultData = data.item;
          return res.status(200).json({
            email: resultData.email,
            creditsUsed: findCost,
            creditsRemaining: updatedCredits,
          });
        } else if (data.success && data.item && data.item.status === "NONE") {
          // Handle the case where the email is not yet found
          console.log("Email not found yet, retrying...");
        } else if (!data.success) {
          console.error("IcyPeas API error:", data.message || data);
          return res.status(500).json({
            message:
              "Failed to find email: " + (data.message || "Unknown error"),
          });
        } else {
          console.error("Unexpected IcyPeas API response:", data);
          return res
            .status(500)
            .json({ message: "Failed to find email: Unexpected API response" });
        }

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
        attempts++;
      }

      return res.status(404).json({
        message: "Email not found",
        creditsUsed: findCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error finding email:", error);
      return res.status(500).json({ message: "Failed to find email" });
    }
  });

  // Email verification endpoint
  app.post("/api/verify-email", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Credit cost for email verification
      const verifyCost = 1;
      const updatedCredits = await storage.useCredits(
        user.id,
        verifyCost,
        `Email verification for ${email}`,
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      const isValid = await verifyEmail(email);

      return res.status(200).json({
        success: true,
        isValid,
        creditsUsed: verifyCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // NEW ROUTE
  app.post("/api/enrich/contact", authenticateRequest, async (req, res) => {
    try {
      const user = (req as any).user;
      const { contactId, options } = req.body;

      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Calculate enrichment cost based on selected options
      const enrichCost =
        options?.reduce((total: number, option: string) => {
          const costs: Record<string, number> = {
            email: 2,
            phone: 3,
            social: 1,
            company: 4,
          };
          return total + (costs[option] || 0);
        }, 0) || 5;

      // Check if user has enough credits
      const updatedCredits = await storage.useCredits(
        user.id,
        enrichCost,
        `Contact enrichment for ${contact.fullName}`,
      );

      if (updatedCredits === null) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // In a production environment, this would call an enrichment API
      // For this demo, we'll just simulate it with sample data

      const enrichedData = {
        email:
          contact.email ||
          `${contact.fullName.toLowerCase().replace(/\s/g, ".")}@${contact.companyName?.toLowerCase().replace(/\s/g, "")}.com`,
        phone: contact.phone || "+1 (555) 123-4567",
        linkedInUrl:
          contact.linkedInUrl ||
          `https://linkedin.com/in/${contact.fullName.toLowerCase().replace(/\s/g, "-")}`,
        isEnriched: true,
        emailVerified: true,
        enrichmentSource: "AI-CRM",
        enrichmentDate: new Date(),
      };

      // Update the contact with enriched data
      const updatedContact = await storage.updateContact(
        contactId,
        enrichedData,
      );

      return res.status(200).json({
        success: true,
        message: `Contact data for ${contact.fullName} has been enriched`,
        contact: updatedContact,
        creditsUsed: enrichCost,
        creditsRemaining: updatedCredits,
      });
    } catch (error) {
      console.error("Error enriching contact:", error);
      return res
        .status(500)
        .json({ message: "Failed to enrich contact. Please try again." });
    }
  });

  // CRM INTEGRATION ROUTES
  // Connection status routes
  app.get(
    "/api/crm/connection/status",
    authenticateRequest,
    async (req, res) => {
      try {
        // Check status of both CRM systems
        const [salesforceStatus, hubspotStatus] = await Promise.all([
          testSalesforceConnection().catch((err) => ({
            success: false,
            message: `Salesforce connection error: ${err.message || "Unknown error"}`,
          })),
          testHubspotConnection().catch((err) => ({
            success: false,
            message: `HubSpot connection error: ${err.message || "Unknown error"}`,
          })),
        ]);

        const connections: CRMConnectionStatus[] = [
          {
            type: CRMType.Salesforce,
            connected: salesforceStatus.success,
            message: salesforceStatus.message,
          },
          {
            type: CRMType.HubSpot,
            connected: hubspotStatus.success,
            message: hubspotStatus.message,
          },
        ];

        return res.status(200).json({ connections });
      } catch (error) {
        console.error("Error checking CRM connections:", error);
        return resstatus(500).json({
          message: "Failed to check CRM connections",
        });
      }
    },
  );

  // Import contacts routes
  app.post(
    "/api/crm/import/contacts",
    authenticateRequest,
    async (req, res) => {
      try {
        const user = (req as any).user;
        const { source } = req.body;

        if (!source || !Object.values(CRMType).includes(source)) {
          return res
            .status(400)
            .json({ message: "Valid CRM source is required" });
        }

        // Check if user has enough credits
        const importCost = 10; // Credits per import operation
        const updatedCredits = await storage.useCredits(
          user.id,
          importCost,
          `Import contacts from ${source}`,
        );

        if (updatedCredits === null) {
          return res.status(400).json({ message: "Insufficient credits" });
        }

        let importedContacts = [];

        if (source === CRMType.Salesforce) {
          const sfContacts = await importContactsFromSalesforce();

          // Save contacts to database
          for (const contact of sfContacts) {
            await storage.createContact({
              ...contact,
              userId: user.id,
              tags: ["Salesforce Import"],
            });
          }

          importedContacts = sfContacts;
        } else if (source === CRMType.HubSpot) {
          const hsContacts = await importContactsFromHubspot();

          // Save contacts to database
          for (const contact of hsContacts) {
            await storage.createContact({
              ...contact,
              userId: user.id,
              tags: ["HubSpot Import"],
            });
          }

          importedContacts = hsContacts;
        }

        return res.status(200).json({
          message: `Successfully imported ${importedContacts.length} contacts from ${source}`,
          count: importedContacts.length,
          creditsUsed: importCost,
          creditsRemaining: updatedCredits,
        });
      } catch (error) {
        console.error("Error importing contacts:", error);
        return res.status(500).json({ message: "Failed to import contacts" });
      }
    },
  );

  // Import companies routes
  app.post(
    "/api/crm/import/companies",
    authenticateRequest,
    async (req, res) => {
      try {
        const user = (req as any).user;
        const { source } = req.body;

        if (!source || !Object.values(CRMType).includes(source)) {
          return res
            .status(400)
            .json({ message: "Valid CRM source is required" });
        }

        // Check if user has enough credits
        const importCost = 10; // Credits per import operation
        const updatedCredits = await storage.useCredits(
          user.id,
          importCost,
          `Import companies from ${source}`,
        );

        if (updatedCredits === null) {
          return res.status(400).json({ message: "Insufficient credits" });
        }

        let importedCompanies = [];

        if (source === CRMType.Salesforce) {
          const sfCompanies = await importCompaniesFromSalesforce();

          // Save companies to database
          for (const company of sfCompanies) {
            await storage.createCompany({
              ...company,
              userId: user.id,
            });
          }

          importedCompanies = sfCompanies;
        } else if (source === CRMType.HubSpot) {
          const hsCompanies = await importCompaniesFromHubspot();

          // Save companies to database
          for (const company of hsCompanies) {
            await storage.createCompany({
              ...company,
              userId: user.id,
            });
          }

          importedCompanies = hsCompanies;
        }

        return res.status(200).json({
          message: `Successfully imported ${importedCompanies.length} companies from ${source}`,
          count: importedCompanies.length,
          creditsUsed: importCost,
          creditsRemaining: updatedCredits,
        });
      } catch (error) {
        console.error("Error importing companies:", error);
        return res.status(500).json({ message: "Failed to import companies" });
      }
    },
  );

  // Export contacts routes
  app.post(
    "/api/crm/export/contacts",
    authenticateRequest,
    async (req, res) => {
      try {
        const user = (req as any).user;
        const { destination, contactIds } = req.body;

        if (!destination || !Object.values(CRMType).includes(destination)) {
          return res
            .status(400)
            .json({ message: "Valid CRM destination is required" });
        }

        if (
          !contactIds ||
          !Array.isArray(contactIds) ||
          contactIds.length === 0
        ) {
          return res
            .status(400)
            .json({ message: "At least one contact ID is required" });
        }

        // Check if user has enough credits
        const exportCost = 5; // Credits per export operation
        const updatedCredits = await storage.useCredits(
          user.id,
          exportCost,
          `Export contacts to ${destination}`,
        );

        if (updatedCredits === null) {
          return res.status(400).json({ message: "Insufficient credits" });
        }

        // Get contacts to export
        const contacts = [];
        for (const id of contactIds) {
          const contact = await storage.getContact(id);
          if (contact && contact.userId === user.id) {
            contacts.push(contact);
          }
        }

        if (contacts.length === 0) {
          return res
            .status(400)
            .json({ message: "No valid contacts found to export" });
        }

        let exportResult;

        if (destination === CRMType.Salesforce) {
          exportResult = await exportContactsToSalesforce(contacts);

          // Update contacts with Salesforce IDs
          if (exportResult.success) {
            for (let i = 0; i < contacts.length; i++) {
              if (exportResult.results[i] && exportResult.results[i].success) {
                await storage.updateContact(contacts[i].id, {
                  salesforceId: exportResult.results[i].id,
                  crmSource: "salesforce",
                  crmLastSynced: new Date(),
                });
              }
            }
          }
        } else if (destination === CRMType.HubSpot) {
          exportResult = await exportContactsToHubspot(contacts);

          // Update contacts with HubSpot IDs
          if (exportResult.success) {
            for (let i = 0; i < contacts.length; i++) {
              if (exportResult.results[i] && exportResult.results[i].success) {
                await storage.updateContact(contacts[i].id, {
                  hubspotId: exportResult.results[i].result.vid.toString(),
                  crmSource: "hubspot",
                  crmLastSynced: new Date(),
                });
              }
            }
          }
        }

        return res.status(200).json({
          success: exportResult?.success || false,
          message: exportResult?.success
            ? `Successfully exported ${contacts.length} contacts to ${destination}`
            : `Failed to export some or all contacts to ${destination}`,
          results: exportResult?.results,
          creditsUsed: exportCost,
          creditsRemaining: updatedCredits,
        });
      } catch (error) {
        console.error("Error exporting contacts:", error);
        return res.status(500).json({ message: "Failed to export contacts" });
      }
    },
  );

  // Export companies routes
  app.post(
    "/api/crm/export/companies",
    authenticateRequest,
    async (req, res) => {
      try {
        const user = (req as any).user;
        const { destination, companyIds } = req.body;

        if (!destination || !Object.values(CRMType).includes(destination)) {
          return res
            .status(400)
            .json({ message: "Valid CRM destination is required" });
        }

        if (
          !companyIds ||
          !Array.isArray(companyIds) ||
          companyIds.length === 0
        ) {
          return res
            .status(400)
            .json({ message: "At least one company ID is required" });
        }

        // Check if user has enough credits
        const exportCost = 5; // Credits per export operation
        const updatedCredits = await storage.useCredits(
          user.id,
          exportCost,
          `Export companies to ${destination}`,
        );

        if (updatedCredits === null) {
          return res.status(400).json({ message: "Insufficient credits" });
        }

        // Get companies to export
        const companies = [];
        for (const id of companyIds) {
          const company = await storage.getCompany(id);
          if (company && company.userId === user.id) {
            companies.push(company);
          }
        }

        if (companies.length === 0) {
          return res
            .status(400)
            .json({ message: "No valid companies found to export" });
        }

        let exportResult;

        if (destination === CRMType.Salesforce) {
          exportResult = await exportCompaniesToSalesforce(companies);

          // Update companies with Salesforce IDs
          if (exportResult.success) {
            for (let i = 0; i < companies.length; i++) {
              if (exportResult.results[i] && exportResult.results[i].success) {
                await storage.updateCompany(companies[i].id, {
                  salesforceId: exportResult.results[i].id,
                  crmSource: "salesforce",
                  crmLastSynced: new Date(),
                });
              }
            }
          }
        } else if (destination === CRMType.HubSpot) {
          exportResult = await exportCompaniesToHubspot(companies);

          // Update companies with HubSpot IDs
          if (exportResult.success) {
            for (let i = 0; i < companies.length; i++) {
              if (exportResult.results[i] && exportResult.results[i].success) {
                await storage.updateCompany(companies[i].id, {
                  hubspotId:
                    exportResult.results[i].result.companyId.toString(),
                  crmSource: "hubspot",
                  crmLastSynced: new Date(),
                });
              }
            }
          }
        }

        return res.status(200).json({
          success: exportResult?.success || false,
          message: exportResult?.success
            ? `Successfully exported ${companies.length} companies to ${destination}`
            : `Failed to export some or all companies to ${destination}`,
          results: exportResult?.results,
          creditsUsed: exportCost,
          creditsRemaining: updatedCredits,
        });
      } catch (error) {
        console.error("Error exporting companies:", error);
        return res.status(500).json({ message: "Failed to export companies" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
