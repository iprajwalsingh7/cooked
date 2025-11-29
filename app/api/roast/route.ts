import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@/lib/sessionStore';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');

    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
    }

    const sessionId = authHeader.split(' ')[1];
    const session = getSession(sessionId);

    if (!session || !session.access_token) {
        return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }

    const { access_token } = session;

    try {

        const [userProfile, topArtists, topTracks, recentlyPlayed] = await Promise.all([
            axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${access_token}` } }),
            axios.get('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', { headers: { Authorization: `Bearer ${access_token}` } }),
            axios.get('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', { headers: { Authorization: `Bearer ${access_token}` } }),
            axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=10', { headers: { Authorization: `Bearer ${access_token}` } }),
        ]);

        const dataSummary = {
            user: userProfile.data.display_name,
            topArtists: topArtists.data.items.map((artist: any) => artist.name).join(', '),
            topTracks: topTracks.data.items.map((track: any) => `${track.name} by ${track.artists[0].name}`).join(', '),
            recent: recentlyPlayed.data.items.map((item: any) => `${item.track.name} by ${item.track.artists[0].name}`).join(', '),
        };


        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });

        const prompt = `
      You are a ruthless, witty, and hilarious music critic. Your job is to roast the user's music taste based on their Spotify history.
      
      Here is the user's data:
      Name: ${dataSummary.user}
      Top Artists: ${dataSummary.topArtists}
      Top Tracks: ${dataSummary.topTracks}
      Recently Played: ${dataSummary.recent}

      Instructions:
      1. Be mean but funny. Use Gen Z slang if appropriate but don't overdo it.
      2. Call out specific embarrassing artists or songs.
      3. Make assumptions about their personality based on their music.
      4. Keep it under 200 words.
      5. Address them directly.
      6. FORMATTING IS CRITICAL: Do NOT write a single block of text. Use short paragraphs (max 2-3 sentences). Separate paragraphs with double line breaks.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ roast: text });

    } catch (error: any) {
        const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error generating roast:', errorMessage);


        try {
            const logPath = path.join(process.cwd(), 'server.log');
            fs.appendFileSync(logPath, `${new Date().toISOString()} - Error: ${errorMessage}\nStack: ${error.stack}\n\n`);
        } catch (logError) {
            console.error('Failed to write to log file:', logError);
        }

        return NextResponse.json({ error: 'Failed to generate roast', details: errorMessage }, { status: 500 });
    }
}
