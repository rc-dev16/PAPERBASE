import { PricingContainer } from '@/components/ui/pricing-container';

// Types
interface PricingPlan {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    isPopular?: boolean;
    accent: string;
    rotation?: number;
}

const PRICING_PLANS: PricingPlan[] = [
    {
        name: "Personal Research",
        monthlyPrice: 120,
        yearlyPrice: 220,
        features: [
            "Single user access",
            "Limited projects",
            "Local document storage",
            "Highlights & notes",
            "Basic citation formats",
            "Offline-first architecture"
        ],
        isPopular: false,
        accent: "bg-[#111111]",
        rotation: -2
    },
    {
        name: "Research Lab",
        monthlyPrice: 420,
        yearlyPrice: 720,
        features: [
            "Multiple users & collaboration",
            "Unlimited projects",
            "Global document deduplication",
            "AI-powered metadata extraction",
            "Advanced citation formats (BibTeX, RIS)",
            "Versioned documents",
            "Soft delete & recovery"
        ],
        isPopular: true,
        accent: "bg-[#FF3B30]",
        rotation: 1
    },
    {
        name: "Institutional",
        monthlyPrice: 900,
        yearlyPrice: 1600,
        features: [
            "Unlimited users & documents",
            "Centralized knowledge graph",
            "Admin controls & audit logs",
            "Cloud sync capabilities",
            "Single Sign-On (SSO)",
            "Enterprise-grade scalability"
        ],
        isPopular: false,
        accent: "bg-[#111111]",
        rotation: 2
    }
];

export default function PricingSection() {
    return (
        <PricingContainer
            title="System Capability Tiers"
            plans={PRICING_PLANS}
        />
    );
}



