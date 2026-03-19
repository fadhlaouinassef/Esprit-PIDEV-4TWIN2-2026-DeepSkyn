import { NextRequest, NextResponse } from 'next/server';

const N8N_URL = "http://localhost:5678/webhook-test/skincare-quiz"; // Defaulting to webhook-test for dev

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const body = await request.json();
    console.log('--- Proxying request to n8n ---');

    const tryFetch = async (url: string) => {
      console.log(`📡 Trying URL: ${url}`);
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    };

    let response = await tryFetch(N8N_URL);

    if (!response.ok) {
        console.warn(`⚠️ n8n test webhook failed (${response.status}). Trying production...`);
        const prodUrl = N8N_URL.replace('webhook-test', 'webhook');
        response = await tryFetch(prodUrl);
        
        if (!response.ok) {
            console.error(`❌ Both n8n endpoints failed. Activating Radical Fallback...`);
            
            // RADICAL FALLBACK: If n8n fails, we handle the logic locally!
            const questionsRes = await fetch(`${request.nextUrl.origin}/api/quiz/questions`);
            const { questions } = await questionsRes.json();
            
            const answeredIds = (body.answersSoFar || []).map((a: any) => Number(a.questionId));
            const nextQuestion = questions.find((q: any) => !answeredIds.includes(Number(q.id)));
            
            if (nextQuestion && (body.answersSoFar || []).length < 10) {
              return NextResponse.json({ status: "continue", nextQuestion });
            } else {
              // Final analysis fallback
              return NextResponse.json({ 
                status: "complete", 
                analysis: "Based on our local analysis, your skin seems to need consistent hydration and UV protection. Please check your n8n workflow for a more detailed AI analysis.",
                score: 82
              });
            }
        }
    }

    const data = await response.json();
    console.log('✅ Success from n8n');
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout reached');
      return NextResponse.json({ error: 'N8N Timeout' }, { status: 504 });
    }
    console.error('❌ Proxy error:', error);
    return NextResponse.json({ error: 'Proxy implementation error' }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
