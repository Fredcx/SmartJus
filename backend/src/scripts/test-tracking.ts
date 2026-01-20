import prisma from '../config/database';
import trackingService from '../services/trackingService';

async function main() {
    console.log('🧪 Starting Tracking Service Test...');

    try {
        // 1. Find a case to test
        const caseProc = await prisma.case.findFirst({
            where: {
                status: 'active',
                caseNumber: { not: null }
            }
        });

        if (!caseProc) {
            console.log('❌ No active case found with a case number to test.');
            return;
        }

        console.log(`🔎 Testing with case: ${caseProc.title} (CNJ: ${caseProc.caseNumber})`);
        console.log('⏳ Running checkCaseUpdates... (this uses Puppeteer, might take 10-20s)');

        // 2. Run the service
        const updates = await trackingService.checkCaseUpdates(caseProc.id);

        // 3. Output results
        console.log('---------------------------------------------------');
        console.log(`✅ Finished! Found ${updates.length} updates.`);
        updates.forEach(u => {
            console.log(`[${u.sourceName}] ${u.date.toISOString().split('T')[0]} - ${u.content.substring(0, 100)}...`);
        });
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
