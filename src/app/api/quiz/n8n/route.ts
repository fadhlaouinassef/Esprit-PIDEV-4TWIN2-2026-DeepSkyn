import { NextRequest, NextResponse } from 'next/server';

const N8N_URL = "http://localhost:5678/webhook/skincare-quiz";

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for multimodal calls

  try {
    const body = await request.json();
    console.log('--- Proxying request to n8n ---');

    const answersSoFar = Array.isArray(body.answersSoFar) ? body.answersSoFar : [];

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
      console.warn(`⚠️ n8n production webhook failed (${response.status}). Trying test webhook...`);
      const testUrl = N8N_URL.replace('/webhook/', '/webhook-test/');
      response = await tryFetch(testUrl);
        
        if (!response.ok) {
            console.error(`❌ Both n8n endpoints failed. Activating Radical Fallback...`);
            
            // Local fallback loop: opening question first, then next unanswered.
            if (Number(body.userId) > 0 && body.lastQuestionId && String(body.lastAnswer || '').trim()) {
              await fetch(`${request.nextUrl.origin}/api/quiz/save-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: Number(body.userId),
                  questionId: Number(body.lastQuestionId),
                  answer: String(body.lastAnswer)
                })
              }).catch(() => null);
            }

            const questionsRes = await fetch(`${request.nextUrl.origin}/api/quiz/questions`);
            const { questions } = await questionsRes.json();

            const sessionId = String(body.sessionId || `session-${body.userId || 0}`);
            const hashString = (str: string) => {
              let h = 2166136261;
              for (let i = 0; i < str.length; i++) {
                h ^= str.charCodeAt(i);
                h = Math.imul(h, 16777619);
              }
              return h >>> 0;
            };
            const mulberry32 = (a: number) => () => {
              let t = (a += 0x6D2B79F5);
              t = Math.imul(t ^ (t >>> 15), t | 1);
              t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
              return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
            const shuffle = <T,>(arr: T[], rng: () => number): T[] => {
              const out = [...arr];
              for (let i = out.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [out[i], out[j]] = [out[j], out[i]];
              }
              return out;
            };
            const rng = mulberry32(hashString(sessionId));

            const byQuiz = (questions || []).reduce((acc: Record<string, any[]>, q: any) => {
              const quizKey = String(q.quizId ?? q.quiz_id ?? 'unknown');
              if (!acc[quizKey]) acc[quizKey] = [];
              acc[quizKey].push(q);
              return acc;
            }, {});

            Object.keys(byQuiz).forEach((key) => {
              const sorted = [...byQuiz[key]].sort((a, b) => Number(a.id) - Number(b.id));
              byQuiz[key] = shuffle(sorted, rng);
            });

            const quizKeys = shuffle(Object.keys(byQuiz).sort((a, b) => Number(a) - Number(b)), rng);
            const mixedQuestions: any[] = [];
            let cursor = 0;
            let hasMore = true;

            while (hasMore) {
              hasMore = false;
              for (const key of quizKeys) {
                const list = byQuiz[key];
                if (cursor < list.length) {
                  mixedQuestions.push(list[cursor]);
                  hasMore = true;
                }
              }
              cursor += 1;
            }
            
            const answeredIds = answersSoFar.map((a: any) => Number(a.questionId));
            const allAnswerText = answersSoFar.map((a: any) => String(a.answer || '')).join(' ').toLowerCase();
            const coveredSignals = [
              /(oily|dry|combination|normal|sensitive|tight|shiny|flaky)/i,
              /(acne|pores|redness|pigmentation|aging|dehydration|dullness|blackheads)/i,
              /(sunscreen|sun|spf|uv)/i,
              /(sleep|stress|diet|water|climate|pollution|smoke)/i,
              /(cleanser|exfoliate|routine|moisturizer|product|texture)/i,
            ].filter((re) => re.test(allAnswerText)).length;

            const shouldStopEarly = answersSoFar.length >= 3 && (coveredSignals >= 4 || answersSoFar.length >= 12);

            if (shouldStopEarly) {
              return NextResponse.json({
                status: "complete",
                analysis: "Dynamic stop reached: we gathered enough signals from your answers to provide a reliable skin profile and recommendations.",
                score: 84
              });
            }

            const openingQuestion = mixedQuestions?.[0];
            const nextQuestion = answeredIds.length === 0
              ? openingQuestion
              : mixedQuestions.find((q: any) => !answeredIds.includes(Number(q.id)));
            
            if (nextQuestion && answersSoFar.length < mixedQuestions.length) {
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
