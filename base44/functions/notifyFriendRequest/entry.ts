import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { receiverEmail, senderEmail, senderName } = await req.json();

    if (!receiverEmail || !senderEmail || !senderName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.functions.invoke('sendNotification', {
      userEmail: receiverEmail,
      notificationType: 'friend_request',
      title: '👋 Demande d\'ami',
      message: `${senderName} vous a envoyé une demande d'ami. Acceptez ou refusez depuis votre liste d'amis.`,
      actionLink: 'Friends',
      relatedEntityId: senderEmail,
      relatedEntityType: 'user',
      senderEmail
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Friend request notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});