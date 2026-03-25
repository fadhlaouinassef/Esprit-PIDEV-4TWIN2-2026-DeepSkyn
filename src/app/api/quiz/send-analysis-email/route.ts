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

    const sent = await transporter.sendMail({
      from: smtpUser,
      to: targetEmail,
      subject: `DeepSkyn Analysis Receipt - Score ${Math.round(score)}/100`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#f8fafc;color:#0f172a;">
          <h2 style="margin:0 0 12px 0;color:#0f172a;">DeepSkyn Analysis Receipt</h2>
          <p style="margin:0 0 16px 0;">Hello ${userName}, your skin analysis has been completed.</p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:14px;">
            <p style="margin:0 0 6px 0;"><strong>Status:</strong> complete</p>
            <p style="margin:0 0 6px 0;"><strong>Score:</strong> ${Math.round(score)}/100</p>
            <p style="margin:0;"><strong>Date:</strong> ${new Date().toISOString()}</p>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;white-space:pre-wrap;line-height:1.55;">
            ${analysis.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </div>
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
