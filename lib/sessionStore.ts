import fs from 'fs';
import path from 'path';

const sessionsFilePath = path.join(process.cwd(), 'sessions.json');

// Ensure file exists
if (!fs.existsSync(sessionsFilePath)) {
    fs.writeFileSync(sessionsFilePath, JSON.stringify({}));
}

export function saveSession(sessionId: string, data: any) {
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));
    sessions[sessionId] = data;
    fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2));
}

export function getSession(sessionId: string) {
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));
    return sessions[sessionId] || null;
}
