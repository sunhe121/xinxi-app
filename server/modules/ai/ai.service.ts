import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type {
  FamilyRelation,
  ToneStyle,
  WeatherInfo,
} from '@shared/api.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateBroadcast(params: {
    dailyData: Record<string, unknown>;
    weatherInfo: WeatherInfo;
    relation: string;
    senderTitle: string;
    toneStyle: ToneStyle;
    direction: 'to_partner' | 'from_partner';
    languageProfile?: string;
  }): Promise<string> {
    if (!this.isConfigured) {
      return this.generateFallback(params);
    }

    const { dailyData, weatherInfo, relation, senderTitle, toneStyle, direction, languageProfile } = params;
    const tonePrompt = this.getTonePrompt(toneStyle);
    const perspective = direction === 'from_partner'
      ? `请以"我"（播报发送者）的第一人称视角来撰写。发送者的称呼是"${senderTitle || relation}"。内容结构分两部分：① 用第一人称描述我今天一天的生活状态（包括天气、活动、心情、作息等日常细节，讲自己的事），② 然后自然地表达对家人的关心和想念（关心对方的身体、天气、生活）。整体像家人之间的语音通话，温暖自然，不要太正式。`
      : `请以播报者的身份，为${relation}整理今天的生活状态播报。内容包括：今天的天气情况、步数、睡眠、活动地点、心情状态等，最后加上对${relation}的关心和问候。语气像家人一样温暖自然。`;

    const languageStyleInstruction = languageProfile
      ? `【语言风格参考】
请尽量模仿以下说话风格，让播报更像发送者本人：
${languageProfile}

`
      : '';

    const prompt = `
你是一位亲情播报助手，负责为异地家人生成温暖的日常关心播报。
${perspective}

【语气要求】${tonePrompt}

${languageStyleInstruction}【今日生活数据】
${JSON.stringify(dailyData, null, 2)}

【今日天气】
${JSON.stringify(weatherInfo, null, 2)}

【称呼】对接收者的称呼是"${relation}"。

请生成一段300字左右的播报内容，温暖自然，口语化，像真实的语音消息，不要分点，不要标题，直接说内容。
`.trim();

    try {
      const response = await axios.post(
        `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: '你是一位温暖贴心的亲情播报助手，用中文生成温暖的日常关心播报。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 600,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        return content.trim();
      }
      throw new Error('AI返回内容为空');
    } catch (error) {
      this.logger.error('AI播报生成失败，使用模板生成', error as Error);
      return this.generateFallback(params);
    }
  }

  private generateFallback(params: {
    dailyData: Record<string, unknown>;
    weatherInfo: WeatherInfo;
    relation: string;
    toneStyle: ToneStyle;
  }): string {
    const { dailyData, weatherInfo, relation, toneStyle } = params;
    const moodIndex = Number(dailyData.moodIndex ?? 7);
    const steps = Number(dailyData.steps ?? 0);
    const sleepHours = Number(dailyData.sleepHours ?? 7);
    const moodWord = moodIndex >= 8 ? '心情很好' : moodIndex >= 6 ? '心情还不错' : '心情一般般';
    const activityWord = steps > 6000 ? '走了不少路' : steps > 3000 ? '出门活动了一下' : '在家休息为主';
    const sleepWord = sleepHours >= 7 ? '睡得还不错' : '睡得有点少';

    const greeting = relation === '爸爸' || relation === '妈妈'
      ? `${relation}，您今天身体还好吧？`
      : relation === '儿子' || relation === '女儿'
      ? `${relation}，最近过得怎么样？`
      : `亲爱的${relation}，`;

    const toneSuffix = this.getToneSuffix(toneStyle);
    return `${greeting}今天${weatherInfo.weather}，气温${weatherInfo.tempLow}到${weatherInfo.tempHigh}度。今天他${moodWord}，${activityWord}，${sleepWord}。${toneSuffix}`;
  }

  async generateDailyReport(params: {
    dailyData: Record<string, unknown>;
    weatherInfo: WeatherInfo;
    relation: string;
    senderTitle: string;
    toneStyle: ToneStyle;
    direction: 'to_partner' | 'from_partner';
    languageProfile?: string;
    messages: string[];
    thinkOfYous: string[];
    caringWords: string[];
  }): Promise<string> {
    if (!this.isConfigured) {
      return this.generateDailyReportFallback(params);
    }

    const {
      dailyData,
      weatherInfo,
      relation,
      senderTitle,
      toneStyle,
      direction,
      languageProfile,
      messages,
      thinkOfYous,
      caringWords,
    } = params;

    const tonePrompt = this.getTonePrompt(toneStyle);
    const perspective = direction === 'from_partner'
      ? `请以"我"（播报发送者）的第一人称视角来撰写。发送者的称呼是"${senderTitle || relation}"。内容像一段温暖的语音消息，告诉对方今天发生了什么。`
      : `请以播报者的身份，为${relation}整理今天的生活状态播报。语气像家人一样温暖自然。`;

    const languageStyleInstruction = languageProfile
      ? `【语言风格参考】
请尽量模仿以下说话风格，让播报更像发送者本人：
${languageProfile}

`
      : '';

    const messagesSection = messages.length > 0
      ? `【今天的聊天消息】
${messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

`
      : '';

    const thinkOfYousSection = thinkOfYous.length > 0
      ? `【今天的想念】
${thinkOfYous.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

`
      : '';

    const caringWordsSection = caringWords.length > 0
      ? `【今天的关心话】
${caringWords.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

`
      : '';

    const hasDailyContent = messages.length > 0 || thinkOfYous.length > 0 || caringWords.length > 0;
    const emptyNote = hasDailyContent
      ? ''
      : '注意：今天没有特别的消息或互动记录，请生成一条简单温暖的问候，表达想念和关心即可。\n\n';

    const prompt = `
你是一位亲情播报助手，负责为异地家人生成温暖的每日关心播报。
${perspective}

【语气要求】${tonePrompt}

${languageStyleInstruction}${emptyNote}【今日生活数据】
${JSON.stringify(dailyData, null, 2)}

【今日天气】
${JSON.stringify(weatherInfo, null, 2)}

${messagesSection}${thinkOfYousSection}${caringWordsSection}【称呼】对接收者的称呼是"${relation}"。

请生成一段200-300字的播报内容，结构为：温暖问候 + 今天的想念/关心/互动 + 生活状态简述 + 温暖结尾。整体要自然流畅，口语化，像真实的语音消息，不要分点，不要标题，直接说内容。
`.trim();

    try {
      const response = await axios.post(
        `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: '你是一位温暖贴心的亲情播报助手，用中文生成温暖的日常关心播报。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 600,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        return content.trim();
      }
      throw new Error('AI返回内容为空');
    } catch (error) {
      this.logger.error('AI每日报告生成失败，使用模板生成', error as Error);
      return this.generateDailyReportFallback(params);
    }
  }

  private generateDailyReportFallback(params: {
    dailyData: Record<string, unknown>;
    weatherInfo: WeatherInfo;
    relation: string;
    toneStyle: ToneStyle;
    thinkOfYous: string[];
    caringWords: string[];
    messages: string[];
  }): string {
    const { dailyData, weatherInfo, relation, toneStyle, thinkOfYous, caringWords, messages } = params;
    const moodIndex = Number(dailyData.moodIndex ?? 7);
    const steps = Number(dailyData.steps ?? 0);
    const sleepHours = Number(dailyData.sleepHours ?? 7);
    const moodWord = moodIndex >= 8 ? '心情很好' : moodIndex >= 6 ? '心情还不错' : '心情一般般';
    const activityWord = steps > 6000 ? '走了不少路' : steps > 3000 ? '出门活动了一下' : '在家休息为主';
    const sleepWord = sleepHours >= 7 ? '睡得还不错' : '睡得有点少';

    const greeting = relation === '爸爸' || relation === '妈妈'
      ? `${relation}，您今天身体还好吧？`
      : relation === '儿子' || relation === '女儿'
      ? `${relation}，今天过得怎么样？`
      : `亲爱的${relation}，`;

    let interactionPart = '';
    if (thinkOfYous.length > 0) {
      interactionPart = `今天我又想你了，${thinkOfYous[0]}。`;
    } else if (caringWords.length > 0) {
      interactionPart = `想对你说：${caringWords[0]}。`;
    } else if (messages.length > 0) {
      interactionPart = `今天我们聊了聊，${messages[0].slice(0, 30)}...心里暖暖的。`;
    } else {
      interactionPart = '今天平平淡淡，但我依然想着你。';
    }

    const toneSuffix = this.getToneSuffix(toneStyle);
    return `${greeting}${interactionPart}今天${weatherInfo.weather}，气温${weatherInfo.tempLow}到${weatherInfo.tempHigh}度。今天他${moodWord}，${activityWord}，${sleepWord}。${toneSuffix}`;
  }

  private getTonePrompt(toneStyle: ToneStyle): string {
    const prompts: Record<ToneStyle, string> = {
      warm_chatter: '语气温暖唠叨，话多贴心，像家人一样嘘寒问暖，多一些关心的细节',
      warm_concise: '语气简洁实在，不多说废话，直接表达关心，真诚朴实',
      humorous: '语气幽默风趣，带点玩笑，轻松愉快，让人听了会心一笑',
      gentle: '语气温柔细腻，深情款款，充满爱意和温暖',
    };
    return prompts[toneStyle] || prompts.warm_chatter;
  }

  private getToneSuffix(toneStyle: ToneStyle): string {
    const suffixes: Record<ToneStyle, string> = {
      warm_chatter: '记得按时吃饭，天冷加衣，照顾好自己哦。想你了，有时间多打电话回家。',
      warm_concise: '记得常联系，关心要及时说出口。',
      humorous: '生活就像一盒巧克力，你永远不知道下一颗是什么味道，但每天都要开心呀！',
      gentle: '愿你每一天都被温柔以待，心中有爱，眼里有光。想你。',
    };
    return suffixes[toneStyle] || suffixes.warm_chatter;
  }
}
