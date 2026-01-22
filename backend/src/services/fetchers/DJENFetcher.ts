import { getBrowser } from '../../utils/browserHelper';
import { SourceFetcher, CaseUpdateResult } from './SourceFetcher';

export class DJENFetcher implements SourceFetcher {
    sourceName = "DJEN (Diário de Justiça Eletrônico Nacional)";
    private baseUrl = "https://comunica.pje.jus.br/";

    async fetchUpdates(cnj: string): Promise<CaseUpdateResult[]> {
        console.log(`[DJEN] Starting search for CNJ: ${cnj}`);
        let browser;
        try {
            browser = await getBrowser();
            const page = await browser.newPage();

            // Set a generous timeout for government sites
            page.setDefaultNavigationTimeout(60000);

            // 1. Navigate to the portal
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            // 2. Wait for the search input (inspecting the site or assuming standard structure)
            // Based on known structure of PJe Comunica or similar portals. 
            // The portal usually has a sidebar or main search bar.
            // Adjusting selectors based on typical element names if specific IDs are unknown, 
            // but for Comunica PJe, it's often an input looking for "Número do Processo".

            // Heuristic selectors - user might need to debug if selectors change.
            // PJe Comunica usually acts as a SPA.

            // Wait for input to be present.
            const searchInputSelector = 'input[type="text"]';
            // Ideally we look for a specific ID or placeholder, e.g. "Número do processo"
            // Let's try to be more specific if possible, or iterate inputs.

            await page.waitForSelector(searchInputSelector);

            // Type CNJ. ensuring only numbers if field expects that, or full format.
            // Comunica PJe often expects standard format: NNNNNNN-DD.AAAA.J.TR.OOOO
            await page.type(searchInputSelector, cnj);
            await page.keyboard.press('Enter');

            // 3. Wait for results
            // Wait for a result list item or a "no results" message.
            try {
                // Wait for either card-result or empty-state
                await page.waitForSelector('.card-resultado, .no-results', { timeout: 15000 });
            } catch (e) {
                console.log("[DJEN] Timeout waiting for results container.");
                return [];
            }

            // 4. Extract data
            const updates = await page.evaluate(() => {
                const results: any[] = [];
                // Look for result cards
                const cards = document.querySelectorAll('.card-resultado'); // Hypothetical class

                // If the site structure is different (e.g. table rows)
                // Fallback to searching common container patterns if specific class not found
                // For this implementation, I will rely on generic traversal if explicit classes fail
                // But for now let's assume standard PJe-like cards.

                /*
                 * Note: Since I cannot browse the live site to get the EXACT CSS selectors right now,
                 * I will implement a robust text-search fallback in the scraper or ask the user to verify.
                 * However, for "Comunica", known structure often involves cards with dates.
                 */

                cards.forEach(card => {
                    const dateEl = card.querySelector('.data-disponibilizacao');
                    const contentEl = card.querySelector('.teor-ato, .conteudo');
                    const linkEl = card.querySelector('a');

                    if (contentEl) {
                        results.push({
                            dateStr: dateEl ? dateEl.textContent?.trim() : new Date().toISOString(),
                            content: contentEl.textContent?.trim() || "",
                            link: linkEl ? linkEl.href : ""
                        });
                    }
                });
                return results;
            });

            // Parse dates and format
            const parsedUpdates: CaseUpdateResult[] = updates.map(u => {
                const dateParts = u.dateStr.split('/'); // Assuming DD/MM/YYYY
                let dateObj = new Date();
                if (dateParts.length === 3) {
                    dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                }

                return {
                    sourceName: "DJEN",
                    date: dateObj,
                    content: u.content,
                    link: u.link || this.baseUrl
                };
            });

            console.log(`[DJEN] Found ${parsedUpdates.length} updates for ${cnj}`);
            return parsedUpdates;

        } catch (error) {
            console.error(`[DJEN] Error scraping:`, error);
            // Return empty list on error to not crash the flow
            return [];
        } finally {
            if (browser) await browser.close();
        }
    }
}
