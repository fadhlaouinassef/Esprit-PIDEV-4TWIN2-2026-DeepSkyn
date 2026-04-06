import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export async function sendAdminComplaintNotification(complaintData: {
    userName: string;
    userEmail: string;
    category: string;
    content: string;
    complaintId: number | string;
}) {
    const mailOptions = {
        from: `"Deepskyn Support" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Sending to the admin email defined in .env
        subject: `🚨 New Support Claim: ${complaintData.category} #${complaintData.complaintId}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #6366f1;">New Claim Received</h2>
                <p><strong>User:</strong> ${complaintData.userName} (${complaintData.userEmail})</p>
                <p><strong>Category:</strong> ${complaintData.category}</p>
                <p><strong>Ticket ID:</strong> #${complaintData.complaintId}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>Description:</strong></p>
                <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #6366f1;">
                    ${complaintData.content}
                </blockquote>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    Please log in to the <a href="${process.env.NEXTAUTH_URL}/admin/complaints" style="color: #6366f1;">Admin Dashboard</a> to respond.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Notification sent for claim #${complaintData.complaintId}`);
    } catch (error) {
        console.error(`[MAIL_ERROR] Failed to send notification for claim #${complaintData.complaintId}`, error);
    }
}

export async function sendUserStatusUpdateNotification(complaintData: {
    userName: string;
    userEmail: string;
    category: string;
    status: string;
    complaintId: number | string;
}) {
    const mailOptions = {
        from: `"Deepskyn Support" <${process.env.EMAIL_USER}>`,
        to: complaintData.userEmail, 
        subject: `Update on your Support Claim #${complaintData.complaintId}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #6366f1; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Ticket Status Updated</h2>
                <p>Hello <strong>${complaintData.userName}</strong>,</p>
                <p>The status of your claim (<strong>${complaintData.category}</strong> - Ticket <strong>#${complaintData.complaintId}</strong>) has been updated by our support team.</p>
                <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #f8fafc; text-align: center;">
                    <span style="font-size: 1.1em; font-weight: bold;">New Status: </span>
                    <strong style="padding: 6px 12px; border-radius: 6px; letter-spacing: 1px; color: #fff; background-color: ${complaintData.status === 'ACCEPT' ? '#10b981' : complaintData.status === 'REJECT' ? '#f43f5e' : '#f59e0b'};">${complaintData.status}</strong>
                </div>
                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                    You can view the full discussion or reply by logging into your <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/user/complaints" style="color: #6366f1; text-decoration: underline;">Deepskyn Dashboard</a>.
                </p>
                <p style="margin-top: 40px; font-size: 0.85em; color: #999;">Thank you,<br><strong>Deepskyn Support Team</strong></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Status update sent to user ${complaintData.userEmail} for claim #${complaintData.complaintId}`);
    } catch (error) {
        console.error(`[MAIL_ERROR] Failed to send status notification for claim #${complaintData.complaintId}`, error);
    }
}
