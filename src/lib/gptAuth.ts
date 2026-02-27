import { NextRequest } from 'next/server';

export function checkGptAuth(req: NextRequest): boolean {
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.GPT_API_KEY;

    if (!expectedKey) {
        console.error('GPT_API_KEY is not configured on the server.');
        return false;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    return token === expectedKey;
}
