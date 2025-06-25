import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the standards with their metadata
const standards = [
  {
    name: 'CDP (Carbon Disclosure Project)',
    description: 'CDP is a global disclosure system for investors, companies, cities, states and regions to manage their environmental impacts.',
    categories: ['Climate Change', 'Water Security', 'Forests'],
    website: 'https://www.cdp.net/',
    file: 'cdp.pdf'
  },
  {
    name: 'CSRD (Corporate Sustainability Reporting Directive)',
    description: 'The CSRD is an EU directive that requires large companies to publish regular reports on their environmental and social impact activities.',
    categories: ['EU Regulation', 'Sustainability Reporting'],
    website: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
    file: 'csrd.pdf'
  },
  {
    name: 'Equator Principles',
    description: 'The Equator Principles is a risk management framework for determining, assessing and managing environmental and social risk in project finance.',
    categories: ['Project Finance', 'Risk Management'],
    website: 'https://equator-principles.com/',
    file: 'equator.pdf'
  },
  {
    name: 'GRI (Global Reporting Initiative)',
    description: 'GRI is an international independent standards organization that helps businesses, governments and other organizations understand and communicate their impacts on issues such as climate change, human rights and corruption.',
    categories: ['Sustainability Reporting', 'ESG'],
    website: 'https://www.globalreporting.org/',
    file: 'gri.pdf'
  },
  {
    name: 'HKEX ESG Reporting Guide',
    description: 'The Hong Kong Stock Exchange ESG Reporting Guide provides guidance to listed companies on how to prepare an ESG report.',
    categories: ['Stock Exchange', 'ESG Reporting'],
    website: 'https://www.hkex.com.hk/',
    file: 'hkex.pdf'
  },
  {
    name: 'ISS ESG',
    description: 'ISS ESG provides corporate and country ESG research and ratings to identify material social and environmental risks and opportunities.',
    categories: ['ESG Ratings', 'Corporate Governance'],
    website: 'https://www.issgovernance.com/esg/',
    file: 'iss.pdf'
  },
  {
    name: 'MSCI ESG Ratings',
    description: 'MSCI ESG Ratings aim to measure a company\'s resilience to long-term, industry material environmental, social and governance (ESG) risks.',
    categories: ['ESG Ratings', 'Investment'],
    website: 'https://www.msci.com/our-solutions/esg-investing/esg-ratings',
    file: 'msci.pdf'
  },
  {
    name: 'PRI (Principles for Responsible Investment)',
    description: 'The PRI is a UN-supported international network of investors working together to implement six Principles for Responsible Investment.',
    categories: ['Investment', 'UN Initiative'],
    website: 'https://www.unpri.org/',
    file: 'pri.pdf'
  },
  {
    name: 'SASB (Sustainability Accounting Standards Board)',
    description: 'SASB standards guide the disclosure of financially material sustainability information by companies to their investors.',
    categories: ['Accounting Standards', 'Sustainability'],
    website: 'https://www.sasb.org/',
    file: 'sasb-software-it.pdf'
  },
  {
    name: 'SBTi (Science Based Targets initiative)',
    description: 'The SBTi drives ambitious climate action in the private sector by enabling companies to set science-based emissions reduction targets.',
    categories: ['Climate Change', 'Emissions Reduction'],
    website: 'https://sciencebasedtargets.org/',
    file: 'sbti.pdf'
  },
  {
    name: 'SDGs (Sustainable Development Goals)',
    description: 'The SDGs are a collection of 17 interlinked global goals designed to be a blueprint to achieve a better and more sustainable future for all.',
    categories: ['UN Initiative', 'Sustainable Development'],
    website: 'https://sdgs.un.org/',
    file: 'sdg.pdf'
  },
  {
    name: 'SEC Climate Disclosure Rules',
    description: 'The SEC\'s climate disclosure rules require public companies to disclose climate-related risks and greenhouse gas emissions.',
    categories: ['US Regulation', 'Climate Disclosure'],
    website: 'https://www.sec.gov/',
    file: 'sec.pdf'
  },
  {
    name: 'SFDR (Sustainable Finance Disclosure Regulation)',
    description: 'The SFDR is an EU regulation that requires financial market participants to disclose how they integrate ESG factors into their investment decisions.',
    categories: ['EU Regulation', 'Sustainable Finance'],
    website: 'https://finance.ec.europa.eu/sustainable-finance/disclosures_en',
    file: 'sfdr.pdf'
  },
  {
    name: 'EU Taxonomy',
    description: 'The EU Taxonomy is a classification system establishing a list of environmentally sustainable economic activities.',
    categories: ['EU Regulation', 'Sustainable Finance'],
    website: 'https://finance.ec.europa.eu/sustainable-finance/tools-and-standards/eu-taxonomy-sustainable-activities_en',
    file: 'taxonomy.pdf'
  },
  {
    name: 'TCFD (Task Force on Climate-related Financial Disclosures)',
    description: 'The TCFD develops recommendations for more effective climate-related disclosures that could promote more informed investment, credit, and insurance underwriting decisions.',
    categories: ['Climate Disclosure', 'Financial Reporting'],
    website: 'https://www.fsb-tcfd.org/',
    file: 'tcfd.pdf'
  }
];

// Function to copy a file
function copyFile(source, destination) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(destination);
    
    readStream.on('error', err => reject(err));
    writeStream.on('error', err => reject(err));
    writeStream.on('finish', () => resolve());
    
    readStream.pipe(writeStream);
  });
}

// Main function to import standards
async function importStandards() {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Process each standard
    for (const standard of standards) {
      console.log(`Processing ${standard.name}...`);
      
      // Source and destination paths
      const sourcePath = path.join(__dirname, '..', '..', 'standards', standard.file);
      const timestamp = Date.now();
      const destinationFileName = `${timestamp}-${standard.file}`;
      const destinationPath = path.join(uploadsDir, destinationFileName);
      
      // Get file stats
      const stats = fs.statSync(sourcePath);
      const fileSize = stats.size;
      
      // Copy the file
      await copyFile(sourcePath, destinationPath);
      console.log(`Copied ${standard.file} to uploads directory`);
      
      // Check if standard already exists
      const existingStandard = await prisma.standard.findFirst({
        where: {
          name: standard.name
        }
      });
      
      if (existingStandard) {
        console.log(`Standard ${standard.name} already exists, updating...`);
        
        // Update the standard
        await prisma.standard.update({
          where: {
            id: existingStandard.id
          },
          data: {
            description: standard.description,
            categories: standard.categories,
            website: standard.website,
            isActive: true
          }
        });
        
        // Check if a file with this name already exists
        const existingFile = await prisma.file.findFirst({
          where: {
            standardId: existingStandard.id,
            name: standard.file
          }
        });
        
        if (existingFile) {
          console.log(`File ${standard.file} already exists for this standard, skipping file creation`);
        } else {
          // Add the file to the standard
          await prisma.file.create({
            data: {
              name: standard.file,
              url: `/uploads/${destinationFileName}`,
              size: fileSize,
              type: 'application/pdf',
              standardId: existingStandard.id
            }
          });
          console.log(`Added new file ${standard.file} to standard`);
        }
      } else {
        console.log(`Creating new standard: ${standard.name}`);
        
        // Create the standard with the file
        await prisma.standard.create({
          data: {
            name: standard.name,
            description: standard.description,
            categories: standard.categories,
            website: standard.website,
            isActive: true,
            files: {
              create: [
                {
                  name: standard.file,
                  url: `/uploads/${destinationFileName}`,
                  size: fileSize,
                  type: 'application/pdf'
                }
              ]
            }
          }
        });
      }
      
      console.log(`Successfully processed ${standard.name}`);
    }
    
    console.log('All standards imported successfully!');
  } catch (error) {
    console.error('Error importing standards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importStandards()
  .then(() => console.log('Import completed'))
  .catch(error => console.error('Import failed:', error)); 