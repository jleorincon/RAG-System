import { OpenAI } from 'openai';
import { DocumentService } from './documentService';
import { EmbeddingService } from './embeddingService';
import { WebSearchService } from './webSearchService';
import { SportsDataService } from './sportsDataService';
import { randomUUID } from 'crypto';
import { sanitizeText } from '../../utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedChunk[];
  timestamp: Date;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  documentId: string;
  documentTitle?: string;
  chunkIndex: number;
  source?: string;
  type?: 'document' | 'web_content' | 'sports_data';
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  maxTokens?: number;
  temperature?: number;
  useWebSearch?: boolean;
  predictionType?: 'winner' | 'score' | 'outcome' | 'trend' | 'general';
  confidenceLevel?: boolean;
}

export interface ChatResponse {
  id: string;
  message: string;
  sources: RetrievedChunk[];
  sessionId: string;
  timestamp: Date;
}

// New interfaces for prediction query parsing
interface ExtractedQuery {
  intent: 'prediction' | 'general_query';
  sport?: string;
  teams?: string[];
  date?: string;
  factors?: string[];
  confidence?: number;
}

export class ChatService {
  private openai: OpenAI | null;
  private documentService: DocumentService;
  private embeddingService: EmbeddingService;
  private webSearchService: WebSearchService;
  private sportsDataService: SportsDataService;

  constructor() {
    // Only initialize OpenAI if API key is available
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
      : null;

    this.documentService = new DocumentService();
    this.embeddingService = new EmbeddingService();
    this.webSearchService = new WebSearchService();
    this.sportsDataService = new SportsDataService();
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }
    return this.openai;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const sessionId = request.sessionId || randomUUID();
      
      // Sanitize the user message
      const sanitizedMessage = this.sanitizeText(request.message);

      // --- Step 1: Intent Detection and Entity Extraction ---
      const extractedQuery = await this.extractQueryIntent(sanitizedMessage);
      const isPredictionQuery = extractedQuery.intent === 'prediction';
      
      console.log(`[DEBUG] Query: "${sanitizedMessage}"`);
      console.log(`[DEBUG] Extracted intent: ${extractedQuery.intent}, isPredictionQuery: ${isPredictionQuery}`);
      console.log(`[DEBUG] Extracted query details:`, extractedQuery);

      let context = "";
      let actualSources: RetrievedChunk[] = [];

      if (isPredictionQuery && extractedQuery.sport && extractedQuery.teams && extractedQuery.teams.length >= 1) {
        // --- Step 2: Orchestrate Sports Data Retrieval ---
        console.log(`[DEBUG] Taking sports prediction path`);
        const sportsContext = await this.orchestrateSportsDataRetrieval(extractedQuery);
        context = sportsContext.context;
        // Convert sports sources to RetrievedChunk format
        actualSources = sportsContext.sources.map((source: string, index: number) => ({
          id: `sports-${index}`,
          content: source,
          similarity: 1.0,
          documentId: `sports-data-${index}`,
          chunkIndex: index,
          source: source,
          type: 'sports_data' as const
        }));
      } else {
        // Fall back to existing RAG logic for non-prediction queries
        console.log(`[DEBUG] Taking document retrieval path`);
        const retrievedChunks = await this.retrieveRelevantChunks(
          sanitizedMessage,
          5,
          0.3,
          request.useWebSearch || false
        );
        console.log(`[DEBUG] Retrieved ${retrievedChunks.length} chunks`);
        context = this.formatContext(retrievedChunks);
        actualSources = retrievedChunks;
        console.log(`[DEBUG] Actual sources:`, actualSources.length);
      }

      // --- Step 3: Create Specialized System Prompt ---
      const systemPrompt = this.createPredictionSystemPrompt(isPredictionQuery, extractedQuery);

      const finalUserMessage = isPredictionQuery 
        ? `Based on the following real-time sports data and analysis, please provide a detailed prediction for: "${sanitizedMessage}"\n\nContext:\n${context}\n\nPrediction:`
        : `${sanitizedMessage}\n\nContext:\n${context}`;

      // Generate response using OpenAI
      const completion = await this.getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalUserMessage }
        ],
        max_tokens: isPredictionQuery ? 1200 : 1000,
        temperature: isPredictionQuery ? 0.7 : 0.4,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Use the actual sources we retrieved
      const sources: RetrievedChunk[] = actualSources;

      return {
        id: randomUUID(),
        message: response,
        sources,
        sessionId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error in chat service:', error);
      throw new Error(`Failed to generate chat response: ${(error as Error).message}`);
    }
  }

  private async extractQueryIntent(userQuery: string): Promise<ExtractedQuery> {
    const extractionPrompt = `The user is asking a question: "${userQuery}".
    Analyze the query to determine if it is a request for a sports game prediction.
    If it is a prediction request, identify the following:
    - sport (e.g., 'basketball_nba', 'americanfootball_nfl', 'soccer_epl', 'baseball_mlb')
    - teams (e.g., 'Lakers', 'Celtics', 'Manchester United', 'Cowboys')
    - date (e.g., 'tonight', 'tomorrow', 'today', '2025-01-15')
    - specific factors mentioned (e.g., 'injuries', 'recent form', 'odds', 'head-to-head')
    
    Respond in JSON format like this:
    { "intent": "prediction" | "general_query", "sport": "...", "teams": ["...", "..."], "date": "...", "factors": ["..."] }
    If not a prediction, just respond with: { "intent": "general_query" }`;

    try {
      const extractionResponse = await this.getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const parsed = JSON.parse(extractionResponse.choices[0].message?.content || '{}');
      return parsed as ExtractedQuery;
    } catch (e) {
      console.error("Failed to parse extraction response:", e);
      return { intent: "general_query" };
    }
  }

  private async orchestrateSportsDataRetrieval(extractedQuery: ExtractedQuery): Promise<{context: string, sources: string[]}> {
    let context = "";
    const sources: string[] = [];
    const sport = extractedQuery.sport!;
    const teams = extractedQuery.teams!;
    const targetDate = extractedQuery.date || 'today';

    try {
      // --- Get Game Schedule ---
      console.log(`Fetching game schedule for ${sport}`);
      const scheduleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-tools/get-game-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, date: targetDate })
      });

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        if (scheduleData.success && scheduleData.data?.length > 0) {
          // Find games matching the teams
          const relevantGames = scheduleData.data.filter((game: any) => 
            teams.some(team => 
              game.home_team?.toLowerCase().includes(team.toLowerCase()) || 
              game.away_team?.toLowerCase().includes(team.toLowerCase())
            )
          );

          if (relevantGames.length > 0) {
            context += "\n\n**Game Schedule:**\n";
            relevantGames.forEach((game: any) => {
              context += `${game.home_team} vs ${game.away_team} - ${new Date(game.commence_time).toLocaleString()}\n`;
            });
            sources.push("Game Schedule: The Odds API");

            // --- Get Game Odds for found games ---
            for (const game of relevantGames.slice(0, 2)) { // Limit to 2 games to avoid too much data
              try {
                const oddsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-tools/get-game-odds`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sport, gameId: game.id })
                });

                if (oddsResponse.ok) {
                  const oddsData = await oddsResponse.json();
                  if (oddsData.success && oddsData.data?.length > 0) {
                    context += `\n\n**Betting Odds for ${game.home_team} vs ${game.away_team}:**\n`;
                    const gameOdds = oddsData.data[0];
                    if (gameOdds.bookmakers) {
                      gameOdds.bookmakers.slice(0, 3).forEach((bookmaker: any) => {
                        context += `  ${bookmaker.title}:\n`;
                        bookmaker.markets?.forEach((market: any) => {
                          context += `    ${market.key}: `;
                          market.outcomes?.forEach((outcome: any) => {
                            context += `${outcome.name}: ${outcome.price} `;
                          });
                          context += "\n";
                        });
                      });
                    }
                    sources.push(`Betting Odds: ${gameOdds.sport_title} (The Odds API)`);
                  }
                }
              } catch (oddsError) {
                console.warn("Could not fetch odds for game:", game.id, oddsError);
              }
            }
          }
        }
      }
    } catch (scheduleError) {
      console.warn("Could not fetch game schedule:", scheduleError);
      context += "\n\nCould not retrieve current game schedule.";
    }

    // --- Get Team Stats ---
    for (const team of teams.slice(0, 2)) { // Limit to 2 teams
      try {
        const teamStatsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-tools/get-team-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName: team, sport })
        });

        if (teamStatsResponse.ok) {
          const teamStatsData = await teamStatsResponse.json();
          if (teamStatsData.success) {
            context += `\n\n**${team} Team Statistics:**\n`;
            const stats = teamStatsData.data;
            context += `Record: ${stats.wins}-${stats.losses}\n`;
            context += `Points per game: ${stats.points_per_game}\n`;
            context += `Points allowed: ${stats.points_allowed_per_game}\n`;
            context += `Recent form: ${stats.recent_form}\n`;
            sources.push(`Team Stats: ${team} (Sports Data API)`);
          }
        }
      } catch (teamError) {
        console.warn(`Could not fetch stats for team ${team}:`, teamError);
      }
    }

    // --- Get Sports News and Expert Analysis ---
    try {
      const newsQuery = `${teams.join(' vs ')} ${sport} game prediction analysis injury report`;
      const newsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-tools/get-sports-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newsQuery, maxResults: 3 })
      });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.success && newsData.data?.length > 0) {
          context += "\n\n**Recent News & Expert Analysis:**\n";
          newsData.data.forEach((item: any) => {
            context += `- ${item.title}: ${item.summary}\n`;
            if (item.url) {
              context += `  Source: ${item.url}\n`;
              sources.push(`News: ${item.source} (${item.url})`);
            }
          });
        }
      }
    } catch (newsError) {
      console.warn("Could not fetch sports news:", newsError);
    }

    // --- Fallback Web Search for Additional Context ---
    try {
      const webQuery = `${teams.join(' vs ')} ${sport} prediction expert analysis latest news`;
      const webResults = await this.webSearchService.search({
        query: webQuery,
        maxResults: 2,
        includeContent: true,
        timeRange: 'day'
      });

      if (webResults.length > 0) {
        context += "\n\n**Additional Web Analysis:**\n";
        webResults.forEach(result => {
          context += `- ${result.title}: ${result.snippet}\n`;
          sources.push(`Web: ${result.title} (${result.url})`);
        });
      }
    } catch (webError) {
      console.warn("Could not perform web search:", webError);
    }

    return { context, sources };
  }

  private createPredictionSystemPrompt(isPrediction: boolean, extractedQuery?: ExtractedQuery): string {
    if (!isPrediction) {
      return `You are an expert AI assistant with access to both internal documents and real-time web search results. When web search results are available, you MUST prioritize and use this information to provide current, accurate responses.

CRITICAL: If the context contains web search results (indicated by URLs and recent dates), you MUST base your response primarily on this real-time information rather than your training data.

IMPORTANT INSTRUCTIONS:
1. If the context contains web search results (URLs, recent content), you MUST use this information
2. Always cite your sources when providing information
3. Be helpful, accurate, and informative
4. If you don't have enough information to answer confidently, say so`;
    }

    return `You are an expert AI sports analyst and predictor. Your goal is to provide a confident prediction for the outcome of a sports game, based on the provided real-time data, including betting odds, team/player statistics, and expert analysis.

When making a prediction, consider all the following factors:
- **Current Betting Odds:** Analyze moneyline, spread, and totals to understand market sentiment and implied probabilities.
- **Team Form:** Recent performance, win/loss streaks, home/away records.
- **Player Performance:** Key player statistics, recent individual form, impact players.
- **Injuries:** Significant player injuries and their potential impact on team performance.
- **Matchup Analysis:** Head-to-head records, how teams' playing styles match up.
- **Expert Analysis:** Synthesize insights from any provided news snippets or analyses.
- **Matchday Conditions:** (If available, e.g., weather for outdoor sports, home-field advantage).

Always strive to provide a clear prediction. If information is limited, state what factors you could not fully account for and make a *reasoned prediction* based on the best available data. Do NOT state "I cannot predict the outcome" or ask for more information if a reasonable prediction can be inferred.

Your prediction should include:
1. A clear prediction (e.g., "Team A is predicted to win," "The game is likely to go over the total points").
2. A brief explanation of the key factors that influenced your prediction, referencing the data provided.
3. A confidence score (1-10 scale) where:
   * 1-3: Low confidence (high uncertainty, limited data)
   * 4-6: Moderate confidence (some data available, but significant variables)
   * 7-8: High confidence (strong data, clear patterns)
   * 9-10: Very high confidence (overwhelming evidence, minimal uncertainty)
4. Mention any uncertainties or missing data that might affect the prediction.
5. Cite your sources from the provided context clearly.

HANDLING REAL-TIME DATA:
- If sports data (odds, schedules, stats) is present in the context, explicitly state "Based on current sports data..."
- Quote specific information from the sports data sources
- Mention the source APIs when referencing sports information
- Use the real-time data to make informed, current predictions rather than generic responses`;
  }

  private detectPredictionQuery(message: string): boolean {
    const predictionKeywords = [
      'predict', 'prediction', 'forecast', 'who will win', 'what will happen',
      'outcome', 'result', 'likely', 'chances', 'probability', 'odds',
      'future', 'next', 'upcoming', 'expect', 'anticipate', 'will be',
      'going to', 'trend', 'projection', 'estimate'
    ];
    
    const lowerMessage = message.toLowerCase();
    return predictionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private inferPredictionType(message: string): 'winner' | 'score' | 'outcome' | 'trend' | 'general' {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('win') || lowerMessage.includes('winner') || lowerMessage.includes('beat')) {
      return 'winner';
    }
    if (lowerMessage.includes('score') || lowerMessage.includes('points') || lowerMessage.includes('goals')) {
      return 'score';
    }
    if (lowerMessage.includes('trend') || lowerMessage.includes('direction') || lowerMessage.includes('movement')) {
      return 'trend';
    }
    if (lowerMessage.includes('outcome') || lowerMessage.includes('result') || lowerMessage.includes('happen')) {
      return 'outcome';
    }
    
    return 'general';
  }

  private createEnhancedSystemPrompt(
    context: string, 
    isPrediction: boolean, 
    predictionType: string,
    includeConfidence: boolean
  ): string {
    let basePrompt = `You are an expert AI assistant with access to both internal documents and real-time web search results. When web search results are available, you MUST prioritize and use this information to provide current, accurate responses.

CRITICAL: If the context contains web search results (indicated by URLs and recent dates), you MUST base your response primarily on this real-time information rather than your training data.`;

    if (isPrediction) {
      basePrompt += ` You specialize in making informed predictions and forecasts based on available data.

PREDICTION GUIDELINES:
- Type: This query appears to be asking for a ${predictionType} prediction
- ALWAYS provide a clear, specific prediction rather than avoiding the question
- When web search results are available, use them as your PRIMARY source for current information
- Base predictions on: recent performance, current conditions, historical patterns, and expert analysis from the web results
- Consider multiple factors and explain your reasoning using the provided sources
- Account for uncertainty and variables that could affect the outcome`;

      if (includeConfidence) {
        basePrompt += `
- ALWAYS include a confidence score (1-10 scale) where:
  * 1-3: Low confidence (high uncertainty, limited data)
  * 4-6: Moderate confidence (some data available, but significant variables)
  * 7-8: High confidence (strong data, clear patterns)
  * 9-10: Very high confidence (overwhelming evidence, minimal uncertainty)`;
      }

      basePrompt += `

HANDLING WEB SEARCH RESULTS:
- If web search results are present in the context, explicitly state "Based on current web search results..."
- Quote specific information from the web sources
- Mention the source URLs when referencing web information
- Use the web results to make informed, current predictions rather than generic responses`;
    }

    basePrompt += `

IMPORTANT INSTRUCTIONS:
1. If the context contains web search results (URLs, recent content), you MUST use this information`;

    return basePrompt;
  }

  private async retrieveRelevantChunks(
    query: string,
    limit: number = 5,
    threshold: number = 0.3,
    useWebSearch: boolean = false
  ): Promise<RetrievedChunk[]> {
    let relevantChunks: RetrievedChunk[] = [];
    let webSearchFailed = false;

    console.log(`[DEBUG] retrieveRelevantChunks called with query: "${query}", limit: ${limit}, threshold: ${threshold}, useWebSearch: ${useWebSearch}`);

    try {
      // 1. FIRST PRIORITY: Search uploaded documents with higher threshold and more results
      console.log('Step 1: Searching uploaded documents for query:', query);
      
      const uploadedDocumentResults = await this.embeddingService.unifiedSearch(query, {
        matchThreshold: Math.max(threshold, 0.2), // Reasonable threshold for uploaded docs
        matchCount: limit, // Get more results from uploaded docs initially
        includeChunks: true,
        includeStructured: true,
      });

      // Convert uploaded document results to RetrievedChunk format
      const uploadedChunks = uploadedDocumentResults.map(result => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
        documentId: result.documentId,
        documentTitle: result.documentTitle,
        chunkIndex: result.contentType === 'chunk' ? 0 : -1,
        type: 'document' as const,
      }));

      console.log(`[DEBUG] Found ${uploadedChunks.length} relevant chunks from uploaded documents with similarities:`, uploadedChunks.map(c => c.similarity));

      // 2. Check if uploaded documents provide sufficient relevant content
      const highQualityUploaded = uploadedChunks.filter(chunk => chunk.similarity >= 0.25);
      
      if (highQualityUploaded.length >= Math.ceil(limit * 0.6)) {
        // We have good matches from uploaded documents, prioritize them
        console.log(`Using ${highQualityUploaded.length} high-quality matches from uploaded documents`);
        relevantChunks = highQualityUploaded.slice(0, limit);
        
        // Add a few more if we have space and they're decent quality
        const remainingSlots = limit - relevantChunks.length;
        if (remainingSlots > 0) {
          const additionalChunks = uploadedChunks
            .filter(chunk => chunk.similarity >= 0.15 && !highQualityUploaded.includes(chunk))
            .slice(0, remainingSlots);
          relevantChunks = [...relevantChunks, ...additionalChunks];
        }
      } else {
        // Not enough high-quality matches, include all decent uploaded content
        relevantChunks = uploadedChunks.filter(chunk => chunk.similarity >= threshold);
        console.log(`Found ${relevantChunks.length} moderate-quality matches from uploaded documents`);
      }

      // 3. If we still don't have enough relevant content from uploaded documents, 
      // supplement with web search or expand the search
      if (relevantChunks.length < Math.ceil(limit * 0.5)) {
        console.log(`Need more content (have ${relevantChunks.length}/${limit}), expanding search...`);
        
        // Try web search if requested or if we have very few results
        if (useWebSearch || relevantChunks.length < 2) {
          console.log('Performing web search for additional context:', query);
          try {
            const webResults = await this.webSearchService.search({
              query: query,
              maxResults: Math.ceil(limit * 0.4), // Limit web results to supplement uploaded docs
              includeContent: true,
              timeRange: 'week',
              searchEngine: 'duckduckgo',
              cacheMaxAge: 60,
              bypassCache: false
            });

            // Convert web results into RetrievedChunk format
            const webChunks: RetrievedChunk[] = webResults.map((result, index) => ({
              id: `web_${index}`,
              content: result.content || result.snippet,
              similarity: result.cached ? 0.7 : 0.6, // Lower similarity than uploaded docs
              documentId: `web_${index}`,
              documentTitle: result.title,
              chunkIndex: -1,
              source: result.url,
              type: 'web_content' as const,
            }));

            // Add web results but keep uploaded documents as priority
            const remainingSlots = limit - relevantChunks.length;
            relevantChunks = [...relevantChunks, ...webChunks.slice(0, remainingSlots)];
            
            console.log(`Added ${Math.min(webChunks.length, remainingSlots)} web results as supplementary content`);
          } catch (webSearchError) {
            console.error('Web search failed:', webSearchError);
            webSearchFailed = true;
            console.log('Continuing with uploaded document results only');
          }
        }

        // 4. If still not enough content, expand uploaded document search with lower threshold
        if (relevantChunks.length < Math.ceil(limit * 0.5)) {
          console.log('Expanding uploaded document search with lower threshold');
          try {
            const expandedResults = await this.embeddingService.unifiedSearch(query, {
              matchThreshold: Math.max(threshold * 0.5, 0.1), // Much lower threshold for more results
              matchCount: limit * 2, // Get more candidates
              includeChunks: true,
              includeStructured: true,
            });

            const expandedChunks = expandedResults
              .filter(result => !relevantChunks.some(existing => existing.id === result.id)) // Avoid duplicates
              .map(result => ({
                id: result.id,
                content: result.content,
                similarity: result.similarity,
                documentId: result.documentId,
                documentTitle: result.documentTitle,
                chunkIndex: result.contentType === 'chunk' ? 0 : -1,
                type: 'document' as const,
              }));

            // Add the best expanded results to fill remaining slots
            const remainingSlots = limit - relevantChunks.length;
            relevantChunks = [...relevantChunks, ...expandedChunks.slice(0, remainingSlots)];
            
            console.log(`Added ${Math.min(expandedChunks.length, remainingSlots)} additional document chunks`);
          } catch (expandedError) {
            console.error('Expanded document search failed:', expandedError);
          }
        }
      }

    } catch (error) {
      console.error('Error in document-priority retrieval:', error);
      
      // Fallback to original method if our enhanced search fails
      try {
        console.log('Falling back to original search method');
        const similarChunks = await this.documentService.searchSimilarChunks(
          query,
          limit,
          threshold
        );

        relevantChunks = similarChunks.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.similarity,
          documentId: chunk.document_id,
          documentTitle: chunk.document_title,
          chunkIndex: chunk.chunk_index,
          type: 'document' as const,
        }));
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
    }

    // 5. Sort results by similarity (uploaded docs will naturally rank higher due to better similarity scores)
    relevantChunks.sort((a, b) => b.similarity - a.similarity);

    // 6. Add metadata about search strategy
    relevantChunks.forEach(chunk => {
      if (chunk.type === 'document') {
        chunk.source = chunk.source || 'uploaded_document';
      }
      if (useWebSearch && webSearchFailed) {
        chunk.source = chunk.source + '_web_search_failed';
      }
    });

    const finalResults = relevantChunks.slice(0, limit);
    const uploadedCount = finalResults.filter(chunk => chunk.type === 'document').length;
    const webCount = finalResults.filter(chunk => chunk.type === 'web_content').length;
    
    console.log(`[DEBUG] Final results: ${finalResults.length} total (${uploadedCount} from uploaded docs, ${webCount} from web)`);
    console.log(`[DEBUG] Final result similarities:`, finalResults.map(r => ({ id: r.id.slice(0, 8), similarity: r.similarity, title: r.documentTitle })));
    
    return finalResults;
  }

  private sanitizeText(text: string): string {
    // Use the centralized sanitizeText function
    return sanitizeText(text);
  }

  private formatContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'No relevant context found.';
    }

    // Separate different types of results
    const uploadedDocResults = chunks.filter(chunk => chunk.type === 'document');
    const webResults = chunks.filter(chunk => chunk.type === 'web_content');
    const sportsResults = chunks.filter(chunk => chunk.type === 'sports_data');

    let context = '';

    // HIGHEST PRIORITY: Uploaded documents
    if (uploadedDocResults.length > 0) {
      context += '=== UPLOADED DOCUMENTS (HIGHEST PRIORITY) ===\n\n';
      context += 'The following information comes from documents that have been uploaded to your knowledge base. This content should be prioritized when answering the user\'s question.\n\n';
      
      uploadedDocResults.forEach((chunk, index) => {
        const title = chunk.documentTitle || `Document ${chunk.documentId.slice(0, 8)}`;
        const sanitizedContent = this.sanitizeText(chunk.content);
        const similarity = Math.round(chunk.similarity * 100);
        
        context += `[UPLOADED DOCUMENT ${index + 1}: ${title}] (${similarity}% match)\n`;
        context += `Content: ${sanitizedContent}\n\n`;
      });
      context += '=== END UPLOADED DOCUMENTS ===\n\n';
    }

    // SECOND PRIORITY: Current web results (if available)
    if (webResults.length > 0) {
      context += '=== CURRENT WEB SEARCH RESULTS (SUPPLEMENTARY) ===\n\n';
      context += 'The following information comes from recent web searches and should be used to supplement the uploaded document content.\n\n';
      
      webResults.forEach((chunk, index) => {
        const source = chunk.source || 'Unknown URL';
        const title = chunk.documentTitle || 'Web Result';
        const sanitizedContent = this.sanitizeText(chunk.content);
        
        context += `[WEB RESULT ${index + 1}: ${title}]\n`;
        context += `URL: ${source}\n`;
        context += `Content: ${sanitizedContent}\n\n`;
      });
      context += '=== END WEB RESULTS ===\n\n';
    }

    // THIRD PRIORITY: Sports data (if available)
    if (sportsResults.length > 0) {
      context += '=== SPORTS DATA (SUPPLEMENTARY) ===\n\n';
      sportsResults.forEach((chunk, index) => {
        const sanitizedContent = this.sanitizeText(chunk.content);
        context += `[SPORTS DATA ${index + 1}]: ${sanitizedContent}\n\n`;
      });
      context += '=== END SPORTS DATA ===\n\n';
    }

    // Add instructions based on what content is available
    if (uploadedDocResults.length > 0) {
      context += 'CRITICAL INSTRUCTION: The UPLOADED DOCUMENTS section contains the most relevant and authoritative information for answering this question. Prioritize this content in your response and cite these documents when providing information. ';
      
      if (webResults.length > 0) {
        context += 'Use the web search results only to supplement or provide additional current context that complements the uploaded documents. ';
      }
      
      if (uploadedDocResults.length >= 3) {
        context += 'Since multiple relevant uploaded documents were found, this suggests the question is well-covered by the uploaded content.\n\n';
      } else {
        context += 'If the uploaded documents don\'t fully answer the question, you may supplement with other sources.\n\n';
      }
    } else if (webResults.length > 0) {
      context += 'INSTRUCTION: No relevant uploaded documents were found for this query. Use the web search results to provide current, accurate information.\n\n';
    }

    return context;
  }

  async streamChat(request: ChatRequest): Promise<AsyncGenerator<string, void, unknown>> {
    try {
      // Sanitize the user message
      const sanitizedMessage = this.sanitizeText(request.message);

      const retrievedChunks = await this.retrieveRelevantChunks(
        sanitizedMessage,
        5,
        0.3, // Lowered threshold for better recall
        request.useWebSearch || false // Pass web search flag
      );

      const context = this.formatContext(retrievedChunks);

      const systemPrompt = this.sanitizeText(`You are an expert AI assistant designed to provide predictions based on the latest available information. 
You have access to both internal documents and real-time web search results when available.

When asked to predict an outcome (e.g., sports match results, market trends, election outcomes), explicitly take into account factors such as:
- Recent performance and form
- Current conditions and context
- Historical patterns and trends
- Expert opinions and analysis
- Any relevant breaking news or developments

If the information is not directly available, make a reasonable, informed prediction based on the context provided, and clearly state any assumptions made.
Always strive to give an answer, even if it requires making a well-reasoned inference. Do NOT say "I cannot predict the outcome" if a reasonable prediction can be formed from the given context.

Context:
${context}

Please provide a comprehensive answer based on the context above. If you reference specific information, mention which document or source it came from. For web-sourced information, include the source URL when available.`);

      const stream = await this.getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini', // Updated to use available model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        stream: true,
      });

      return this.streamGenerator(stream);
    } catch (error) {
      console.error('Error in streaming chat:', error);
      throw new Error(`Failed to generate streaming response: ${(error as Error).message}`);
    }
  }

  private async* streamGenerator(stream: any): AsyncGenerator<string, void, unknown> {
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Error in stream generator:', error);
      throw error;
    }
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    // This would typically be stored in a database
    // For now, return empty array as we're focusing on the core RAG functionality
    return [];
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    // This would typically clear the chat history from database
    // For now, this is a placeholder
    console.log(`Clearing chat history for session: ${sessionId}`);
  }
} 