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

  async _callGroq(systemPrompt, userPrompt, maxTokens = 300, fallbackFn = null) {
    if (!this.isConfigured || !this.groq) {
      return fallbackFn ? fallbackFn() : null;
    }
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: maxTokens,
      });
      const content = completion.choices[0]?.message?.content || '';
      try {
        return JSON.parse(content);
      } catch {
        return fallbackFn ? fallbackFn() : content;
      }
    } catch (error) {
      console.error('GROQ API error:', error);
      return fallbackFn ? fallbackFn() : null;
    }
  }

  async generateDailyVerse() {
    return this._callGroq(
      'You are a helpful assistant that provides Bible verses. Return JSON with verse, reference, and theme.',
      'Provide a Bible verse for today with encouragement. Return as JSON.',
      200,
      () => ({
        verse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
        reference: 'Joshua 1:9',
        theme: 'Courage',
      })
    );
  }

  async generateTaskRecommendations(currentTasks) {
    return this._callGroq(
      'You are a helpful Christian assistant. Suggest 3-5 tasks based on current tasks and spiritual growth. Return as JSON array.',
      `Current tasks: ${JSON.stringify(currentTasks)}. Suggest 3-5 believer tasks for spiritual growth. Return as JSON array with title, category, priority.`,
      300,
      () => [
        { title: 'Pray for your family', category: 'spiritual', priority: 'high' },
        { title: 'Read a chapter of the Bible', category: 'study', priority: 'medium' },
        { title: 'Help someone in need', category: 'service', priority: 'low' },
      ]
    );
  }

  async generatePrayerSuggestion(currentBalance) {
    return this._callGroq(
      'You are a spiritual guide. Provide short prayer suggestions based on prayer balance.',
      `Current prayer balance: ${currentBalance}. Give a short encouraging prayer suggestion.`,
      100,
      () => 'Keep praying for wisdom and guidance in your daily walk with Christ.'
    );
  }

  async generateBibleStudyTopic() {
    return this._callGroq(
      'You are a Bible study guide. Provide short study topics with questions. Return as JSON.',
      'Provide a short Bible study topic for daily devotion. Include topic, reference, duration, and 2-3 questions. Return as JSON.',
      200,
      () => ({
        topic: 'The Fruit of the Spirit',
        reference: 'Galatians 5:22-23',
        duration: '15 minutes',
        questions: ['What does love look like in your daily life?', 'How can you practice patience today?'],
      })
    );
  }

  async generateSpiritualActivities(count = 5) {
    return this._callGroq(
      'You are a Christian spiritual advisor. Suggest practical faith-building activities. Return as JSON array.',
      `Suggest ${count} practical spiritual activities for daily Christian living. Include title, category (prayer, study, worship, service, fellowship), duration, and description. Return as JSON array.`,
      400,
      () => [
        { title: 'Morning Prayer Walk', category: 'prayer', duration: '15 min', description: 'Take a walk while praying for your day ahead' },
        { title: 'Scripture Memorization', category: 'study', duration: '10 min', description: 'Memorize one verse per day' },
        { title: 'Worship Music Session', category: 'worship', duration: '20 min', description: 'Listen to and reflect on worship music' },
        { title: 'Volunteer at Church', category: 'service', duration: '1-2 hours', description: 'Serve in your local church ministry' },
        { title: 'Fellowship Call', category: 'fellowship', duration: '30 min', description: 'Call a fellow believer to encourage them' },
      ]
    );
  }

  async generateBibleReadingPlan(days = 7) {
    return this._callGroq(
      'You are a Bible study guide. Create a structured Bible reading plan. Return as JSON array.',
      `Create a ${days}-day Bible reading plan with a theme. Include day, passage, theme, and reflection question for each day. Return as JSON array.`,
      500,
      () => [
        { day: 1, passage: 'Psalm 1', theme: 'The Righteous Path', question: 'What does it mean to delight in God\'s law?' },
        { day: 2, passage: 'Matthew 5:1-16', theme: 'The Beatitudes', question: 'Which beatitude speaks to your current situation?' },
        { day: 3, passage: 'John 15:1-17', theme: 'Abiding in Christ', question: 'How can you bear more fruit for God\'s kingdom?' },
        { day: 4, passage: 'Romans 8:28-39', theme: 'God\'s Unfailing Love', question: 'How does knowing God works for your good comfort you?' },
        { day: 5, passage: 'Ephesians 6:10-20', theme: 'Spiritual Warfare', question: 'Which piece of armor do you need most today?' },
        { day: 6, passage: 'Philippians 4:4-13', theme: 'Joy in All Circumstances', question: 'What are you thankful for today?' },
        { day: 7, passage: '1 Corinthians 13', theme: 'The Greatest Gift', question: 'How can you show love more effectively?' },
      ]
    );
  }

  async generatePrayerSchedule() {
    return this._callGroq(
      'You are a spiritual formation guide. Suggest daily prayer time slots with themes. Return as JSON array.',
      'Suggest 5 daily prayer time slots with themes and scripture references for a structured prayer life. Return as JSON array with time, theme, scripture, and focus.',
      400,
      () => [
        { time: '06:00', theme: 'Morning Thanksgiving', scripture: 'Psalm 5:3', focus: 'Thank God for a new day and surrender your plans' },
        { time: '09:00', theme: 'Workplace Intercession', scripture: 'Colossians 3:23', focus: 'Pray for colleagues and your work witness' },
        { time: '12:00', theme: 'Midday Reflection', scripture: 'Psalm 55:17', focus: 'Pause and reflect on God\'s faithfulness' },
        { time: '18:00', theme: 'Evening Gratitude', scripture: 'Ephesians 5:20', focus: 'Give thanks for the day\'s blessings' },
        { time: '21:00', theme: 'Nightly Peace', scripture: 'Psalm 4:8', focus: 'Release worries and rest in God\'s peace' },
      ]
    );
  }

  async generateDevotionPlan(days = 7) {
    return this._callGroq(
      'You are a Christian devotion writer. Create daily devotion outlines. Return as JSON array.',
      `Create a ${days}-day devotion plan. Each devotion should have: title, scripture, reflection (2-3 sentences), prayer point, and action step. Return as JSON array.`,
      600,
      () => [
        { title: 'Starting Your Day with God', scripture: 'Lamentations 3:22-23', reflection: 'God\'s mercies are new every morning. Begin each day by acknowledging His faithfulness and love.', prayer: 'Lord, thank You for new mercies today. Help me walk in Your grace.', action: 'Write down three things you are grateful for this morning' },
        { title: 'Finding Strength in Weakness', scripture: '2 Corinthians 12:9-10', reflection: 'God\'s power is made perfect in our weakness. When we admit our limitations, we make room for His strength.', prayer: 'Father, in my weakness, let Your strength shine through me today.', action: 'Identify one area of weakness and surrender it to God in prayer' },
        { title: 'The Power of Forgiveness', scripture: 'Colossians 3:12-14', reflection: 'Forgiveness is not optional for believers. As Christ forgave us, we must forgive others, releasing bitterness.', prayer: 'Lord, help me forgive as I have been forgiven. Release any bitterness in my heart.', action: 'Is there someone you need to forgive? Take a step toward reconciliation today' },
      ]
    );
  }

  async generateFaithBuildingActivities(count = 5) {
    return this._callGroq(
      'You are a Christian discipleship coach. Suggest faith-strengthening activities. Return as JSON array.',
      `Suggest ${count} creative faith-building activities for spiritual growth. Include activity name, category, time required, materials needed (if any), and expected spiritual benefit. Return as JSON array.`,
      400,
      () => [
        { name: 'Scripture Journaling', category: 'study', time: '20 min', materials: 'Notebook, Bible, pen', benefit: 'Deeper understanding and retention of Scripture' },
        { name: 'Prayer Walking', category: 'prayer', time: '30 min', materials: 'Comfortable shoes', benefit: 'Connects physical activity with intercessory prayer' },
        { name: 'Worship Dance', category: 'worship', time: '15 min', materials: 'Worship music', benefit: 'Expressive worship that engages the whole body' },
        { name: 'Serve a Neighbor', category: 'service', time: '1 hour', materials: 'Varies', benefit: 'Demonstrates God\'s love in practical ways' },
        { name: 'Testimony Writing', category: 'fellowship', time: '30 min', materials: 'Journal', benefit: 'Recognizing God\'s work in your life story' },
      ]
    );
  }

  async generateHabitSuggestions() {
    return this._callGroq(
      'You are a Christian habit formation coach. Suggest spiritual habits for daily life. Return as JSON array.',
      'Suggest 8 spiritual habits that help build consistent Christian discipline. Include title, category, suggested time, frequency, and Bible verse for motivation. Return as JSON array.',
      500,
      () => [
        { title: 'Daily Prayer Time', category: 'prayer', suggestedTime: '06:00', frequency: 'Daily', verse: '1 Thessalonians 5:17' },
        { title: 'Bible Reading', category: 'study', suggestedTime: '06:30', frequency: 'Daily', verse: 'Psalm 119:105' },
        { title: 'Worship Music', category: 'worship', suggestedTime: '07:00', frequency: 'Daily', verse: 'Psalm 95:1' },
        { title: 'Scripture Memorization', category: 'study', suggestedTime: '12:00', frequency: 'Daily', verse: 'Psalm 119:11' },
        { title: 'Evening Reflection', category: 'prayer', suggestedTime: '21:00', frequency: 'Daily', verse: 'Psalm 4:4' },
        { title: 'Church Attendance', category: 'fellowship', suggestedTime: '10:00', frequency: 'Weekly', verse: 'Hebrews 10:25' },
        { title: 'Fellowship Gathering', category: 'fellowship', suggestedTime: '19:00', frequency: 'Weekly', verse: 'Acts 2:42' },
        { title: 'Service/Missions', category: 'service', suggestedTime: '09:00', frequency: 'Monthly', verse: 'Galatians 5:13' },
      ]
    );
  }
}

export const groqService = new GroqService();
