# 🤝 Contributing to Reggie - AI-Powered ESG Compliance Platform

Thank you for your interest in contributing to the Reggie AI-powered ESG compliance platform! This guide will help you get started with contributing to our mission of making ESG compliance more accessible and intelligent.

## 📋 Table of Contents

- [🌟 Ways to Contribute](#-ways-to-contribute)
- [🚀 Getting Started](#-getting-started)
- [💻 Development Setup](#-development-setup)
- [📝 Code Standards](#-code-standards)
- [🔄 Development Workflow](#-development-workflow)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [🤖 AI/ML Contributions](#-aiml-contributions)
- [📚 Documentation](#-documentation)
- [🐛 Issue Reporting](#-issue-reporting)
- [✨ Feature Requests](#-feature-requests)
- [👥 Code of Conduct](#-code-of-conduct)
- [❓ Getting Help](#-getting-help)

---

## 🌟 Ways to Contribute

### 🔧 **Code Contributions**
- Bug fixes and performance improvements
- New features and enhancements
- UI/UX improvements
- API optimizations
- Database schema improvements

### 🤖 **AI/ML Contributions**
- RAG pipeline improvements
- New prompt strategies
- Model fine-tuning techniques
- Vector store optimizations
- Embedding model improvements

### 📚 **Content & Standards**
- Adding new ESG standards
- Improving compliance mappings
- Updating regulatory documents
- Translating content

### 📖 **Documentation**
- API documentation
- User guides
- Developer tutorials
- Code comments
- README improvements

### 🐛 **Quality Assurance**
- Bug reporting
- Testing on different platforms
- Performance testing
- Security auditing

---

## 🚀 Getting Started

### Prerequisites
Before contributing, ensure you have:
- **Node.js 18+** installed
- **PostgreSQL 12+** running
- **Git** configured with your GitHub account
- **Bun** (recommended) or npm
- Basic knowledge of TypeScript/React

### Quick Setup
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/reggie-ai.git
cd reggie-ai

# Add upstream remote
git remote add upstream https://github.com/AshutoshVJTI/reggie-ai.git

# Run the setup script
./run.sh
```

---

## 💻 Development Setup

### 1. Environment Configuration
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend environment (if needed)
cp frontend/.env.example frontend/.env.local
```

### 2. Database Setup
```bash
cd backend
bun install
bun run db:generate
bun run db:push
bun run db:seed
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
bun run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4. Verify Setup
- Frontend: https://tryreggie.ai
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/swagger

---

## 📝 Code Standards

### 🎯 **General Principles**
- **Type Safety**: Use TypeScript for all new code
- **Consistency**: Follow existing code patterns
- **Readability**: Write self-documenting code
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

### 🔧 **TypeScript Standards**
```typescript
// ✅ Good: Explicit types and interfaces
interface ComplianceReport {
  id: string;
  standardId: string;
  score: number;
  gaps: ComplianceGap[];
  createdAt: Date;
}

// ✅ Good: Descriptive function names with types
async function analyzeDocumentCompliance(
  documentId: string,
  standardIds: string[]
): Promise<ComplianceReport> {
  // Implementation
}

// ❌ Avoid: Any types and unclear naming
function analyze(data: any): any {
  // Implementation
}
```

### 🎨 **React/Next.js Standards**
```tsx
// ✅ Good: Functional components with TypeScript
interface ReportCardProps {
  report: ComplianceReport;
  onView: (id: string) => void;
}

export function ReportCard({ report, onView }: ReportCardProps) {
  const handleViewClick = useCallback(() => {
    onView(report.id);
  }, [report.id, onView]);

  return (
    <Card className="p-4">
      <h3>{report.title}</h3>
      <Button onClick={handleViewClick}>View Report</Button>
    </Card>
  );
}
```

### 🗄️ **Database Standards**
```typescript
// ✅ Good: Prisma schema patterns
model ComplianceReport {
  id          String   @id @default(cuid())
  title       String
  score       Float
  standardId  String
  standard    Standard @relation(fields: [standardId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("compliance_reports")
}
```

### 🔧 **API Standards**
```typescript
// ✅ Good: RESTful endpoint patterns
app.get('/api/reports', async ({ query }) => {
  const { page = 1, limit = 10, standardId } = query;
  
  const reports = await getReports({
    page: Number(page),
    limit: Number(limit),
    standardId,
  });
  
  return { data: reports, meta: { page, limit } };
});
```

---

## 🔄 Development Workflow

### 1. **Branch Naming**
```bash
# Feature branches
git checkout -b feature/add-new-standard
git checkout -b feature/improve-rag-pipeline

# Bug fix branches  
git checkout -b fix/database-connection-issue
git checkout -b fix/chat-response-formatting

# Documentation branches
git checkout -b docs/api-documentation
git checkout -b docs/setup-guide
```

### 2. **Commit Messages**
Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat(rag): add new prompt strategy for compliance analysis"
git commit -m "feat(ui): add report sharing functionality"

# Bug fixes
git commit -m "fix(api): resolve database connection timeout issue"
git commit -m "fix(chat): handle empty responses gracefully"

# Documentation
git commit -m "docs(readme): update installation instructions"
git commit -m "docs(api): add endpoint examples"

# Refactoring
git commit -m "refactor(db): optimize query performance"
git commit -m "style(ui): improve button component styling"
```

### 3. **Pull Request Process**

#### Before Creating PR:
```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Rebase your feature branch
git checkout feature/your-feature
git rebase main

# Run tests and linting
cd backend && bun test
cd frontend && npm run lint
```

#### PR Template:
```markdown
## 📝 Description
Brief description of changes made.

## 🎯 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📚 Documentation
- [ ] Code comments added
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No console.log statements
- [ ] TypeScript types are proper
```

---

## 🧪 Testing Guidelines

### **Backend Testing**
```typescript
// Unit test example
import { describe, it, expect } from 'bun:test';
import { analyzeCompliance } from '../src/rag/compliance-analyzer';

describe('Compliance Analyzer', () => {
  it('should identify missing requirements', async () => {
    const document = await loadTestDocument();
    const result = await analyzeCompliance(document, 'tcfd');
    
    expect(result.gaps).toHaveLength(3);
    expect(result.score).toBeGreaterThan(0.7);
  });
});
```

### **Frontend Testing** (when implemented)
```tsx
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportCard } from '../components/ReportCard';

describe('ReportCard', () => {
  it('should call onView when button is clicked', () => {
    const mockOnView = jest.fn();
    const report = { id: '1', title: 'Test Report' };
    
    render(<ReportCard report={report} onView={mockOnView} />);
    
    fireEvent.click(screen.getByText('View Report'));
    expect(mockOnView).toHaveBeenCalledWith('1');
  });
});
```

### **Running Tests**
```bash
# Backend tests
cd backend
bun test

# Frontend tests (when available)
cd frontend
npm test

# E2E tests (future)
npm run test:e2e
```

---

## 🤖 AI/ML Contributions

### **RAG Pipeline Improvements**
```typescript
// Example: Custom prompt strategy
export class CompliancePromptStrategy implements PromptStrategy {
  name = 'compliance-v2';
  
  createPrompt(context: string, query: string): string {
    return `
    You are an ESG compliance expert. Analyze the following context against the query.
    
    Context: ${context}
    Query: ${query}
    
    Provide a structured analysis including:
    1. Compliance status
    2. Missing requirements
    3. Recommendations
    `;
  }
}
```

### **Model Fine-tuning Guidelines**
- Use versioned datasets in `training_data/`
- Document model performance metrics
- Include evaluation scripts
- Follow reproducible ML practices

### **Vector Store Contributions**
- Optimize embedding strategies
- Improve chunking algorithms
- Enhance retrieval accuracy
- Add new similarity metrics

---

## 📚 Documentation

### **Code Documentation**
```typescript
/**
 * Analyzes a document for compliance with specified ESG standards.
 * 
 * @param documentId - Unique identifier for the document
 * @param standardIds - Array of ESG standard IDs to check against
 * @param options - Optional analysis configuration
 * @returns Promise resolving to compliance analysis results
 * 
 * @example
 * ```typescript
 * const result = await analyzeDocumentCompliance(
 *   'doc-123',
 *   ['tcfd', 'gri'],
 *   { includeRecommendations: true }
 * );
 * ```
 */
export async function analyzeDocumentCompliance(
  documentId: string,
  standardIds: string[],
  options?: AnalysisOptions
): Promise<ComplianceReport> {
  // Implementation
}
```

### **API Documentation**
- Use OpenAPI/Swagger annotations
- Provide request/response examples
- Document error cases
- Include authentication details

### **User Documentation**
- Step-by-step guides with screenshots
- Common use cases and examples
- Troubleshooting sections
- Video tutorials (future)

---

## 🐛 Issue Reporting

### **Bug Reports**
Use the bug report template:

```markdown
## 🐛 Bug Description
Clear description of the bug.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## 💭 Expected Behavior
What should happen.

## 📱 Environment
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 95]
- Node.js: [e.g., 18.17.0]
- Database: [e.g., PostgreSQL 14]

## 📷 Screenshots
If applicable, add screenshots.

## 📋 Additional Context
Any other relevant information.
```

### **Performance Issues**
Include:
- Performance metrics (response times, memory usage)
- System specifications
- Dataset size information
- Browser DevTools screenshots

---

## ✨ Feature Requests

### **Feature Request Template**
```markdown
## 🚀 Feature Request

### Problem Statement
Describe the problem this feature would solve.

### Proposed Solution
Detailed description of the proposed feature.

### Alternatives Considered
Other solutions you've considered.

### Additional Context
- User stories
- Mockups/wireframes
- Technical considerations
```

### **Feature Prioritization**
Features are prioritized based on:
1. **Impact** - How many users benefit
2. **Effort** - Development complexity
3. **Strategic Value** - Alignment with project goals
4. **Community Interest** - Upvotes and discussion

---

## 👥 Code of Conduct

### **Our Standards**
- **Respectful**: Treat everyone with respect and kindness
- **Inclusive**: Welcome contributors from all backgrounds
- **Constructive**: Provide helpful feedback and suggestions
- **Professional**: Maintain professional communication
- **Collaborative**: Work together towards common goals

### **Unacceptable Behavior**
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Other unprofessional conduct

### **Enforcement**
Violations should be reported to the maintainers. We reserve the right to remove comments, commits, or contributors who violate our standards.

---

## ❓ Getting Help

### **Community Resources**
- 💬 **GitHub Discussions**: Ask questions and share ideas
- 🐛 **GitHub Issues**: Report bugs and request features  
- 📧 **Email**: [Contact maintainers](mailto:ashutosh@example.com)

### **Development Help**
- 📖 **Documentation**: Check existing docs first
- 🔍 **Search Issues**: Your question might be answered
- 💡 **Stack Overflow**: Tag questions with `esg-ai`

### **Getting Started Issues**
Look for issues labeled:
- `good first issue` - Perfect for new contributors
- `help wanted` - Community assistance needed
- `documentation` - Documentation improvements

---

## 🚀 Quick Start Checklist

- [ ] Fork the repository
- [ ] Set up development environment
- [ ] Read the codebase and understand the architecture
- [ ] Find a `good first issue` to work on
- [ ] Create a feature branch
- [ ] Make your changes following our standards
- [ ] Add tests for your changes
- [ ] Update documentation if needed
- [ ] Create a pull request
- [ ] Respond to review feedback

---

## 🙏 Recognition

Contributors will be recognized in:
- 📝 **README Contributors Section**
- 🎉 **Release Notes** for significant contributions
- 🏆 **Special Recognition** for major features or fixes

---

<div align="center">

**Thank you for contributing to a more sustainable future!** 🌱

</div>

---

*This document is inspired by the best practices from successful open-source projects and is continuously improved based on community feedback.* 