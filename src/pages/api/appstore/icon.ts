import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
    try {
        const searchParams = new URL(request.url).searchParams;
        const id = searchParams.get('id');
        if (!id) {
            return new Response('Missing id', { status: 400 });
        }

        const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=software&country=us`;
        const res = await fetch(lookupUrl);
        if (!res.ok) {
            return new Response('Not found', { status: 404 });
        }
        const json = await res.json();
        const artwork = json?.results?.[0]?.artworkUrl100 as string | undefined;
        if (!artwork) {
            return new Response('Artwork not found', { status: 404 });
        }

        // Redirect to the artwork URL so the image can be loaded directly
        return new Response(null, {
            status: 302,
            headers: {
                Location: artwork,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (e) {
        return new Response('Error', { status: 500 });
    }
};


