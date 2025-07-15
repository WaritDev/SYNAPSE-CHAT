import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        const n8nBearerToken = process.env.N8N_BEARER_TOKEN;

        if (!n8nWebhookUrl || !n8nBearerToken) {
        throw new Error("Missing n8n configuration on the server.");
        }

        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nBearerToken}`,
        },
        body: JSON.stringify(body),
        });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('n8n webhook error:', errorBody);
        throw new Error(`n8n webhook failed with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

    } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
    );
    }
}