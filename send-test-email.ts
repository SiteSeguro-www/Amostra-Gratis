import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function sendTestEmail() {
  const recipient = 'dweminem@gmail.com';
  const sender = process.env.SMTP_USER || 'contato.packzinhu@gmail.com';
  const pass = process.env.SMTP_PASS;

  console.log(`Tentando enviar e-mail de ${sender} para ${recipient}...`);

  if (!pass) {
    console.error('ERRO: A variável de ambiente SMTP_PASS não está configurada.');
    console.log('Por favor, configure o SMTP_PASS (Senha de App do Gmail) nas configurações do AI Studio.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: sender,
      pass: pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"PackZinhu Test" <${sender}>`,
      to: recipient,
      subject: 'Teste de Envio de E-mail - PackZinhu',
      text: 'Este é um e-mail de teste enviado pelo sistema PackZinhu.',
      html: `
        <div style="font-family: sans-serif; background-color: #0f0f0f; color: white; padding: 40px; border-radius: 20px; border: 1px solid #333;">
          <h1 style="color: #8B5CF6; margin-bottom: 20px;">Teste de Conexão!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Este é um e-mail de teste enviado para validar a configuração SMTP do site <strong>PackZinhu</strong>.</p>
          <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">Se você recebeu este e-mail, as configurações estão funcionando corretamente.</p>
          <div style="margin-top: 30px; padding: 15px; background-color: #1a1a1a; border-radius: 10px; font-size: 12px; color: #666;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      `,
    });

    console.log('E-mail enviado com sucesso!');
    console.log('Message ID:', info.messageId);
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error.message);
    if (error.message.includes('Invalid login')) {
      console.log('Dica: Verifique se o SMTP_USER e SMTP_PASS estão corretos. Se usar Gmail, use uma "Senha de App".');
    }
  }
}

sendTestEmail();
