import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

interface SearchResult {
  court: string;
  number: string;
  date: string;
  summary: string;
  understanding: string;
  ementa: string;
  link: string;
  relevance: number;
}

interface PaginatedResults {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class JurisprudenceService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new', // Updated to new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ],
      });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ============================================
  // EXTRAIR EMENTA DIRETAMENTE DA PÁGINA DE BUSCA
  // ============================================
  private extractEmentaFromSummary(text: string): string {
    // Limpar o texto
    let ementa = text.trim();

    // Se o texto já começa com "EMENTA:", manter
    if (ementa.toUpperCase().startsWith('EMENTA')) {
      return ementa;
    }

    // Procurar por "EMENTA:" no meio do texto
    const ementaMatch = ementa.match(/EMENTA[:\s]+([\s\S]+)/i);
    if (ementaMatch && ementaMatch[1]) {
      return `EMENTA: ${ementaMatch[1].trim()}`;
    }

    // Se não encontrou, adicionar "EMENTA:" no início
    return `EMENTA: ${ementa}`;
  }

  // ============================================
  // BUSCAR NO JUSBRASIL (COM PAGINAÇÃO)
  // ============================================
  private async searchJusbrasil(query: string, court: string, pageNumber: number = 1): Promise<{ results: SearchResult[], total: number }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🔍 [JusBrasil] Buscando: "${query}" (Página ${pageNumber})`);

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // URL de busca com parâmetro de página
      const searchUrl = `https://www.jusbrasil.com.br/jurisprudencia/busca?q=${encodeURIComponent(query)}&p=${pageNumber}`;
      console.log(`📡 Acessando: ${searchUrl}\n`);

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // Wait for results to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extrair total de resultados (tentativa)
      const totalResults = await page.evaluate(() => {
        try {
          // Tentativa 1: Seletores específicos
          const countSelectors = [
            '[data-testid="results-count"]',
            '.results-count',
            '.Search-results-count',
            '[class*="resultsCount"]',
            '.Search-query-count'
          ];

          for (const sel of countSelectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent) {
              const num = el.textContent.replace(/\D/g, '');
              return parseInt(num) || 0;
            }
          }

          // Tentativa 2: Busca textual por "X resultados" ou "Encontrados X"
          const bodyText = document.body.innerText;
          const match = bodyText.match(/(\d[\d\.]*)\s+resultados/i) || bodyText.match(/Encontrados\s+(\d[\d\.]*)/i);
          if (match) {
            return parseInt(match[1].replace(/\./g, '')) || 0;
          }

          return 0;
        } catch (e) {
          return 0;
        }
      });

      console.log(`📊 Estimativa de total de resultados: ${totalResults}`);

      // Extrair todos os resultados da página
      const searchResults = await page.evaluate(() => {
        const results: any[] = [];

        // Seletores atualizados
        const possibleContainers = [
          'article',
          '[data-testid="result"]',
          '.SearchResult',
          '.result-card',
          'div[class*="Result"]'
        ];

        let containers: Element[] = [];
        for (const sel of possibleContainers) {
          const found = Array.from(document.querySelectorAll(sel));
          if (found.length > 0) {
            containers = found;
            break;
          }
        }

        containers.forEach((container) => {
          try {
            const linkEl = container.querySelector('a[href*="/jurisprudencia/"]');
            const href = linkEl?.getAttribute('href') || '';

            if (!href || href.includes('/busca')) return;

            const fullUrl = href.startsWith('http') ? href : `https://www.jusbrasil.com.br${href}`;

            // Título
            const titleEl = container.querySelector('h2, h3, [class*="title"]');
            const title = titleEl?.textContent?.trim() || '';

            // Texto
            const textEl = container.querySelector('p, [class*="snippet"], [class*="body"]');
            const text = textEl?.textContent?.trim() || '';

            // Data
            const dateEl = container.querySelector('time, [class*="date"]');
            const date = dateEl?.textContent?.trim() || '';

            // Tribunal (tentativa de extrair do título ou texto)
            const tribunalMatch = (title + ' ' + text).match(/(STF|STJ|TST|TSE|TRF-?\d|TJ-?[A-Z]{2}|TRT-?\d+)/i);
            const tribunal = tribunalMatch ? tribunalMatch[0].toUpperCase() : 'Tribunal';

            if (title || text) {
              results.push({
                url: fullUrl,
                title: title,
                text: text,
                tribunal: tribunal,
                date: date
              });
            }
          } catch (e) { }
        });

        return results;
      });

      console.log(`📚 Extraídos ${searchResults.length} resultados da página ${pageNumber}\n`);

      // Processar resultados
      const allResults: SearchResult[] = [];

      for (const result of searchResults) {
        // ... Logica de processamento existente ...

        // Filtrar por tribunal se necessário
        if (court !== 'TODOS' && !result.tribunal.includes(court)) {
          continue;
        }

        // Limpar o texto de artefatos comuns da interface do Jusbrasil
        let cleanText = result.text
          .replace(/Jurisprudência\s*Acórdão\s*Mostrar\s*data\s*de\s*publicação/gi, '')
          .replace(/Mostrar\s*data\s*de\s*publicação/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        const ementa = cleanText.length > 200 ? 'EMENTA: ' + cleanText : cleanText;

        allResults.push({
          court: result.tribunal,
          number: result.title || 'N/A',
          date: result.date || new Date().toLocaleDateString('pt-BR'),
          summary: cleanText.substring(0, 300) + '...',
          understanding: cleanText.substring(0, 300) + '...',
          ementa: ementa,
          link: result.url,
          relevance: 90
        });
      }

      // Use stricter total count logic
      let finalTotal = totalResults;

      // Se o total encontrado for muito baixo (igual ao número de resultados na página),
      // provavelmente capturamos o contador de "itens visíveis" e não o total real.
      // Nesse caso, usamos o fallback para garantir que a paginação funcione.
      if (!finalTotal || finalTotal < 50) {
        finalTotal = 5000;
      }

      return { results: allResults, total: finalTotal };

    } catch (error) {
      console.error(`❌ [JusBrasil] Erro: ${error}\n`);
      return { results: [], total: 0 };
    } finally {
      await page.close();
    }
  }

  // ============================================
  // BUSCAR EM TODAS AS FONTES
  // ============================================
  async searchAll(query: string, court: string = 'TODOS', page: number = 1, pageSize: number = 20): Promise<PaginatedResults> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 NOVA BUSCA AGREGADA: "${query}"`);
      console.log(`📋 Tribunal: ${court} | Página do Usuário: ${page} | Itens por página: ${pageSize}`);
      console.log(`${'='.repeat(60)}\n`);

      // Jusbrasil retorna aprox 10 resultados por página
      const SOURCE_PAGE_SIZE = 10;
      const pagesToFetch = Math.ceil(pageSize / SOURCE_PAGE_SIZE);

      const startSourcePage = ((page - 1) * pagesToFetch) + 1;
      const endSourcePage = startSourcePage + pagesToFetch - 1;

      console.log(`📑 Buscando páginas de origem: ${startSourcePage} até ${endSourcePage}`);

      let allResults: SearchResult[] = [];
      let maxTotalFound = 0;

      // Buscar múltiplas páginas em paralelo ou sequencial
      // Sequencial é mais seguro para evitar bloqueios
      for (let i = startSourcePage; i <= endSourcePage; i++) {
        const { results, total } = await this.searchJusbrasil(query, court, i);
        allResults = [...allResults, ...results];
        if (total > maxTotalFound) maxTotalFound = total;

        // Pequeno delay entre requisições para evitar rate limit
        if (i < endSourcePage) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ BUSCA AGREGADA CONCLUÍDA`);
      console.log(`📊 Total coletado: ${allResults.length}`);
      console.log(`📊 Total estimado global: ${maxTotalFound}`);
      console.log(`${'='.repeat(60)}\n`);

      // Ordenar por relevância (se necessário, mas geralmente já vem ok)
      // results.sort((a, b) => b.relevance - a.relevance);

      const totalPages = Math.ceil(maxTotalFound / pageSize);

      return {
        results: allResults,
        total: maxTotalFound,
        page,
        pageSize,
        totalPages
      };

    } catch (error) {
      console.error('\n❌ ERRO GERAL:', error, '\n');
      return {
        results: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 0
      };
    }
  }
}

export default new JurisprudenceService();
