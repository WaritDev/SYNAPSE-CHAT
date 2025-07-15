import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { Role } from '@/app/lib/types';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { role, message } = body as { role: Role, message: string };

        if (!role || !message) {
        return NextResponse.json({ error: 'Missing role or message' }, { status: 400 });
        }

        const channelName = `chat-notifications-${role}`;
        const eventName = 'new-alert';

        await pusher.trigger(channelName, eventName, {
        content: message
        });

        return NextResponse.json({ success: true, message: `Notification sent to role: ${role}` });

    } catch (error) {
        console.error('Notify API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}