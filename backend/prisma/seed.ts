import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create initial standards
  const gri = await prisma.standard.create({
    data: {
      name: 'Global Reporting Initiative (GRI)',
      description: 'The GRI Standards create a common language for organizations to report their sustainability impacts in a consistent and credible way. They are the world\'s most widely used sustainability reporting standards.',
      categories: ['Environmental', 'Social', 'Governance'],
      isCustom: false,
      isActive: true,
      website: 'https://www.globalreporting.org/',
      files: {
        create: [
          {
            name: 'GRI Standards 2021',
            url: 'https://www.globalreporting.org/standards/download-the-standards/',
            size: 2500000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const sasb = await prisma.standard.create({
    data: {
      name: 'Sustainability Accounting Standards Board (SASB)',
      description: 'SASB Standards guide businesses in disclosing financially material sustainability information to investors. They identify sustainability issues most relevant to financial performance in 77 industries.',
      categories: ['Financial', 'Environmental', 'Social'],
      isCustom: false,
      isActive: true,
      website: 'https://www.sasb.org/',
      files: {
        create: [
          {
            name: 'SASB Standards Overview',
            url: 'https://www.sasb.org/standards/download/',
            size: 1800000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  // EU Standards
  const csrd = await prisma.standard.create({
    data: {
      name: 'Corporate Sustainability Reporting Directive (CSRD)',
      description: 'EU directive that requires large companies to publish regular reports on their environmental and social impact activities. It extends the scope and reporting requirements of the Non-Financial Reporting Directive (NFRD).',
      categories: ['Environmental', 'Social', 'Governance', 'Regulatory'],
      isCustom: false,
      isActive: true,
      website: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
      files: {
        create: [
          {
            name: 'CSRD Overview',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
            size: 1500000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const sfdr = await prisma.standard.create({
    data: {
      name: 'Sustainable Finance Disclosure Regulation (SFDR)',
      description: 'EU regulation that requires financial market participants and financial advisers to disclose how they integrate ESG factors in their risk management processes and investment decisions.',
      categories: ['Financial', 'Environmental', 'Social', 'Regulatory'],
      isCustom: false,
      isActive: true,
      website: 'https://www.esma.europa.eu/policy-activities/sustainable-finance/sustainability-related-disclosure-regulation',
      files: {
        create: [
          {
            name: 'SFDR Overview',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019R2088',
            size: 1200000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const euTaxonomy = await prisma.standard.create({
    data: {
      name: 'EU Taxonomy for Sustainable Activities',
      description: 'Classification system establishing a list of environmentally sustainable economic activities. It provides companies, investors, and policymakers with definitions for economic activities that can be considered environmentally sustainable.',
      categories: ['Environmental', 'Financial', 'Regulatory'],
      isCustom: false,
      isActive: true,
      website: 'https://finance.ec.europa.eu/sustainable-finance/tools-and-standards/eu-taxonomy-sustainable-activities_en',
      files: {
        create: [
          {
            name: 'EU Taxonomy Regulation',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32020R0852',
            size: 1700000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  // International Standards
  const tcfd = await prisma.standard.create({
    data: {
      name: 'Task Force on Climate-related Financial Disclosures (TCFD)',
      description: 'Framework for companies to disclose climate-related financial risks to investors, lenders, and insurers. It focuses on governance, strategy, risk management, and metrics/targets related to climate risks and opportunities.',
      categories: ['Environmental', 'Financial', 'Climate'],
      isCustom: false,
      isActive: true,
      website: 'https://www.fsb-tcfd.org/',
      files: {
        create: [
          {
            name: 'TCFD Recommendations',
            url: 'https://www.fsb-tcfd.org/recommendations/',
            size: 2200000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const unpri = await prisma.standard.create({
    data: {
      name: 'UN Principles for Responsible Investment (PRI)',
      description: 'Network of international investors working together to implement six principles for responsible investment. It aims to understand the investment implications of ESG factors and support signatories in incorporating these factors into investment decisions.',
      categories: ['Environmental', 'Social', 'Governance', 'Investment'],
      isCustom: false,
      isActive: true,
      website: 'https://www.unpri.org/',
      files: {
        create: [
          {
            name: 'PRI Principles',
            url: 'https://www.unpri.org/about-us/what-are-the-principles-for-responsible-investment',
            size: 1100000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const sdgs = await prisma.standard.create({
    data: {
      name: 'UN Sustainable Development Goals (SDGs)',
      description: 'Collection of 17 global goals designed to be a blueprint to achieve a better and more sustainable future for all. The SDGs address global challenges including poverty, inequality, climate change, environmental degradation, peace, and justice.',
      categories: ['Environmental', 'Social', 'Economic', 'Global'],
      isCustom: false,
      isActive: true,
      website: 'https://sdgs.un.org/',
      files: {
        create: [
          {
            name: 'SDGs Overview',
            url: 'https://sdgs.un.org/goals',
            size: 1900000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const cdp = await prisma.standard.create({
    data: {
      name: 'Carbon Disclosure Project (CDP)',
      description: 'Global disclosure system for investors, companies, cities, states, and regions to manage their environmental impacts. It focuses on climate change, water security, and deforestation.',
      categories: ['Environmental', 'Climate', 'Disclosure'],
      isCustom: false,
      isActive: true,
      website: 'https://www.cdp.net/',
      files: {
        create: [
          {
            name: 'CDP Reporting Framework',
            url: 'https://www.cdp.net/en/guidance/guidance-for-companies',
            size: 1600000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  // US Standards
  const secClimateDisclosure = await prisma.standard.create({
    data: {
      name: 'SEC Climate Disclosure Rule',
      description: 'Proposed rule by the U.S. Securities and Exchange Commission requiring public companies to disclose climate-related risks, emissions, and net-zero transition plans in their registration statements and periodic reports.',
      categories: ['Environmental', 'Climate', 'Regulatory', 'US'],
      isCustom: false,
      isActive: true,
      website: 'https://www.sec.gov/rules/proposed/2022/33-11042.pdf',
      files: {
        create: [
          {
            name: 'SEC Climate Disclosure Proposal',
            url: 'https://www.sec.gov/rules/proposed/2022/33-11042.pdf',
            size: 2300000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  // Asian Standards
  const hkexEsg = await prisma.standard.create({
    data: {
      name: 'HKEX ESG Reporting Guide',
      description: 'Hong Kong Stock Exchange\'s Environmental, Social and Governance Reporting Guide that sets out the disclosure requirements for listed companies in Hong Kong.',
      categories: ['Environmental', 'Social', 'Governance', 'Asia'],
      isCustom: false,
      isActive: true,
      website: 'https://www.hkex.com.hk/Listing/Rules-and-Guidance/Environmental-Social-and-Governance/ESG-Reporting-Guide-and-FAQs',
      files: {
        create: [
          {
            name: 'HKEX ESG Reporting Guide',
            url: 'https://www.hkex.com.hk/-/media/HKEX-Market/Listing/Rules-and-Guidance/Environmental-Social-and-Governance/Exchanges-guidance-materials-on-ESG/step_by_step.pdf',
            size: 1400000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  // Industry-specific Standards
  const equatorPrinciples = await prisma.standard.create({
    data: {
      name: 'Equator Principles',
      description: 'Risk management framework adopted by financial institutions for determining, assessing, and managing environmental and social risk in project finance. It is primarily intended to provide a minimum standard for due diligence to support responsible risk decision-making.',
      categories: ['Environmental', 'Social', 'Financial', 'Project Finance'],
      isCustom: false,
      isActive: true,
      website: 'https://equator-principles.com/',
      files: {
        create: [
          {
            name: 'Equator Principles Framework',
            url: 'https://equator-principles.com/app/uploads/The-Equator-Principles_EP4_July2020.pdf',
            size: 1300000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const scienceBasedTargets = await prisma.standard.create({
    data: {
      name: 'Science Based Targets initiative (SBTi)',
      description: 'Partnership between CDP, the UN Global Compact, World Resources Institute, and WWF that helps companies set emissions reduction targets in line with climate science and Paris Agreement goals.',
      categories: ['Environmental', 'Climate', 'Emissions'],
      isCustom: false,
      isActive: true,
      website: 'https://sciencebasedtargets.org/',
      files: {
        create: [
          {
            name: 'SBTi Criteria and Recommendations',
            url: 'https://sciencebasedtargets.org/resources/files/SBTi-criteria.pdf',
            size: 1500000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const issGovernance = await prisma.standard.create({
    data: {
      name: 'ISS ESG Corporate Rating',
      description: 'ESG corporate rating methodology that provides a highly relevant and material assessment of companies\' sustainability performance. It analyzes more than 100 industry-specific ESG factors.',
      categories: ['Environmental', 'Social', 'Governance', 'Rating'],
      isCustom: false,
      isActive: true,
      website: 'https://www.issgovernance.com/esg/ratings/',
      files: {
        create: [
          {
            name: 'ISS ESG Corporate Rating Methodology',
            url: 'https://www.issgovernance.com/esg/ratings/corporate-rating/',
            size: 1200000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  const msciEsg = await prisma.standard.create({
    data: {
      name: 'MSCI ESG Ratings',
      description: 'Ratings designed to measure a company\'s resilience to long-term, industry material environmental, social and governance risks. It uses a rules-based methodology to identify industry leaders and laggards.',
      categories: ['Environmental', 'Social', 'Governance', 'Rating'],
      isCustom: false,
      isActive: true,
      website: 'https://www.msci.com/our-solutions/esg-investing/esg-ratings',
      files: {
        create: [
          {
            name: 'MSCI ESG Ratings Methodology',
            url: 'https://www.msci.com/documents/1296102/21901542/MSCI-ESG-Ratings-Methodology-Exec-Summary.pdf',
            size: 1400000,
            type: 'application/pdf'
          }
        ]
      }
    }
  });

  console.log('Database seeded successfully with real standards data!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 