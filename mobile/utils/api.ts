const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export type GlobalFood = {
  id: string;
  name: string;
  image_url: string;
  remote_image_url: string;
  sensory_string: string;
};

export type DishOut = {
  dish_id: string;
  name: string;
  thai_name: string;
  english_name: string;
  description: string;
  image_url: string;
  sensory_string: string;
};

export type VendorOut = {
  vendor_id: string;
  vendor_name: string;
  distance: string;
  google_maps_url: string;
  flashcard_thai: string;
  flashcard_phonetic: string;
};

export type RecommendResult = {
  dish: DishOut;
  vendor: VendorOut;
  explanation: string;
};

export function dishImageUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

export async function fetchNextCard(
  likedIds: string[],
  seenIds: string[],
): Promise<GlobalFood | null> {
  const res = await fetch(`${BACKEND_URL}/next-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked_ids: likedIds, seen_ids: seenIds }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`next-card failed: ${res.status}`);
  return res.json();
}

export async function fetchRecommendation(
  likedFoodIds: string[],
): Promise<RecommendResult[]> {
  const res = await fetch(`${BACKEND_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked_food_ids: likedFoodIds }),
  });
  if (!res.ok) throw new Error(`recommend failed: ${res.status}`);
  const data = await res.json();
  return data.results as RecommendResult[];
}
