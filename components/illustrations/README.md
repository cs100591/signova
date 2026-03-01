# Signova Illustration Library

Complete set of 18+ hand-drawn style SVG illustrations for Signova.

## Installation

All illustrations are already in your project at `components/illustrations/`.

## Usage

### Import individual illustrations:

```jsx
import { EmptyContracts, RiskLow, Error404 } from './components/illustrations';

function MyComponent() {
  return (
    <div>
      <EmptyContracts width={180} height={180} />
      <RiskLow width={160} height={160} />
      <Error404 width={340} height={180} />
    </div>
  );
}
```

### Import category groups:

```jsx
import { EmptyStates, RiskScores } from './components/illustrations';

function MyComponent() {
  return (
    <div>
      <EmptyStates.EmptyContracts />
      <RiskScores.RiskLow />
    </div>
  );
}
```

## Available Illustrations

### Empty States (`EmptyStates`)
- `EmptyContracts` - No contracts yet
- `EmptySearch` - No search results
- `EmptyArchive` - Nothing archived

### Upload States (`UploadStates`)
- `UploadIdle` - Dropzone idle state
- `UploadScanning` - OCR scanning in progress

### Analysis States (`AnalysisStates`)
- `AnalysisInProgress` - Detective analyzing
- `AnalysisComplete` - Analysis done with checkmark

### Risk Scores (`RiskScores`)
- `RiskLow` - Score 0-40 (thumbs up)
- `RiskMedium` - Score 41-70 (concerned)
- `RiskHigh` - Score 71-100 (warning)

### Pricing Plans (`PricingPlans`)
- `PricingFree` - Free plan illustration
- `PricingSolo` - Solo plan illustration
- `PricingPro` - Pro plan illustration
- `PricingBusiness` - Business plan illustration

### Contract Types (`ContractTypes`)
- `ContractNDA` - NDA/Confidentiality
- `ContractEmployment` - Employment agreement
- `ContractLease` - Lease/Rental
- `ContractContractor` - Freelance/Contractor

### Onboarding Steps (`OnboardingSteps`)
- `OnboardingLocation` - Step 1: Location
- `OnboardingContracts` - Step 2: Contract types
- `OnboardingLanguage` - Step 3: Language
- `OnboardingComplete` - All set with confetti

### Error States (`ErrorStates`)
- `Error404` - Page not found (404)
- `ErrorGeneral` - Something went wrong

## Props

All illustrations accept these props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | number | varies | SVG width in pixels |
| `height` | number | varies | SVG height in pixels |
| `className` | string | "" | Additional CSS classes |

## Styling

All illustrations use the Signova color palette:
- Primary: `#1a1714` (black)
- Background: `white` or `transparent`
- Accents: Various opacities of black

You can override colors by targeting the SVG with CSS:

```css
.my-illustration path {
  stroke: #c8873a; /* Change to gold accent */
}
```

## Source

Extracted from `signova-illustrations-complete.html`
