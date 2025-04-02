import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure the generative AI
const apiKey = process.env.GEMINI_API_KEY as string;
console.log("Gemini API key available:", !!apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

export enum MessagePurpose {
  Introduction = 'introduction',
  FollowUp = 'followup',
  Proposal = 'proposal',
  Custom = 'custom'
}

export enum MessageTone {
  Professional = 'professional',
  Friendly = 'friendly',
  Casual = 'casual',
  Formal = 'formal',
  Persuasive = 'persuasive',
  Enthusiastic = 'enthusiastic'
}

export interface GenerateMessageParams {
  contactFullName: string;
  contactJobTitle?: string;
  contactCompanyName?: string;
  userFullName: string;
  userCompanyName?: string;
  userJobTitle?: string;
  purpose: MessagePurpose;
  tone: MessageTone;
  customPrompt?: string;
}

/**
 * Generates a message for a contact using Gemini AI
 */
export async function generateMessage(params: GenerateMessageParams): Promise<string> {
  // Access the generative model - use gemini-1.5-pro for latest version
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  // Craft the prompt based on purpose and tone
  let prompt = '';
  
  // Base prompt with context
  prompt = `You are an AI assistant helping a sales or business development professional write a personalized message to a potential contact. The message should be professionally written and tailored to the specific individual.
  
  Contact details:
  - Name: ${params.contactFullName}
  ${params.contactJobTitle ? `- Job title: ${params.contactJobTitle}` : ''}
  ${params.contactCompanyName ? `- Company: ${params.contactCompanyName}` : ''}
  
  Sender details:
  - Name: ${params.userFullName}
  ${params.userJobTitle ? `- Job title: ${params.userJobTitle}` : ''}
  ${params.userCompanyName ? `- Company: ${params.userCompanyName}` : ''}
  
  Purpose of message: ${params.purpose}
  Desired tone: ${params.tone}
  `;
  
  // Add specific instructions based on purpose
  switch (params.purpose) {
    case MessagePurpose.Introduction:
      prompt += `
      Write a concise introduction message (less than 200 words) that:
      - Introduces ${params.userFullName} to ${params.contactFullName}
      - Briefly mentions why they're reaching out
      - Includes a soft call to action for a response
      - Maintains a ${params.tone} tone
      - Doesn't sound generic or templated
      - Is written in first person as if from ${params.userFullName}
      `;
      break;
    case MessagePurpose.FollowUp:
      prompt += `
      Write a brief follow-up message (less than 200 words) that:
      - References a previous interaction 
      - Politely checks in with ${params.contactFullName}
      - Includes a clear but gentle next step
      - Maintains a ${params.tone} tone
      - Is written in first person as if from ${params.userFullName}
      `;
      break;
    case MessagePurpose.Proposal:
      prompt += `
      Write a proposal message (less than 300 words) that:
      - Addresses ${params.contactFullName} directly
      - Briefly outlines a business opportunity or collaboration
      - Highlights 1-2 key benefits specific to ${params.contactCompanyName || "the recipient's company"}
      - Includes a clear call to action
      - Maintains a ${params.tone} tone
      - Is written in first person as if from ${params.userFullName}
      `;
      break;
    case MessagePurpose.Custom:
      prompt += `
      Write a custom message following these instructions:
      ${params.customPrompt}
      
      The message should:
      - Be addressed to ${params.contactFullName}
      - Maintain a ${params.tone} tone throughout
      - Include a clear purpose and call to action
      - Be written in first person as if from ${params.userFullName}
      `;
      break;
  }
  
  // Add tone-specific instructions
  prompt += `\n\nAdditional tone guidance for ${params.tone} tone:`;
  
  switch (params.tone) {
    case MessageTone.Professional:
      prompt += `
      - Use clear, straightforward business language
      - Be courteous and respectful
      - Avoid overly casual expressions or slang
      - Maintain appropriate formality while being approachable
      `;
      break;
    case MessageTone.Friendly:
      prompt += `
      - Use warm, conversational language
      - Include a personal touch without being too informal
      - Be approachable while maintaining professionalism
      - Use positive and encouraging language
      `;
      break;
    case MessageTone.Casual:
      prompt += `
      - Use relaxed, conversational language
      - Include some personality but remain professional
      - Be approachable and relatable
      - Use contractions and simpler sentence structures
      `;
      break;
    case MessageTone.Formal:
      prompt += `
      - Use more traditional business language
      - Maintain higher level of formality throughout
      - Use complete sentences and proper grammar
      - Avoid contractions and colloquialisms
      `;
      break;
    case MessageTone.Persuasive:
      prompt += `
      - Use compelling language that emphasizes benefits
      - Include subtle urgency without being pushy
      - Focus on value propositions
      - Use confident, assertive language
      `;
      break;
    case MessageTone.Enthusiastic:
      prompt += `
      - Use energetic, positive language
      - Express genuine interest and excitement
      - Include some dynamic phrasing
      - Be upbeat while maintaining professionalism
      `;
      break;
  }
  
  prompt += `\n\nOutput just the message text, without any additional explanations or notes.`;
  
  try {
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error generating message with Gemini:', error);
    throw new Error('Failed to generate message. Please try again later.');
  }
}