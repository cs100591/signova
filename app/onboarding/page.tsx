"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, FileText, Languages, ChevronRight } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { OnboardingLocation, OnboardingContracts, OnboardingLanguage, OnboardingComplete } from "@/components/illustrations";

const jurisdictions = [
  { region: "Southeast Asia", countries: ["Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines", "Vietnam", "Brunei", "Myanmar", "Cambodia", "Laos"] },
  { region: "East Asia", countries: ["China", "Japan", "South Korea", "Taiwan", "Hong Kong"] },
  { region: "Americas", countries: ["United States", "Canada", "Brazil", "Mexico", "Argentina", "Chile", "Colombia"] },
  { region: "Europe", countries: ["United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy", "Switzerland", "Sweden", "Norway", "Denmark"] },
  { region: "Oceania", countries: ["Australia", "New Zealand"] },
  { region: "Others", countries: ["India", "UAE", "Saudi Arabia", "South Africa", "Nigeria", "Other"] },
];

const ContractTypeIcon = ({ id }: { id: string }) => {
  switch (id) {
    case "employment":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="9" r="5.5" stroke="#1a1714" strokeWidth="1.8"/>
          <path d="M12 14 L16 18 L20 14" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M16 17 L14.5 22 L16 24 L17.5 22 Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
          <path d="M8 30 Q8 23 16 23 Q24 23 24 30" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </svg>
      );
    case "freelance":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M4 13 L4 26 Q4 28 6 28 L26 28 Q28 28 28 26 L28 13 Q28 11 26 11 L6 11 Q4 11 4 13Z" stroke="#1a1714" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
          <path d="M11 11 L11 8 Q11 5 16 5 Q21 5 21 8 L21 11" stroke="#1a1714" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
          <path d="M4 18 L28 18" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 22 L12 25" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="12" cy="21" r="2" stroke="#1a1714" strokeWidth="1.3" fill="none"/>
          <path d="M17 21 L17 25" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M15 21 L19 21" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="23" cy="23" r="2.5" stroke="#1a1714" strokeWidth="1.3" fill="none"/>
          <circle cx="23" cy="23" r="1" fill="#1a1714"/>
          <path d="M23 19.5 L23 18.5" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M23 26.5 L23 27.5" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M19.5 23 L18.5 23" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M26.5 23 L27.5 23" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "business":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M3 17 Q3 14 6 13 L12 11 L14 14 L16 12 L18 14 L20 11 L26 13 Q29 14 29 17 L26 23 Q23 27 20 25 L16 23 L12 25 Q9 27 6 23 Z" stroke="#1a1714" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
          <path d="M14 14 L18 14" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17 L1 21" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
          <path d="M29 17 L31 21" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "nda":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L27 7 L27 17 Q27 25 16 30 Q5 25 5 17 L5 7 Z" stroke="#1a1714" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
          <path d="M12 16 L12 21 L20 21 L20 16 Q20 12 16 12 Q12 12 12 16 Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          <path d="M13.5 16 L13.5 14 Q13.5 11 16 11 Q18.5 11 18.5 14 L18.5 16" stroke="#1a1714" strokeWidth="1.4" fill="none"/>
          <circle cx="16" cy="18.5" r="1.3" fill="#1a1714"/>
        </svg>
      );
    case "lease":
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M4 28 L4 14 L16 4 L28 14 L28 28 Z" stroke="#1a1714" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
          <path d="M2 15 L16 3 L30 15" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M12 28 L12 20 Q12 18 14.5 18 L17.5 18 Q20 18 20 20 L20 28" stroke="#1a1714" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
          <circle cx="18.5" cy="24" r="1.2" fill="#1a1714"/>
          <rect x="7" y="17" width="6" height="5" rx="1.5" stroke="#1a1714" strokeWidth="1.3" fill="none"/>
          <path d="M10 17 L10 22" stroke="#1a1714" strokeWidth="0.8" opacity="0.5"/>
          <path d="M7 19.5 L13 19.5" stroke="#1a1714" strokeWidth="0.8" opacity="0.5"/>
        </svg>
      );
    case "other":
    default:
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27 Z" stroke="#1a1714" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
          <path d="M20 5 L20 11 L26 11" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
          <circle cx="11" cy="19" r="1.5" fill="#1a1714"/>
          <circle cx="16" cy="19" r="1.5" fill="#1a1714"/>
          <circle cx="21" cy="19" r="1.5" fill="#1a1714"/>
          <path d="M10 14 L22 14" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
  }
};

const contractTypes = [
  { id: "employment", label: "Employment contracts" },
  { id: "freelance", label: "Freelance / Contractor agreements" },
  { id: "business", label: "Business / Vendor agreements" },
  { id: "nda", label: "NDA / Confidentiality" },
  { id: "lease", label: "Lease / Rental" },
  { id: "other", label: "Other" },
];

const languages = [
  { code: "EN", label: "English", flag: "🇺🇸" },
  { code: "ZH", label: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ZH_TW", label: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "MS", label: "Bahasa Malaysia", flag: "🇲🇾" },
  { code: "ID", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "TH", label: "Thai", flag: "🇹🇭" },
  { code: "JA", label: "Japanese", flag: "🇯🇵" },
  { code: "KO", label: "Korean", flag: "🇰🇷" },
  { code: "ES", label: "Spanish", flag: "🇪🇸" },
  { code: "FR", label: "French", flag: "🇫🇷" },
  { code: "DE", label: "German", flag: "🇩🇪" },
  { code: "OTHER", label: "Other", flag: "🌍" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    country: "",
    contractTypes: [] as string[],
    language: "EN",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };
    checkUser();
  }, [router]);

  const handleCountrySelect = (country: string) => {
    setFormData({ ...formData, country });
  };

  const handleContractTypeToggle = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      contractTypes: prev.contractTypes.includes(typeId)
        ? prev.contractTypes.filter(t => t !== typeId)
        : [...prev.contractTypes, typeId]
    }));
  };

  const handleLanguageSelect = (langCode: string) => {
    setFormData({ ...formData, language: langCode });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user) {
        router.push('/login');
        return;
      }

      // Use upsert to insert or update profile
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          country: formData.country,
          contract_types: formData.contractTypes,
          preferred_language: formData.language,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Profile was not saved properly');
      }

      console.log('Profile saved successfully:', data);

      // Redirect to contracts page
      router.push('/contracts');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.country;
      case 2:
        return formData.contractTypes.length > 0;
      case 3:
        return !!formData.language;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Welcome to Signova</h1>
              <p className="text-sm text-gray-400">Let&apos;s personalize your experience</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-[#F59E0B] text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
>
                  {currentStep > step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && <div className="w-8 h-0.5 bg-gray-700" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Step 1: Country */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <OnboardingLocation width={80} height={80} className="flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Where are you located?</h2>
                  <p className="text-sm text-[#6B7280]">This helps us tailor legal insights to your jurisdiction</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {jurisdictions.map((group) => (
                  <div key={group.region}>
                    <h3 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">
                      {group.region}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {group.countries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className={`px-4 py-3 rounded-xl border text-left transition-all ${
                            formData.country === country
                              ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]"
                              : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#F59E0B]"
                          }`}
                        >
                          <span className="text-sm font-medium">{country}</span>
                          {formData.country === country && (
                            <Check className="w-4 h-4 inline-block ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Contract Types */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <OnboardingContracts width={80} height={80} className="flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">What contracts do you typically sign?</h2>
                  <p className="text-sm text-[#6B7280]">Select all that apply</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {contractTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleContractTypeToggle(type.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      formData.contractTypes.includes(type.id)
                        ? "bg-[#FEF3C7] border-[#F59E0B]"
                        : "bg-white border-[#E5E7EB] hover:border-[#F59E0B]"
                    }`}
                  >
                    <ContractTypeIcon id={type.id} />
                    <span className={`flex-1 text-left font-medium ${
                      formData.contractTypes.includes(type.id) ? "text-[#B45309]" : "text-[#374151]"
                    }`}>
                      {type.label}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.contractTypes.includes(type.id)
                        ? "bg-[#F59E0B] border-[#F59E0B]"
                        : "border-gray-300"
                    }`}>
                      {formData.contractTypes.includes(type.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Language */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <OnboardingLanguage width={80} height={80} className="flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Preferred analysis language</h2>
                  <p className="text-sm text-[#6B7280]">How would you like AI analysis to be delivered?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      formData.language === lang.code
                        ? "bg-[#FEF3C7] border-[#F59E0B]"
                        : "bg-white border-[#E5E7EB] hover:border-[#F59E0B]"
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`flex-1 text-left font-medium ${
                      formData.language === lang.code ? "text-[#B45309]" : "text-[#374151]"
                    }`}>
                      {lang.label}
                    </span>
                    {formData.language === lang.code && (
                      <Check className="w-5 h-5 text-[#F59E0B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[#E5E7EB] flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            className={`text-sm font-medium ${
              currentStep > 1 ? "text-[#374151] hover:text-[#1A1A1A]" : "text-transparent"
            }`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>Saving...</>
            ) : currentStep === 3 ? (
              <>Get Started</>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
