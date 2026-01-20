import prisma from '../config/database';
// import { saveFile, deleteFile } from '../utils/fileHandler'; // Removed (using Multer)
import { deleteFile } from '../utils/fileHandler'; // Kept for delete logic if needed, or remove if unused
import { extractTextFromPDF } from '../utils/pdfParser';
import classificationService from './classificationService';
import individualSummaryService from './individualSummaryService';

export class DocumentService {
  // Updated to accept Multer file object and optional category
  async uploadDocument(file: Express.Multer.File, caseId: string, category?: string) {
    try {
      // Arquivo já foi salvo pelo Multer, temos o path em file.path
      const filePath = file.path;

      // Prepare initial data
      const data: any = {
        name: file.originalname,
        type: file.mimetype,
        path: filePath,
        status: 'processing',
        caseId,
      };

      // If it's an evidence upload, explicitly set classification or type
      if (category === 'evidence') {
        data.classification = { category: 'evidence', type: 'Prova Documental' };
      }

      // Criar registro no banco
      const document = await prisma.document.create({
        data,
      });

      // Processar em background
      this.processDocument(document.id, filePath).catch(console.error);

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  private async processDocument(documentId: string, filePath: string) {
    try {
      console.log(`Processing document ${documentId}...`);

      // 1. Extrair texto
      const text = await extractTextFromPDF(filePath);

      // Save extracted text to file
      const fs = require('fs');
      const txtPath = filePath.replace(/\.[^/.]+$/, "") + ".txt";
      fs.writeFileSync(txtPath, text);

      await prisma.document.update({
        where: { id: documentId },
        data: { extractedTextPath: txtPath }
      });

      // 2. Classificar
      const classification = await classificationService.classifyDocument(text);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          classification: classification as any,
          status: 'classified'
        }
      });

      // 3. Resumo Individual
      const summary = await individualSummaryService.summarizeDocument(text, classification.type);

      // 4. Update Final
      await prisma.document.update({
        where: { id: documentId },
        data: {
          individualSummary: summary,
          status: 'summarized', // Ready for case analysis
          type: classification.type // Update main type field with detected type
        },
      });

      // 5. Timeline Event
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { case: true },
      });

      if (document) {
        await prisma.timelineEvent.create({
          data: {
            title: `Documento: ${classification.type}`,
            description: `Classificado como ${classification.type} (${classification.confidence}%)`,
            type: 'analysis',
            caseId: document.caseId,
          },
        });
      }

      console.log(`Document ${documentId} processed successfully.`);

    } catch (error) {
      console.error('Error processing document:', error);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'error' },
      });
    }
  }

  async getDocumentsByCase(caseId: string) {
    return prisma.document.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (document) {
      await deleteFile(document.path);
      await prisma.document.delete({
        where: { id: documentId },
      });
    }
  }
}

export default new DocumentService();
