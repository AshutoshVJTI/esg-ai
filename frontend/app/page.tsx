"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ESGLogo,
  DocumentAnalysis,
  ComplianceAnalytics,
  EnterpriseCollaboration,
  GlobalCompliance,
  EnterpriseSecurity,
  PerformanceAnalytics,
  AIBrain,
  ModernTech,
  SecurityShield,
  FuturePlatform,
  ArrowForward,
  CheckMark,
  HeadphonesIcon,
  TargetIcon,
  DollarSignIcon
} from '@/components/ui/custom-icons';
import { Logo } from '@/components/ui/logo';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <motion.nav 
        className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ opacity: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Logo variant="text" width={140} height={36} />
            </motion.div>
            <div className="hidden md:flex items-center space-x-8">
              <motion.a 
                href="#solutions" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                Solutions
              </motion.a>
              <motion.a 
                href="#compliance" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                Compliance
              </motion.a>
              <motion.a 
                href="#enterprise" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                Enterprise
              </motion.a>
              <motion.a 
                href="#resources" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                Resources
              </motion.a>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  href="/dashboard" 
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Request Demo
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div 
              className="text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8"
                variants={itemVariants}
              >
                <FuturePlatform className="w-4 h-4 mr-2" />
                Your AI-powered ESG compliance assistant
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight font-display tracking-tight"
                variants={fadeInUp}
              >
                The Future of
                <span className="block bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ESG Compliance
                </span>
                is Here
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed font-sans"
                variants={fadeInUp}
              >
                Meet Reggie, your AI assistant for ESG compliance. Reggie analyzes your reports with precision, reduces compliance costs by 70%, and ensures 100% adherence to TCFD, ESRS, GRI, SASB, SEC, and EU regulations.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                variants={itemVariants}
              >
                <motion.div
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    href="/dashboard"
                    className="group bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center"
                  >
                    Meet Reggie
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowForward className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.button 
                  className="flex items-center px-8 py-4 border-2 border-gray-300 rounded-xl text-lg font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <HeadphonesIcon className="w-5 h-5 mr-2" />
                  Chat with Reggie
                </motion.button>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center space-x-8 text-sm text-gray-500"
                variants={itemVariants}
              >
                <motion.div 
                  className="flex items-center"
                  whileHover={{ opacity: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckMark className="w-4 h-4 text-green-500 mr-2" />
                  Built for enterprise scale
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  whileHover={{ opacity: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckMark className="w-4 h-4 text-green-500 mr-2" />
                  SOC 2 Type II ready
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  whileHover={{ opacity: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckMark className="w-4 h-4 text-green-500 mr-2" />
                  GDPR & CCPA compliant
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Right Column - Hero Image */}
            <motion.div 
              className="relative"
              variants={slideInRight}
              initial="hidden"
              animate="visible"
            >
              <div className="relative">
                {/* Main Dashboard Mockup */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-sm"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 bg-gray-300 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-end space-x-2 h-32">
                      <div className="flex-1 bg-green-400 rounded-t" style={{height: '60%'}}></div>
                      <div className="flex-1 bg-blue-400 rounded-t" style={{height: '80%'}}></div>
                      <div className="flex-1 bg-purple-400 rounded-t" style={{height: '45%'}}></div>
                      <div className="flex-1 bg-green-400 rounded-t" style={{height: '90%'}}></div>
                      <div className="flex-1 bg-blue-400 rounded-t" style={{height: '70%'}}></div>
                    </div>
                  </div>
                  
                  {/* AI Chat Interface */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-80"
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.div 
                  className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-80"
                  animate={{ 
                    y: [0, 10, 0],
                    scale: [1, 0.9, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating Elements with Framer Motion */}
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20"
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20"
          animate={{ 
            y: [0, 15, 0],
            scale: [1, 0.9, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20"
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
      </section>

      {/* Technology Credibility */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p 
            className="text-center text-gray-500 mb-8"
            variants={itemVariants}
          >
            Powered by cutting-edge technology
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { 
                name: "OpenAI GPT-4", 
                icon: "🤖",
                description: "Advanced AI reasoning",
                color: "from-purple-400 to-pink-400"
              },
              { 
                name: "LangChain", 
                icon: "🔗",
                description: "RAG pipeline",
                color: "from-blue-400 to-indigo-400"
              },
              { 
                name: "ChromaDB", 
                icon: "📊",
                description: "Vector database",
                color: "from-green-400 to-emerald-400"
              },
              { 
                name: "Enterprise Security", 
                icon: "🛡️",
                description: "SOC 2 Type II",
                color: "from-orange-400 to-red-400"
              }
            ].map((tech, index) => (
              <motion.div 
                key={tech.name}
                className="text-center group"
                variants={scaleIn}
                custom={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${tech.color} rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-600">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Expected ROI Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-green-600 to-blue-600"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight">
              What Reggie Can Do
              <span className="block">For Your Team</span>
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Reggie's capabilities based on industry benchmarks and advanced AI
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { percentage: "70%", title: "Cost Reduction", description: "Reggie reduces compliance costs through automated analysis and reporting" },
              { percentage: "90%", title: "Time Savings", description: "Reggie processes documents and assesses compliance faster than manual review" },
              { percentage: "100%", title: "Compliance Coverage", description: "Reggie provides comprehensive coverage of all major ESG standards and regulatory requirements" }
            ].map((stat, index) => (
              <motion.div 
                key={stat.title}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white"
                variants={scaleIn}
                whileHover={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.15)"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-4xl font-bold mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  {stat.percentage}
                </motion.div>
                <div className="text-xl font-semibold mb-4">{stat.title}</div>
                <p className="text-green-100">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Solutions Section */}
      <motion.section 
        id="solutions" 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display tracking-tight">
              What Reggie Can
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Do For You
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reggie is your comprehensive ESG compliance assistant, designed for enterprise-scale operations and regulatory requirements.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📄",
                title: "Document Intelligence",
                description: "Reggie analyzes your ESG reports with AI-powered extraction and analysis.",
                features: ["Multi-format support (PDF, DOCX, XLSX)", "Automated data extraction", "Version control & audit trails"],
                color: "from-green-400 to-blue-400",
                gradient: "from-green-50 to-blue-50"
              },
              {
                icon: "📈",
                title: "Compliance Analytics",
                description: "Real-time compliance scoring and gap analysis across multiple regulatory frameworks.",
                features: ["Multi-standard compliance tracking", "Risk scoring & prioritization", "Automated reporting workflows"],
                color: "from-purple-400 to-pink-400",
                gradient: "from-purple-50 to-pink-50"
              },
              {
                icon: "👥",
                title: "Enterprise Collaboration",
                description: "Role-based access control and team workflows for seamless collaboration.",
                features: ["SSO & LDAP integration", "Approval workflows", "Audit trail & compliance"],
                color: "from-blue-400 to-indigo-400",
                gradient: "from-blue-50 to-indigo-50"
              },
              {
                icon: "🌍",
                title: "Global Compliance",
                description: "Support for international ESG standards including EU, US, UK, and APAC regulations.",
                features: ["TCFD, ESRS, GRI, SASB", "SEC Climate Rules", "EU Taxonomy & SFDR"],
                color: "from-yellow-400 to-orange-400",
                gradient: "from-yellow-50 to-orange-50"
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "Bank-grade security with SOC 2 Type II, GDPR compliance, and enterprise data protection.",
                features: ["SOC 2 Type II ready", "End-to-end encryption", "On-premise deployment options"],
                color: "from-red-400 to-pink-400",
                gradient: "from-red-50 to-pink-50"
              },
              {
                icon: "📊",
                title: "Performance Analytics",
                description: "Executive dashboards and KPI tracking with performance benchmarking against industry peers.",
                features: ["Executive dashboards", "Peer benchmarking", "Custom reporting"],
                color: "from-indigo-400 to-purple-400",
                gradient: "from-indigo-50 to-purple-50"
              }
            ].map((solution, index) => (
              <motion.div 
                key={solution.title}
                className={`bg-gradient-to-br ${solution.gradient} border border-gray-200 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group`}
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${solution.color} rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {solution.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-heading">{solution.title}</h3>
                <p className="text-gray-600 mb-6">{solution.description}</p>
                <ul className="space-y-3 text-sm text-gray-600">
                  {solution.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={feature}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: featureIndex * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mr-3"></div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Compliance Standards Section */}
      <motion.section 
        id="compliance" 
        className="py-20 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display tracking-tight">
              Comprehensive
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Regulatory Coverage
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay ahead of evolving ESG regulations with our comprehensive compliance framework
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                name: "TCFD", 
                description: "Climate-related Financial Disclosures", 
                icon: "🌡️", 
                color: "green",
                gradient: "from-green-400 to-emerald-400"
              },
              { 
                name: "ESRS", 
                description: "European Sustainability Reporting Standards", 
                icon: "🇪🇺", 
                color: "blue",
                gradient: "from-blue-400 to-indigo-400"
              },
              { 
                name: "GRI", 
                description: "Global Reporting Initiative Standards", 
                icon: "🌐", 
                color: "purple",
                gradient: "from-purple-400 to-pink-400"
              },
              { 
                name: "SASB", 
                description: "Sustainability Accounting Standards Board", 
                icon: "💰", 
                color: "orange",
                gradient: "from-orange-400 to-red-400"
              }
            ].map((standard, index) => (
              <motion.div 
                key={standard.name}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                variants={scaleIn}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <motion.div 
                    className={`w-20 h-20 bg-gradient-to-r ${standard.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.6 }}
                  >
                    {standard.icon}
                  </motion.div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">{standard.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{standard.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display tracking-tight">
              Why Choose
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Reggie?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reggie is built by ESG compliance experts with cutting-edge AI technology
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={slideInLeft}>
              <div className="space-y-8">
                {[
                  {
                    icon: "🧠",
                    title: "Expert-Built AI",
                    description: "Reggie is developed by ESG compliance professionals with deep understanding of regulatory requirements and industry best practices.",
                    color: "green",
                    gradient: "from-green-400 to-emerald-400"
                  },
                  {
                    icon: "⚡",
                    title: "Modern Technology Stack",
                    description: "Built on the latest AI/ML technologies including OpenAI GPT-4, LangChain, and ChromaDB for superior performance.",
                    color: "blue",
                    gradient: "from-blue-400 to-indigo-400"
                  },
                  {
                    icon: "🛡️",
                    title: "Enterprise-Ready Security",
                    description: "Designed with enterprise security standards from day one, ready for SOC 2 Type II certification.",
                    color: "purple",
                    gradient: "from-purple-400 to-pink-400"
                  },
                  {
                    icon: "🚀",
                    title: "Future-Proof Platform",
                    description: "Built to scale and adapt to evolving ESG regulations and enterprise requirements.",
                    color: "orange",
                    gradient: "from-orange-400 to-red-400"
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={feature.title}
                    className="flex items-start space-x-6"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <motion.div 
                      className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl shadow-lg`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 font-heading">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl border border-green-100"
              variants={slideInRight}
              whileHover={{ opacity: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-heading">Reggie's Advantages</h3>
              <div className="space-y-4">
                {[
                  "Built specifically for ESG compliance",
                  "Latest AI/ML technology stack",
                  "Expert-driven development",
                  "Enterprise security by design",
                  "Scalable architecture",
                  "Comprehensive compliance coverage"
                ].map((advantage, index) => (
                  <motion.div 
                    key={advantage}
                    className="flex items-center"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div
                      whileHover={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mr-4"></div>
                    </motion.div>
                    <span className="text-gray-700 font-medium">{advantage}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-green-600 to-blue-600"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight"
            variants={fadeInUp}
          >
            Ready to meet Reggie,
            <span className="block">your ESG assistant?</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-green-100 mb-8"
            variants={fadeInUp}
          >
            Be among the first to experience Reggie, your AI-powered ESG compliance assistant.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                href="/dashboard"
                className="bg-white text-green-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Meet Reggie
              </Link>
            </motion.div>
            <motion.button 
              className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Chat with Reggie
            </motion.button>
          </motion.div>
          <motion.p 
            className="text-green-100 mt-6 text-sm"
            variants={itemVariants}
          >
            Enterprise-grade security • Built for scale • Expert support
          </motion.p>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="bg-gray-900 text-white py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-2 mb-4">
                <Logo variant="text" width={120} height={32} className="invert" />
              </div>
              <p className="text-gray-400">
                Next-generation ESG compliance platform built for enterprise scale.
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Document Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance Tracking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API & Integrations</a></li>
              </ul>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h4 className="font-semibold mb-4">Enterprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </motion.div>
          </div>
          <motion.div 
            className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"
            variants={itemVariants}
          >
            <p>&copy; 2024 Reggie. All rights reserved. | Built for enterprise scale | GDPR & CCPA compliant</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}