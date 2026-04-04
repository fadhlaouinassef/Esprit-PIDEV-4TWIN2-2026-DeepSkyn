
export type ComplaintStatus = 'pending' | 'accepted' | 'rejected';
export type ComplaintCategory = 'Bug' | 'Payment' | 'Service' | 'Analysis' | 'Routine' | 'Product' | 'Badge' | 'Other';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
    isRead?: boolean;
}

export interface Complaint {
    id: string;
    userId: string;
    userName: string;
    category: ComplaintCategory;
    content: string;
    status: ComplaintStatus;
    adminResponse?: string;
    evidence?: string[];
    createdAt: string;
    messages: ChatMessage[];
}

export const MOCK_COMPLAINTS: Complaint[] = [
    {
        id: "C1",
        userId: "U1",
        userName: "John Doe",
        category: "Payment",
        content: "I was charged twice for the premium plan.",
        status: "pending",
        adminResponse: "",
        evidence: ["/mock-evidence-1.jpg"],
        createdAt: "2024-03-20T10:00:00Z",
        messages: [
            {
                id: "m1",
                sender: "user",
                text: "I was charged twice for the premium plan.",
                timestamp: "2024-03-20T10:00:00Z",
                isRead: false
            }
        ]
    },
    {
        id: "C2",
        userId: "U1",
        userName: "John Doe",
        category: "Bug",
        content: "The scan feature is not working on mobile Safari.",
        status: "accepted",
        adminResponse: "Thank you for reporting, we are working on it.",
        evidence: [],
        createdAt: "2024-03-18T14:30:00Z",
        messages: [
            {
                id: "m1",
                sender: "user",
                text: "The scan feature is not working on mobile Safari.",
                timestamp: "2024-03-18T14:30:00Z",
                isRead: true
            },
            {
                id: "m2",
                sender: "admin",
                text: "Thank you for reporting, we are working on it.",
                timestamp: "2024-03-19T09:00:00Z",
                isRead: true
            }
        ]
    },
    {
        id: "C3",
        userId: "U1",
        userName: "John Doe",
        category: "Analysis",
        content: "My last scan result seems inconsistent with my skin type.",
        status: "pending",
        adminResponse: "",
        evidence: [],
        createdAt: "2024-03-22T08:15:00Z",
        messages: [
            {
                id: "m1",
                sender: "user",
                text: "My last scan result seems inconsistent with my skin type. It says I have oily skin but it's very dry today.",
                timestamp: "2024-03-22T08:15:00Z"
            }
        ]
    },
    {
        id: "C4",
        userId: "U1",
        userName: "John Doe",
        category: "Routine",
        content: "I don't understand how to use the recommended toner.",
        status: "accepted",
        adminResponse: "We will add a detailed instruction video for this product.",
        evidence: [],
        createdAt: "2024-03-21T16:00:00Z",
        messages: [
            {
                id: "m1",
                sender: "user",
                text: "I don't understand how to use the recommended toner.",
                timestamp: "2024-03-21T16:00:00Z",
                isRead: true
            },
            {
                id: "m2",
                sender: "admin",
                text: "We will add a detailed instruction video for this product.",
                timestamp: "2024-03-22T10:00:00Z",
                isRead: true
            }
        ]
    }
];
