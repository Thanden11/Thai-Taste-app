/**
 * Simple in-memory session store — holds swipe state and results between screens.
 * No external dependency needed for this MVP.
 */
import { RecommendResult } from './api';

interface Session {
  likedIds: string[];
  seenIds: string[];
  results: RecommendResult[];
}

const session: Session = {
  likedIds: [],
  seenIds: [],
  results: [],
};

export const store = {
  getLikedIds: (): string[] => [...session.likedIds],
  getSeenIds: (): string[] => [...session.seenIds],
  getResults: (): RecommendResult[] => [...session.results],

  addLiked(id: string) {
    session.likedIds.push(id);
    session.seenIds.push(id);
  },

  addSeen(id: string) {
    if (!session.seenIds.includes(id)) {
      session.seenIds.push(id);
    }
  },

  setResults(results: RecommendResult[]) {
    session.results = results;
  },

  reset() {
    session.likedIds = [];
    session.seenIds = [];
    session.results = [];
  },
};
