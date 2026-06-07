/**
 * GROQ LLM Service - AI-generated believer activities and recommendations
 */
import {Groq} from 'groq-sdk';

class GroqService {
  constructor() {
    this.groq = null;
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.isConfigured = !!this.apiKey;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY not set. AI features will be limited.');
      return false;
    }
    try {
      this.groq = new Groq({apiKey: this.apiKey});
      return true;
    } catch (error) {
      console.error('Failed to initialize GROQ:', error);
      return false;
    }
  }

  async generateDailyVerse() {
    if (!this.isConfigured) {
      return {
        verse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
        reference: 'Joshua 1:9',
        theme: 'Courage',
      };
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides Bible verses. Return JSON with verse, reference, and theme.',
          },
          {
            role: 'user',
            content: 'Provide a Bible verse for today with encouragement. Return as JSON.',
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 200,
      });

      const content = completion.choices[0]?.message?.content || '';
      // Try to parse JSON, fallback to default if parsing fails
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return {
          verse: 'Trust in the Lord with all your heart and lean not on your own understanding.',
          reference: 'Proverbs 3:5',
          theme: 'Trust',
        };
      }
    } catch (error) {
      console.error('GROQ API error:', error);
      return {
        verse: 'The Lord is my shepherd; I shall not want.',
        reference: 'Psalm 23:1',
        theme: ' Provision',
      };
    }
  }

  async generateTaskRecommendations(currentTasks) {
    if (!this.isConfigured) {
      return [
        {
          title: 'Pray for your family',
          category: 'spiritual',
          priority: 'high',
        },
        {
          title: 'Read a chapter of the Bible',
          category: 'study',
          priority: 'medium',
        },
        {
          title: 'Help someone in need',
          category: 'service',
          priority: 'low',
        },
      ];
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Christian assistant. Suggest 3-5 tasks based on current tasks and spiritual growth. Return as JSON array.',
          },
          {
            role: 'user',
            content: `Current tasks: ${JSON.stringify(currentTasks)}. Suggest 3-5 believer tasks for spiritual growth. Return as JSON array with title, category, priority.`,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('GROQ recommendations error:', error);
      return [];
    }
  }

  async generatePrayerSuggestion(currentBalance) {
    if (!this.isConfigured) {
      return 'Keep praying for wisdom and guidance in your daily walk with Christ.';
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a spiritual guide. Provide short prayer suggestions based on prayer balance.',
          },
          {
            role: 'user',
            content: `Current prayer balance: ${currentBalance}. Give a short encouraging prayer suggestion.`,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 100,
      });

      return completion.choices[0]?.message?.content || 'Keep praying!';
    } catch (error) {
      console.error('GROQ prayer suggestion error:', error);
      return 'Keep praying!';
    }
  }

  async generateBibleStudyTopic() {
    if (!this.isConfigured) {
      return {
        topic: 'The Fruit of the Spirit',
        reference: 'Galatians 5:22-23',
        duration: '15 minutes',
        questions: [
          'What does love look like in your daily life?',
          'How can you practice patience today?',
        ],
      };
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a Bible study guide. Provide short study topics with questions. Return as JSON.',
          },
          {
            role: 'user',
            content: 'Provide a short Bible study topic for daily devotion. Include topic, reference, duration, and 2-3 questions. Return as JSON.',
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 200,
      });

      const content = completion.choices[0]?.message?.content || '';
      try {
        return JSON.parse(content);
      } catch {
        return {
          topic: 'The Fruit of the Spirit',
          reference: 'Galatians 5:22-23',
          duration: '15 minutes',
          questions: ['What does love look like in your daily life?', 'How can you practice patience today?'],
        };
      }
    } catch (error) {
      console.error('GROQ study topic error:', error);
      return {
        topic: 'The Fruit of the Spirit',
        reference: 'Galatians 5:22-23',
        duration: '15 minutes',
        questions: ['What does love look like in your daily life?', 'How can you practice patience today?'],
      };
    }
  }
}

export const groqService = new GroqService();
