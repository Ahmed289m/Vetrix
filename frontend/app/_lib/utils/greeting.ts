/**
 * Greeting utilities for displaying time-based greetings
 */

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type UserTitle = "Dr" | "Mr" | "Ms" | "Mrs";

/**
 * Get time of day based on current hour
 * Morning: 5-12, Afternoon: 12-18, Evening: 18-23
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * Get greeting based on time of day
 */
export function getTimeBasedGreeting(): string {
  const timeOfDay = getTimeOfDay();
  switch (timeOfDay) {
    case "morning":
      return "Good Morning";
    case "afternoon":
      return "Good Afternoon";
    case "evening":
      return "Good Evening";
  }
}

/**
 * Get Arabic greeting based on time of day
 */
export function getArabicTimeBasedGreeting(): string {
  const timeOfDay = getTimeOfDay();
  switch (timeOfDay) {
    case "morning":
      return "صباح الخير";
    case "afternoon":
      return "مساء الخير";
    case "evening":
      return "مساء الخير";
  }
}

/**
 * Get title prefix based on role
 */
export function getTitlePrefix(role: string): UserTitle | "" {
  switch (role?.toLowerCase()) {
    case "doctor":
      return "Dr";
    case "owner":
      return "Mr";
    case "staff":
      return "Mr";
    case "client":
      return "Mr";
    default:
      return "";
  }
}

/**
 * Get Arabic title prefix based on role
 */
export function getArabicTitlePrefix(role: string): string {
  switch (role?.toLowerCase()) {
    case "doctor":
      return "د.";
    case "owner":
      return "السيد";
    case "staff":
      return "السيد";
    case "client":
      return "العميل";
    default:
      return "";
  }
}

/**
 * Format greeting with name and role
 */
export function formatGreeting(
  name: string,
  role: string,
  lang: "en" | "ar" = "en",
): string {
  const greeting =
    lang === "ar" ? getArabicTimeBasedGreeting() : getTimeBasedGreeting();
  const title =
    lang === "ar" ? getArabicTitlePrefix(role) : getTitlePrefix(role);
  return title ? `${greeting} ${title} ${name}` : `${greeting} ${name}`;
}
