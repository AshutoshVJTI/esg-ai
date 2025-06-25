# 🌱 Carbon Emissions Compliance AI

A comprehensive AI-powered platform for ESG (Environmental, Social, and Governance) compliance analysis and reporting. This application helps organizations analyze their sustainability reports against multiple international standards and frameworks.

## ✨ Features

### 🔍 **Multi-Standard Compliance Analysis**
- **TCFD** (Task Force on Climate-related Financial Disclosures)
- **ESRS** (European Sustainability Reporting Standards)
- **GRI** (Global Reporting Initiative)
- **SASB** (Sustainability Accounting Standards Board)
- **SEC** Climate Disclosure Rules
- **CDP**, **SFDR**, **EU Taxonomy**, and more

### 🤖 **AI-Powered Analysis**
- **RAG (Retrieval-Augmented Generation)** pipeline for accurate compliance checking
- **Multiple LLM Integration** (OpenAI, local models)
- **Advanced Prompt Strategies** with guardrails against hallucination
- **Document Intelligence** with text extraction and semantic search
- **Compliance Scoring** and gap analysis

### 📊 **Comprehensive Dashboard**
- **Interactive Compliance Reports** with visualizations
- **Real-time Chat Interface** for asking ESG questions
- **Document Upload & Analysis** (PDF, Word, Excel)
- **Standards Library** with searchable regulatory documents
- **Historical Analysis** and progress tracking

### 🔧 **Enterprise Features**
- **Model Fine-tuning** capabilities for organization-specific compliance
- **Multi-format Export** (PDF, JSON, CSV)
- **API Access** for integration with existing systems
- **Report Sharing** with secure token-based access
- **Audit Trail** and compliance history

## 🚀 Quick Start

### One-Command Setup

Simply run our setup script and choose your preferred method:

```bash
./run.sh
```

The script will:
1. ✅ Check for required dependencies
2. 📦 Install packages automatically
3. 🗄️ Set up the database
4. 🚀 Start both frontend and backend
5. 🌐 Open the application at http://localhost:3000

### Setup Options

**Option 1: Local Development (Recommended)**
- Requires Node.js 18+, PostgreSQL
- Best performance and compatibility
- Supports both bun and npm package managers
- Ideal for development and customization

**Option 2: Docker (Experimental)**
- Includes PostgreSQL database automatically
- May have dependency conflicts with some packages
- Use if you prefer containerized setup

## 🏗️ Architecture

### Backend (Port 3001)
- **Framework**: Elysia (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: LangChain with multiple LLM providers
- **Vector Store**: ChromaDB for semantic search
- **File Processing**: Support for PDF, DOCX, XLSX

### Frontend (Port 3000)
- **Framework**: Next.js 13 with App Router
- **UI**: Tailwind CSS + Radix UI components
- **Charts**: Recharts for data visualization
- **PDF Viewing**: React-PDF for document display
- **Forms**: React Hook Form with Zod validation

### AI Pipeline
```
Documents → Text Extraction → Chunking → Embeddings → Vector Store
                                                          ↓
User Query → Retrieval → Context → LLM → Compliance Analysis
```

## 📁 Project Structure

```
carbon-emissions-compliance-ai/
├── backend/                 # API server and AI pipeline
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── rag/           # RAG pipeline components
│   │   ├── repositories/   # Data access layer
│   │   └── lib/           # Utilities and database
│   ├── prisma/            # Database schema and migrations
│   └── uploads/           # Document storage
├── frontend/               # Next.js web application
│   ├── app/               # App router pages
│   ├── components/        # Reusable UI components
│   └── lib/               # Frontend utilities
├── standards/             # ESG standard documents
├── esg_corpus/           # Additional regulatory documents
└── run.sh                # One-click setup script
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Bun (recommended) or npm

### Backend Setup
```bash
cd backend
bun install                    # or npm install
cp .env.example .env          # Configure your environment
bun run db:generate           # Generate Prisma client
bun run db:push              # Create database schema
bun run db:seed              # Seed with initial data
bun run dev                  # Start development server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                  # Start development server
```

## 🌍 Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/carbon_emissions_db"
OPENAI_API_KEY="your-openai-api-key"  # Optional: for enhanced AI features
```

### Frontend
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"  # Backend URL
```

## 📖 Usage

### 1. Upload Documents
- Navigate to the Upload page
- Drop PDF/DOCX files or select from file browser
- Documents are automatically processed and indexed

### 2. Analyze Compliance
- Go to Reports to view analysis results
- Each report shows compliance gaps and recommendations
- Use the chat interface to ask specific questions

### 3. Browse Standards
- Standards page contains all regulatory frameworks
- Search and filter by region, industry, or topic
- Each standard is processed for AI-powered matching

### 4. Export Reports
- Generate PDF reports with compliance summaries
- Share reports with secure token-based links
- Export data in multiple formats (JSON, CSV)

## 🤖 AI Features

### RAG Pipeline
- **Document Processing**: Extracts text from various formats
- **Semantic Chunking**: Intelligent text segmentation
- **Vector Embeddings**: Creates searchable document representations
- **Retrieval**: Finds relevant regulatory content
- **Generation**: Produces compliance analysis with citations

### Model Fine-tuning
- Train custom models on your organization's data
- Improve accuracy for specific industry requirements
- Evaluation metrics and performance tracking

### Prompt Strategies
- **ESG Compliance**: General compliance checking
- **Legal/Audit**: Regulatory requirement analysis
- **Technical Implementation**: Actionable recommendations
- **Quick Reference**: Fast fact checking

## 🔗 API Documentation

Once running, access the interactive API documentation:
- **Swagger UI**: http://localhost:3001/swagger
- **Full API Reference**: Available in the running application

Key endpoints:
- `POST /api/reports/upload` - Upload and analyze documents
- `GET /api/reports` - List all compliance reports
- `POST /api/chat` - Chat with AI about ESG topics
- `GET /api/standards` - Browse regulatory standards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

#### Docker Setup Problems (Option 2)
- **Dependency conflicts**: Use Option 1 (Local Development) instead - it's more reliable
- **"executable file not found" error**: Fixed automatically by the run script on macOS
- **Manual credential fix**: Run `./fix-docker-credentials.sh` if issues persist
- **Permission denied**: Run `chmod +x run.sh` to make script executable  
- **Build failures**: TypeScript/dependency issues - use Local Development instead

#### Local Development Issues  
- **"PostgreSQL not found"**: Install PostgreSQL or use Docker setup (option 1)
- **"bun: command not found"**: Install Bun from https://bun.sh or use npm
- **Database connection errors**: Check DATABASE_URL in backend/.env file

#### General Help
- **Issues**: Report bugs on GitHub Issues
- **Documentation**: Check component README files for detailed information
- **API Help**: Use the interactive Swagger documentation
- **Logs**: For Docker: `docker-compose logs`, For local: check terminal output

## 🔮 Roadmap

- [ ] Additional ESG frameworks (ISSB, CDSB)
- [ ] Multi-language support
- [ ] Advanced visualization dashboards
- [ ] Integration with ESG data providers
- [ ] Mobile application
- [ ] Enterprise SSO integration

---

**Built with ❤️ for a more sustainable future** 🌍 