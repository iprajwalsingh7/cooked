import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import querystring from 'querystring';
import { saveSession } from '@/lib/sessionStore';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (state === null) {
        return NextResponse.redirect(new URL('/?error=state_mismatch', request.url));
    }

    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

    if (!client_id || !client_secret || !redirect_uri) {
        return NextResponse.json({ error: 'Missing Spotify credentials' }, { status: 500 });
    }

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
                },
            }
        );

        const { access_token, refresh_token } = response.data;

        // Generate Session ID
        const sessionId = uuidv4();

        // Save to file store
        saveSession(sessionId, { access_token, refresh_token });

        console.log('Session ID generated:', sessionId);

        // Redirect with session_id in query param (bypass cookies)
        return NextResponse.redirect(new URL(`/roast?session_id=${sessionId}`, request.url));
    } catch (error: any) {
        console.error('Error exchanging token:', error.response?.data || error.message);
        console.error('Full Error:', error);
        return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }
}
