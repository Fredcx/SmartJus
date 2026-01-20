export interface CaseUpdateResult {
    date: Date;
    content: string;
    link: string;
    sourceName: string; // e.g., "DJEN", "DOU"
    edition?: string;
}

export interface SourceFetcher {
    sourceName: string;
    /**
     * Searches for updates for a specific case number (CNJ).
     * @param cnj The CNJ number formatted or unformatted.
     * @returns A list of updates found.
     */
    fetchUpdates(cnj: string): Promise<CaseUpdateResult[]>;
}
