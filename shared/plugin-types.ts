// ---- plugin:family_care_broadcast_generator_1 ----
// ============================================================
// 插件 family_care_broadcast_generator_1 (亲情关怀播报文案生成器) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FamilyCareBroadcastGeneratorOneInput {
  /** 当日天气信息，包括温度、天气状况、风力、空气质量等 */
  weather_info: string;
  /** 每日数据，包括步数、睡眠时长、出门状态、活动地点、心情指数等信息 */
  daily_data: string;
}

/**
 * capabilityClient.load('family_care_broadcast_generator_1').callStream<FamilyCareBroadcastGeneratorOneOutput>('textGenerate', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 FamilyCareBroadcastGeneratorOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface FamilyCareBroadcastGeneratorOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  response?: string;
}
// ---- end:family_care_broadcast_generator_1 ----