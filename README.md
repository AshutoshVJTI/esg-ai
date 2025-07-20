# 🌱 Reggie - AI-Powered ESG Compliance Platform

> **A comprehensive AI-powered platform for ESG (Environmental, Social, and Governance) compliance analysis and reporting**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

![Reggie - AI-Powered ESG Compliance Platform](https://img.shields.io/badge/Reggie-AI_Powered_ESG_Compliance-green?style=for-the-badge)

---

## 🎯 **Overview**

Transform your ESG compliance workflow with Reggie's intelligent AI analysis. This platform helps organizations analyze sustainability reports against multiple international standards, identify compliance gaps, and generate actionable insights using cutting-edge RAG (Retrieval-Augmented Generation) technology.

### 🚀 **Quick Demo**
```bash
git clone https://github.com/AshutoshVJTI/esg-ai.git
cd esg-ai
./run.sh
```
*Visit http://localhost:3000 to explore the platform*

---

## ✨ **Key Features**

### 🔍 **Multi-Standard Compliance Analysis**
| Standard | Description | Coverage |
|----------|-------------|----------|
| **TCFD** | Task Force on Climate-related Financial Disclosures | ✅ Complete |
| **ESRS** | European Sustainability Reporting Standards | ✅ Complete |
| **GRI** | Global Reporting Initiative | ✅ Complete |
| **SASB** | Sustainability Accounting Standards Board | ✅ Complete |
| **SEC** | Climate Disclosure Rules | ✅ Complete |
| **CDP** | Carbon Disclosure Project | ✅ Complete |
| **SFDR** | Sustainable Finance Disclosure Regulation | ✅ Complete |
| **EU Taxonomy** | EU Sustainable Activities Classification | ✅ Complete |

### 🤖 **Advanced AI Pipeline**
- **🔗 RAG (Retrieval-Augmented Generation)** - Accurate compliance checking with citations
- **🧠 Multiple LLM Support** - OpenAI GPT-4, local models, and custom fine-tuned models
- **🛡️ Anti-Hallucination Guardrails** - Advanced prompt strategies to ensure accuracy
- **📊 Document Intelligence** - Smart text extraction from PDF, DOCX, XLSX
- **🎯 Semantic Search** - ChromaDB-powered vector similarity matching
- **📈 Compliance Scoring** - Quantitative gap analysis and recommendations

### 📊 **Enterprise Dashboard**
- **💬 Interactive Chat Interface** - Ask questions about ESG compliance in natural language
- **📈 Real-time Visualizations** - Compliance scores, trend analysis, and progress tracking
- **📋 Automated Report Generation** - PDF exports with executive summaries
- **🔗 Secure Sharing** - Token-based report sharing for stakeholders
- **🗂️ Document Management** - Centralized storage with intelligent categorization
- **📱 Responsive Design** - Works seamlessly across desktop, tablet, and mobile

---

## 🏗️ **Architecture & Tech Stack**

### 🎨 **Frontend** (Port 3000)
```
Framework:     Next.js 13 (App Router)
Language:      TypeScript
Styling:       Tailwind CSS + Radix UI
Charts:        Recharts
PDF Viewer:    React-PDF
Forms:         React Hook Form + Zod
State:         React Context + Hooks
```

### ⚙️ **Backend** (Port 3001)
```
Framework:     Elysia (Bun-optimized)
Language:      TypeScript
Database:      PostgreSQL + Prisma ORM
AI/ML:         LangChain + OpenAI
Vector Store:  ChromaDB
File Processing: PDF-Parse, Mammoth, XLSX
API Docs:      Swagger/OpenAPI
```

### 🤖 **AI/ML Pipeline**
```mermaid
graph LR
    A[Document Upload] --> B[Text Extraction]
    B --> C[Semantic Chunking]
    C --> D[Vector Embeddings]
    D --> E[ChromaDB Storage]
    
    F[User Query] --> G[Similarity Search]
    E --> G
    G --> H[Context Retrieval]
    H --> I[LLM Analysis]
    I --> J[Compliance Report]
```

### 🐳 **Infrastructure**
- **Docker** - Containerized deployment with multi-stage builds
- **PostgreSQL** - Reliable ACID-compliant data storage
- **Prisma** - Type-safe database access and migrations
- **Bun** - Fast JavaScript runtime and package manager

---

## 🚀 **Quick Start**

### Option 1: One-Click Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/AshutoshVJTI/esg-ai.git
cd esg-ai

# Make script executable and run
chmod +x run.sh
./run.sh
```

**The script will:**
1. ✅ Check system dependencies
2. 📦 Install packages automatically  
3. 🗄️ Setup PostgreSQL database
4. 🚀 Start both frontend and backend
5. 🌐 Open http://localhost:3000

### Option 2: Manual Setup

#### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Bun** (recommended) - [Install](https://bun.sh/) or use npm

#### Backend Setup
```bash
cd backend

# Install dependencies
bun install  # or npm install

# Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Database setup
bun run db:generate  # Generate Prisma client
bun run db:push      # Create database schema  
bun run db:seed      # Seed with sample data

# Start development server
bun run dev          # Backend runs on http://localhost:3001
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev          # Frontend runs on http://localhost:3000
```

### Option 3: Docker (Experimental)
```bash
# Ensure Docker is running
docker --version
docker-compose --version

# Start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

---

## 🌍 **Environment Configuration**

### Backend Environment (.env)
```bash
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/reggie_db"

# AI Configuration (Optional)
OPENAI_API_KEY="sk-your-openai-key-here"

# Application Settings
NODE_ENV="development"
PORT=3001

# ChromaDB Configuration
CHROMA_HOST="localhost"
CHROMA_PORT=8000
```

### Frontend Environment
```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Optional: Analytics
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

---

## 📖 **Usage Guide**

### 1. 📤 **Upload Documents**
- Navigate to **Upload** page
- Drag & drop or select PDF/DOCX/XLSX files
- Documents are automatically processed and indexed
- View processing status in real-time

### 2. 📊 **Analyze Compliance**
- Go to **Reports** to view analysis results
- Each report shows:
  - Compliance score breakdown
  - Identified gaps and missing requirements
  - Actionable recommendations
  - Citations to source documents

### 3. 💬 **Interactive Chat**
- Use the chat interface for specific questions
- Ask about compliance requirements
- Get instant answers with document citations
- Export conversations as reports

### 4. 📚 **Browse Standards**
- **Standards** page contains all regulatory frameworks
- Search by keyword, region, or industry
- View detailed requirement mappings
- Compare different standards side-by-side

### 5. 📋 **Generate Reports**
- Create executive summaries
- Export to PDF with custom branding
- Share reports with secure token links
- Schedule automated compliance checks

---

## 🔗 **API Documentation**

Once running, access interactive API documentation:
- **Swagger UI**: http://localhost:3001/swagger
- **JSON Schema**: http://localhost:3001/swagger/json

### Key Endpoints
```typescript
// Document Analysis
POST   /api/reports/upload      // Upload and analyze documents
GET    /api/reports             // List all compliance reports
GET    /api/reports/:id         // Get specific report details

// AI Chat Interface  
POST   /api/chat                // Send message to AI assistant
GET    /api/chat/history        // Retrieve chat history

// Standards Management
GET    /api/standards           // Browse ESG standards
GET    /api/standards/:id       // Get standard details
POST   /api/standards/search    // Search standards content

// Model Management
POST   /api/finetuning/start    // Start model fine-tuning
GET    /api/finetuning/status   // Check training status
```

---

## 🛠️ **Development**

### Project Structure
```
carbon-emissions-compliance-ai/
├── backend/                    # API server and AI pipeline
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── rag/              # RAG pipeline components  
│   │   ├── repositories/     # Data access layer
│   │   └── lib/              # Utilities and database
│   ├── prisma/               # Database schema and migrations
│   ├── uploads/              # Document storage
│   └── temp/                 # Temporary processing files
├── frontend/                  # Next.js web application
│   ├── app/                  # App router pages
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Frontend utilities
│   └── public/               # Static assets
├── standards/                 # ESG standard documents
├── esg_corpus/               # Additional regulatory documents
├── docker-compose.yml        # Docker orchestration
└── run.sh                    # One-click setup script
```

### Available Scripts

#### Backend
```bash
bun run dev              # Start development server with hot reload
bun run build            # Build for production
bun run start:prod       # Start production server
bun run test             # Run test suite
bun run lint             # Lint and fix code
bun run format           # Format code with Prettier

# Database Management
bun run db:generate      # Generate Prisma client
bun run db:push          # Push schema changes
bun run db:studio        # Open Prisma Studio
bun run db:seed          # Seed database

# RAG Pipeline Management  
bun run rag:process      # Process documents into vector store
bun run rag:query        # Test RAG pipeline
bun run rag:stats        # Show vector store statistics
bun run rag:reset        # Reset vector store
```

#### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
```

### Testing
```bash
# Backend tests
cd backend
bun test

# Frontend tests (if configured)
cd frontend  
npm test
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### **Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify connection string
psql "postgresql://username:password@localhost:5432/carbon_emissions_db"

# Reset database
bun run db:push --force-reset
```

#### **Docker Issues**
```bash
# Fix Docker credentials (macOS)
./fix-docker-credentials.sh

# Reset Docker state
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### **Node.js Version Issues**
```bash
# Check version
node --version  # Should be 18+

# Use nvm to switch versions
nvm install 18
nvm use 18
```

### Getting Help
- 🐛 **Issues**: [GitHub Issues](https://github.com/AshutoshVJTI/esg-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/AshutoshVJTI/esg-ai/discussions)
- 📧 **Email**: [Contact Developer](mailto:ashutosh@example.com)

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript** for all new code
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Unit tests** for critical functionality

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🔮 **Roadmap**

### 🚧 **In Progress**
- [ ] Advanced model fine-tuning interface
- [ ] Real-time collaborative editing
- [ ] Mobile application (React Native)

### 📋 **Planned Features**
- [ ] Additional ESG frameworks (ISSB, CDSB)
- [ ] Multi-language support (Spanish, French, German)
- [ ] Advanced data visualization dashboards
- [ ] Integration with major ESG data providers
- [ ] Enterprise SSO/SAML integration
- [ ] Automated regulatory update notifications
- [ ] API rate limiting and enterprise scaling

### 💡 **Future Innovations**
- [ ] Blockchain-based compliance verification
- [ ] IoT sensor data integration
- [ ] Predictive compliance risk modeling
- [ ] AR/VR data visualization
- [ ] Voice-activated compliance queries

---

## 🌟 **Acknowledgments**

- **OpenAI** - For GPT models and embeddings
- **LangChain** - For RAG pipeline framework
- **Prisma** - For database ORM and migrations
- **Vercel** - For Next.js framework
- **ChromaDB** - For vector storage
- **Radix UI** - For accessible component primitives

---

## 📊 **Project Stats**

![GitHub stars](https://img.shields.io/github/stars/AshutoshVJTI/esg-ai?style=social)
![GitHub forks](https://img.shields.io/github/forks/AshutoshVJTI/esg-ai?style=social)
![GitHub issues](https://img.shields.io/github/issues/AshutoshVJTI/esg-ai)
![GitHub license](https://img.shields.io/github/license/AshutoshVJTI/esg-ai)

---

<div align="center">

**Built with ❤️ for a more sustainable future** 🌍

[⭐ Star this project](https://github.com/AshutoshVJTI/esg-ai) • [🐛 Report Bug](https://github.com/AshutoshVJTI/esg-ai/issues) • [💡 Request Feature](https://github.com/AshutoshVJTI/esg-ai/issues)

</div> 