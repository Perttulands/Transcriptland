import { ParsedTemplate } from '../types/template';
import { FrameworkSegment } from '../types/phases';

/**
 * Regex-based parser that extracts structured sections from pasted
 * analysis-template text (typically copied from a Word document).
 *
 * Recognised headers (case-insensitive):
 *   "Context Understanding"  → contextUnderstanding
 *   "Tags:"                  → tags[]  (split on × U+00D7, commas, or newlines)
 *   "Analysis Objective"     → analysisObjective
 *   "ANALYSIS FRAMEWORK:"    → FrameworkSegment[] (sub-sections)
 *   "Hypothesis N:"          → FrameworkSegment per hypothesis
 */

// ── helpers ────────────────────────────────────────────────────────
function extractSection(text: string, headerPattern: RegExp): string {
    const match = headerPattern.exec(text);
    if (!match) return '';
    const start = match.index + match[0].length;
    // Grab everything until the next major header or end-of-string
    const rest = text.slice(start);
    const nextHeader = rest.search(
        /\n\s*(?:context understanding|tags\s*:|analysis objective|analysis framework\s*:|hypothesis\s+\d|if missing)/i
    );
    return (nextHeader === -1 ? rest : rest.slice(0, nextHeader)).trim();
}

function parseTags(raw: string): string[] {
    // Split on × (U+00D7), regular x between words, commas, or newlines
    return raw
        .split(/[\u00d7,\n]+/)
        .map(t => t.trim())
        .filter(Boolean);
}

function parseFrameworkBlock(block: string): FrameworkSegment[] {
    const segments: FrameworkSegment[] = [];

    // Try to split by numbered or titled sub-sections:
    //   "1. Title" or "Title\nObjective(s):" patterns
    const subSections = block.split(/\n(?=\d+\.\s|\w[\w\s]*:\s*\n)/);

    for (const sub of subSections) {
        const trimmed = sub.trim();
        if (!trimmed) continue;

        // Try "N. Title" pattern
        const numberedMatch = trimmed.match(/^\d+\.\s*(.+)/);
        const title = numberedMatch ? numberedMatch[1].split('\n')[0].trim() : trimmed.split('\n')[0].trim();

        if (!title) continue;

        // Extract Objective(s) sub-field
        const objMatch = trimmed.match(/objective(?:s)?\s*:\s*([\s\S]*?)(?=guidance\s*:|$)/i);
        const objective = objMatch ? objMatch[1].trim() : '';

        // Extract Guidance sub-field
        const guidanceMatch = trimmed.match(/guidance\s*:\s*([\s\S]*?)$/i);
        const guidance = guidanceMatch ? guidanceMatch[1].trim() : '';

        if (objective || guidance) {
            segments.push({
                id: `imported-${Date.now()}-${segments.length}`,
                title,
                objective: objective || title,
                guidance: guidance || 'Analyze this section based on the transcript.',
                order: segments.length,
            });
        }
    }

    return segments;
}

function parseHypotheses(text: string): FrameworkSegment[] {
    const segments: FrameworkSegment[] = [];
    const hypothesisRegex = /hypothesis\s+(\d+)\s*:\s*([\s\S]*?)(?=hypothesis\s+\d|if missing|analysis framework|$)/gi;

    let match: RegExpExecArray | null;
    while ((match = hypothesisRegex.exec(text)) !== null) {
        const body = match[2].trim();
        const firstLine = body.split('\n')[0].trim();
        segments.push({
            id: `hypothesis-${Date.now()}-${segments.length}`,
            title: `Hypothesis ${match[1]}`,
            objective: firstLine || body.slice(0, 200),
            guidance: body.length > firstLine.length ? body.slice(firstLine.length).trim() : 'Evaluate this hypothesis against the transcript evidence.',
            order: segments.length,
        });
    }

    return segments;
}

function parseIfMissing(text: string): FrameworkSegment[] {
    const ifMissingMatch = /if missing\s*[:\-]?\s*([\s\S]*?)(?=hypothesis\s+\d|analysis framework|$)/i.exec(text);
    if (!ifMissingMatch) return [];

    const body = ifMissingMatch[1].trim();
    if (!body) return [];

    // Split on bullet points or newlines
    const items = body.split(/\n[-•*]\s*|\n\d+\.\s*/).map(s => s.trim()).filter(Boolean);

    return items.map((item, i) => ({
        id: `supplementary-${Date.now()}-${i}`,
        title: item.split(/[.!?]/)[0].trim() || `Supplementary ${i + 1}`,
        objective: item,
        guidance: 'Supplementary analysis — explore this angle if not already covered.',
        order: i,
    }));
}

// ── main parser ────────────────────────────────────────────────────
export function parseTemplate(text: string): ParsedTemplate {
    const contextUnderstanding = extractSection(
        text,
        /context understanding\s*[:\-]?\s*/i
    );

    const tagsRaw = extractSection(text, /tags\s*:\s*/i);
    const tags = parseTags(tagsRaw);

    const analysisObjective = extractSection(
        text,
        /analysis objective\s*[:\-]?\s*/i
    );

    // Framework segments
    const frameworkRaw = extractSection(text, /analysis framework\s*:\s*/i);
    let frameworkSegments = parseFrameworkBlock(frameworkRaw);

    // Hypothesis-based segments (merged in)
    const hypothesisSegments = parseHypotheses(text);
    if (hypothesisSegments.length > 0) {
        // Re-number combined list
        const combined = [...frameworkSegments, ...hypothesisSegments];
        frameworkSegments = combined.map((seg, i) => ({ ...seg, order: i }));
    }

    // "If missing" supplementary segments
    const supplementary = parseIfMissing(text);
    if (supplementary.length > 0) {
        const base = frameworkSegments.length;
        frameworkSegments = [
            ...frameworkSegments,
            ...supplementary.map((seg, i) => ({ ...seg, order: base + i })),
        ];
    }

    return { contextUnderstanding, tags, analysisObjective, frameworkSegments };
}

export const templateParser = { parseTemplate };
