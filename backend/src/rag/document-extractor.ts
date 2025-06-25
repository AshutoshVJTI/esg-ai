import * as fs from 'fs/promises';
import * as path from 'path';
import { readFile } from 'fs/promises';

/**
 * Document extractor for ESG compliance analysis
 * Extracts text content from PDF and DOCX files
 */
export class DocumentExtractor {
  
  /**
   * Extract text from a file
   */
  async extractText(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        return this.extractFromPDF(filePath);
      case '.docx':
        return this.extractFromDOCX(filePath);
      case '.txt':
        return this.extractFromText(filePath);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * Extract text from base64 encoded content
   */
  async extractFromBase64(base64Content: string, originalFileName: string): Promise<string> {
    // Create temporary file
    const tempDir = './temp';
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempPath = path.join(tempDir, `temp_${Date.now()}_${originalFileName}`);
    
    try {
      // Write base64 content to temporary file
      const buffer = Buffer.from(base64Content, 'base64');
      await fs.writeFile(tempPath, buffer);
      
      // Extract text
      const text = await this.extractText(tempPath);
      
      // Clean up temporary file
      await fs.unlink(tempPath).catch(() => {
        // Ignore cleanup errors
      });
      
      return text;
    } catch (error) {
      // Ensure cleanup on error
      await fs.unlink(tempPath).catch(() => {
        // Ignore cleanup errors
      });
      throw error;
    }
  }

  /**
   * Extract text from PDF using a simple approach
   * Note: For production, consider using pdf-parse or pdf2pic + OCR
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      // Try to use pdf-parse if available
      const pdfParse = await this.tryImportPdfParse();
      if (pdfParse) {
        const buffer = await readFile(filePath);
        const data = await pdfParse(buffer);
        return data.text;
      }
    } catch (error) {
      console.warn('PDF parsing failed, falling back to basic extraction:', error);
    }

    // Fallback: Basic text extraction (very limited)
    try {
      const buffer = await readFile(filePath);
      const text = buffer.toString('utf8');
      
      // Very basic PDF text extraction - just look for readable text
      const readableText = text
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (readableText.length > 100) {
        return readableText;
      }
      
      throw new Error('Unable to extract meaningful text from PDF');
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX using a simple approach
   * Note: For production, consider using mammoth or docx libraries
   */
  private async extractFromDOCX(filePath: string): Promise<string> {
    try {
      // Try to use mammoth if available
      const mammoth = await this.tryImportMammoth();
      if (mammoth) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }
    } catch (error) {
      console.warn('DOCX parsing failed, falling back to basic extraction:', error);
    }

    // Fallback: Very basic approach (extract from XML in DOCX)
    try {
      const AdmZip = await this.tryImportAdmZip();
      if (AdmZip) {
        const zip = new AdmZip(filePath);
        const documentXml = zip.readAsText('word/document.xml');
        
        if (documentXml) {
          // Extract text from XML (basic approach)
          const textContent = documentXml
            .replace(/<[^>]*>/g, ' ') // Remove XML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (textContent.length > 50) {
            return textContent;
          }
        }
      }
      
      throw new Error('Unable to extract meaningful text from DOCX');
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  private async extractFromText(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf8');
    return content;
  }

  /**
   * Try to import pdf-parse dynamically
   */
  private async tryImportPdfParse(): Promise<any> {
    try {
      const pdfParse = await import('pdf-parse');
      return pdfParse.default || pdfParse;
    } catch {
      return null;
    }
  }

  /**
   * Try to import mammoth dynamically
   */
  private async tryImportMammoth(): Promise<any> {
    try {
      const mammoth = await import('mammoth');
      return mammoth;
    } catch {
      return null;
    }
  }

  /**
   * Try to import adm-zip dynamically
   */
  private async tryImportAdmZip(): Promise<any> {
    try {
      const AdmZip = await import('adm-zip');
      return AdmZip.default || AdmZip;
    } catch {
      return null;
    }
  }

  /**
   * Validate if file exists and is readable
   */
  async validateFile(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Clean extracted text for better analysis
   */
  cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .replace(/\s{3,}/g, '  ') // Reduce excessive spaces
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .trim();
  }

  /**
   * Split text into sections for better analysis
   */
  splitIntoSections(text: string, maxSectionLength: number = 2000): string[] {
    const sections: string[] = [];
    
    // Try to split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentSection = '';
    
    for (const paragraph of paragraphs) {
      if (currentSection.length + paragraph.length > maxSectionLength && currentSection.length > 0) {
        sections.push(currentSection.trim());
        currentSection = paragraph;
      } else {
        currentSection += (currentSection ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last section
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    // If sections are still too large, split by sentences
    const finalSections: string[] = [];
    for (const section of sections) {
      if (section.length <= maxSectionLength) {
        finalSections.push(section);
      } else {
        // Split by sentences
        const sentences = section.split(/[.!?]+\s+/);
        let currentSubSection = '';
        
        for (const sentence of sentences) {
          if (currentSubSection.length + sentence.length > maxSectionLength && currentSubSection.length > 0) {
            finalSections.push(currentSubSection.trim());
            currentSubSection = sentence;
          } else {
            currentSubSection += (currentSubSection ? '. ' : '') + sentence;
          }
        }
        
        if (currentSubSection.trim()) {
          finalSections.push(currentSubSection.trim());
        }
      }
    }
    
    return finalSections.filter(section => section.length > 50); // Filter out very short sections
  }
} 