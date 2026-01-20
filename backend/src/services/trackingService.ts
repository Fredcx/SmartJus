import prisma from '../config/database';
import { SourceFetcher, CaseUpdateResult } from './fetchers/SourceFetcher';
import { DJENFetcher } from './fetchers/DJENFetcher';
import { DOUFetcher } from './fetchers/DOUFetcher';

export class TrackingService {
    private fetchers: SourceFetcher[];

    constructor() {
        this.fetchers = [
            new DJENFetcher(),
            new DOUFetcher()
        ];
    }

    // Check updates for a specific case
    async checkCaseUpdates(caseId: string): Promise<CaseUpdateResult[]> {
        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
        });

        if (!caseData || !caseData.caseNumber) {
            throw new Error('Case not found or missing case number');
        }

        console.log(`[Tracking] Checking updates for case ${caseData.caseNumber} via [${this.fetchers.map(f => f.sourceName).join(', ')}]`);

        const allUpdates: CaseUpdateResult[] = [];

        for (const fetcher of this.fetchers) {
            try {
                const updates = await fetcher.fetchUpdates(caseData.caseNumber);
                allUpdates.push(...updates);

                // Save immediately per source
                if (updates.length > 0) {
                    await this.saveUpdates(caseId, updates);
                }
            } catch (error) {
                console.error(`[Tracking] Error fetching from ${fetcher.sourceName}:`, error);
            }
        }

        return allUpdates;
    }

    private async saveUpdates(caseId: string, updates: CaseUpdateResult[]) {
        for (const update of updates) {
            // Check if update already exists (deduplication by date and description substring or strict link)
            // Description might vary slightly, so we check date and source.

            // We use a lenient check: if same date and same source, and description is similar? 
            // For now, exact match on description + date.
            const exists = await prisma.caseUpdate.findFirst({
                where: {
                    caseId: caseId,
                    date: update.date,
                    description: update.content, // Assuming content fits in description
                },
            });

            if (!exists) {
                console.log(`[Tracking] Saving new update from ${update.sourceName}: ${update.date.toISOString()}`);
                await prisma.caseUpdate.create({
                    data: {
                        caseId: caseId,
                        date: update.date,
                        description: update.content,
                        source: update.sourceName,
                    },
                });
            }
        }
    }

    // Check updates for ALL active cases
    async checkAllActiveCases(): Promise<void> {
        console.log('🔄 [Tracking] Iniciando verificação OFICIAL de processos...');
        const activeCases = await prisma.case.findMany({
            where: { status: 'active', caseNumber: { not: null } }
        });

        console.log(`📋 [Tracking] Encontrados ${activeCases.length} processos ativos para verificar.`);

        for (const caseProc of activeCases) {
            try {
                if (!caseProc.caseNumber) continue;
                await this.checkCaseUpdates(caseProc.id);
                // Delay to respect rate limits
                await new Promise(r => setTimeout(r, 5000));
            } catch (error) {
                console.error(`❌ [Tracking] Erro ao verificar processo ${caseProc.caseNumber}:`, error);
            }
        }
        console.log('✅ [Tracking] Verificação oficial concluída.');
    }
}

export default new TrackingService();
