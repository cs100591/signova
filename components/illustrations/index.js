// Signova Illustration Library
// Complete set of 18+ hand-drawn style SVG illustrations
// Extracted from signova-illustrations-complete.html

// Empty States
export {
  EmptyContracts,
  EmptySearch,
  EmptyArchive
} from './EmptyStates';

// Upload States
export {
  UploadIdle,
  UploadScanning
} from './UploadStates';

// Analysis States
export {
  AnalysisInProgress,
  AnalysisComplete
} from './AnalysisStates';

// Risk Score States
export {
  RiskLow,
  RiskMedium,
  RiskHigh
} from './RiskScores';

// Pricing Plans
export {
  PricingFree,
  PricingSolo,
  PricingPro,
  PricingBusiness
} from './PricingPlans';

// Contract Types
export {
  ContractNDA,
  ContractEmployment,
  ContractLease,
  ContractContractor
} from './ContractTypes';

// Onboarding Steps
export {
  OnboardingLocation,
  OnboardingContracts,
  OnboardingLanguage,
  OnboardingComplete
} from './OnboardingSteps';

// Error States
export {
  Error404,
  ErrorGeneral
} from './ErrorStates';

// Re-export all as default object
export { default as EmptyStates } from './EmptyStates';
export { default as UploadStates } from './UploadStates';
export { default as AnalysisStates } from './AnalysisStates';
export { default as RiskScores } from './RiskScores';
export { default as PricingPlans } from './PricingPlans';
export { default as ContractTypes } from './ContractTypes';
export { default as OnboardingSteps } from './OnboardingSteps';
export { default as ErrorStates } from './ErrorStates';
