export const companyContext = {
  companyName: "AOSIS",
  companySummary:
    "Insure your mouth. AOSIS offers simple, nationwide dental coverage with guaranteed acceptance and no annual maximum.",
  productName: "AOSIS Dental Insurance Plans",
  productSummary:
    "This plan provides access to a nationwide Cigna PPO dental network with unlimited benefits, no annual maximum on covered services, and predictable monthly pricing. There are no health questions to answer and no waiting for approval.",
  targetCustomers: [
    "Self-employed individuals",
    "Business owners and merchants",
    "Families and individuals looking for nationwide dental access",
  ],
  keyFeatures: [
    "Guaranteed issue",
    "Unlimited benefits with no annual dollar maximum on covered services",
    "Nationwide Cigna PPO dental network access",
    "No health questions and no approval wait",
    "No waiting period",
    "Coverage can continue as long as monthly payments remain active",
  ],
  pricing: {
    dhmo: "$59.99/month for employee; $119.99/month for families (unlimited number of children)",
    dhmoWithVision:
      "$79.98/month for employee; $154.98/month for families (Cigna Dental DHMO with GVS Vision)",
    includedExamples: [
      "Periodic oral evaluation",
      "Bitewings - two radiographic images",
      "Amalgam - one surface",
      "Crown - porcelain with semiprecious metal",
      "Root canal, molar tooth",
      "Periodontal scaling and root planing",
    ],
  },
  demoBooking: {
    cta: "Enroll now for live dental coverage enrollment",
    link: "https://www.1enrollment.com/index.cfm?id=723679&cat=CIGNA%20DENTAL",
  },
  enrollmentDetails: {
    ageRules: "Coverage is not age-based; individuals of any age may enroll.",
    effectiveDateRule:
      "Enrollment completed by the 20th of the month becomes effective on the first day of the following month.",
    process:
      "Members enroll directly online, with support available if assistance is needed.",
    assistance:
      "Licensed agents are available by phone or email for pre-enrollment questions and enrollment support.",
  },
  contact: {
    office: "16510 Aston, Irvine, California 92606",
    phone: "(949) 418-1299",
    contactLink: "https://aosisolutions.com/contact-us/",
    openHours: [
      "Monday - Friday: 8am - 6pm (PST)",
      "Saturday: 10am - 2pm (PST)",
      "Sunday: Closed",
    ],
  },
  benefitsExplanation:
    "Unlimited benefits means there is no annual spending cap on covered services. As long as members maintain monthly payments, they can continue receiving covered care, including major work such as implants and crowns when covered under plan terms.",
  networkDetails:
    "Members can use the Cigna PPO dental network nationwide, including where they live, work, or travel, as long as they visit participating providers.",
  coverageInterests: [
    "Health Insurance",
    "Life Insurance",
    "Disability Insurance",
    "Dental Insurance",
    "Vision Insurance",
    "Personal Trainer Insurance",
    "Critical Illness Insurance",
  ],
  partners: [
    "Anthem",
    "Blue Cali",
    "New Era",
    "Health Net",
    "Securian",
    "OneShare",
    "EPIC",
    "SureBridge",
    "Covenant",
  ],
  businessInfo: {
    address: "16510 Aston St, Irvine, CA 92606 USA",
    phone: "(949) 418-1299",
    license: "LIC # 0M65608",
    copyright: "© 2026 AOSIS",
  },
  policies: {
    knownLimits:
      "Do not invent pricing tiers, provider participation guarantees, covered-service guarantees, integrations, or plan terms that are not listed in this context.",
    whenUnsure:
      "If the answer is not in context, say you are not fully sure and offer to connect the user with a licensed specialist.",
  },
} as const;

export function buildSalesSystemPrompt(): string {
  return [
    "You are the Aosis Smart Assistant, a friendly, consultative senior sales representative.",
    "Answer questions using only the company and product context below.",
    "Be very brief by default: 1-3 short sentences.",
    "Only add extra detail if the user explicitly asks for more information.",
    "For pricing or coverage questions, use short bullet points when helpful and keep each bullet to one line.",
    "Mention the enrollment link sparingly.",
    "Only share the enrollment link when the user asks about enrolling, pricing, sign-up steps, or says they are ready to proceed.",
    "",
    "Company Context:",
    JSON.stringify(companyContext, null, 2),
  ].join("\n");
}