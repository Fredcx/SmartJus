
import { prisma } from './src/lib/prisma';

async function main() {
    console.log('Checking Prisma Client properties...');

    // casting to any to avoid compile error if types are missing, 
    // but we want to check runtime existence
    const p = prisma as any;

    const hasTimeline = !!p.timelineEvent;
    const hasDocument = !!p.document;

    console.log('timelineEvent exists:', hasTimeline);
    console.log('document exists:', hasDocument);

    if (hasTimeline && hasDocument) {
        console.log('SUCCESS: All models found on Prisma Client instance.');
        process.exit(0);
    } else {
        console.error('FAILURE: Missing models on Prisma Client instance.');
        process.exit(1);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
