import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return NextResponse.json({ imageUrl: null }, { status: res.status });
    }

    const html = await res.text();

    // Regex to find og:image content
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["'][^>]*>/i);

    if (ogImageMatch && ogImageMatch[1]) {
      return NextResponse.json({ imageUrl: ogImageMatch[1] });
    }

    // Fallback: finding twitter:image
    const twImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["'](.*?)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']twitter:image["'][^>]*>/i);

    if (twImageMatch && twImageMatch[1]) {
      return NextResponse.json({ imageUrl: twImageMatch[1] });
    }

    return NextResponse.json({ imageUrl: null });
  } catch (error) {
    console.error('[OG Image Fetch]', error);
    return NextResponse.json({ imageUrl: null }, { status: 500 });
  }
}
