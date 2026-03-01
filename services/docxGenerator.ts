import * as docx from 'docx';
import saveAs from 'file-saver';
import type { RFPContent } from '../types';

const TanmyaaLogoDefault = `iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVHhe7cEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAB8G4IAAAE2lV8dAAAAAElFTkSuQmCC`;


export const exportRFPToDocx = async (rfpContent: RFPContent, logoBase64: string | null) => {
    const logoBuffer = logoBase64 
        ? Uint8Array.from(atob(logoBase64.split(',')[1]), c => c.charCodeAt(0))
        : Uint8Array.from(atob(TanmyaaLogoDefault), c => c.charCodeAt(0));

    const doc = new docx.Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 32, // 16pt
                        bold: true,
                        color: "2E74B5",
                    },
                    paragraph: {
                        spacing: { after: 240 }, // 12pt
                    },
                },
                 {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 26, // 13pt
                        bold: true,
                        color: "2E74B5",
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 },
                    },
                },
            ],
        },
        sections: [{
            headers: {
                default: new docx.Header({
                    children: [
                        new docx.Paragraph({
                            children: [
                                new docx.ImageRun({
                                    data: logoBuffer,
                                    transformation: {
                                        width: 100,
                                        height: 25,
                                    },
                                }),
                            ],
                            alignment: docx.AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            footers: {
                default: new docx.Footer({
                    children: [
                        new docx.Paragraph({
                             alignment: docx.AlignmentType.CENTER,
                             children: [
                                new docx.TextRun({
                                    children: [docx.PageNumber.CURRENT, " | ", docx.PageNumber.TOTAL_PAGES],
                                    size: 16, // 8pt
                                    color: "808080"
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new docx.Paragraph({
                    text: rfpContent.title,
                    heading: docx.HeadingLevel.HEADING_1,
                    alignment: docx.AlignmentType.CENTER,
                }),
                ...rfpContent.sections.flatMap(section => [
                    new docx.Paragraph({
                        text: section.title,
                        heading: docx.HeadingLevel.HEADING_2,
                    }),
                    ...section.content.flatMap(part => {
                        if (part.paragraph) {
                            return [new docx.Paragraph({ text: part.paragraph, spacing: { after: 120 } })];
                        }
                        if (part.list && part.list.length > 0) {
                            return part.list.map(item => new docx.Paragraph({
                                text: item,
                                bullet: { level: 0 },
                                spacing: { after: 80 }
                            }));
                        }
                        return [];
                    })
                ])
            ],
        }],
    });

    try {
        const blob = await docx.Packer.toBlob(doc);
        saveAs(blob, `${rfpContent.title.replace(/ /g, '_')}.docx`);
    } catch (error) {
        console.error("Error generating DOCX file:", error);
    }
};