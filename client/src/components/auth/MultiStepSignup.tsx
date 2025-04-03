import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function MultiStepSignup() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    industry: "",
    role: "",
    verificationCode: "",
    preferences: [] as string[]
  });
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const handleStepOneSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/signup/step1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Step 1 validation failed");
      }
      
      setUserData(prev => ({ ...prev, ...data }));
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepTwoSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/signup/step2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Step 2 validation failed");
      }
      
      setUserData(prev => ({ ...prev, ...data }));
      setStep(3);
      
      // In a real implementation, this would trigger sending a verification code
      toast({
        title: "Verification code sent",
        description: "Use code 123456 to verify your email for this demo",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepThreeSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/signup/step3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid verification code");
      }
      
      setUserData(prev => ({ ...prev, ...data }));
      setStep(4);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepFourSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Combine all data and register
      const fullUserData = {
        ...userData,
        ...data,
        userData: {
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
          companyName: userData.companyName,
          industry: userData.industry,
          role: userData.role
        }
      };
      
      const success = await register(fullUserData);
      
      if (success) {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOne onSubmit={handleStepOneSubmit} defaultValues={userData} isSubmitting={isSubmitting} />;
      case 2:
        return <StepTwo onSubmit={handleStepTwoSubmit} defaultValues={userData} isSubmitting={isSubmitting} />;
      case 3:
        return <StepThree onSubmit={handleStepThreeSubmit} defaultValues={userData} isSubmitting={isSubmitting} />;
      case 4:
        return <StepFour onSubmit={handleStepFourSubmit} defaultValues={userData} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Create Account</h2>
        <Link href="/login" className="text-primary-500 text-sm hover:text-primary-600">
          Already have an account?
        </Link>
      </div>
      
      {/* Progress Indicator */}
      <div className="flex justify-between mb-8 relative px-4">
        <div className="absolute top-4 left-8 right-8 h-[2px] bg-neutral-200 -z-10">
          <div 
            className="h-full bg-primary-500 transition-all duration-300" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex flex-col items-center relative" style={{ width: '80px' }}>
            <div 
              className={`w-8 h-8 rounded-full shadow-lg transition-all duration-300 ${
                stepNumber === step 
                  ? "bg-primary-500 text-white scale-110" 
                  : stepNumber < step 
                    ? "bg-primary-500 text-white"
                    : "bg-white text-neutral-600 border-2 border-neutral-200"
              } flex items-center justify-center absolute left-1/2 -translate-x-1/2`}
            >
              {stepNumber < step ? "✓" : stepNumber}
            </div>
            <span 
              className={`text-xs mt-12 text-center ${
                stepNumber <= step ? "text-primary-500 font-medium" : "text-neutral-600"
              }`}
            >
              {stepNumber === 1 ? "Account" : 
               stepNumber === 2 ? "Company" : 
               stepNumber === 3 ? "Verify" : "Setup"}
            </span>
          </div>
        ))}
        <div className="flex-1 h-1 bg-neutral-200 self-center mx-2 relative">
          <div 
            className="absolute inset-0 bg-primary-500" 
            style={{ width: `${(step - 1) * 33.33}%` }}
          ></div>
        </div>
        {[2, 3].map((lineNumber) => (
          <div key={`line-${lineNumber}`} className="flex-1 h-1 bg-neutral-200 self-center mx-2 relative">
            <div 
              className="absolute inset-0 bg-primary-500" 
              style={{ width: step > lineNumber ? "100%" : step === lineNumber ? "50%" : "0%" }}
            ></div>
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
