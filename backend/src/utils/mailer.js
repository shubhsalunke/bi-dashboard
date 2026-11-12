const net = require('net');
const tls = require('tls');
const config = require('../config/env');

const isSmtpConfigured = () => {
  return Boolean(config.smtp.host && config.smtp.port && config.smtp.from);
};

const readSmtpResponse = (socket) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      const completeLines = lines.slice(0, -1);
      const lastComplete = completeLines[completeLines.length - 1];
      if (lastComplete && /^\d{3}\s/.test(lastComplete)) {
        cleanup();
        resolve({ code: parseInt(lastComplete.slice(0, 3), 10), text: buffer.trim() });
      }
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onClose = () => {
      cleanup();
      reject(new Error('SMTP connection closed unexpectedly'));
    };
    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);
  });

const sendSmtpCommand = async (socket, command, expectedCodes) => {
  if (command !== null) {
    socket.write(`${command}\r\n`);
  }
  const resp = await readSmtpResponse(socket);
  if (!expectedCodes.includes(resp.code)) {
    throw new Error(`SMTP error (${resp.code}): ${resp.text}`);
  }
  return resp;
};

const connectSocket = ({ host, port, secure }) =>
  new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    const socket = secure
      ? tls.connect({ host, port, rejectUnauthorized: true }, () => {
          socket.off('error', onError);
          resolve(socket);
        })
      : net.createConnection({ host, port }, () => {
          socket.off('error', onError);
          resolve(socket);
        });
    socket.setTimeout(10000, () => {
      socket.destroy(new Error('SMTP connection timed out'));
    });
    socket.once('error', onError);
  });

const sendMail = async ({ to, subject, text }) => {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  let socket = await connectSocket({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
  });

  try {
    await sendSmtpCommand(socket, null, [220]);
    const ehloResp = await sendSmtpCommand(socket, `EHLO ${config.smtp.host}`, [250]);

    if (!config.smtp.secure && /STARTTLS/i.test(ehloResp.text)) {
      await sendSmtpCommand(socket, 'STARTTLS', [220]);
      socket = await new Promise((resolve, reject) => {
        const tlsSocket = tls.connect(
          { socket, host: config.smtp.host, rejectUnauthorized: true },
          () => resolve(tlsSocket)
        );
        tlsSocket.once('error', reject);
      });
      await sendSmtpCommand(socket, `EHLO ${config.smtp.host}`, [250]);
    }

    if (config.smtp.user && config.smtp.pass) {
      await sendSmtpCommand(socket, 'AUTH LOGIN', [334]);
      await sendSmtpCommand(socket, Buffer.from(config.smtp.user).toString('base64'), [334]);
      await sendSmtpCommand(socket, Buffer.from(config.smtp.pass).toString('base64'), [235]);
    }

    const fromAddr = config.smtp.from.replace(/[<>]/g, '').trim();
    const toAddr = String(to).replace(/[<>]/g, '').trim();

    await sendSmtpCommand(socket, `MAIL FROM:<${fromAddr}>`, [250]);
    await sendSmtpCommand(socket, `RCPT TO:<${toAddr}>`, [250, 251]);
    await sendSmtpCommand(socket, 'DATA', [354]);

    const body = [
      `From: ${config.smtp.from}`,
      `To: ${toAddr}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      text,
      '.',
    ].join('\r\n');

    await sendSmtpCommand(socket, body, [250]);
    await sendSmtpCommand(socket, 'QUIT', [221, 250]).catch(() => {});
    return { sent: true };
  } finally {
    if (socket && !socket.destroyed) {
      socket.end();
    }
  }
};

const sendPasswordResetEmail = async ({ to, name, resetUrl, expiresInMinutes = 30 }) => {
  const safeName = name || 'User';
  const subject = 'Password Reset Request - BI Dashboard';
  const text = [
    `Hello ${safeName},`,
    '',
    'We received a request to reset your BI Dashboard account password.',
    `Use the link below within ${expiresInMinutes} minutes to set a new password:`,
    resetUrl,
    '',
    'If you did not request a password reset, you can safely ignore this message.',
  ].join('\n');

  return sendMail({ to, subject, text });
};

module.exports = {
  isSmtpConfigured,
  sendMail,
  sendPasswordResetEmail,
};

