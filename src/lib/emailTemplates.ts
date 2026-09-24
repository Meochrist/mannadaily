import { NotificationMessage } from "./notifications";

export function generateNotificationEmail(notification: NotificationMessage, userName: string): string {
  const name = userName || "Ami";
  const appUrl = process.env.NEXTAUTH_URL || "https://mannadaily.vercel.app";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      padding: 40px 0;
      background-color: #f8fafc;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      padding: 40px 40px 20px 40px;
      text-align: center;
    }
    .mascot-emoji {
      font-size: 64px;
      line-height: 1;
      margin-bottom: 16px;
      display: inline-block;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      line-height: 1.25;
    }
    .content {
      padding: 0 40px 30px 40px;
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      text-align: center;
    }
    .cta-container {
      padding: 0 40px 40px 40px;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
      transition: all 0.2s ease;
    }
    .footer {
      padding: 24px 40px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
    }
    .signature {
      font-weight: 600;
      color: #64748b;
      margin-top: 0;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="mascot-emoji">${notification.emoji}</div>
        <h1 class="title">${notification.title}</h1>
      </div>
      <div class="content">
        <p>Bonjour ${name},</p>
        <p>${notification.body}</p>
      </div>
      <div class="cta-container">
        <a href="${appUrl}" class="btn" target="_blank">Méditer maintenant</a>
      </div>
      <div class="footer">
        <p class="signature">— L'équipe MannaDaily</p>
        <p>Tu reçois cet e-mail car tu es inscrit sur MannaDaily.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
