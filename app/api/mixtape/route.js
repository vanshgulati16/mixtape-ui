import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const recipientName = formData.get('recipientName');
    const youtubeUrls = formData.getAll('youtubeUrl');

    // Validate the data
    if (!recipientName || !youtubeUrls.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract video IDs from URLs
    const videoIds = youtubeUrls.map(url => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    }).filter(Boolean);

    // Create mixtape data
    const mixtapeData = {
      id: Date.now().toString(),
      recipientName,
      tracks: videoIds,
      createdAt: new Date().toISOString()
    };

    // Return the mixtape data with the player URL
    return NextResponse.json({
      success: true,
      data: mixtapeData,
      playerUrl: `/player?v=${videoIds.join(',')}&to=${encodeURIComponent(recipientName)}`
    });

  } catch (error) {
    console.error('Mixtape creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create mixtape' },
      { status: 500 }
    );
  }
}