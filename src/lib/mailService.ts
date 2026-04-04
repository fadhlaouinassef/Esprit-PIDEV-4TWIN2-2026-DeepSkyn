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
