import axios from 'axios';

// Types for sports data
export interface GameSchedule {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: BookmakerData[];
}

export interface BookmakerData {
  key: string;
  title: string;
  last_update: string;
  markets: MarketData[];
}

export interface MarketData {
  key: string; // 'h2h' (moneyline), 'spreads', 'totals'
  last_update: string;
  outcomes: OutcomeData[];
}

export interface OutcomeData {
  name: string;
  price: number; // American odds format
  point?: number; // For spreads/totals
}

export interface TeamStats {
  team: string;
  sport: string;
  season: string;
  wins: number;
  losses: number;
  points_per_game: number;
  points_allowed_per_game: number;
  recent_form: string; // e.g., "W-L-W-W-L"
  last_updated: string;
}

export interface PlayerStats {
  player: string;
  team: string;
  sport: string;
  season: string;
  position: string;
  games_played: number;
  points_per_game?: number;
  rebounds_per_game?: number;
  assists_per_game?: number;
  injury_status: string;
  last_updated: string;
}

export interface SportsNewsItem {
  title: string;
  summary: string;
  url: string;
  published_date: string;
  source: string;
  relevance_score?: number;
}

interface GetGameScheduleOptions {
  sport: string; // e.g., 'basketball_nba', 'americanfootball_nfl'
  date?: string; // YYYY-MM-DD format
  league?: string;
  regions?: string; // 'us', 'uk', 'eu', 'au'
}

interface GetGameOddsOptions {
  sport: string;
  gameId?: string;
  regions?: string;
  markets?: string; // 'h2h,spreads,totals'
  oddsFormat?: 'decimal' | 'american';
  dateFrom?: string;
  dateTo?: string;
}

interface GetTeamStatsOptions {
  teamName: string;
  sport: string;
  season?: string;
}

interface GetPlayerStatsOptions {
  playerName: string;
  sport: string;
  teamName?: string;
  season?: string;
}

interface GetSportsNewsOptions {
  query: string;
  sport?: string;
  team?: string;
  maxResults?: number;
}

export class SportsDataService {
  private theOddsApiKey: string | null;
  private sportsDataIoApiKey: string | null;
  private baseUrlOdds = 'https://api.the-odds-api.com/v4';
  private baseUrlSportsData = 'https://api.sportsdata.io/v3';

  constructor() {
    this.theOddsApiKey = process.env.THE_ODDS_API_KEY || null;
    this.sportsDataIoApiKey = process.env.SPORTSDATA_IO_API_KEY || null;
  }

  // Get available sports from The Odds API
  async getAvailableSports(): Promise<any[]> {
    if (!this.theOddsApiKey) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrlOdds}/sports`, {
        params: {
          apiKey: this.theOddsApiKey
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available sports:', error.response?.data || error.message);
      throw new Error('Failed to fetch available sports');
    }
  }

  // Get game schedule
  async getGameSchedule(options: GetGameScheduleOptions): Promise<GameSchedule[]> {
    if (!this.theOddsApiKey) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }

    const { sport, date, regions = 'us' } = options;

    try {
      let url = `${this.baseUrlOdds}/sports/${sport}/odds`;
      const params: any = {
        apiKey: this.theOddsApiKey,
        regions,
        markets: 'h2h', // Just get basic odds for schedule
        oddsFormat: 'american'
      };

      if (date) {
        // The Odds API doesn't have a direct date filter, but we can filter results
        // For now, we'll get all upcoming games and filter client-side
      }

      const response = await axios.get(url, { params });
      
      // Transform the response to our GameSchedule format
      const games: GameSchedule[] = response.data.map((game: any) => ({
        id: game.id,
        sport_key: game.sport_key,
        sport_title: game.sport_title,
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        bookmakers: game.bookmakers
      }));

      // Filter by date if provided
      if (date) {
        const filterDate = new Date(date);
        return games.filter(game => {
          const gameDate = new Date(game.commence_time);
          return gameDate.toDateString() === filterDate.toDateString();
        });
      }

      return games;
    } catch (error: any) {
      console.error('Error fetching game schedule:', error.response?.data || error.message);
      throw new Error('Failed to fetch game schedule');
    }
  }

  // Get game odds
  async getGameOdds(options: GetGameOddsOptions): Promise<GameSchedule[]> {
    if (!this.theOddsApiKey) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }

    const { 
      sport, 
      gameId, 
      regions = 'us', 
      markets = 'h2h,spreads,totals', 
      oddsFormat = 'american',
      dateFrom,
      dateTo
    } = options;

    try {
      let url = `${this.baseUrlOdds}/sports/${sport}/odds`;
      const params: any = {
        apiKey: this.theOddsApiKey,
        regions,
        markets,
        oddsFormat
      };

      if (gameId) {
        params.eventIds = gameId;
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      const response = await axios.get(url, { params });
      
      return response.data.map((game: any) => ({
        id: game.id,
        sport_key: game.sport_key,
        sport_title: game.sport_title,
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        bookmakers: game.bookmakers
      }));
    } catch (error: any) {
      console.error('Error fetching game odds:', error.response?.data || error.message);
      throw new Error('Failed to fetch game odds');
    }
  }

  // Get team statistics (mock implementation - would need actual sports stats API)
  async getTeamStats(options: GetTeamStatsOptions): Promise<TeamStats> {
    const { teamName, sport, season = '2024' } = options;

    // This is a mock implementation. In a real scenario, you'd integrate with
    // a service like SportsDataIO, ESPN API, or similar
    console.log(`Fetching team stats for ${teamName} in ${sport} (${season})`);

    // Mock data - replace with actual API call
    const mockStats: TeamStats = {
      team: teamName,
      sport,
      season,
      wins: Math.floor(Math.random() * 20) + 10,
      losses: Math.floor(Math.random() * 15) + 5,
      points_per_game: Math.floor(Math.random() * 50) + 80,
      points_allowed_per_game: Math.floor(Math.random() * 40) + 75,
      recent_form: 'W-L-W-W-L',
      last_updated: new Date().toISOString()
    };

    return mockStats;
  }

  // Get player statistics (mock implementation)
  async getPlayerStats(options: GetPlayerStatsOptions): Promise<PlayerStats> {
    const { playerName, sport, teamName, season = '2024' } = options;

    console.log(`Fetching player stats for ${playerName} in ${sport} (${season})`);

    // Mock data - replace with actual API call
    const mockStats: PlayerStats = {
      player: playerName,
      team: teamName || 'Unknown Team',
      sport,
      season,
      position: 'Guard', // This would come from the API
      games_played: Math.floor(Math.random() * 30) + 40,
      points_per_game: Math.floor(Math.random() * 15) + 10,
      rebounds_per_game: Math.floor(Math.random() * 8) + 3,
      assists_per_game: Math.floor(Math.random() * 6) + 2,
      injury_status: 'Healthy',
      last_updated: new Date().toISOString()
    };

    return mockStats;
  }

  // Get sports news (uses existing web search service)
  async getSportsNews(options: GetSportsNewsOptions): Promise<SportsNewsItem[]> {
    const { query, sport, team, maxResults = 5 } = options;

    // Build search query
    let searchQuery = query;
    if (sport) searchQuery += ` ${sport}`;
    if (team) searchQuery += ` ${team}`;
    searchQuery += ' latest news';

    try {
      // Use the existing WebSearchService for news
      const { WebSearchService } = await import('./webSearchService');
      const webSearchService = new WebSearchService();
      
      const searchResults = await webSearchService.search({
        query: searchQuery,
        maxResults,
        includeContent: false,
        timeRange: 'week',
        searchEngine: 'duckduckgo'
      });

      // Transform web search results to sports news format
      return searchResults.map(result => ({
        title: result.title,
        summary: result.snippet,
        url: result.url,
        published_date: result.publishedDate || new Date().toISOString(),
        source: result.source || 'Web Search',
        relevance_score: this.calculateRelevanceScore(result.title + ' ' + result.snippet, query)
      }));
    } catch (error: any) {
      console.error('Error fetching sports news:', error.message);
      throw new Error('Failed to fetch sports news');
    }
  }

  // Helper method to calculate relevance score
  private calculateRelevanceScore(text: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const textLower = text.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 1;
      }
    });
    
    return score / queryWords.length;
  }

  // Get historical odds (useful for analysis)
  async getHistoricalOdds(sport: string, dateFrom: string, dateTo: string): Promise<GameSchedule[]> {
    if (!this.theOddsApiKey) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrlOdds}/sports/${sport}/odds-history`, {
        params: {
          apiKey: this.theOddsApiKey,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          dateFrom,
          dateTo
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching historical odds:', error.response?.data || error.message);
      throw new Error('Failed to fetch historical odds');
    }
  }

  // Utility method to format odds for display
  formatOdds(odds: number, format: 'american' | 'decimal' = 'american'): string {
    if (format === 'american') {
      return odds > 0 ? `+${odds}` : `${odds}`;
    } else {
      // Convert American odds to decimal
      const decimal = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
      return decimal.toFixed(2);
    }
  }

  // Get betting trends and analysis
  async getBettingAnalysis(gameId: string, sport: string): Promise<any> {
    try {
      // Get current odds
      const odds = await this.getGameOdds({
        sport,
        gameId,
        markets: 'h2h,spreads,totals'
      });

      if (odds.length === 0) {
        throw new Error('No odds data found for this game');
      }

      const game = odds[0];
      const analysis = {
        game_info: {
          id: game.id,
          teams: `${game.away_team} @ ${game.home_team}`,
          commence_time: game.commence_time
        },
        betting_analysis: {
          total_bookmakers: game.bookmakers?.length || 0,
          market_analysis: this.analyzeMarkets(game.bookmakers || []),
          value_opportunities: this.findValueOpportunities(game.bookmakers || [])
        }
      };

      return analysis;
    } catch (error: any) {
      console.error('Error generating betting analysis:', error.message);
      throw new Error('Failed to generate betting analysis');
    }
  }

  private analyzeMarkets(bookmakers: BookmakerData[]): any {
    const marketAnalysis: any = {};

    bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (!marketAnalysis[market.key]) {
          marketAnalysis[market.key] = {
            outcomes: {},
            best_odds: {},
            avg_odds: {}
          };
        }

        market.outcomes.forEach(outcome => {
          if (!marketAnalysis[market.key].outcomes[outcome.name]) {
            marketAnalysis[market.key].outcomes[outcome.name] = [];
          }
          marketAnalysis[market.key].outcomes[outcome.name].push({
            bookmaker: bookmaker.title,
            odds: outcome.price,
            point: outcome.point
          });
        });
      });
    });

    // Calculate best odds for each outcome
    Object.keys(marketAnalysis).forEach(marketKey => {
      Object.keys(marketAnalysis[marketKey].outcomes).forEach(outcomeName => {
        const outcomes = marketAnalysis[marketKey].outcomes[outcomeName];
        const bestOdds = outcomes.reduce((best: any, current: any) => {
          return current.odds > best.odds ? current : best;
        });
        marketAnalysis[marketKey].best_odds[outcomeName] = bestOdds;
      });
    });

    return marketAnalysis;
  }

  private findValueOpportunities(bookmakers: BookmakerData[]): any[] {
    // Simple value detection - in reality, this would be much more sophisticated
    const opportunities: any[] = [];

    bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (market.key === 'h2h') {
          const outcomes = market.outcomes;
          if (outcomes.length === 2) {
            const [outcome1, outcome2] = outcomes;
            const impliedProb1 = this.oddsToImpliedProbability(outcome1.price);
            const impliedProb2 = this.oddsToImpliedProbability(outcome2.price);
            const totalImpliedProb = impliedProb1 + impliedProb2;
            
            // If total implied probability is significantly over 100%, there might be value
            if (totalImpliedProb < 0.95) {
              opportunities.push({
                bookmaker: bookmaker.title,
                market: market.key,
                note: 'Potential arbitrage opportunity detected',
                total_implied_probability: totalImpliedProb
              });
            }
          }
        }
      });
    });

    return opportunities;
  }

  private oddsToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }
} 