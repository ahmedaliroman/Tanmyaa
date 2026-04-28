import * as docx from 'docx';
import saveAs from 'file-saver';
import type { RFPContent, PolicyBrief, StakeholderPlan, Methodology, CapacityBuildingProgram, VisionFramework, UrbanDeepUnderstanding } from '@/types';

const TanmyaaLogoDefault = `iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVHhe7cEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAB8G4IAAAE2lV8dAAAAAElFTkSuQmCC`;

const getLogoBuffer = (logoBase64: string | null) => {
    return logoBase64 
        ? Uint8Array.from(atob(logoBase64.split(',')[1]), c => c.charCodeAt(0))
        : Uint8Array.from(atob(TanmyaaLogoDefault), c => c.charCodeAt(0));
};

const createStandardHeader = (logoBuffer: Uint8Array) => new docx.Header({
    default: new docx.Header({
        children: [
            new docx.Paragraph({
                children: [
                    new docx.ImageRun({
                        data: logoBuffer,
                        transformation: {
                            width: 80,
                            height: 20,
                        },
                    }),
                ],
                alignment: docx.AlignmentType.RIGHT,
            }),
        ],
    }),
});

const createStandardFooter = () => new docx.Footer({
    default: new docx.Footer({
        children: [
            new docx.Paragraph({
                 alignment: docx.AlignmentType.CENTER,
                 children: [
                    new docx.TextRun({
                        children: [docx.PageNumber.CURRENT, " | ", docx.PageNumber.TOTAL_PAGES],
                        size: 16,
                        color: "808080"
                    }),
                ],
            }),
        ],
    }),
});

const docStyles = {
    paragraphStyles: [
        {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 36,
                bold: true,
                color: "2563EB", // Blue-600
            },
            paragraph: {
                spacing: { before: 400, after: 300 },
            },
        },
        {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 28,
                bold: true,
                color: "1E40AF", // Blue-800
            },
            paragraph: {
                spacing: { before: 300, after: 200 },
                border: {
                    bottom: { color: "E5E7EB", size: 6, space: 1, style: docx.BorderStyle.SINGLE }
                }
            },
        },
        {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
                size: 24,
                bold: true,
                color: "1F2937", // Gray-800
            },
            paragraph: {
                spacing: { before: 200, after: 120 },
            },
        },
        {
            id: "Normal",
            name: "Normal",
            run: {
                size: 22, // 11pt
                color: "374151", // Gray-700
            },
            paragraph: {
                spacing: { line: 360, after: 120 }, // 1.5 line spacing
                alignment: docx.AlignmentType.JUSTIFY,
            },
        },
        {
            id: "Quote",
            name: "Quote",
            run: {
                size: 22,
                italic: true,
                color: "4B5563",
            },
            paragraph: {
                indent: { left: 720 },
                spacing: { before: 120, after: 120 },
            },
        }
    ],
};

export const exportRFPToDocx = async (rfpContent: RFPContent, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: rfpContent.title,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: "1. EXECUTIVE SUMMARY", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: rfpContent.executiveSummary, style: "Quote" }),
                
                new docx.Paragraph({ text: "OBJECTIVES", heading: docx.HeadingLevel.HEADING_3 }),
                ...rfpContent.objectives.map(obj => new docx.Paragraph({ text: obj, bullet: { level: 0 }, style: "Normal" })),

                new docx.Paragraph({ text: "2. TECHNICAL SCOPE OF WORK", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: rfpContent.scopeOfWork.intro, style: "Normal" }),
                ...rfpContent.scopeOfWork.phases.flatMap((phase, idx) => [
                    new docx.Paragraph({ text: `Phase ${idx + 1}: ${phase.title}`, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ text: phase.description, style: "Normal", italic: true }),
                    ...phase.tasks.map(task => new docx.Paragraph({ text: task, bullet: { level: 0 }, style: "Normal" }))
                ]),

                new docx.Paragraph({ text: "3. PROJECT TIMELINE & DELIVERABLES", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Total Duration: ", bold: true }), new docx.TextRun(rfpContent.timeframe.totalDuration)] }),
                new docx.Table({
                    width: { size: 100, type: docx.WidthType.PERCENTAGE },
                    rows: [
                        new docx.TableRow({
                            children: [
                                new docx.TableCell({ children: [new docx.Paragraph({ text: "Weeks", bold: true })] }),
                                new docx.TableCell({ children: [new docx.Paragraph({ text: "Activity", bold: true })] }),
                                new docx.TableCell({ children: [new docx.Paragraph({ text: "Deliverable", bold: true })] }),
                            ],
                        }),
                        ...rfpContent.timeframe.milestones.map(m => new docx.TableRow({
                            children: [
                                new docx.TableCell({ children: [new docx.Paragraph({ text: m.weeks })] }),
                                new docx.TableCell({ children: [new docx.Paragraph({ text: m.activity })] }),
                                new docx.TableCell({ children: [new docx.Paragraph({ text: m.deliverable })] }),
                            ],
                        }))
                    ]
                }),

                new docx.Paragraph({ text: "4. EVALUATION FRAMEWORK", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Methodology: ", bold: true }), new docx.TextRun(rfpContent.evaluationCriteria.method)] }),
                ...rfpContent.evaluationCriteria.criteria.flatMap(c => [
                    new docx.Paragraph({ text: `${c.label} (${c.weight})`, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ text: c.description, style: "Normal" })
                ]),

                new docx.Paragraph({ text: "5. TECHNICAL REQUIREMENTS & SUBMISSION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: "Technical Standards:", heading: docx.HeadingLevel.HEADING_3 }),
                ...rfpContent.technicalRequirements.map(req => new docx.Paragraph({ text: req, bullet: { level: 0 }, style: "Normal" })),
                new docx.Paragraph({ text: "Submission Instructions:", heading: docx.HeadingLevel.HEADING_3 }),
                ...rfpContent.submissionInstructions.map(ins => new docx.Paragraph({ text: ins, bullet: { level: 0 }, style: "Normal", italic: true }))
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `${rfpContent.title.replace(/ /g, '_')}.docx`);
};

export const exportPolicyBriefToDocx = async (brief: PolicyBrief, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: brief.title,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: "EXECUTIVE SUMMARY", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: brief.executiveSummary, style: "Quote" }),

                new docx.Paragraph({ text: "1. POLICY PROBLEM", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Definition: ", bold: true }), new docx.TextRun(brief.policyProblem.definition)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Affected Parties: ", bold: true }), new docx.TextRun(brief.policyProblem.affectedParties)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Urgency: ", bold: true }), new docx.TextRun(brief.policyProblem.urgency)] }),

                new docx.Paragraph({ text: "2. EVIDENCE & FINDINGS", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: brief.evidenceAndFindings.summary, style: "Normal" }),
                ...brief.evidenceAndFindings.findings.map(f => new docx.Paragraph({ text: f, bullet: { level: 0 }, style: "Normal" })),

                new docx.Paragraph({ text: "3. POLICY OPTIONS", heading: docx.HeadingLevel.HEADING_2 }),
                ...brief.policyOptions.flatMap((opt, idx) => [
                    new docx.Paragraph({ text: `Option ${idx + 1}: ${opt.description}`, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Benefits: ", bold: true }), new docx.TextRun(opt.benefits)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Risks: ", bold: true }), new docx.TextRun(opt.risks)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Feasibility: ", bold: true }), new docx.TextRun(opt.feasibility)] }),
                ]),

                new docx.Paragraph({ text: "4. RECOMMENDED ACTION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: brief.recommendedAction.option, style: "Normal", bold: true }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Justification: ", bold: true }), new docx.TextRun(brief.recommendedAction.justification)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Impacts: ", bold: true }), new docx.TextRun(brief.recommendedAction.impacts)] }),

                new docx.Paragraph({ text: "5. IMPLEMENTATION CONSIDERATIONS", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Institutional Responsibility: ", bold: true }), new docx.TextRun(brief.implementationConsiderations.responsibility)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Capacity & Resources: ", bold: true }), new docx.TextRun(brief.implementationConsiderations.capacity)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Timeline: ", bold: true }), new docx.TextRun(brief.implementationConsiderations.timeline)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Risks & Mitigation: ", bold: true }), new docx.TextRun(brief.implementationConsiderations.risks)] }),

                new docx.Paragraph({ text: "6. KEY TAKEAWAYS", heading: docx.HeadingLevel.HEADING_2 }),
                ...brief.keyTakeaways.map(t => new docx.Paragraph({ text: t, bullet: { level: 0 }, style: "Normal" })),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Policy_Brief_${brief.title.replace(/ /g, '_')}.docx`);
};

export const exportStakeholderPlanToDocx = async (plan: StakeholderPlan, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: plan.planTitle,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: "ENGAGEMENT GOALS", heading: docx.HeadingLevel.HEADING_2 }),
                ...plan.engagementGoals.map(g => new docx.Paragraph({ text: g, bullet: { level: 0 }, style: "Normal" })),

                new docx.Paragraph({ text: "STAKEHOLDER GROUPS", heading: docx.HeadingLevel.HEADING_2 }),
                ...plan.stakeholderGroups.flatMap(group => [
                    new docx.Paragraph({ text: group.name, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Category: ", bold: true }), new docx.TextRun(group.category)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Interest: ", bold: true }), new docx.TextRun(group.interest), new docx.TextRun({ text: " | Influence: ", bold: true }), new docx.TextRun(group.influence)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Engagement Strategy: ", bold: true }), new docx.TextRun(group.engagementStrategy)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Communication Methods: ", bold: true }), new docx.TextRun(group.communicationMethods.join(", "))] }),
                ]),

                new docx.Paragraph({ text: "TIMELINE", heading: docx.HeadingLevel.HEADING_2 }),
                ...plan.timeline.map(t => new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: `${t.phase} (${t.duration}): `, bold: true }),
                        new docx.TextRun(t.activities)
                    ],
                    style: "Normal"
                })),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Stakeholder_Plan_${plan.planTitle.replace(/ /g, '_')}.docx`);
};

export const exportMethodologyToDocx = async (methodology: Methodology, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: methodology.title,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: "INTRODUCTION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: methodology.introduction, style: "Normal" }),

                ...methodology.phases.flatMap(phase => [
                    new docx.Paragraph({ text: `Phase ${phase.phase_number}: ${phase.title}`, heading: docx.HeadingLevel.HEADING_2 }),
                    new docx.Paragraph({ text: phase.description, style: "Normal" }),
                    ...phase.steps.flatMap(step => [
                        new docx.Paragraph({ text: `Step ${step.step_number}: ${step.title}`, heading: docx.HeadingLevel.HEADING_3 }),
                        new docx.Paragraph({ text: step.description, style: "Normal" }),
                        new docx.Paragraph({ children: [new docx.TextRun({ text: "Deliverable: ", bold: true }), new docx.TextRun(step.deliverable)] }),
                        new docx.Paragraph({ children: [new docx.TextRun({ text: "Tools & Techniques: ", bold: true }), new docx.TextRun(step.tools_and_techniques.join(", "))] }),
                    ])
                ]),

                new docx.Paragraph({ text: "CONCLUSION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: methodology.conclusion, style: "Normal" }),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Methodology_${methodology.title.replace(/ /g, '_')}.docx`);
};

export const exportCapacityBuildingToDocx = async (program: CapacityBuildingProgram, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: program.programTitle,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Target Audience: ", bold: true }), new docx.TextRun(program.targetAudience)] }),
                
                new docx.Paragraph({ text: "LEARNING OBJECTIVES", heading: docx.HeadingLevel.HEADING_2 }),
                ...program.learningObjectives.map(obj => new docx.Paragraph({ text: obj, bullet: { level: 0 }, style: "Normal" })),

                new docx.Paragraph({ text: "MODULES", heading: docx.HeadingLevel.HEADING_2 }),
                ...program.modules.flatMap((mod, idx) => [
                    new docx.Paragraph({ text: `Module ${idx + 1}: ${mod.title}`, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Objective: ", bold: true }), new docx.TextRun(mod.objective)] }),
                    new docx.Paragraph({ text: "Topics:", bold: true }),
                    ...mod.topics.map(t => new docx.Paragraph({ text: t, bullet: { level: 0 }, style: "Normal" })),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Methodology: ", bold: true }), new docx.TextRun(mod.methodology)] }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Outcome: ", bold: true }), new docx.TextRun(mod.outcome)] }),
                ]),

                new docx.Paragraph({ text: "DELIVERY & EVALUATION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Delivery Method: ", bold: true }), new docx.TextRun(program.deliveryMethod)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "Evaluation Plan: ", bold: true }), new docx.TextRun(program.evaluationPlan)] }),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Capacity_Building_${program.programTitle.replace(/ /g, '_')}.docx`);
};

export const exportVisionFrameworkToDocx = async (framework: VisionFramework, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: "VISION FRAMEWORK",
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: framework.visionStatement, heading: docx.HeadingLevel.HEADING_2, alignment: docx.AlignmentType.CENTER }),
                new docx.Paragraph({ text: framework.tagline, style: "Quote", alignment: docx.AlignmentType.CENTER }),

                new docx.Paragraph({ text: "STRATEGIC PILLARS", heading: docx.HeadingLevel.HEADING_2 }),
                ...framework.strategicPillars.flatMap(pillar => [
                    new docx.Paragraph({ text: pillar.title, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ text: pillar.description, style: "Normal" }),
                    new docx.Paragraph({ text: "Key Initiatives:", bold: true }),
                    ...pillar.keyInitiatives.map(ki => new docx.Paragraph({ text: ki, bullet: { level: 0 }, style: "Normal" })),
                ]),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Vision_Framework.docx`);
};

export const exportDeepUnderstandingToDocx = async (data: UrbanDeepUnderstanding, logoBase64: string | null) => {
    const logoBuffer = getLogoBuffer(logoBase64);
    const doc = new docx.Document({
        styles: docStyles,
        sections: [{
            headers: { default: createStandardHeader(logoBuffer).options.default! },
            footers: { default: createStandardFooter().options.default! },
            children: [
                new docx.Paragraph({
                    text: "DEEP UNDERSTANDING BOARD",
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({
                    text: data.topic,
                    heading: docx.HeadingLevel.HEADING_2,
                    alignment: docx.AlignmentType.CENTER,
                }),
                new docx.Paragraph({ text: data.teacherPersona.intro, style: "Quote" }),

                new docx.Paragraph({ text: "STRATEGIC NODES", heading: docx.HeadingLevel.HEADING_2 }),
                ...data.stickyNotes.flatMap(note => [
                    new docx.Paragraph({ text: note.title, heading: docx.HeadingLevel.HEADING_3 }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Category: ", bold: true }), new docx.TextRun(note.category)] }),
                    new docx.Paragraph({ text: note.content, style: "Normal" }),
                    new docx.Paragraph({ children: [new docx.TextRun({ text: "Tags: ", bold: true }), new docx.TextRun(note.tags.join(", "))] }),
                ]),

                new docx.Paragraph({ text: "STRATEGIC INQUIRY", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: data.lessonInteraction.question, bold: true }),
                ...data.lessonInteraction.choices.map(choice => new docx.Paragraph({ text: choice, bullet: { level: 0 } })),
                
                new docx.Paragraph({ text: "CONCLUSION", heading: docx.HeadingLevel.HEADING_2 }),
                new docx.Paragraph({ text: data.teacherPersona.closing, style: "Quote" }),
            ],
        }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Deep_Understanding_${data.topic.replace(/\s+/g, '_')}.docx`);
};
