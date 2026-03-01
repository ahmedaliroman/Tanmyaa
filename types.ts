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
export interface CoverSlide {
    layout: 'Cover';
    title: string;
    subtitle: string;
    project_code: string;
    year: string;
}

export interface ExecutiveOverviewSlide {
    layout: 'ExecutiveOverview';
    title: string;
    narrative: string;
    key_points: string[];
    analytic_reflection: string;
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
}

export interface SWOTSlide {
    layout: 'SWOT';
    strengths: { title: string; description: string; }[];
    weaknesses: { title: string; description: string; }[];
    opportunities: { title: string; description: string; }[];
    threats: { title: string; description: string; }[];
    analytic_reflection: string;
}

export interface BenchmarksSlide {
    layout: 'Benchmarks';
    benchmarks: {
        name: string;
        location: string;
        introduction: string;
        interventions: string[];
        takeaway: string;
    }[];
}

export interface CaseStudyDeepDiveSlide {
    layout: 'CaseStudyDeepDive';
    title: string;
    introduction: string;
    key_findings: string[];
    conclusion: string;
    image_prompt: string;
    data_source?: string;
    analytic_reflection: string;
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
}

export interface EquityAnalysisSlide {
    layout: 'EquityAnalysis';
    title: string;
    distributional_impacts: {
        group: string;
        impact: string;
    }[];
    mitigation_strategies: string[];
    analytic_reflection: string;
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
    analytic_reflection: string;
    before_image_prompt: string;
    after_image_prompt: string;
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
}

export interface RoadmapSlide {
    layout: 'Roadmap';
    phases: {
        title: string;
        timeline: string;
        action_steps: {
            action: string;
            kpi: string;
        }[];
        outcome: string;
    }[];
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
}


export interface ProjectedImpactSlide {
    layout: 'ProjectedImpact';
    title: string;
    subtitle: string;
    metrics: {
        label: string;
        baseline: string;
        projected: string;
        timeframe: string;
        assumption: string;
    }[];
    analytic_reflection: string;
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
}

export interface PolicyLeversSlide {
    layout: 'PolicyLevers';
    recommendations: {
        title: string;
        strategy: string;
        expected_impact: string;
        measurement_framework: string;
    }[];
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
    }[];
    funding_model: string;
    regulatory_changes: string[];
}


export interface ReferencesSlide {
    layout: 'References';
    sources: string[];
}

export interface ClosingSlide {
    layout: 'Closing';
    tagline: string;
    credits: string;
}

// Union type for all possible slides in the new structure
export type PresentationSlide = 
    | CoverSlide 
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
    | RiskAssessmentSlide
    | RoadmapSlide
    | GanttChartRoadmapSlide
    | ProjectedImpactSlide
    | FiscalFrameworkSlide
    | PolicyLeversSlide
    | GovernanceFrameworkSlide
    | ReferencesSlide
    | ClosingSlide;


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

export interface UserProfile {
    id: string;
    email: string;
    credits: number;
    created_at: string;
}

export interface UsageHistory {
    id: string;
    user_id: string;
    description: string;
    credits_used: number;
    created_at: string;
}
