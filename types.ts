export interface UrbanPlanningProjectInfo {
    location: string;
    scale: string;
    mainChallenge: string;
    policyContext: string;
    targetUsers: string;
    authorRole?: string;
    specificFocus?: string;
}

// New, specific slide types based on user's reference presentation
export interface DesignSystem {
    font_family: string;
    text_color_primary: string;
    text_color_secondary: string;
    text_alignment: 'left' | 'center' | 'right' | 'justify';
    is_light_background: boolean;
}

export interface CoverSlide {
    layout: 'Cover';
    title: string;
    subtitle: string;
    project_code: string;
    year: string;
    image_prompt: string;
    image_url?: string;
    design_system_svg?: string;
    design_system?: DesignSystem;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface ExecutiveOverviewSlide {
    layout: 'ExecutiveOverview';
    title: string;
    narrative: string;
    key_points: string[];
    analytic_reflection: string;
    reference_doc?: string;
    image_prompt: string;
    image_url?: string;
}

export interface CrisisSlide {
    layout: 'Crisis';
    title: string;
    problem_statement: string;
    key_data_points: {
        value: string;
        label: string;
        description: string;
    }[];
    image_prompt: string;
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface SWOTSlide {
    layout: 'SWOT';
    title?: string;
    strengths: { title: string; description: string; }[];
    weaknesses: { title: string; description: string; }[];
    opportunities: { title: string; description: string; }[];
    threats: { title: string; description: string; }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface BenchmarksSlide {
    layout: 'Benchmarks';
    title?: string;
    benchmarks: {
        name: string;
        location: string;
        introduction: string;
        interventions: string[];
        takeaway: string;
        image_prompt: string;
        image_url?: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
}

export interface CaseStudyDeepDiveSlide {
    layout: 'CaseStudyDeepDive';
    title: string;
    introduction: string;
    key_findings: string[];
    conclusion: string;
    image_prompt: string;
    image_url?: string;
    data_source?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface VisionSlide {
    layout: 'Vision';
    title: string;
    vision_statement: string;
    strategic_pillars: {
        title: string;
        initiatives: string[];
    }[];
    image_prompt: string;
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface MacroStrategySlide {
    layout: 'MacroStrategy';
    title: string;
    strategic_intent: string;
    strategies: {
        title: string;
        description: string;
        rationale: string;
    }[];
    image_prompt: string;
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface EquityAnalysisSlide {
    layout: 'EquityAnalysis';
    title: string;
    metrics: {
        dimension: string;
        current_state: string;
        target_state: string;
        impact_description: string;
    }[];
    mitigation_strategies: {
        label: string;
        value: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface NodeAssessmentSlide {
    layout: 'NodeAssessment';
    title: string;
    site_location: string;
    site_rationale: string;
    metrics: {
        value: string;
        label: string;
    }[];
    conclusion: string;
    before_image_url?: string;
    after_image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface ScenarioComparisonSlide {
    layout: 'ScenarioComparison';
    title: string;
    scenarios: {
        name: string;
        outcomes: {
            metric: string;
            value: string;
        }[];
        risk: string;
        cost: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface RiskAssessmentSlide {
    layout: 'RiskAssessment';
    title: string;

    risks: {
        category: string;
        description: string;
        mitigation: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface RoadmapSlide {
    layout: 'Roadmap';
    title: string;
    phases: {
        title: string;
        timeline: string;
        action_steps: {
            action: string;
            kpi: string;
        }[];
        outcome: string;
    }[];
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface GanttChartRoadmapSlide {
    layout: 'GanttChartRoadmap';
    title: string;
    timeline_start_year: number;
    timeline_end_year: number;
    phases: {
        name: string;
        deliverables: {
            name: string;
            start_quarter: string; // e.g., "Q1 2025"
            end_quarter: string;   // e.g., "Q3 2025"
            kpi: string;
        }[];
    }[];
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}


export interface ProjectedImpactSlide {
    layout: 'ProjectedImpact';
    title: string;
    subtitle: string;
    impacts: {
        area: string;
        problem: string;
        solution: string;
        impact: string;
        action: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface FiscalFrameworkSlide {
    layout: 'FiscalFramework';
    title: string;
    cost_items: {
        component: string;
        capex: string;
        opex: string;
        funding_source: string;
        recovery_mechanism: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface PolicyLeversSlide {
    layout: 'PolicyLevers';
    title?: string;
    recommendations: {
        title: string;
        strategy: string;
        expected_impact: string;
        measurement_framework: string;
    }[];
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface GovernanceFrameworkSlide {
    layout: 'GovernanceFramework';
    title: string;
    lead_agency: {
        name: string;
        rationale: string;
    };
    stakeholders: {
        name: string;
        role: string;
        power: string;
        interest: string;
    }[];
    funding_model: string;
    regulatory_changes: string[];
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}


export interface TableOfContentsSlide {
    layout: 'TableOfContents';
    title: string;
    chapters: {
        number: string;
        title: string;
        description: string;
    }[];
    analytic_reflection?: string;
    reference_doc?: string;
}

export interface NextStepsSlide {
    layout: 'NextSteps';
    title: string;
    immediate_actions: {
        title: string;
        owner: string;
        deadline: string;
    }[];
    strategic_milestones: string[];
    analytic_reflection?: string;
    reference_doc?: string;
}

export interface ComparisonTableSlide {
    layout: 'ComparisonTable';
    title: string;
    headers: string[];
    rows: {
        label: string;
        values: string[];
    }[];
    conclusion: string;
    analytic_reflection?: string;
    reference_doc?: string;
}

export interface ConclusionSlide {
    layout: 'Conclusion';
    title: string;
    summary_points: {
        title: string;
        content: string;
    }[];
    final_recommendation: string;
    image_url?: string;
    analytic_reflection?: string;
    reference_doc?: string;
}

export interface ReferencesSlide {
    layout: 'References';
    title: string;
    sources: {
        title: string;
        author: string;
        year: string;
        link: string;
        relevance: string;
    }[];
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface ClosingSlide {
    layout: 'Closing';
    tagline: string;
    credits: string;
    image_prompt?: string;
    image_url?: string;
    analytic_reflection: string;
    reference_doc?: string;
}

export interface ProcessSlide {
    layout: 'Process';
    title: string;
    subtitle: string;
    steps: {
        step_number: number;
        title: string;
        description: string;
    }[];
    analytic_reflection: string;
    reference_doc?: string;
    image_url?: string;
}

export interface LandUseItem {
    label: string;
    percentage: number;
}

export interface MasterplanProjectInfo {
    location: string;
    city: string;
    country: string;
    scale: string;
    type: string;
    buildingCoverage?: string;
    greenSpaceRatio?: string;
    maxHeight?: string;
    landUseBalance?: string; // Kept for backward compatibility or simple input
    landUseBreakdown?: LandUseItem[]; 
    satelliteImage?: string; // Data URL
}

export interface MasterplanSlide {
    layout: 'Masterplan';
    title: string;
    description: string;
    image_prompt: string;
    image_url?: string;
    slide_number: number;
}

// Union type for all possible slides in the new structure
export type PresentationSlide = 
    | CoverSlide 
    | TableOfContentsSlide
    | ExecutiveOverviewSlide
    | CrisisSlide
    | SWOTSlide
    | BenchmarksSlide
    | CaseStudyDeepDiveSlide
    | VisionSlide
    | MacroStrategySlide
    | EquityAnalysisSlide
    | NodeAssessmentSlide
    | ScenarioComparisonSlide
    | ComparisonTableSlide
    | RiskAssessmentSlide
    | RoadmapSlide
    | GanttChartRoadmapSlide
    | ProjectedImpactSlide
    | FiscalFrameworkSlide
    | PolicyLeversSlide
    | GovernanceFrameworkSlide
    | ProcessSlide
    | NextStepsSlide
    | ConclusionSlide
    | ReferencesSlide
    | ClosingSlide
    | MasterplanSlide;


// The following types are kept for other generators but are no longer used for the main presentation
export interface PolicyBrief {
    title: string;
    executiveSummary: string;
    policyProblem: {
        definition: string;
        affectedParties: string;
        urgency: string;
    };
    evidenceAndFindings: {
        summary: string;
        findings: string[];
    };
    policyOptions: {
        description: string;
        benefits: string;
        risks: string;
        feasibility: string;
    }[];
    recommendedAction: {
        option: string;
        justification: string;
        impacts: string;
    };
    implementationConsiderations: {
        responsibility: string;
        capacity: string;
        timeline: string;
        risks: string;
    };
    keyTakeaways: string[];
    groundingSources?: { uri: string; title: string }[];
}

export interface RFPContent {
    title: string;
    sections: {
        title: string;
        content: {
            paragraph?: string;
            list?: string[];
        }[];
    }[];
}

export interface CapacityBuildingModule {
    title: string;
    objective: string;
    topics: string[];
    methodology: string;
    outcome: string;
}

export interface CapacityBuildingProgram {
    programTitle: string;
    targetAudience: string;
    learningObjectives: string[];
    modules: CapacityBuildingModule[];
    deliveryMethod: string;
    evaluationPlan: string;
}

export interface VisionFramework {
    visionStatement: string;
    tagline: string;
    strategicPillars: {
        title: string;
        description: string;
        keyInitiatives: string[];
    }[];
}

export interface StakeholderGroup {
    name: string;
    category: 'Government' | 'Community' | 'Private Sector' | 'Expert/NGO' | 'Other';
    interest: 'High' | 'Medium' | 'Low';
    influence: 'High' | 'Medium' | 'Low';
    engagementStrategy: string;
    communicationMethods: string[];
}

export interface StakeholderPlan {
    planTitle: string;
    engagementGoals: string[];
    stakeholderGroups: StakeholderGroup[];
    timeline: {
        phase: string;
        duration: string;
        activities: string;
    }[];
}

export interface Methodology {
    title: string;
    introduction: string;
    phases: {
        phase_number: number;
        title: string;
        description: string;
        steps: {
            step_number: string; // e.g., "1.1"
            title: string;
            description: string;
            deliverable: string;
            tools_and_techniques: string[];
        }[];
    }[];
    conclusion: string;
}

export interface UrbanDeepUnderstanding {
    topic: string;
    teacherPersona: {
        intro: string;
        closing: string;
    };
    stickyNotes: {
        id: string;
        category: 'Core Concept' | 'Data Insight' | 'Case Study' | 'Strategic Move' | 'Critical Risk';
        title: string;
        content: string;
        tags: string[];
    }[];
    lessonInteraction: {
        question: string;
        choices: string[];
        feedback: Record<string, string>;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    credits: number;
    plan: string;
    referral_code: string;
    invited_by?: string;
    created_at: string;
}

export interface UsageHistory {
    id: string;
    user_id: string;
    description: string;
    credits_used: number;
    created_at: string;
}

export interface BrandingInfo {
    logo?: string | null;
    colors?: string | null;
    presentation_template?: string | null;
    presentation_template_url?: string | null;
    report_template?: string | null;
    report_template_url?: string | null;
}
