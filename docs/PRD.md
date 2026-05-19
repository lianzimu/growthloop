
GrowthLoop PRD v0.1
版本：v0.1
项目暂定名：GrowthLoop
产品类型：AI 驱动的个人长期规划与反馈闭环系统
目标用户：个人自用
优先平台：移动端 Web / PWA，兼容 PC
设计风格：极简工具型、扁平风
技术方向：Next.js + TypeScript + Supabase + OpenAI API + Vercel
当前阶段：产品定义与 MVP 拆解阶段

1. 产品概述
1.1 产品定位
GrowthLoop 是一个面向个人长期成长的 AI 反馈闭环系统。
它帮助用户将长期规划拆解为季度目标、每周行动和每日记录，并通过 AI 对执行情况进行周期性复盘、反馈和计划调整。
GrowthLoop 不是普通 Todo List，也不是简单习惯打卡工具，而是一个帮助用户持续回答以下问题的系统：
	我想成为怎样的人？
	我本周是否真的朝这个方向前进了？
	如果没有，问题出在哪里？
	下周应该如何调整？

1.2 核心闭环
GrowthLoop 的核心使用闭环是：

创建目标
→ 拆解计划
→ 每日记录
→ 数据监控
→ AI 反馈
→ 每周复盘
→ 调整计划
→ 进入下一周期
v0.1 的目标不是构建完整人生管理系统，而是先跑通一个最小闭环：

创建 1 个长期目标
→ 拆出 3 个本周行动
→ 连续记录 7 天
→ 生成一次 AI 周复盘
→ 得到下周调整建议

2. 项目目标
2.1 产品目标
v0.1 的产品目标是：
	1. 让用户能够创建长期目标。 
	2. 让用户能够将目标拆解为本周行动。 
	3. 让用户能够每天快速记录状态和行动完成情况。 
	4. 让系统能够汇总一周执行数据。 
	5. 让 AI 能基于真实记录生成周复盘和下周建议。 
	6. 让用户能够根据复盘结果调整计划。 
	7. 让用户愿意连续使用至少 7 天。 

2.2 非目标
v0.1 不追求：
	1. 完整人生管理系统。 
	2. 多用户商业化产品。 
	3. 原生移动 App。 
	4. 社交功能。 
	5. 游戏化系统。 
	6. 复杂数据分析。 
	7. 自动化 Agent 全流程规划。 
	8. 支付系统。 
	9. 微信提醒 / 邮件提醒 / 日历同步。 
	10. 复杂权限管理。 

3. 用户画像
3.1 当前目标用户
v0.1 只服务一个用户：项目创建者本人。
用户特点：
	• 有长期成长规划需求。 
	• 关注健康、认知、技能、财务等多个领域。 
	• 容易出现目标过多、执行分散、复盘不足的问题。 
	• 有一定编程基础，学过 Java、Python、JavaScript。 
	• 能使用 AI 辅助写代码。 
	• 愿意使用付费 AI API。 
	• 希望通过该项目提升产品设计、全栈开发、AI 应用开发能力。 
	• 希望项目后续可以发展为作品集，甚至副业或产品化方向。 

3.2 使用场景
场景 1：制定长期目标
用户希望把模糊的长期规划整理成结构化目标。
例如：

领域：技能
长期目标：提升 AI & Coding 能力
一年目标：能够独立开发并部署小型 AI 应用
季度目标：完成 GrowthLoop MVP

场景 2：制定本周行动
用户希望从目标中拆解出可执行的本周行动。
例如：

目标：完成 GrowthLoop MVP
本周行动：
1. 完成 PRD v0.1
2. 完成数据库结构设计
3. 完成 Dashboard 静态页面

场景 3：每日记录
用户每天用手机快速记录：

今天睡了多久？
今天精力如何？
今天情绪如何？
今天完成了哪些行动？
如果没完成，是因为什么？

场景 4：低状态时不归零
用户状态不好时，可以完成最低行动版本。
例如：

标准行动：学习英语 45 分钟
最低行动：听 5 分钟英语或背 5 个单词
这样即使低状态，也不会完全中断。

场景 5：每周复盘
系统自动汇总本周数据，AI 生成复盘草稿。
AI 需要帮助用户发现：
	• 是否目标过多。 
	• 是否行动设计过难。 
	• 是否睡眠影响执行。 
	• 哪些行动完成率高。 
	• 哪些行动持续失败。 
	• 下周应该保留、降低、暂停哪些行动。 

4. 核心产品原则
4.1 移动端优先
Daily Check-in 是最高频入口，用户更可能在手机上使用。
因此 v0.1 设计应遵循：

手机端优先
PC 端兼容
少输入
少跳转
高可读性
按钮足够大
表单尽量轻量

4.2 极简工具型
GrowthLoop 不做情绪化陪伴 App，也不做复杂仪表盘。
设计关键词：

极简
清晰
克制
扁平
直接
低干扰
界面应该让用户快速知道：

今天做什么？
本周做得怎样？
哪里需要调整？

4.3 长期坚持优先
系统不应该制造压力，而应该帮助用户持续推进。
因此需要支持：

最低行动版本
失败记录
计划调整
目标暂停
周期复盘
用户失败时，系统不应该只是显示“未完成”，而应该帮助用户理解失败原因。

4.4 反馈优先于打卡
普通打卡工具只记录完成与否。
GrowthLoop 的重点是：

记录 → 解释 → 反馈 → 调整
AI 的作用不是说鼓励话，而是基于数据指出问题并提出下一步建议。

5. 信息架构
v0.1 包含 5 个核心页面：

1. Dashboard
2. Goals
3. Daily Check-in
4. Weekly Review
5. AI Coach
底部导航建议：

Home | Goals | Check-in | Review | Coach
移动端优先使用底部导航。
PC 端可以使用侧边栏导航。

6. 功能需求

6.1 Dashboard 首页
6.1.1 页面目标
Dashboard 是用户每天打开系统后的第一入口。
它需要回答：

今天最重要的事情是什么？
本周完成情况如何？
最近状态如何？
AI 建议我怎么调整？

6.1.2 核心模块
Dashboard v0.1 包含：
	1. 今日日期与简短问候。 
	2. 今日重点行动。 
	3. 当前主线目标。 
	4. 本周行动完成率。 
	5. 最近 3 天状态概览。 
	6. AI 简短建议。 
	7. 快速入口。 

6.1.3 今日重点行动
展示今天最重要的 1-3 个行动。
字段示例：

行动名称
所属目标
标准行动版本
最低行动版本
当前状态
示例：

今日重点：
完成 Daily Check-in 页面静态 UI

最低行动：
只完成表单布局和一个输入组件

6.1.4 本周完成率
展示本周行动完成情况。
计算方式 v0.1：

完成率 = 已完成行动记录数 / 计划行动记录数
行动状态可以分为：

done：完成
minimum_done：完成最低版本
skipped：跳过
failed：失败
v0.1 中，done 和 minimum_done 都计入“没有归零”，但 UI 上需要区分。

6.1.5 最近状态
展示最近 3 天：

睡眠
精力
情绪
压力
v0.1 可先用简单数字和文字展示，不必做复杂图表。

6.1.6 AI 简短建议
基于最近记录生成一句简短建议。
示例：

你这周 AI & Coding 推进不错，但睡眠偏低。建议今天只保留一个主线行动，并使用最低行动版本保护连续性。
v0.1 可以先手动点击生成，不必自动生成。

6.2 Goals 目标页面
6.2.1 页面目标
Goals 页面用于管理长期目标、领域和具体行动。
它需要支持：

领域管理
目标创建
目标拆解
行动创建
最低行动设计
本周启用行动

6.2.2 成长领域
默认领域：

健康
认知
技能
财务
每个领域下可以有多个目标。
示例：

健康
- 身体健康
- 皮肤健康
- 心理健康
- 社交关系健康

认知
- 通用认知
- 思维模型

技能
- AI & Coding
- 摄影 & 后期
- 英语
- 唱歌 & 吉他

财务
- 理财知识
- 储蓄目标
- 副业

6.2.3 目标层级
v0.1 支持目标周期：

5_year
3_year
1_year
quarter
每个目标可以有父目标。
例如：

5 年目标：成为具备 AI 产品开发能力的人
└── 1 年目标：独立完成 3 个 AI 应用项目
    └── 季度目标：完成 GrowthLoop MVP
v0.1 可以不做复杂树形视图，先用列表和筛选实现。

6.2.4 行动 Action
行动是目标的执行单位。
每个行动需要包含：

行动名称
所属目标
标准行动版本
最低行动版本
频率
难度
是否本周启用
状态
示例：

行动名称：完成 Daily Check-in 页面
标准版本：完成页面布局、状态输入、行动记录表单
最低版本：完成页面静态布局
频率：一次性
难度：中
本周启用：是

6.2.5 当前主线
v0.1 建议引入“当前主线”概念。
每周最多：

1 个主线目标
2 个辅助目标
原因：
用户目标领域很多，如果系统不帮助收敛，会加重压力。
当前主线示例：

本周主线目标：
完成 GrowthLoop v0.1 的核心产品设计

辅助目标：
1. 每周运动 2 次
2. 每天英语最低行动 5 分钟

6.3 Daily Check-in 每日记录页面
6.3.1 页面目标
Daily Check-in 是最高频使用页面。
目标是：

用户可以在 3 分钟内完成当天记录。

6.3.2 记录内容
Daily Check-in v0.1 包含：

日期
睡眠时长
精力评分
情绪评分
压力评分
今日行动完成情况
今日一句话记录
今日卡点

6.3.3 状态字段
评分采用 1-5 分。

精力：
1 = 很低
2 = 偏低
3 = 一般
4 = 较好
5 = 很好

情绪：
1 = 很差
2 = 偏差
3 = 一般
4 = 较好
5 = 很好

压力：
1 = 很低
2 = 偏低
3 = 一般
4 = 较高
5 = 很高

6.3.4 行动完成状态
每个本周启用行动可以记录为：

done：完成标准版本
minimum_done：完成最低版本
skipped：主动跳过
failed：想做但失败
说明：
	• done 表示完整完成。 
	• minimum_done 表示低状态下仍然完成最低行动。 
	• skipped 表示主动选择不做。 
	• failed 表示计划做但没有完成。 

6.3.5 今日一句话记录
示例：

今天下班后比较累，但还是完成了 GrowthLoop 的 PRD 初稿。

6.3.6 今日卡点
用于帮助 AI 判断失败原因。
示例：

睡眠不足
目标太多
时间被临时事情占用
不知道下一步怎么做
行动设计太大
情绪低落
v0.1 可以先用文本输入，后续再做标签化。

6.4 Weekly Review 周复盘页面
6.4.1 页面目标
Weekly Review 是 GrowthLoop 的核心价值页面。
它需要帮助用户完成：

回顾本周
发现问题
理解原因
调整下周计划

6.4.2 数据汇总
系统自动汇总：

本周行动完成率
标准完成次数
最低行动完成次数
失败次数
跳过次数
平均睡眠
平均精力
平均情绪
平均压力
完成最多的目标
失败最多的行动

6.4.3 AI 周复盘
用户点击“生成 AI 复盘”后，AI 根据本周数据生成复盘草稿。
AI 输出结构：

1. 本周总体总结
2. 本周主要进展
3. 执行情况分析
4. 主要卡点
5. 可能原因
6. 目标负荷判断
7. 下周调整建议
8. 建议保留的行动
9. 建议降低难度的行动
10. 建议暂停的行动

6.4.4 用户补充反思
AI 生成后，用户可以补充自己的反思。
字段：

本周我自己的观察
下周我想重点调整什么

6.4.5 下周建议
AI 需要给出具体建议，而不是泛泛鼓励。
好的建议示例：

下周建议只保留 1 个 AI & Coding 主线任务：完成 Daily Check-in 数据保存。
英语和运动只保留最低行动版本，避免目标过载。
不好的建议示例：

继续努力，相信你可以变得更好。

6.5 AI Coach 页面
6.5.1 页面目标
AI Coach 是基于用户目标和记录的个人成长助手。
它不是普通聊天机器人，而是有上下文的计划分析工具。

6.5.2 v0.1 功能
AI Coach 页面包含：

预设问题按钮
聊天输入框
历史对话记录
上下文数据引用

6.5.3 预设问题
v0.1 预设问题：

帮我拆解这个目标
帮我分析最近为什么执行失败
帮我生成下周计划
帮我降低目标难度
帮我判断目标是不是太多
帮我做一次周复盘

6.5.4 AI Coach 可访问的数据
v0.1 中，AI Coach 可以读取：

当前目标
当前行动
最近 7 天 daily_logs
最近 7 天 action_records
最近一次 weekly_review
后续版本再扩展为更长周期上下文。

7. 数据对象设计
v0.1 使用以下核心数据对象：

profiles
domains
goals
actions
daily_logs
action_records
weekly_reviews
ai_messages

7.1 profiles
用于保存用户扩展信息。
字段草案：

id
user_id
display_name
timezone
created_at
updated_at
说明：
Supabase Auth 自带用户表。
profiles 用来保存产品内用户信息。

7.2 domains
成长领域表。
字段草案：

id
user_id
name
description
sort_order
created_at
updated_at
示例：

健康
认知
技能
财务

7.3 goals
目标表。
字段草案：

id
user_id
domain_id
parent_goal_id
title
description
horizon
status
is_main_focus
start_date
target_date
created_at
updated_at
字段说明：

horizon:
- 5_year
- 3_year
- 1_year
- quarter

status:
- active
- paused
- completed
- archived

7.4 actions
行动表。
字段草案：

id
user_id
goal_id
title
description
standard_version
minimum_version
frequency
difficulty
is_active
is_weekly_focus
created_at
updated_at
字段说明：

frequency:
- once
- daily
- weekly
- custom

difficulty:
- easy
- medium
- hard

7.5 daily_logs
每日记录表。
字段草案：

id
user_id
date
sleep_hours
energy_score
mood_score
stress_score
note
blockers
created_at
updated_at

7.6 action_records
行动完成记录表。
字段草案：

id
user_id
action_id
daily_log_id
date
status
note
created_at
updated_at
字段说明：

status:
- done
- minimum_done
- skipped
- failed

7.7 weekly_reviews
周复盘表。
字段草案：

id
user_id
week_start
week_end
summary
metrics_snapshot
ai_feedback
next_week_plan
user_reflection
created_at
updated_at
说明：
metrics_snapshot 可保存当周统计结果，避免后续数据变化影响历史复盘。

7.8 ai_messages
AI Coach 对话记录表。
字段草案：

id
user_id
role
content
context_type
created_at
字段说明：

role:
- user
- assistant
- system

context_type:
- coach
- daily_feedback
- weekly_review
- goal_decomposition

8. AI 功能设计
v0.1 不做复杂 Agent，只做 3 个稳定 AI 能力。

8.1 Goal Decomposer 目标拆解助手
使用位置
Goals 页面。
输入

目标标题
目标描述
所属领域
目标周期
当前能力
每周可投入时间
用户偏好
输出

季度目标建议
本周行动建议
最低行动版本
风险提醒

8.2 Daily Feedback 每日反馈助手
使用位置
Daily Check-in 完成后。
输入

今日状态记录
今日行动完成情况
当前主线目标
最近 3 天状态
输出

一句话反馈
明日建议
是否需要降低行动难度

8.3 Weekly Reviewer 周复盘助手
使用位置
Weekly Review 页面。
输入

本周 daily_logs
本周 action_records
当前 goals
当前 actions
上一次 weekly_review
输出

本周总结
主要进展
执行卡点
失败原因假设
目标负荷判断
下周行动建议
需要降低难度的行动
建议暂停的行动

9. AI 输出原则
AI 反馈必须遵守以下原则：
9.1 具体优先
不要输出空泛鼓励。
不推荐：

你已经做得很好了，继续坚持。
推荐：

你本周 AI & Coding 行动完成率较高，但睡眠平均只有 6 小时。建议下周减少一个技能类行动，把主线集中在 Daily Check-in 数据保存上。

9.2 降低负担优先
AI 不应该不断增加目标，而应该帮助用户收敛。
AI 需要主动判断：

目标是否过多
行动是否过难
是否需要最低行动版本
是否应该暂停部分目标

9.3 可执行优先
每次建议都应该能转化为行动。
推荐格式：

下周保留：
1. 完成 Daily Check-in 数据保存
2. 每天英语最低行动 5 分钟

下周暂停：
1. 摄影后期学习
2. 吉他练习

下周降低：
1. 运动从 3 次降低为 2 次

9.4 非诊断原则
涉及心理健康时，AI 只能提供自我观察和一般建议，不能做医学诊断。
例如：

可以说：你最近情绪评分持续偏低，建议降低目标压力，并考虑和可信任的人聊聊。
不可以说：你患有某种心理疾病。

10. MVP 验收标准
10.1 使用验收
v0.1 完成后，用户应该能够：

创建至少 1 个领域
创建至少 1 个长期目标
创建至少 3 个本周行动
为每个行动设置最低行动版本
连续完成 7 天 Daily Check-in
生成 1 次 Weekly Review
获得 1 份 AI 下周建议
根据建议调整下周行动

10.2 产品验收

Daily Check-in 可在 3 分钟内完成
Dashboard 10 秒内能看懂今日重点
Weekly Review 能指出具体问题
AI 建议不是鸡汤
低状态时可以使用最低行动版本
用户失败后可以调整计划，而不是直接放弃

10.3 技术验收

用户可以登录
数据可以保存到 Supabase
Dashboard 可以读取真实数据
Daily Check-in 可以创建和更新记录
Weekly Review 可以汇总一周数据
AI 可以生成复盘内容
项目可以部署到 Vercel
手机浏览器可以正常使用

11. 开发阶段规划
阶段 0：项目文档
产出：

docs/PRD.md
docs/DATABASE.md
docs/API.md
docs/VIBE_CODING_RULES.md

阶段 1：项目骨架
产出：

Next.js 项目初始化
TypeScript 配置
Tailwind CSS 配置
基础 Layout
底部导航
5 个空页面

阶段 2：静态 UI
开发顺序：

1. Dashboard 静态页面
2. Daily Check-in 静态页面
3. Goals 静态页面
4. Weekly Review 静态页面
5. AI Coach 静态页面
这一阶段不接数据库。

阶段 3：Supabase 集成
产出：

Supabase 项目创建
Auth 登录
数据库表创建
RLS 策略
基础 CRUD
优先级：

profiles
domains
goals
actions
daily_logs
action_records

阶段 4：核心闭环实现
产出：

创建目标
创建行动
每日记录
行动完成记录
Dashboard 数据展示

阶段 5：AI 周复盘
产出：

汇总一周数据
调用 AI API
生成复盘草稿
保存 weekly_review
生成下周建议

阶段 6：部署和真实使用
产出：

Vercel 部署
手机端测试
连续使用 7 天
记录问题
根据真实体验迭代 v0.2

12. v0.1 不做事项
为了控制范围，以下功能 v0.1 明确不做：

原生 iOS / Android App
多用户社交
好友监督
积分系统
复杂图表
月度 / 年度报告
日历同步
微信提醒
邮件提醒
支付系统
团队协作
复杂 Agent 自动执行
文件上传
PDF 报告导出
公开分享页面

13. 未来版本方向
v0.2
可能加入：

PWA 安装体验优化
更好的移动端交互
月度复盘
目标负荷评分
行动推荐算法
AI 自动生成下周计划草稿

v0.3
可能加入：

趋势图表
长期目标进度视图
更多 AI 分析模板
日历视图
提醒机制

v1.0
可能方向：

多用户注册
公开 Demo
作品集展示
Landing Page
产品化探索
付费功能实验

14. 当前优先级排序
当前最重要的不是写代码，而是完成项目边界定义。
优先级如下：

P0：
- PRD v0.1
- 数据库结构设计
- 页面信息架构
- Vibe Coding 规则

P1：
- Next.js 项目初始化
- 静态页面
- Supabase 登录与数据库

P2：
- AI 周复盘
- Dashboard 数据化
- PWA 适配

P3：
- 作品集化
- Demo 视频
- 产品化探索

15. 第一阶段任务清单
接下来建议按这个顺序推进：

1. 确认 PRD v0.1
2. 编写 docs/DATABASE.md
3. 编写 docs/VIBE_CODING_RULES.md
4. 编写 docs/API.md
5. 初始化 Next.js 项目
6. 创建 5 个页面路由
7. 完成移动端 Layout 和底部导航
8. 完成 Dashboard 静态页面
9. 完成 Daily Check-in 静态页面
10. 接入 Supabase

16. v0.1 成功标准
GrowthLoop v0.1 成功的标准不是功能多，而是：
	你真实使用了 7 天，并且第 7 天的 AI 周复盘让你觉得：“这个系统确实帮我看清了问题，并让我知道下周怎么调整。”
只要做到这一点，v0.1 就成功。

17. 当前结论
GrowthLoop v0.1 的核心应聚焦在：

一个人使用
移动端优先
极简工具型
目标拆解
每日记录
最低行动
周复盘
AI 反馈
计划调整
它的第一性原理是：
	不是让用户更努力，而是让用户更清楚地知道：什么该坚持，什么该降低，什么该暂停，下一步该怎么走。

