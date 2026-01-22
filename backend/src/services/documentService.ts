import prisma from '../config/database';
import { supabase } from '../config/supabase';
import { deleteFile } from '../utils/fileHandler';
import { extractTextFromPDF } from '../utils/pdfParser';
import classificationService from './classificationService';
import individualSummaryService from './individualSummaryService';

export class DocumentService {
  private BUCKET = 'documents';

  async uploadDocument(file: Express.Multer.File, caseId: string, category?: string) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = file.originalname.split('.').pop();
      const fileName = `document-${uniqueSuffix}.${ext}`;
      const filePath = `${caseId}/${fileName}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Prepare initial data
      const data: any = {
        name: file.originalname,
        type: file.mimetype,
        path: filePath, // Storing Supabase path
        status: 'processing',
        caseId,
      };

      if (category === 'evidence') {
        data.classification = { category: 'evidence', type: 'Prova Documental' };
      }

      const document = await prisma.document.create({ data });

      // Run processing
      // In Vercel, we should probably wait for this if we want to be sure,
      // but let's keep it async for now.
      this.processDocument(document.id, file.buffer, filePath).catch(console.error);

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  private async processDocument(documentId: string, fileBuffer: Buffer, storagePath: string) {
    try {
      console.log(`Processing document ${documentId}...`);

      // 1. Extrair texto (from buffer now)
      const text = await extractTextFromPDF(fileBuffer);

      // 2. Upload extracted text to Supabase
      const txtPath = storagePath.replace(/\.[^/.]+$/, "") + ".txt";
      const { error: txtError } = await supabase.storage
        .from(this.BUCKET)
        .upload(txtPath, Buffer.from(text), {
          contentType: 'text/plain',
        });

      if (txtError) console.error('Error uploading text to Supabase:', txtError);

      await prisma.document.update({
        where: { id: documentId },
        data: { extractedTextPath: txtPath }
      });

      // 3. Classificar
      const classification = await classificationService.classifyDocument(text);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          classification: classification as any,
          status: 'classified'
        }
      });

      // 4. Resumo Individual
      const summary = await individualSummaryService.summarizeDocument(text, classification.type);

      // 5. Update Final
      await prisma.document.update({
        where: { id: documentId },
        data: {
          individualSummary: summary,
          status: 'summarized',
          type: classification.type
        },
      });

      // 6. Timeline Event
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
    const documents = await prisma.document.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });

    // Provide public URLs if needed, or signed URLs
    return Promise.all(documents.map(async (doc) => {
      const { data } = supabase.storage
        .from(this.BUCKET)
        .getPublicUrl(doc.path);

      return { ...doc, url: data.publicUrl };
    }));
  }

  async deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (document) {
      // Delete from Supabase
      const filesToRemove = [document.path];
      if (document.extractedTextPath) {
        filesToRemove.push(document.extractedTextPath);
      }

      await supabase.storage
        .from(this.BUCKET)
        .remove(filesToRemove);

      await prisma.document.delete({
        where: { id: documentId },
      });
    }
  }
}

export default new DocumentService();
