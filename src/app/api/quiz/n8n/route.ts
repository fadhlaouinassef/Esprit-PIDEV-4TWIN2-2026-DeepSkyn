import { NextRequest, NextResponse } from 'next/server';

const N8N_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/skincare-quiz";
const ALLOW_TEST_WEBHOOK = process.env.N8N_ALLOW_TEST_WEBHOOK === 'true';
const MIN_REQUIRED_QUESTIONS = 10;

type QuizAnswer = {
  questionId: number;
  answer: string;
};

type QuizQuestion = {
  id: number;
  text: string;
  type?: string;
  options?: Array<{ id?: string; text?: string } | string>;
  quizId?: number;
  quiz_id?: number;
};

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

const tokenize = (txt: string) =>
  String(txt || '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

const buildQuestionLabel = (question: QuizQuestion) => {
  const quizNum = Number(question.quizId ?? question.quiz_id);
  const prefix = Number.isFinite(quizNum) ? `Quiz ${quizNum}` : 'Quiz';
  return `${prefix} - Q${question.id}`;
};

const buildGroupedPrompt = (questions: QuizQuestion[], answers: QuizAnswer[]) => {
  const byId = new Map<number, QuizQuestion>();
  for (const q of questions) byId.set(Number(q.id), q);

  const groupedLines = answers.map((entry, idx) => {
    const q = byId.get(Number(entry.questionId));
    const qLabel = q ? buildQuestionLabel(q) : `Question ${entry.questionId}`;
    const qText = q?.text || 'Question text unavailable';
    const aText = String(entry.answer || '').trim() || 'No answer provided';
    return `${idx + 1}. ${qLabel}\nQuestion: ${qText}\nAnswer: ${aText}`;
  });

  return [
    'Use the grouped questionnaire below to produce a complete and detailed skin analysis.',
    'Return a professional and practical answer aligned with quiz context and user-provided details.',
    '',
    groupedLines.join('\n\n'),
  ].join('\n');
};

const mixQuestionsBySession = (questions: QuizQuestion[], sessionId: string) => {
  const rng = mulberry32(hashString(sessionId));

  const byQuiz = questions.reduce((acc: Record<string, QuizQuestion[]>, q) => {
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
  const mixedQuestions: QuizQuestion[] = [];
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

  return mixedQuestions;
};

const chooseAdaptiveNextQuestion = (remainingQuestions: QuizQuestion[], answersSoFar: QuizAnswer[]) => {
  if (!remainingQuestions.length) return null;
  if (!answersSoFar.length) return remainingQuestions[0];

  const allAnswerText = answersSoFar.map((a) => String(a.answer || '')).join(' ').toLowerCase();
  const lastAnswer = String(answersSoFar[answersSoFar.length - 1]?.answer || '').toLowerCase();
  const answerTokens = new Set(tokenize(`${lastAnswer} ${allAnswerText}`));

  const questionScore = (q: QuizQuestion) => {
    const optionText = Array.isArray(q.options)
      ? q.options
          .map((o) => (typeof o === 'string' ? o : o?.text || ''))
          .join(' ')
      : '';

    const qTokens = tokenize(`${q.text || ''} ${optionText}`);
    let overlap = 0;
    for (const t of qTokens) {
      if (answerTokens.has(t)) overlap += 1;
    }

    const typeBonus = String(q.type || '').toLowerCase().includes('multiple') ? 0.5 : 0;
    const diversityBonus = (q.quizId || q.quiz_id) ? 0.2 : 0;
    return overlap + typeBonus + diversityBonus;
  };

  return [...remainingQuestions].sort((a, b) => questionScore(b) - questionScore(a) || Number(a.id) - Number(b.id))[0];
};

const shouldStopDynamically = (answersSoFar: QuizAnswer[]) => {
  if (answersSoFar.length < MIN_REQUIRED_QUESTIONS) return false;

  return answersSoFar.length >= MIN_REQUIRED_QUESTIONS;
};

const tryN8n = async (payload: Record<string, unknown>, signal: AbortSignal) => {
  const urls = [N8N_URL, ...(ALLOW_TEST_WEBHOOK ? [N8N_URL.replace('/webhook/', '/webhook-test/')] : [])];

  let lastStatus: number | null = null;
  let lastBody = '';

  for (const url of urls) {
    console.log(`📡 Trying URL: ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (res.ok) {
      return res.json();
    }

    lastStatus = res.status;
    lastBody = await res.text().catch(() => '');
    console.warn(`⚠️ n8n webhook failed (${res.status}) for ${url}`);
  }

  throw new Error(
    `n8n endpoints failed${lastStatus ? ` (status ${lastStatus})` : ''}${lastBody ? ` - ${lastBody.slice(0, 300)}` : ''}`
  );
};

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for multimodal calls

  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log('--- Proxying request to n8n ---');

    const answersSoFar = (Array.isArray(body.answersSoFar) ? body.answersSoFar : []) as QuizAnswer[];
    const userId = Number(body.userId || 0);
    const quizId = Number(body.quizId || 0);
    const sessionId = String(body.sessionId || `session-${userId || 0}`);
    const hasImageParts = Array.isArray(body.imageParts) && body.imageParts.length > 0;
    const forceFinalAnalysis = Boolean(body.forceFinalAnalysis) || hasImageParts;

    // Save latest answer progressively before selecting next question.
    if (userId > 0 && body.lastQuestionId && String(body.lastAnswer || '').trim()) {
      await fetch(`${request.nextUrl.origin}/api/quiz/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizId,
          questionId: Number(body.lastQuestionId),
          answer: String(body.lastAnswer)
        })
      }).catch(() => null);
    }

    const questionsRes = await fetch(
      `${request.nextUrl.origin}/api/quiz/questions${quizId > 0 ? `?quizId=${quizId}` : ''}`
    );
    const questionPayload = await questionsRes.json().catch(() => ({ questions: [] }));
    const allQuestions = (Array.isArray(questionPayload?.questions) ? questionPayload.questions : []) as QuizQuestion[];

    if (!allQuestions.length) {
      return NextResponse.json({
        status: 'complete',
        analysis: 'No quiz questions were found in database.',
        score: 0,
      });
    }

    const mixedQuestions = mixQuestionsBySession(allQuestions, sessionId);
    const answeredIds = new Set(answersSoFar.map((a) => Number(a.questionId)));
    const remainingQuestions = mixedQuestions.filter((q) => !answeredIds.has(Number(q.id)));

    const groupedPrompt = buildGroupedPrompt(mixedQuestions, answersSoFar);

    if (!forceFinalAnalysis) {
      if (answersSoFar.length === 0) {
        return NextResponse.json({ status: 'continue', nextQuestion: mixedQuestions[0] });
      }

      const hasReachedRequiredCount = answersSoFar.length >= MIN_REQUIRED_QUESTIONS;

      if (!hasReachedRequiredCount) {
        let nextQuestion = chooseAdaptiveNextQuestion(remainingQuestions, answersSoFar);

        // If all unique questions are exhausted before reaching 10 answers,
        // recycle one question to satisfy the mandatory minimum count.
        if (!nextQuestion) {
          const lastQuestionId = Number(answersSoFar[answersSoFar.length - 1]?.questionId || 0);
          const recyclable = mixedQuestions.filter((q) => Number(q.id) !== lastQuestionId);
          nextQuestion = chooseAdaptiveNextQuestion(recyclable, answersSoFar) || recyclable[0] || mixedQuestions[0];
        }

        if (nextQuestion) {
          return NextResponse.json({ status: 'continue', nextQuestion });
        }
      }

      const stopNow = shouldStopDynamically(answersSoFar) || remainingQuestions.length === 0;
      if (!stopNow) {
        const nextQuestion = chooseAdaptiveNextQuestion(remainingQuestions, answersSoFar);
        if (nextQuestion) {
          return NextResponse.json({ status: 'continue', nextQuestion });
        }
      }

      // Do not call Gemini yet. Final analysis must be triggered explicitly
      // from the final UI step (with or without images).
      return NextResponse.json({
        status: 'complete',
        analysis: 'Questionnaire completed. Ready for final Gemini analysis.',
        score: 80,
      });
    }

    // Final complete analysis call with grouped Q/A context for Gemini in n8n.
    const finalPayload = {
      ...body,
      userId,
      quizId,
      sessionId,
      answersSoFar,
      groupedAnswersPrompt: groupedPrompt,
      groupedAnswers: answersSoFar.map((entry, idx) => {
        const q = mixedQuestions.find((item) => Number(item.id) === Number(entry.questionId));
        const normalizedQuizId = Number((q?.quizId ?? q?.quiz_id ?? quizId) || 0);
        return {
          index: idx + 1,
          questionId: Number(entry.questionId),
          question: q?.text || null,
          answer: String(entry.answer || ''),
          quizId: normalizedQuizId,
        };
      }),
      allQuestions: mixedQuestions,
      requestType: 'final-analysis',
      forceFinalAnalysis: true,
      maxQuestions: Math.max(10, answersSoFar.length),
    } as Record<string, unknown>;

    try {
      const data = await tryN8n(finalPayload, controller.signal);
      console.log('✅ Success from n8n');
      return NextResponse.json(data);
    } catch (n8nError) {
      console.error('❌ n8n final analysis unavailable, returning local fallback:', n8nError);
      const recap = answersSoFar
        .slice(-4)
        .map((a) => {
          const q = mixedQuestions.find((item) => Number(item.id) === Number(a.questionId));
          return `${q?.text || `Question ${a.questionId}`}: ${String(a.answer || '').trim()}`;
        })
        .join(' | ');

      return NextResponse.json({
        status: 'complete',
        analysis:
          `Questionnaire complete. Grouped responses were prepared for Gemini, but the n8n workflow endpoint was unreachable. ` +
          `Please verify your active workflow webhook URL. Last captured signals: ${recap || 'answers saved.'}`,
        score: 82,
      });
    }
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'AbortError') {
      console.error('❌ Timeout reached');
      return NextResponse.json({ error: 'N8N Timeout' }, { status: 504 });
    }
    console.error('❌ Proxy error:', error);
    return NextResponse.json({ error: 'Proxy implementation error' }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
