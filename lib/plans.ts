export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    contracts: 3,
    analyses: 3,
    workspaces: 1,
    seats: 1,
  },
  solo: {
    name: 'Solo',
    price: 9.9,
    contracts: 50,
    analyses: 30,
    workspaces: 1,
    seats: 1,
  },
  pro: {
    name: 'Pro',
    price: 29,
    contracts: Infinity,
    analyses: 100,
    workspaces: 5,
    seats: 3,
  },
  business: {
    name: 'Business',
    price: 69,
    contracts: Infinity,
    analyses: 500,
    workspaces: Infinity,
    seats: 10,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
