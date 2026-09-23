import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, notificationType, title, message, actionLink, relatedEntityId, relatedEntityType, senderEmail } = await req.json();

    if (!userEmail || !notificationType || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Créer le log de notification
    const notificationLog = await base44.asServiceRole.entities.NotificationLog.create({
      user_email: userEmail,
      notification_type: notificationType,
      title,
      message,
      related_entity_id: relatedEntityId || null,
      related_entity_type: relatedEntityType || null,
      action_link: actionLink || null,
      sender_email: senderEmail || null,
      delivered: false,
      read: false
    });

    // Envoyer email via Resend
    let emailSent = false;
    try {
      const emailSubject = getEmailSubject(notificationType);
      const emailBody = generateEmailBody(title, message, actionLink);

      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: emailSubject,
        body: emailBody,
        from_name: 'DamCash'
      });

      emailSent = true;
    } catch (emailError) {
      console.log('Email send error:', emailError?.message || emailError);
    }

    // Créer notification in-app (Notification entity existante)
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        type: notificationType,
        title,
        message,
        link: actionLink,
        from_user: senderEmail,
        is_read: false
      });
    } catch (notifError) {
      console.log('In-app notification error:', notifError?.message || notifError);
    }

    // Mettre à jour le log
    await base44.asServiceRole.entities.NotificationLog.update(notificationLog.id, {
      sent_via_email: emailSent,
      sent_via_push: true,
      delivered: true
    });

    return Response.json({
      success: true,
      notificationId: notificationLog.id,
      emailSent
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getEmailSubject(type) {
  const subjects = {
    game_invitation: '🎮 Vous avez reçu une invitation à jouer',
    game_turn: '⏱️ C\'est votre tour de jouer',
    game_result: '🏁 Résultat de votre partie',
    friend_request: '👋 Demande d\'ami reçue',
    tournament_notification: '🏆 Notification tournoi',
    system: '📢 DamCash - Notification'
  };
  return subjects[type] || 'Notification DamCash';
}

function generateEmailBody(title, message, actionLink) {
  const actionButton = actionLink
    ? `<a href="${actionLink}" style="display: inline-block; padding: 10px 20px; background: #D4A574; color: #2C1810; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Voir les détails</a>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; background: linear-gradient(to bottom, #2C1810, #5D3A1A); padding: 20px; color: #F5E6D3; border-radius: 8px;">
      <h2 style="margin: 0 0 10px 0; color: #D4A574;">${title}</h2>
      <p style="margin: 0 0 20px 0; line-height: 1.6;">${message}</p>
      ${actionButton}
      <hr style="border: none; border-top: 1px solid rgba(212, 165, 116, 0.2); margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #D4A574; opacity: 0.6;">DamCash - Plateforme de jeu d'échecs et dames</p>
    </div>
  `;
}