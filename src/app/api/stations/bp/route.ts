import { NextResponse } from "next/server";

const AU_CSV_URL =
  "https://bp-prod-bparalretailapi-temp-downloads-prod.s3-eu-west-1.amazonaws.com/csvs/AU.csv";
const NZ_CSV_URL =
  "https://bp-prod-bparalretailapi-temp-downloads-prod.s3-eu-west-1.amazonaws.com/csvs/NZ.csv";

const CACHE_MAX_AGE = 3600; // 1 hour
const STALE_WHILE_REVALIDATE = 1800; // serve stale for 30 min while refreshing

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");

  const url = country === "NZ" ? NZ_CSV_URL : AU_CSV_URL;

  const upstream = await fetch(url, { next: { revalidate: CACHE_MAX_AGE } });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const csv = await upstream.text();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
    },
  });
}
