# Thai Taste-Graph Mock Data

Mock data for the Super AI Engineer Season 6 hackathon MVP.

## Files

- `global_foods.json`: 20 familiar onboarding foods for the swipe flow.
- `thai_dishes.json`: 50 Thai dishes with dense sensory strings for vector matching.
- `vendors.json`: 50 fictional vendors mapped to Thai dishes through `dish_id`.

## Notes

- Vendor names are fictional, but the coordinates are placed around the requested demo areas: Banthat Thong, Song Wat, and Chatuchak.
- Current MVP mapping is one Thai dish to one vendor, so every match has an immediate routing result. To support multiple vendors per dish later, add more records in `vendors.json` with the same `dish_id`.
- `image_url` values are endpoint-style paths; prepend the backend base URL when showing them in Streamlit, or use `local_image_path` for direct local file display.
- After asset download, `image_url` points to the image endpoint path under `/images/...`.
- `local_image_path` points to the downloaded file from the repository root under `backend/app/data/images/...`.
- `remote_image_url` preserves the original URL used for downloading when available.
- `image_source_url` is included so the team can track image origin and replace assets later if needed.
- `asset_status` is `downloaded` for direct downloads and `fallback_copy` for local representative fallbacks used when the source blocked bulk download.
- The ML pipeline should use only `sensory_string` for embeddings.
- `match_reason_keywords` is the offline fallback when Gemini or network access fails.
