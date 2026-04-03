import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

type Payload = {
  userId?: number;
  userEmail?: string;
  userName?: string;
  analysis?: string;
  score?: number;
  status?: string;
  smtpUser?: string;
  smtpPass?: string;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Payload;

    const userId = Number(payload.userId || 0);
    const smtpUser = String(payload.smtpUser || '').trim();
    const smtpPass = String(payload.smtpPass || '').trim();
    const analysis = String(payload.analysis || 'Analysis complete.');
    const score = Number.isFinite(Number(payload.score)) ? Number(payload.score) : 0;
    const userName = String(payload.userName || 'User').trim();

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Missing SMTP credentials' }, { status: 400 });
    }

    let targetEmail = String(payload.userEmail || '').trim();
    if (!targetEmail && userId > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      targetEmail = String(user?.email || '').trim();
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'Missing destination email' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const escapedAnalysis = analysis
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const roundedScore = Math.round(score);
    const now = new Date();
    const dateLabel = now.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const sent = await transporter.sendMail({
      from: smtpUser,
      to: targetEmail,
      subject: `DeepSkyn Analysis Receipt - Score ${roundedScore}/100`,
      text: `DeepSkyn Skin Analysis\n\nHello ${userName},\n\nStatus: complete\nScore: ${roundedScore}/100\nDate: ${dateLabel}\n\nDetailed analysis:\n${analysis}\n`,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background-color:#eef2f7;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;background:#ffffff;border:1px solid #d9e2ec;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <div style="background:linear-gradient(135deg,#0d3b66 0%,#156d95 55%,#1f9db8 100%);padding:28px 30px;color:#ffffff;">
                      <p style="margin:0;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:0.9;">DeepSkyn</p>
                      <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;font-weight:700;">Your Skin Analysis Is Ready</h1>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:26px 30px 12px;color:#102a43;font-family:Segoe UI,Arial,sans-serif;">
                    <p style="margin:0 0 10px;font-size:16px;line-height:1.5;">Hello <strong>${userName}</strong>,</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#334e68;">Your quiz has been completed successfully. You can find your detailed analysis below.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 30px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border:1px solid #d9e2ec;border-radius:14px;">
                      <tr>
                        <td style="padding:18px 20px;width:33%;border-right:1px solid #e6edf5;">
                          <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#627d98;">Status</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">Complete</p>
                        </td>
                        <td style="padding:18px 20px;width:33%;border-right:1px solid #e6edf5;">
                          <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#627d98;">Score</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${roundedScore}/100</p>
                        </td>
                        <td style="padding:18px 20px;width:34%;">
                          <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#627d98;">Generated At</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#243b53;">${dateLabel}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 30px 10px;font-family:Segoe UI,Arial,sans-serif;">
                    <p style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.9px;color:#486581;font-weight:700;">Detailed Analysis</p>
                    <div style="background:#ffffff;border:1px solid #d9e2ec;border-radius:14px;padding:18px 18px;font-size:14px;line-height:1.75;color:#102a43;">
                      ${escapedAnalysis}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 30px 26px;font-family:Segoe UI,Arial,sans-serif;">
                    <div style="background:#f0f7ff;border-left:4px solid #156d95;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.6;color:#334e68;">
                      This email contains your latest analysis result exactly as generated in your quiz workflow.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 30px;background:#f7fafc;border-top:1px solid #d9e2ec;font-family:Segoe UI,Arial,sans-serif;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#627d98;">DeepSkyn automated notification. If you did not request this analysis, contact support.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
    });

    return NextResponse.json({
      status: payload.status || 'complete',
      analysis,
      score,
      emailSent: Boolean(sent?.messageId),
      emailTo: targetEmail,
    });
  } catch (error) {
    console.error('Send analysis email error:', error);
    return NextResponse.json({ error: 'Failed to send analysis email' }, { status: 500 });
  }
}
