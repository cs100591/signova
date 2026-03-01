"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, FileText, Languages, ChevronRight } from "lucide-react";
import { OnboardingLocation, OnboardingContracts, OnboardingLanguage, OnboardingComplete } from "@/components/illustrations";

const jurisdictions = [
  { region: "Southeast Asia", countries: ["Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines", "Vietnam", "Brunei", "Myanmar", "Cambodia", "Laos"] },
  { region: "East Asia", countries: ["China", "Japan", "South Korea", "Taiwan", "Hong Kong"] },
  { region: "Americas", countries: ["United States", "Canada", "Brazil", "Mexico", "Argentina", "Chile", "Colombia"] },
  { region: "Europe", countries: ["United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy", "Switzerland", "Sweden", "Norway", "Denmark"] },
  { region: "Oceania", countries: ["Australia", "New Zealand"] },
  { region: "Others", countries: ["India", "UAE", "Saudi Arabia", "South Africa", "Nigeria", "Other"] },
];

const contractTypes = [
  { id: "employment", label: "Employment contracts", icon: "👔" },
  { id: "freelance", label: "Freelance / Contractor agreements", icon: "💼" },
  { id: "business", label: "Business / Vendor agreements", icon: "🤝" },
  { id: "nda", label: "NDA / Confidentiality", icon: "🔒" },
  { id: "lease", label: "Lease / Rental", icon: "🏠" },
  { id: "other", label: "Other", icon: "📄" },
];

const languages = [
  { code: "EN", label: "English", flag: "🇺🇸" },
  { code: "ZH", label: "中文 (简体)", flag: "🇨🇳" },
  { code: "ZH_TW", label: "中文 (繁體)", flag: "🇹🇼" },
  { code: "MS", label: "Bahasa Malaysia", flag: "🇲🇾" },
  { code: "ID", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "TH", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "JA", label: "日本語", flag: "🇯🇵" },
  { code: "KO", label: "한국어", flag: "🇰🇷" },
  { code: "ES", label: "Español", flag: "🇪🇸" },
  { code: "FR", label: "Français", flag: "🇫🇷" },
  { code: "DE", label: "Deutsch", flag: "🇩🇪" },
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
    
    // TODO: Save to database
    try {
      // const response = await fetch('/api/user/profile', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      console.log('Saving user profile:', formData);
      
      // Save to localStorage for now
      localStorage.setItem('userProfile', JSON.stringify(formData));
      
      // Redirect to contracts page
      router.push('/contracts');
    } catch (error) {
      console.error('Error saving profile:', error);
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
                    <span className="text-2xl">{type.icon}</span>
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
