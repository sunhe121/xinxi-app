# 心系 - AI亲情关怀应用

## 应用概述
"心系"是一款手机端AI亲情关怀应用，帮助异地子女和老人通过AI自动总结每日生活状态，生成温暖的语音播报，定时推送给对方，让陪伴不缺席。

## 设计规范

### 视觉风格
- **风格定位**: 温暖、简洁、治愈、大留白
- **主色调**: 暖橙色系，传递温暖关怀的感觉
- **配色方案**:
  - 主色：暖橙 `#FF8C69` → `hsl(14 100% 66%)` (primary)
  - 次色：柔粉 `#FFB5B5` (secondary)
  - 点缀：柔绿 `#98D8C8` (accent)
  - 背景：米白 `#FFF8F3` → `hsl(24 60% 97.5%)` (background)
  - 卡片：纯白 `#FFFFFF` (card)
  - 文字：深棕灰 `#4A3F3A` → `hsl(20 15% 20%)` (foreground)
  - 次要文字：棕灰 `#8B7D75` → `hsl(22 8% 55%)` (muted-foreground)
  - 边框：浅米色 `hsl(24 35% 90%)` (border)
  - 成功：柔绿 `#6BCB77`
  - 警告：暖橙 `#FFB347`
  - 危险：柔红 `#FF6B6B`

### 字体与行高
- **字体**: 系统默认中文字体栈，圆润亲和
- **行高**: 正文 1.6，标题 1.3，辅助文字 1.5
- **字号层级**:
  - 页面大标题: text-2xl (24px), font-bold, 行高1.3
  - 卡片/区块标题: text-xl (20px), font-semibold
  - 副标题: text-base (16px), font-medium, 灰色
  - 正文: text-base (16px), 行高1.6
  - 输入框标签: text-base (16px), font-medium
  - 按钮文字: text-base (16px), font-semibold
  - 辅助文字: text-sm (14px), 灰色, 行高1.5
  - 小字: text-xs (12px)

### 间距体系（全局规范，所有页面必须遵循）
- **页面级**:
  - 左右 padding: px-6 (24px)
  - 顶部 padding: pt-6 (24px)
  - 底部 padding: pb-[120px]（给底部导航留空间）
  - 最大宽度: max-w-[480px], mx-auto 居中
- **卡片级**:
  - 背景: 白色 (bg-card)
  - 圆角: rounded-2xl (16px)
  - 阴影: shadow-sm (柔和暖色阴影)
  - 内部 padding: p-6 (24px)
  - 卡片之间间距: space-y-4 / gap-4 (16px)
- **元素间距**:
  - 标题与副标题之间: 3 (12px)
  - 区块标题与内容之间: 4 (16px)
  - 表单标签与输入框之间: 2 (8px)
  - 两个输入框组之间: 5 (20px)
  - 输入框与按钮之间: 6 (24px)
  - 按钮与辅助文字之间: 4 (16px)
  - 列表项之间: 3 (12px)
  - 列表项内部 padding: py-4 px-4 (16px)
  - 图标与文字之间: 2.5 (10px)

### 组件尺寸（全局规范）
- **主按钮**: h-12 (48px), rounded-xl (12px), 文字16px加粗, 渐变橙色 from-primary to-orange-400
- **次按钮**: h-12 (48px), rounded-xl, 边框+橙色文字
- **输入框**: h-12 (48px), rounded-xl (12px), 文字16px, px-4, border border-border, bg-white, 聚焦时 border-primary + ring-2 ring-primary/20
- **标签/分类按钮**: h-9 (36px), rounded-full (18px), px-4
- **列表项**: 最小高度 14 (56px)
- **头像**: 12 (48px) 列表用, 16 (64px) 个人中心用

### 布局规范
- **移动端优先**: 最大宽度 480px，居中显示，模拟原生App体验
- **底部导航**: 固定在底部，高度 64px，4个tab（首页、录音库、历史播报、我的）
- **表单页**: 白色卡片包裹所有表单元素，卡片内间距24px，元素间距20px
- **列表页**: 白色卡片包裹列表，列表项间距12px

### 动效规范
- 过渡动画：柔和缓动，duration 300ms
- 页面切换：淡入淡出 + 轻微上移
- 按钮点击：轻微缩放反馈 (active:scale-[0.98])

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
