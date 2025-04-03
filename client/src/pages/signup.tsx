import { Link } from "wouter";
import MultiStepSignup from "@/components/auth/MultiStepSignup";
import { Search, Bot, Database } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Left side - Brand Info */}
      <div className="hidden md:flex md:w-1/3 lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-700 text-white flex-col justify-center items-center p-10 shadow-2xl">
        <div className="max-w-md mx-auto">
          <div className="text-3xl font-bold mb-6">AI-Powered CRM System</div>
          <p className="text-primary-100 mb-8">Generate real-time B2B leads, get enriched contact data, and send AI-powered personalized outreach messages in one place.</p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Search className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">Real-Time B2B Lead Search</h3>
                <p className="text-primary-100 text-sm">Find qualified leads based on industry, job title, and more.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Bot className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">AI-Powered Messaging</h3>
                <p className="text-primary-100 text-sm">Generate personalized outreach messages with AI assistance.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                <Database className="text-primary-200" size={18} />
              </div>
              <div>
                <h3 className="font-medium">Data Enrichment</h3>
                <p className="text-primary-100 text-sm">Get detailed contact information and company insights.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-sm text-primary-200">
            <p>Trusted by 1000+ businesses worldwide</p>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <MultiStepSignup />
        </div>
      </div>
    </div>
  );
}