import { SearchResult } from '@/lib/types';

export const calculateSourceScore = (
  testResult: { quality: string; loadSpeed: string; pingTime: number },
  maxSpeed: number,
  minPing: number,
  maxPing: number
): number => {
  let score = 0;

  const qualityScore = (() => {
    switch (testResult.quality) {
      case '4K':
        return 100;
      case '2K':
        return 85;
      case '1080p':
        return 75;
      case '720p':
        return 60;
      case '480p':
        return 40;
      case 'SD':
        return 20;
      default:
        return 0;
    }
  })();
  score += qualityScore * 0.4;

  const speedScore = (() => {
    const speedStr = testResult.loadSpeed;
    if (speedStr === '未知' || speedStr === '测量中...') return 30;

    const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
    if (!match) return 30;

    const value = parseFloat(match[1]);
    const unit = match[2];
    const speedKBps = unit === 'MB/s' ? value * 1024 : value;
    const speedRatio = speedKBps / maxSpeed;
    return Math.min(100, Math.max(0, speedRatio * 100));
  })();
  score += speedScore * 0.4;

  const pingScore = (() => {
    const ping = testResult.pingTime;
    if (ping <= 0) return 0;
    if (maxPing === minPing) return 100;
    const pingRatio = (maxPing - ping) / (maxPing - minPing);
    return Math.min(100, Math.max(0, pingRatio * 100));
  })();
  score += pingScore * 0.2;

  return Math.round(score * 100) / 100;
};

export const preferBestSource = async (
  sources: SearchResult[],
  setPrecomputedVideoInfo: (
    m: Map<
      string,
      {
        quality: string;
        loadSpeed: string;
        pingTime: number;
        hasError?: boolean;
      }
    >
  ) => void,
  getVideoResolutionFromM3u8: (
    url: string
  ) => Promise<{ quality: string; loadSpeed: string; pingTime: number }>
): Promise<SearchResult> => {
  if (sources.length === 1) return sources[0];

  const batchSize = Math.ceil(sources.length / 2);
  const allResults: Array<{
    source: SearchResult;
    testResult: { quality: string; loadSpeed: string; pingTime: number };
  } | null> = [];

  for (let start = 0; start < sources.length; start += batchSize) {
    const batchSources = sources.slice(start, start + batchSize);
    const batchResults = await Promise.all(
      batchSources.map(async (source) => {
        try {
          if (!source.episodes || source.episodes.length === 0) return null;
          const episodeUrl =
            source.episodes.length > 1
              ? source.episodes[1]
              : source.episodes[0];
          const testResult = await getVideoResolutionFromM3u8(episodeUrl);
          return { source, testResult };
        } catch (e) {
          return null;
        }
      })
    );
    allResults.push(...batchResults);
  }

  const newVideoInfoMap = new Map<
    string,
    { quality: string; loadSpeed: string; pingTime: number; hasError?: boolean }
  >();
  allResults.forEach((result, index) => {
    const source = sources[index];
    const sourceKey = `${source.source}-${source.id}`;
    if (result) newVideoInfoMap.set(sourceKey, result.testResult);
  });
  setPrecomputedVideoInfo(newVideoInfoMap);

  const successfulResults = allResults.filter(Boolean) as Array<{
    source: SearchResult;
    testResult: { quality: string; loadSpeed: string; pingTime: number };
  }>;
  if (successfulResults.length === 0) return sources[0];

  const validSpeeds = successfulResults
    .map((result) => {
      const speedStr = result.testResult.loadSpeed;
      if (speedStr === '未知' || speedStr === '测量中...') return 0;
      const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2];
      return unit === 'MB/s' ? value * 1024 : value;
    })
    .filter((s) => s > 0);

  const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 1024;
  const validPings = successfulResults
    .map((r) => r.testResult.pingTime)
    .filter((p) => p > 0);
  const minPing = validPings.length > 0 ? Math.min(...validPings) : 50;
  const maxPing = validPings.length > 0 ? Math.max(...validPings) : 1000;

  const resultsWithScore = successfulResults.map((result) => ({
    ...result,
    score: calculateSourceScore(result.testResult, maxSpeed, minPing, maxPing),
  }));

  resultsWithScore.sort((a, b) => b.score - a.score);
  return resultsWithScore[0].source;
};
