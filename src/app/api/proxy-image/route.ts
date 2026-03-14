import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
        }

        const response = await fetch(imageUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Falha ao buscar imagem' }, { status: response.status });
        }

        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/png',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
    }
}
