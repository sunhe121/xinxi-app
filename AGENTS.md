# 心系 - AI亲情关怀应用

## 应用概述
"心系"是一款手机端AI亲情关怀应用，帮助异地子女和老人通过AI自动总结每日生活状态，生成温暖的语音播报，定时推送给对方，让陪伴不缺席。

## 设计规范

### 视觉风格
- **风格定位**: 温暖治愈、毛玻璃质感、大留白、橙粉渐变
- **主色调**: 暖橙粉渐变，传递温暖关怀的感觉
- **配色方案**:
  - 背景：暖橙粉柔和线性渐变 `linear-gradient(135deg, #FFF0E6 0%, #FFE4E1 50%, #FFE8DC 100%)`
  - 主色渐变：`linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)`
  - 主色起点：`#FF8C69` (primary)
  - 主色终点：`#FF6B6B` (destructive)
  - 次色：柔粉 `#FFB5B5` (secondary)
  - 点缀：柔绿 `#98D8C8` (accent)
  - 卡片：白色半透明 `rgba(255, 255, 255, 0.75)` + 毛玻璃 `backdrop-filter: blur(20px)`
  - 卡片边框：`1px solid rgba(255, 255, 255, 0.8)`
  - 文字主色：`#333333` (foreground)
  - 文字辅助色：`#999999` (muted-foreground)
  - 输入框背景：`rgba(255, 255, 255, 0.6)`
  - 输入框边框：`1px solid rgba(255, 140, 105, 0.2)`
  - 阴影：柔和 `0 8px 32px rgba(255, 107, 107, 0.1)`
  - 成功：柔绿 `#6BCB77`
  - 警告：暖橙 `#FFB347`
  - 危险：柔红 `#FF6B6B`

### 字体与行高
- **字体**: 系统字体栈 `-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft Yahei', 'Segoe UI', sans-serif`
- **行高**: 正文 1.7，标题 1.3，辅助文字 1.5
- **字号层级**:
  - 页面大标题: text-2xl / 22-28px, font-bold
  - 卡片/区块标题: text-lg / 18px, font-semibold
  - 副标题: text-base (16px), text-[#999]
  - 正文: text-base (16px), 行高1.7, text-[#333]
  - 输入框标签: text-sm (14px), font-medium
  - 按钮文字: text-base (16px), font-semibold
  - 辅助文字: text-sm (14px), text-[#999], 行高1.5
  - 小字: text-xs (12px)

### 间距体系（全局规范，所有页面必须遵循）
- **页面级**:
  - 左右 padding: px-5 (20px)
  - 顶部 padding: pt-6 (24px)
  - 底部 padding: pb-[120px]（给底部导航留空间）
  - 最大宽度: max-w-[480px], mx-auto 居中
  - 背景：透明（透出body的橙粉渐变）
- **卡片级**:
  - 背景: 毛玻璃 `rgba(255,255,255,0.75)` + `backdrop-filter: blur(20px)` + `-webkit-backdrop-filter: blur(20px)`
  - 边框: `1px solid rgba(255,255,255,0.8)`
  - 圆角: rounded-3xl (24px)
  - 阴影: shadow-sm（柔和暖色阴影 `0 8px 32px rgba(255,107,107,0.1)`）
  - 内部 padding: p-6 (24px)
  - 卡片之间间距: space-y-5 / gap-5 (20px)
- **元素间距**:
  - 标题与副标题之间: 2-3 (8-12px)
  - 区块标题与内容之间: 4 (16px)
  - 表单标签与输入框之间: 2 (8px)
  - 两个输入框组之间: 5 (20px)
  - 输入框与按钮之间: 7 (28px)
  - 按钮与辅助文字之间: 6 (24px)
  - 列表项之间: 4 (16px)
  - 列表项内部 padding: py-4 px-5 (16px/20px)
  - 图标与文字之间: 2.5 (10px)

### 组件尺寸（全局规范）
- **主按钮**: h-[52px] (52px), rounded-2xl (16px), 文字16px加粗, 橙色渐变 `linear-gradient(135deg, #FF8C69 0%, #FF6B6B 100%)`, 阴影 `0 8px 24px rgba(255,107,107,0.3)`, active:scale-[0.98]
- **次按钮**: h-[52px] (52px), rounded-2xl, 毛玻璃白底 + 橙色文字 + 白边框
- **输入框**: h-[52px] (52px), rounded-2xl (16px), 文字16px, px-4, 背景`rgba(255,255,255,0.6)`, 边框 `1px solid rgba(255,140,105,0.2)`, 聚焦时 border-[#FF8C69] + ring-2 ring-[#FF8C69]/20
- **标签/分类按钮**: h-9 (36px), rounded-full (18px), px-4
- **列表项**: 最小高度 16 (64px)
- **头像**: 12 (48px) 列表用, 16 (64px) 个人中心用

### 全局样式类（在 tailwind-theme.css 中定义）
- `.glass-card` — 毛玻璃卡片（24px圆角+阴影+白边+blur）
- `.glass-input` — 毛玻璃输入框（16px圆角+聚焦变橙色）
- `.btn-gradient` — 橙色渐变按钮（52px高+16px圆角+阴影+active:scale-98）
- `.animate-fade-in-up` — 淡入上移动画
- `.scrollbar-hide` — 隐藏滚动条

### 布局规范
- **移动端优先**: 最大宽度 480px，居中显示，模拟原生App体验
- **背景**: 全局body设暖橙粉线性渐变，页面背景透明透出渐变
- **底部导航**: 毛玻璃效果固定在底部，高度 68px + 安全区，4个tab（首页、家人、关心话、我的）
- **表单页**: 毛玻璃卡片包裹所有表单元素，卡片内间距24px，元素间距20px
- **列表页**: 毛玻璃卡片包裹列表，列表项间距16px

### 响应式适配
- **手机端（< 768px）**: 单列布局，卡片宽度100%，px-5水平padding
- **平板/电脑端（>= 768px）**: 内容区域max-w-[480px] mx-auto居中，背景渐变铺满全屏
- **全面屏适配**: 顶部padding-top: env(safe-area-inset-top)，底部padding-bottom: env(safe-area-inset-bottom)，100dvh视口高度

### iOS/Android兼容性
- backdrop-filter 加 `-webkit-backdrop-filter` 前缀
- 渐变 加 `-webkit-linear-gradient` 前缀
- 输入框 `-webkit-appearance: none` 去除默认样式
- 按钮 `-webkit-tap-highlight-color: transparent` 去除点击高亮
- 滚动 `-webkit-overflow-scrolling: touch` 平滑滚动
- 字体使用系统字体栈

### 动效规范
- 过渡动画：柔和缓动，duration 300ms
- 页面切换：淡入淡出 + 轻微上移（animate-fade-in-up）
- 按钮点击：轻微缩放反馈 (active:scale-[0.98])
- 卡片加载：淡入动画（animate-fade-in）

## 数据模型

### 用户表 (xinyu_users)
- id (uuid, PK)
- userId (user_profile, 唯一索引)
- nickname (varchar, 昵称)
- avatarUrl (text, 头像)
- role (varchar, 'child' | 'elder', 身份：子女/老人)
- inviteCode (varchar, 唯一, 邀请码)
- city (varchar, 所在城市)
- pushTime (varchar, 推送时间，默认 '08:00,20:00')
- voiceType (varchar, 声音选择，默认 'female_warm')
- playbackSpeed (numeric, 播放语速，默认 1.0)

### 绑定关系表 (xinyu_bindings)
- id (uuid, PK)
- userIdA (user_profile, 用户A)
- userIdB (user_profile, 用户B)
- status (varchar, 'pending' | 'bound' | 'unbound')
- boundAt (timestamptz, 绑定时间)

### 播报历史表 (xinyu_broadcasts)
- id (uuid, PK)
- userId (user_profile, 所属用户)
- targetUserId (user_profile, 播报对象)
- content (text, 播报内容)
- summary (varchar, 摘要)
- broadcastDate (date, 播报日期)
- moodIndex (integer, 心情指数 1-10)
- steps (integer, 步数)
- sleepHours (numeric, 睡眠时长)
- weatherInfo (jsonb, 天气信息)
- status (varchar, 'generated' | 'failed')

### 录音库表 (xinyu_recordings)
- id (uuid, PK)
- userId (user_profile, 所属用户)
- category (varchar, 分类：weather/health/diet/general)
- presetText (varchar, 预设句子文本)
- audioUrl (text, 录音文件URL)
- duration (integer, 时长，秒)
- isRecorded (boolean, 是否已录制)

### 每日数据表 (xinyu_daily_data)
- id (uuid, PK)
- userId (user_profile)
- dataDate (date, 数据日期)
- steps (integer, 步数)
- sleepHours (numeric, 睡眠时长)
- outingStatus (varchar, 出门状态：home/out)
- locationType (varchar, 活动地点类型：park/supermarket/hospital/company/home)
- callDuration (integer, 通话时长，分钟)
- moodIndex (integer, 心情指数 1-10)
- activityData (jsonb, 活动明细数据)

## 模块划分

### 后端模块
- `users` - 用户信息、身份选择、绑定关系
- `daily-data` - 每日数据（模拟数据生成）
- `broadcasts` - AI播报生成、历史记录
- `recordings` - 录音库管理
- `weather` - 天气信息（模拟）

### 前端页面
- `HomePage` - 首页：数据面板 + AI播报 + 语音播放
- `RecordingsPage` - 录音库：分类录音、播放管理
- `HistoryPage` - 历史播报：列表 + 详情
- `ProfilePage` - 个人中心：用户信息 + 设置
- `BindPage` - 绑定页面：输入邀请码
- `OnboardingPage` - 注册引导：选择身份

## 技术要点
- AI播报使用 ai-text-generate 插件，前端流式生成
- 语音播放使用 Web Speech API (SpeechSynthesis)
- 录音使用 MediaRecorder API
- 数据第一版用模拟数据，保持真实合理
- 所有页面移动端优先，最大宽度480px居中
