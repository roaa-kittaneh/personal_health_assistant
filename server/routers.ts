import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getUserQAHistory, insertQARecord, updateQAFeedback, getKnowledgeSources } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Health Assistant RAG procedures
  health: router({
    // Ask a health question with RAG
    askQuestion: protectedProcedure
      .input(z.object({
        question: z.string().min(3).max(500),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Get knowledge base
          const knowledgeBase = await getKnowledgeSources();
          
          // Prepare context from knowledge base
          const context = knowledgeBase
            .slice(0, 3)
            .map(doc => `Title: ${doc.title}\nContent: ${doc.content}`)
            .join("\n\n---\n\n");

          // Call LLM with RAG context
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a helpful medical information assistant. Provide general health information based on the following knowledge base. Always remind users that this is for informational purposes only and not a substitute for professional medical advice.

Knowledge Base:
${context}`,
              },
              {
                role: "user",
                content: input.question,
              },
            ],
          });

          const answerContent = response.choices[0]?.message?.content;
          const answer = typeof answerContent === "string" ? answerContent : "Unable to generate response";

          // Save to history
          if (answer) {
            await insertQARecord({
              userId: ctx.user.id,
              question: input.question,
              answer: answer,
              sources: JSON.stringify(knowledgeBase.map(doc => ({ title: doc.title, source: doc.source }))),
            });
          }

          return {
            answer,
            sources: knowledgeBase.map(doc => ({
              title: doc.title,
              source: doc.source,
              category: doc.category,
            })),
          };
        } catch (error) {
          console.error("Error in askQuestion:", error);
          throw error;
        }
      }),

    // Get user's Q&A history
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserQAHistory(ctx.user.id);
      }),

    // Provide feedback on an answer
    provideFeedback: protectedProcedure
      .input(z.object({
        qaId: z.number(),
        isHelpful: z.enum(["yes", "no", "neutral"]),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateQAFeedback(input.qaId, input.isHelpful, input.feedback);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
