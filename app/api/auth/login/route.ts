import { NextResponse } from 'next/server';
import querystring from 'querystring';

export async function GET() {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

    if (!client_id || !redirect_uri) {
        return NextResponse.json({ error: 'Missing Spotify credentials' }, { status: 500 });
    }

    const scope = 'user-read-recently-played user-top-read';
    const state = generateRandomString(16);

    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
    });

    return NextResponse.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
}

function generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
