// 个人信息来自简历；精选作品使用用户提供的完整短片和原片截图。
export const profile = {
  name: '盛勇杰',
  englishName: 'SHENG YONGJIE',
  email: '2543546653@qq.com',
  phone: '18106586863',
  location: '杭州 · 余杭',
  roles: ['AI 内容生成师', 'AI 设计师', 'AIGC 编导'],
  portrait: '/images/portrait-traveler-720.webp',
  portraitSrcSet: '/images/portrait-traveler-480.webp 480w, /images/portrait-traveler-720.webp 720w, /images/portrait-traveler-890.webp 890w',
  portraitAlt: '戴宽檐帽的旅行者彩色插画',
  heroPoster: '/images/hero-fantasy-1920.webp',
  heroPosterSrcSet: '/images/hero-fantasy-960.webp 960w, /images/hero-fantasy-1536.webp 1536w, /images/hero-fantasy-1920.webp 1920w, /images/hero-fantasy-2560.webp 2560w, /images/hero-fantasy-2912.webp 2912w',
  heroVideo: null,
};

export const backgroundMusic = {
  title: '异世界生活小曲',
  src: '/audio/isekai-life.mp3',
  durationLabel: '02:14',
  volume: 0.3,
};

export const projects = [
  {
    id: 'cat-cafe', number: '01', title: '猫知道', english: 'The Cat Knows',
    category: '猫咖叙事短片', label: '独立创作 · 故事影像',
    image: '/images/projects/cat-cafe.webp', alt: '《猫知道》原片画面：白猫坐在暖光猫咖的木质柜台上',
    imageWidth: 1280, imageHeight: 720,
    video: '/videos/projects/cat-cafe-web.mp4', duration: 70.46, durationLabel: '01:10',
    summary: '以猫咖为场景，围绕人物与猫的互动组织故事，练习氛围、镜头衔接与情绪节奏。',
    responsibility: '选题 / 剧本 / 分镜 / AI 生成 / 剪辑',
    notes: ['将一句话选题扩展为剧本，梳理叙事的起点与转折。', '根据剧情设计角色、场景和分镜，使用 AI 工具生成画面。', '通过镜头衔接、音效与背景音乐，完成短片的情绪表达。'],
  },
  {
    id: 'lost-memory', number: '02', title: '重新认识一下', english: 'Meet Me Again',
    category: '失忆主题短片', label: '独立创作 · 人物叙事',
    image: '/images/projects/lost-memory-portrait.webp', alt: '《重新认识一下》原片画面：暖色光线下的女性面部特写',
    imageWidth: 1280, imageHeight: 734,
    video: '/videos/projects/lost-memory-web.mp4', duration: 140.04, durationLabel: '02:20',
    summary: '围绕失忆主题展开人物叙事，用角色、生活场景与镜头节奏，探索记忆与关系的表达。',
    responsibility: '剧本 / 角色设定 / 场景生成 / 后期',
    notes: ['围绕失忆主题构思人物与情节，将叙事拆解为可执行的镜头。', '设计角色和场景，用 AI 生图与视频工具推进画面制作。', '在剪辑中调整镜头顺序与节奏，配置音效和背景音乐。'],
  },
  {
    id: 'combat-study', number: '03', title: '战斗练习 01', english: 'Combat Study 01',
    category: '动作场景练习', label: '个人练习 · 动作与节奏',
    image: '/images/projects/combat-study-duel.webp', alt: '《战斗练习1》原片画面：蓝色遗迹中持剑人物与铠甲战士的交锋',
    imageWidth: 1280, imageHeight: 548,
    video: '/videos/projects/combat-study-web.mp4', duration: 83.99, durationLabel: '01:24',
    summary: '围绕战斗场景练习动作镜头，探索人物运动、空间关系与剪辑节奏在 AI 影像中的呈现。',
    responsibility: '动作镜头练习 / AI 影像 / 剪辑',
    notes: ['以战斗场景为题材，练习不同景别之间的动作衔接。', '关注人物运动与场景空间，探索 AI 影像的动态表达。', '通过镜头选择与剪辑节奏，组织动作段落的张力。'],
  },
  {
    id: 'fashion-film', number: '04', title: '时尚短片', english: 'Fashion in Motion',
    category: '时尚视觉短片', label: '个人创作 · 时尚影像',
    image: '/images/projects/fashion-film-closeup.webp', alt: '《时尚短片》原片画面：黑发人物回望的面部特写',
    imageWidth: 1280, imageHeight: 718,
    video: '/videos/projects/fashion-film-web.mp4', duration: 41.94, durationLabel: '00:42',
    summary: '围绕人物造型、服装质感与场景氛围展开视觉练习，以镜头和节奏呈现时尚影像。',
    responsibility: 'AI 视觉生成 / 镜头编排 / 剪辑',
    notes: ['围绕人物与服装，探索造型、质感和光线的关系。', '将人物镜头与空间场景组合成连贯的视觉段落。', '通过画面选择与剪辑节奏，形成短片的整体氛围。'],
  },
];

export const experiences = [
  { date: '2022.07 — 2025.06', role: '数字媒体技术', place: '浙江经济职业技术学院 · 大专', description: '从数字媒体出发，持续练习影像制作与视觉表达。' },
  { date: '2025.07 — 2025.08', role: '摄影助理', place: '杭州卡美瑞影视文化有限公司', description: '参与课程录制，布置拍摄设备，操作摄影机并跟随人物调整画面。' },
  { date: '2025.09 — 2026.06', role: '文员', place: '余杭区交警大队', description: '整理车辆与违停数据、撰写事故报告，承担监控沟通与控灯相关工作。' },
];

export const capabilities = [
  { icon: 'story', title: '叙事与分镜', english: 'Story & direction', description: '将一句话想法展开为剧本，设计角色、场景与镜头，让创作有清晰的叙事方向。', tools: '选题策划 / 剧本 / 分镜设计' },
  { icon: 'frames', title: 'AI 视觉生成', english: 'AI visual creation', description: '结合生图与视频生成工具，把文字构想转成画面，推进角色、场景与影像制作。', tools: 'MJ / img2 / Banana / Seedance' },
  { icon: 'sound', title: '剪辑与声音', english: 'Editing & sound', description: '用镜头节奏、音乐和音效塑造情绪，独立完成短片剪辑；了解 PR 与 AE 的基础操作。', tools: '剪映 / Premiere Pro / After Effects' },
  { icon: 'lens', title: '镜头与色彩', english: 'Photography & color', description: '拥有个人摄影设备，持续学习构图与调色，并用照片修饰与基础后期完善画面。', tools: '摄影构图 / Lightroom / Photoshop' },
];
