export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    contracts: 3,
    analyses: 3,
    comparisons: 1,      // Lifetime, not monthly
    workspaces: 1,
    seats: 1,
    expiryReminders: false,
  },
  solo: {
    name: 'Solo',
    price: 9.9,
    contracts: 50,
    analyses: 25,         // Was 30
    comparisons: 3,
    workspaces: 1,
    seats: 1,
    expiryReminders: true,
  },
  pro: {
    name: 'Pro',
    price: 29,
    contracts: Infinity,
    analyses: 80,         // Was 100
    comparisons: 15,
    workspaces: 5,
    seats: 3,
    expiryReminders: true,
  },
  business: {
    name: 'Business',
    price: 69,
    contracts: Infinity,
    analyses: 300,        // Was 500
    comparisons: 50,      // Was 80
    workspaces: Infinity,
    seats: 10,
    expiryReminders: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
