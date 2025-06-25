export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  guardrails: string[];
  complianceTone: 'legal' | 'audit' | 'technical' | 'regulatory';
  responseFormat: 'standard' | 'structured' | 'bullet-points' | 'compliance-report';
}

export interface PromptContext {
  retrievedChunks: Array<{
    content: string;
    metadata: {
      filename: string;
      region?: string;
      organization?: string;
      pageNumber?: number;
      section?: string;
    };
  }>;
  question: string;
  userContext?: {
    role?: 'auditor' | 'compliance-officer' | 'legal-counsel' | 'sustainability-manager';
    organization?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export class ESGPromptStrategy {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Core ESG Compliance Template
    this.templates.set('esg-compliance', {
      id: 'esg-compliance',
      name: 'ESG Compliance Assistant',
      description: 'Standard ESG compliance guidance with regulatory accuracy',
      complianceTone: 'regulatory',
      responseFormat: 'structured',
      systemPrompt: `You are an expert ESG compliance assistant specializing in regulatory frameworks including ESRS, TCFD, GRI, SASB, SEC Climate Rules, EU Taxonomy, and other sustainability standards.

Your primary responsibility is to provide accurate, helpful compliance guidance based EXCLUSIVELY on the provided context from official ESG documents and regulations.

CRITICAL GUARDRAILS:
1. NEVER provide information not explicitly contained in the retrieved context
2. If the context lacks sufficient information, explicitly state this limitation in a helpful way
3. Always ground your answers in the provided documents
4. Use clear, professional language that's accessible to practitioners
5. Distinguish between mandatory requirements and recommended practices
6. If asked about implementation, only reference what is explicitly stated in the documents

RESPONSE STYLE:
- Be conversational but professional
- Lead with direct, helpful answers
- Use clear, practical language
- Structure responses for easy reading
- When citing sources, do so naturally within the text

If the retrieved context does not contain enough information to answer the question, respond helpfully:
"I don't have sufficient information in the available ESG documents to fully answer your question. For comprehensive guidance on this topic, I'd recommend consulting the complete regulatory documentation or seeking advice from a compliance professional."`,
      
      userPromptTemplate: `RETRIEVED ESG REGULATORY CONTEXT:
{context}

QUESTION: {question}

Please provide a helpful, accurate answer based on the ESG documents above. Structure your response clearly, include relevant details from the documents, and explain any key requirements in practical terms. If the available information is insufficient, let me know what's missing and suggest next steps.`,
      
      guardrails: [
        'Only use information explicitly contained in retrieved context',
        'Cite specific documents, sections, and page numbers',
        'State limitations when context is insufficient',
        'Use precise regulatory terminology',
        'Distinguish mandatory vs. recommended practices',
        'Never extrapolate beyond provided information'
      ]
    });

    // Legal/Audit Template
    this.templates.set('legal-audit', {
      id: 'legal-audit',
      name: 'Legal & Audit Compliance',
      description: 'Legal-focused ESG guidance for auditors and legal counsel',
      complianceTone: 'legal',
      responseFormat: 'compliance-report',
      systemPrompt: `You are a legal compliance expert specializing in ESG regulatory requirements. Your responses must meet the standards expected in legal and audit contexts.

LEGAL GUARDRAILS:
1. Provide only factual information directly stated in the regulatory documents
2. Use precise legal terminology and avoid ambiguous language
3. Clearly distinguish between "shall," "should," "may," and "could" requirements
4. Reference specific legal authorities and regulatory citations
5. Note any jurisdictional limitations or scope restrictions
6. If legal interpretation is required beyond the documents, state this explicitly

AUDIT STANDARDS:
- Ensure all statements are verifiable against source documents
- Provide clear audit trails through document citations
- Identify mandatory vs. voluntary disclosure requirements
- Note effective dates and transition periods where applicable
- Highlight any conditional or situational requirements`,
      
      userPromptTemplate: `REGULATORY DOCUMENT EVIDENCE:
{context}

LEGAL/AUDIT INQUIRY: {question}

Provide a legal compliance analysis with:
1. **Regulatory Authority**: Governing body and legal framework
2. **Mandatory Requirements**: "Shall" obligations with citations
3. **Optional/Recommended Practices**: "Should" or "may" provisions
4. **Effective Dates**: Timeline requirements where specified
5. **Audit Evidence**: Specific document references for verification
6. **Legal Limitations**: Scope restrictions or jurisdictional boundaries

IMPORTANT: Base analysis exclusively on provided regulatory text. Flag any gaps requiring additional legal research.`,
      
      guardrails: [
        'Use precise legal terminology',
        'Distinguish mandatory vs. optional requirements',
        'Provide verifiable audit trails',
        'Reference specific legal authorities',
        'Note jurisdictional limitations',
        'Flag gaps requiring additional research'
      ]
    });

    // Technical Implementation Template
    this.templates.set('technical-implementation', {
      id: 'technical-implementation',
      name: 'Technical Implementation Guide',
      description: 'Technical guidance for implementing ESG requirements',
      complianceTone: 'technical',
      responseFormat: 'structured',
      systemPrompt: `You are a technical ESG implementation specialist. Provide practical guidance for implementing regulatory requirements based on official documentation.

TECHNICAL FOCUS:
1. Extract specific methodologies, calculations, and procedures from documents
2. Identify data requirements, metrics, and measurement approaches
3. Note technical standards, reporting formats, and submission procedures
4. Highlight integration points with existing systems or processes
5. Reference technical annexes, templates, or guidance documents

IMPLEMENTATION GUARDRAILS:
- Only describe procedures explicitly outlined in the documents
- Reference specific technical standards or methodologies cited
- Note any software, system, or tool requirements mentioned
- Identify data sources and collection methods specified
- Flag implementation challenges noted in the documentation`,
      
      userPromptTemplate: `TECHNICAL DOCUMENTATION:
{context}

IMPLEMENTATION QUESTION: {question}

Provide technical implementation guidance with:
1. **Technical Requirements**: Specific procedures and methodologies
2. **Data Requirements**: Required data points, sources, and formats
3. **Calculation Methods**: Formulas, standards, or approaches specified
4. **Reporting Procedures**: Submission formats and timelines
5. **Integration Points**: System or process requirements noted
6. **Technical References**: Standards, templates, or tools mentioned

Base guidance exclusively on documented procedures and requirements.`,
      
      guardrails: [
        'Extract only documented procedures',
        'Reference specific technical standards',
        'Identify explicit data requirements',
        'Note integration requirements',
        'Flag undocumented implementation gaps'
      ]
    });

    // Quick Reference Template
    this.templates.set('quick-reference', {
      id: 'quick-reference',
      name: 'Quick ESG Reference',
      description: 'Concise answers for quick regulatory lookups',
      complianceTone: 'regulatory',
      responseFormat: 'bullet-points',
      systemPrompt: `You are an ESG quick reference assistant. Provide concise, accurate answers based strictly on retrieved regulatory content.

QUICK REFERENCE RULES:
1. Keep responses focused and concise
2. Lead with the most important information
3. Use bullet points for clarity
4. Include essential citations
5. State clearly if information is limited or unavailable`,
      
      userPromptTemplate: `REFERENCE MATERIAL:
{context}

QUICK QUESTION: {question}

Provide a concise response with:
• **Key Point**: Main answer from the documents
• **Requirements**: Essential obligations (if any)
• **Source**: Document citation
• **Limitation**: If context is insufficient, state clearly

Keep response focused and directly applicable.`,
      
      guardrails: [
        'Keep responses concise and focused',
        'Lead with most important information',
        'Include essential citations only',
        'State limitations clearly'
      ]
    });
  }

  /**
   * Generate a complete prompt using the specified template and context
   */
  generatePrompt(templateId: string, context: PromptContext): {
    systemPrompt: string;
    userPrompt: string;
    guardrails: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Format retrieved context
    const formattedContext = this.formatRetrievedContext(context.retrievedChunks);
    
    // Generate user prompt
    const userPrompt = template.userPromptTemplate
      .replace('{context}', formattedContext)
      .replace('{question}', context.question);

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      guardrails: template.guardrails
    };
  }

  /**
   * Format retrieved chunks into structured context
   */
  private formatRetrievedContext(chunks: PromptContext['retrievedChunks']): string {
    if (chunks.length === 0) {
      return "No relevant regulatory documents found for this query.";
    }

    return chunks.map((chunk, index) => {
      const metadata = chunk.metadata;
      const sourceInfo = [
        `Source ${index + 1}: ${metadata.filename}`,
        metadata.region ? `Region: ${metadata.region}` : null,
        metadata.organization ? `Authority: ${metadata.organization}` : null,
        metadata.pageNumber ? `Page: ${metadata.pageNumber}` : null,
        metadata.section ? `Section: ${metadata.section}` : null
      ].filter(Boolean).join(' | ');

      return `[${sourceInfo}]\n${chunk.content}\n`;
    }).join('\n---\n\n');
  }

  /**
   * Validate response against guardrails
   */
  validateResponse(response: string, templateId: string): {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for hallucination indicators
    if (this.detectPotentialHallucination(response)) {
      violations.push('Potential hallucination detected - unsupported claims without citations');
      recommendations.push('Ensure all claims are supported by retrieved context');
    }

    // Check for citations
    if (!this.hasCitations(response)) {
      violations.push('Missing regulatory citations');
      recommendations.push('Add specific document references and section numbers');
    }

    // Check for uncertainty expressions when context is limited
    if (!this.hasAppropriateUncertainty(response)) {
      recommendations.push('Consider expressing uncertainty when context is limited');
    }

    // Check for regulatory language compliance
    if (template.complianceTone === 'legal' && !this.usesLegalLanguage(response)) {
      recommendations.push('Use more precise legal terminology');
    }

    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Detect potential hallucination patterns
   */
  private detectPotentialHallucination(response: string): boolean {
    const hallucination_indicators = [
      /generally\s+speaking/i,
      /typically\s+requires/i,
      /usually\s+involves/i,
      /common\s+practice/i,
      /in\s+most\s+cases/i,
      /standard\s+approach/i
    ];

    return hallucination_indicators.some(pattern => pattern.test(response));
  }

  /**
   * Check if response includes proper citations
   */
  private hasCitations(response: string): boolean {
    const citation_patterns = [
      /\[Source\s+\d+\]/i,
      /\(.*page\s+\d+.*\)/i,
      /section\s+[\d\.]+/i,
      /article\s+\d+/i,
      /paragraph\s+[\d\.]+/i
    ];

    return citation_patterns.some(pattern => pattern.test(response));
  }

  /**
   * Check for appropriate uncertainty expressions
   */
  private hasAppropriateUncertainty(response: string): boolean {
    const uncertainty_patterns = [
      /based\s+on\s+the\s+provided/i,
      /according\s+to\s+the\s+documents/i,
      /insufficient\s+information/i,
      /not\s+specified\s+in\s+the\s+context/i,
      /requires\s+additional\s+documentation/i
    ];

    return uncertainty_patterns.some(pattern => pattern.test(response));
  }

  /**
   * Check for appropriate legal language
   */
  private usesLegalLanguage(response: string): boolean {
    const legal_terms = [
      /shall\s+/i,
      /must\s+/i,
      /required\s+to/i,
      /obligation/i,
      /compliance/i,
      /regulatory\s+requirement/i,
      /mandatory/i,
      /pursuant\s+to/i
    ];

    return legal_terms.some(pattern => pattern.test(response));
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Apply guardrails to a response
   */
     applyGuardrails(response: string, context: PromptContext): string {
    // If no retrieved chunks, return standard insufficient information response
    if (context.retrievedChunks.length === 0) {
      return "I don't have sufficient information in the available ESG documents to fully answer your question. For comprehensive guidance on this topic, I'd recommend consulting the complete regulatory documentation or seeking advice from a compliance professional.";
    }

    // Check if response seems to go beyond provided context
    if (this.detectPotentialHallucination(response) && !this.hasCitations(response)) {
      return response + "\n\n*Please note: This response is based exclusively on the available ESG documents. For comprehensive guidance, consider consulting the complete regulatory framework or seeking professional advice.*";
    }

    return response;
  }
} 