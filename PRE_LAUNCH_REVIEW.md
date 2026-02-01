# Pitstop Pre-Launch Review

## 1. Security & Operational Challenges

### Critical

- **Google Maps API key is exposed client-side** (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`). Anyone can extract it from your bundle and abuse your quota. You should:
  - Restrict the key in Google Cloud Console to your domain(s) only (HTTP referrer restriction)
  - Set a daily quota cap so a bad actor can't run up unlimited usage
  - Consider rotating the current key since it's been in your git history

- **BP S3 CSV URLs are hardcoded and publicly accessible.** If BP changes or revokes these URLs, your AU/NZ data breaks instantly with no fallback. You have no control over this dependency.

- **Shell's proprietary locator API** (`shellretaillocator.geoapp.me`) — you're scraping their data without (presumably) an agreement. They could block you or raise legal issues (see section 2).

### Moderate

- **No error monitoring.** Failures in `dataLoader.ts` silently return empty arrays. In production, you won't know when data sources go down. Add at minimum basic error logging (Sentry free tier, or even `console.error` to a log drain).

- **No caching on CSV fetches.** Every page load re-fetches BP's S3 CSVs. This means slow initial loads and unnecessary bandwidth. Consider caching with `stale-while-revalidate` headers or fetching at build time via ISR/SSG.

- **Geolocation permission UX** — if the user denies location, there's no clear recovery path. The app should gracefully default to a country-level view.

- **No CSP headers or security headers configured.** For a Netlify deploy, add a `_headers` file with `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, etc.

---

## 2. How You Could Lose Money (Free App Risks)

| Risk | How it costs you | Mitigation |
|------|-----------------|------------|
| **Google Maps API abuse** | Unrestricted key = unlimited tile requests billed to you | Domain-restrict the key + set daily budget cap ($0 or near-$0) in GCP |
| **Netlify bandwidth overages** | Free tier = 100GB/month. If you get traction, the BP CSV re-fetching + map tiles + JSON files add up | Cache aggressively; consider Cloudflare free tier in front |
| **Legal/IP claims** | Scraping Shell's API and redistributing BP's data may violate terms of service. A cease-and-desist = legal costs even if you comply | Review BP/Shell ToS; add attribution; consider reaching out for data partnerships |
| **Domain/SSL renewal** | If you use a custom domain | Use Netlify's free subdomain or set calendar reminders |

The biggest financial risk is the **Google Maps API key without a budget cap**. Set a $0 daily budget in GCP immediately — the CARTO fallback already works, so even if Google cuts off, the app still functions.

---

## 3. UX Recommendations (Research-Backed)

Based on the Technology Acceptance Model (TAM) and current UX research:

### Perceived Usefulness (the #1 retention driver)

- **Add "last updated" timestamps** to station data. Users need to trust the data is current. This is the single highest-impact trust signal you can add.
- **Show distance + fuel type on markers/cards without requiring a tap.** Progressive disclosure — the top 2-3 data points should be visible at glance.
- **One-question personalization**: On first visit, ask "What fuel do you use?" and persist it. Auto-filter results so users immediately see relevant stations.

### Perceived Ease of Use (critical for first 30 seconds)

- **Time to value must be under 5 seconds.** On first load: request location → show nearest stations immediately. No splash screens.
- Your existing **react-joyride onboarding tour** is good, but research shows tours are skipped by 80%+ of users. Consider replacing it with a single contextual tooltip ("Tap a station for details") that dismisses on first interaction.
- **Add a "recenter on me" button** on the map — users who pan away need a one-tap way back.

### HUD Aesthetic — Keep It, But Fix Accessibility

The aesthetic-usability effect works in your favor — users perceive attractive designs as more usable. However:

- **Audit all text for WCAG AA contrast ratios** (4.5:1 minimum). Green-on-dark terminal themes commonly fail this.
- **Never rely on color alone** for status/information. Add labels or icons alongside color coding.
- **Keep the HUD for chrome/decoration** but use conventional patterns for core interactions (buttons, forms, navigation). Users should not have to "learn terminal" to find fuel.
- Consider offering a **high-contrast toggle** — this doubles as an accessibility feature and a trust signal.

---

## 4. Deep Performance Optimizations

### Data Loading

- **Cache BP CSV data** using Next.js ISR or a lightweight API route with `Cache-Control` headers. Re-fetching ~1400 rows of CSV on every page load is unnecessary — BP likely updates this data daily at most.
- **Lazy-load country data.** Only fetch the selected country's stations. Currently `fetchCountryStations()` in `dataLoader.ts` fetches all JSON for a country at once — this is fine, but ensure you're not fetching *all* countries.

### Map Performance

- **Cluster markers** at low zoom levels using `react-leaflet-cluster` or similar. Rendering 1400+ individual markers simultaneously kills mobile performance.
- **Virtualize the station list** — if you're rendering hundreds of station cards in the sidebar, use `react-window` or `react-virtuoso` to only render visible items.

### Bundle Size

- You're importing both `@phosphor-icons/react` and `react-icons`. Pick one or ensure you're tree-shaking properly. Two icon libraries bloat the bundle.
- Run `next build` and check the output — Next.js reports page sizes. Aim for < 200KB first-load JS.

### Perceived Performance

- Add **skeleton loaders** for the station list and map while data loads. An empty screen feels broken; a skeleton feels fast.
- **Prefetch the user's likely next country** data if they're near a border or have previously switched countries.

---

## 5. Everything Else

### Legal & Compliance

- **Add a Privacy Policy page.** You collect geolocation data (even if not stored). GDPR, Australia's Privacy Act, and Malaysia's PDPA all require disclosure. A simple page explaining "we use your location to show nearby stations; we don't store or share it" is sufficient.
- **Add data attribution.** Credit OpenStreetMap (required by their license), BP, Shell, CARTO, etc. Missing attribution can result in takedown requests.
- **Cookie/localStorage notice** — technically required in some jurisdictions for even non-cookie storage.

### Reliability

- **Add a health check or status indicator.** If BP's S3 goes down, users see an empty map with no explanation. Show a banner: "Station data temporarily unavailable."
- **Offline resilience** — consider a Service Worker to cache the last-known station data. Users often check fuel stations while driving with spotty connectivity.

### SEO & Discoverability

- **Add proper meta tags** — title, description, Open Graph tags for social sharing. When someone shares the link, it should show a compelling preview.
- **Add a favicon and PWA manifest** — makes the app installable on mobile and looks professional in browser tabs.

### Analytics

- **Add basic, privacy-respecting analytics** (Plausible, Umami, or Netlify Analytics) so you know if anyone is actually using it, which countries are popular, and where users drop off.

### Testing

- **You have zero tests.** Before launch, add at minimum:
  - A smoke test that `dataLoader.ts` correctly parses sample CSV/JSON
  - A test that filtering logic in `stationUtils.ts` returns expected results
  - Manual testing on real mobile devices (not just browser devtools)

### Mobile Experience

- **Test on actual phones**, especially low-end Android. Leaflet + 1400 markers + Chart.js on a budget phone can be painful.
- Verify the app doesn't overflow horizontally on small screens.

---

## Top 5 Actions Before Launch (Priority Order)

1. Restrict your Google Maps API key (domain + budget cap) — this is a financial risk right now
2. Add data freshness timestamps and error state banners
3. Run a WCAG contrast audit on the HUD theme
4. Add a privacy policy page and data attribution
5. Implement marker clustering for mobile performance
