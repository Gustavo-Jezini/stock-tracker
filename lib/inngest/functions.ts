import { getAllUsersForNewsEmail } from "../actions/user.actions"
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions"
import { getNews } from "../actions/finnhub.actions"
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer"
import { inngest } from "./client"
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts"
import { formatDateToday } from "../utils"

export const sendSignUpEmail = inngest.createFunction(
  { id: 'sign-up-email'},
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
      - Country: ${event.data.country }
      - Investment goals: ${event.data.investmentGoals }
      - Risk Tolerance: ${event.data.riskTolerance }
      - Preferred Industry: ${event.data.preferredIndustry }
    `

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({ model: 'gemini-2.0-flash-lite' }),
      body: {
        contents: [ 
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ]
      }
    })

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

      const { data: { email, name }} = event;
      return await sendWelcomeEmail({
        email,
        name, 
        intro: introText
      })
    })

    return {
      success: true,
      message: 'Welcome email sent successfully'
    }
  }
)

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary'},
  [ { event: 'app/send.daily.news' },
     { cron: '0 12 * * *'} 
    ],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run('get-all-users', getAllUsersForNewsEmail)
    console.log(users)
    if (!users || users.length === 0) {
      return { success: false, message: 'No users found for news email' }
    }

    // Step #2: Fetch personalized news for each user
    const usersWithNews = await step.run('fetch-user-news', async () => {
      const results = [];
      
      for (const user of users) {
        try {
          // Get user's watchlist symbols
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          
          // Fetch news (personalized if has watchlist, general otherwise)
          const news = await getNews(symbols.length > 0 ? symbols : undefined);
          
          results.push({
            user,
            news: (news || []).slice(0, 6),
          });
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error);
          results.push({
            user,
            news: [],
          });
        }
      }
      
      return results;
    });

    // Step #3: Summarize news using AI
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];
    
    for (const { user, news } of usersWithNews) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT
        .replace('{{newsData}}', JSON.stringify(news, null, 2))

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
          body: {
            contents: [ 
              {
                role: 'user',
                parts: [
                  { text: prompt }
                ]
              }
            ]
          }
        })

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent = (part && 'text' in part ? part.text : 'No market news.');

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error(`Error summarizing news for user ${user.email}:`, error);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: Send email to each user (placeholder)
    await step.run('send-news-emails', async () => {
      await Promise.all(userNewsSummaries.map(async ({ user, newsContent }) => {
        if (!newsContent) return false;

        return await sendNewsSummaryEmail({
          email: user.email,
          date: formatDateToday, 
          newsContent
        })
      }))
    });

    return { 
      success: true,
      message: `Daily news summary processed for ${users.length} users`
    }
  }
)