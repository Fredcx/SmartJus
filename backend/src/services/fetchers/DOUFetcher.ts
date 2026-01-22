import { getBrowser } from '../../utils/browserHelper';
import { SourceFetcher, CaseUpdateResult } from './SourceFetcher';

export class DOUFetcher implements SourceFetcher {
    sourceName = "DOU (Diário Oficial da União)";
    private searchUrl = "https://www.in.gov.br/consulta-ava";

    async fetchUpdates(cnj: string): Promise<CaseUpdateResult[]> {
        console.log(`[DOU] Starting search for CNJ: ${cnj}`);
        let browser;
        try {
            browser = await getBrowser();
            const page = await browser.newPage();

            // Construct query URL
            // Advanced search often allows exact phrase.
            const targetUrl = `${this.searchUrl}?q="${cnj}"`; // Quoting for exact match

            await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for results
            // IN.GOV.BR uses specific classes for results
            // Use a broad selector if specific one fails
            try {
                await page.waitForSelector('.resultados-busca, .alert-warning', { timeout: 15000 });
            } catch (e) {
                console.log("[DOU] Timeout waiting for results container.");
                return [];
            }

            const updates = await page.evaluate(() => {
                const results: any[] = [];
                // Typical Liferay / gov.br layout
                const items = document.querySelectorAll('.resultado-busca-item');

                items.forEach(item => {
                    const titleEl = item.querySelector('h5 a') || item.querySelector('.titulo-resultado a');
                    const dateEl = item.querySelector('.data-publicacao');
                    const contentEl = item.querySelector('.texto-resultado');

                    if (titleEl) {
                        results.push({
                            title: titleEl.textContent?.trim(),
                            link: (titleEl as HTMLAnchorElement).href,
                            dateStr: dateEl ? dateEl.textContent?.trim() : "",
                            content: contentEl ? contentEl.textContent?.trim() : ""
                        });
                    }
                });
                return results;
            });

            console.log(`[DOU] Found ${updates.length} raw results`);

            return updates.map(u => ({
                sourceName: "DOU",
                // Parser for "Publicado em: 25/11/2024"
                date: u.dateStr ? this.parseDate(u.dateStr) : new Date(),
                content: `[${u.title}] ${u.content}`,
                link: u.link
            }));

        } catch (error) {
            console.error(`[DOU] Error scraping:`, error);
            return [];
        } finally {
            if (browser) await browser.close();
        }
    }

    private parseDate(dateStr: string): Date {
        try {
            // Remove "Publicado em: " prefix if present
            const clean = dateStr.replace('Publicado em:', '').trim();
            const parts = clean.split('/');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        } catch (e) { }
        return new Date();
    }
}
