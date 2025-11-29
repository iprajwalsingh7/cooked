import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import querystring from 'querystring';

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

        const { access_token, refresh_token, expires_in } = response.data;
        console.log('Token exchange successful. Access Token:', access_token ? 'Present' : 'Missing');
        console.log('Expires in:', expires_in);

        const redirectUrl = new URL('/roast', request.url);
        redirectUrl.searchParams.set('token', access_token);
        const res = NextResponse.redirect(redirectUrl);

        // Set cookies
        res.cookies.set('spotify_access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Ensure this is false locally
            sameSite: 'lax',
            maxAge: expires_in,
            path: '/',
        });
        console.log('Cookie set: spotify_access_token');

        if (refresh_token) {
            res.cookies.set('spotify_refresh_token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
        }

        return res;

    } catch (error: any) {
        console.error('Error exchanging token:', error.response?.data || error.message);
        console.error('Full Error:', error);
        return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }
}
