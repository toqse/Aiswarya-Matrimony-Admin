import type { WebsitePlan } from "./plansApi";

/**
 * Shown when GET /api/v1/website/plans/ returns an empty list or the request fails,
 * so the /membership page is never a blank row of five slots.
 * Replace or remove when the backend always returns active public plans.
 */
export const WEBSITE_PLANS_FALLBACK: WebsitePlan[] = [
  {
    id: 1,
    name: "Special Offer",
    price: 499,
    duration_days: 30,
    description: "Quick trial plan",
    profile_view_limit: 200,
    interest_limit: 30,
    chat_limit: 20,
    horoscope_match_limit: 6,
    contact_view_limit: 6,
  },
  {
    id: 2,
    name: "Silver",
    price: 999,
    duration_days: 90,
    description: "Perfect to get started",
    profile_view_limit: 400,
    interest_limit: 50,
    chat_limit: 30,
    horoscope_match_limit: 15,
    contact_view_limit: 15,
  },
  {
    id: 3,
    name: "Gold",
    price: 1499,
    duration_days: 180,
    description: "Most popular choice",
    profile_view_limit: 800,
    interest_limit: 100,
    chat_limit: 50,
    horoscope_match_limit: 30,
    contact_view_limit: 30,
  },
  {
    id: 4,
    name: "Premium",
    price: 1999,
    duration_days: 365,
    description: "Best value for one year",
    profile_view_limit: 1200,
    interest_limit: 150,
    chat_limit: 80,
    horoscope_match_limit: 60,
    contact_view_limit: 60,
  },
  {
    id: 5,
    name: "Ultimate",
    price: 2999,
    duration_days: 365,
    description: "Best value for serious seekers",
    profile_view_limit: 2000,
    interest_limit: 200,
    chat_limit: 100,
    horoscope_match_limit: 70,
    contact_view_limit: 70,
  },
];
