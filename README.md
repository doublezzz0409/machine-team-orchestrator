# Machine Team: Master Orchestrator

多 Agent 协作编排系统 — 基于 Claude Code 的角色分离、信息隔离、流程刚性架构。

## 核心理念

> 不是先画完流程图再往里面填角色，而是先深度设计每个角色，再从角色之间的自然张力中发现流程的缺失，反过来优化流程。

- **角色分离** — 20 个子 Agent，各司其职，互不越界
- **信息隔离** — 双审计师无法看到彼此的原始报告，防止串通
- **流程刚性** — 每个组有严格的 SOP，不可跳步（除非总指挥授权）
- **信号驱动** — 任务完成后自动检测跨组信号，触发后续流程

---

## 架构总览

```
总指挥 (Commander)
    ↓ 提交任务
总调度层 (Master Orchestrator) — CLAUDE.md
    ↓ 路由 + 分发
6 个组编排器 (Group Orchestrators) — groups/*.md
    ↓ 按 SOP 召唤
20 个子 Agent — .claude/agents/*.md
```

<a href="diagrams/总调度版本完整流程图.svg">
  <img src="diagrams/总调度版本完整流程图.svg" alt="总调度版本完整流程图" width="100%">
</a>

> 点击图片可查看原图

---

## 项目结构

```
总调度版本/
├── CLAUDE.md                          ← 总调度层主控（自动加载）
├── .claude/agents/                    ← 20 个子 Agent 定义
│   ├── defect-programmer-standard.md
│   ├── defect-programmer-fast.md
│   ├── defect-auditor-a.md
│   ├── defect-auditor-b.md
│   ├── defect-qa-validator.md
│   ├── feature-pm.md
│   ├── feature-architect.md
│   ├── feature-engineer.md
│   ├── feature-qa.md
│   ├── feature-technical-writer.md
│   ├── debt-auditor.md
│   ├── debt-refactor-engineer.md
│   ├── debt-regression-qa.md
│   ├── research-engineer.md
│   ├── research-tech-evaluator.md
│   ├── risk-security-auditor.md
│   ├── risk-hardening-engineer.md
│   ├── risk-qa.md
│   ├── knowledge-manager.md
│   └── knowledge-training-designer.md
├── groups/                            ← 6 个组的内部 SOP
│   ├── defect-fix.md
│   ├── feature-dev.md
│   ├── debt-cleanup.md
│   ├── research.md
│   ├── risk-mitigation.md
│   └── knowledge-mgmt.md
├── docs/
│   ├── 方法论.txt                     ← 角色设计方法论
│   └── 总调度版本 - 配置文件总览.txt
└── diagrams/
    └── 总调度版本完整流程图.mermaid
```

---

## 6 个组与触发规则

| 组 ID | 组名称 | Agent 数 | 触发关键词 |
|--------|--------|----------|-----------|
| DEFECT | 缺陷修复组 | 5 | Bug, 缺陷, 报错, 异常, 崩溃, 回归 |
| FEATURE | 功能开发组 | 5 | 新功能, 需求, 功能开发, 用户故事 |
| DEBT | 技术债务清理组 | 3 | 重构, 技术债, 代码质量, 清理, 债务 |
| RESEARCH | 技术调研与原型验证组 | 2 | 调研, 技术选型, 可行性, 原型, 对比, 评估 |
| RISK | 风险缓解与安全加固组 | 3 | 安全, CVE, 漏洞, 加固, 审计, 渗透 |
| KNOWLEDGE | 知识管理与培训组 | 2 | (不可用户触发 — 仅事件驱动) |

---

## 20 个 Agent 清单

### 缺陷修复组 (DEFECT) — 5 个

| Agent | 核心职责 |
|-------|---------|
| `defect-programmer-standard` | 根因分析、修复方案（带意图标签）、执行修改、测试草案 |
| `defect-programmer-fast` | 快速止血、紧急修复、临时方案 |
| `defect-auditor-a` | 安全漏洞、边界条件、危险假设审查 |
| `defect-auditor-b` | 性能影响、架构合理性、技术债务审查 |
| `defect-qa-validator` | 测试执行、回归排查、补充观察、质量否决 |

### 功能开发组 (FEATURE) — 5 个

| Agent | 核心职责 |
|-------|---------|
| `feature-pm` | 需求定义、验收条件、优先级排序、最终验收否决 |
| `feature-architect` | 技术方案设计、架构约束、方案否决、债务记录 |
| `feature-engineer` | 需求理解、代码实现、自测报告、文档变更标注 |
| `feature-qa` | 验收条件前置审查、测试设计与执行、质量否决 |
| `feature-technical-writer` | 文档撰写更新、API 模糊性打回 |

### 技术债务清理组 (DEBT) — 3 个

| Agent | 核心职责 |
|-------|---------|
| `debt-auditor` | 债务识别与定义、清理方案设计、不可变行为红线 |
| `debt-refactor-engineer` | 方案可行性评估、代码重构执行、风险暂停声明 |
| `debt-regression-qa` | 行为不变验证、债务清除验证、否决交付 |

### 技术调研组 (RESEARCH) — 2 个

| Agent | 核心职责 |
|-------|---------|
| `research-engineer` | 实验设计、原型搭建、数据收集、初步结论 |
| `research-tech-evaluator` | 实验方法审核、最终建议、风险量化、替代方案 |

### 风险缓解组 (RISK) — 3 个

| Agent | 核心职责 |
|-------|---------|
| `risk-security-auditor` | 风险识别与分级、加固方向制定、优先级排序 |
| `risk-hardening-engineer` | 方案可行性评估、加固执行、临时缓解措施 |
| `risk-qa` | 三重验证（功能回归 / 性能基线 / 攻击模拟） |

### 知识管理组 (KNOWLEDGE) — 2 个

| Agent | 核心职责 |
|-------|---------|
| `knowledge-manager` | 从任务产出中提取知识、时效标注、来源引用 |
| `knowledge-training-designer` | 可教学性评估、学习路径设计、技能缺口诊断 |

---

## 各组工作流程

### 缺陷修复组 (DEFECT) — 8 步标准通道

```
Step 1: 召唤 programmer-standard
        → 根因分析 + 修复方案（带意图标签）+ 测试用例草稿

Step 2: 并行召唤 auditor-a + auditor-b（信息隔离）
        → auditor-a: 仅安全 & 边界条件
        → auditor-b: 仅性能 & 架构影响

Step 3: 组编排器执行信号过滤
        → 去重、识别冲突、标记越界（INVALID）

Step 4: 去身份化交叉质询
        → 分歧点匿名化后分别发给两个审计师
        → 强制独立判断，禁止简单同意

Step 5: 形成最终审计报告
        → 共识项 + 未解决分歧项

Step 6: 重新召唤 programmer-standard
        → 对每个分歧项做独立技术判断
        → 可拒绝建议（记录为"开放争议"）

Step 7: 召唤 qa-validator
        → 三态：PASS / FAIL / PASS with Observations

Step 8: QA 后分流
        → PASS → 关闭
        → FAIL → 回到 Step 6
        → PASS with Observations → 评估是否需补充交叉质询
```

**紧急通道**：`programmer-fast → auditor-a（仅安全）→ qa-validator`，标记 `[Emergency Channel]`

### 功能开发组 (FEATURE) — 10 步

```
Step 0: 判断是否启用 Technical Writer

Step 1: 召唤 PM
        → 用户故事 + 验收标准 + 优先级 + 非目标

Step 2: 召唤 Architect
        → 技术可行性 + 架构设计 + 技术债评估
        → 复杂度超预期 → PM-Architect 讨论 → 僵局上报

Step 3: 召唤 Engineer
        → 先验证需求清晰度（模糊打回 PM）
        → 可挑战架构约束

Step 4: Engineer 实现
        → 代码 + 自测报告 + 文档变更标记

Step 5-7: QA 测试
        → 先审查验收标准可测试性 → 执行测试 → 三态结论

Step 8: PM 最终验收
        → 对照原始验收标准，不接受新增标准

Step 9: Technical Writer（如启用）

Step 10: 关闭
```

### 技术债务清理组 (DEBT) — 6 步

```
Step 1: 召唤 debt-auditor → 债务项 + 清理计划 + 不可变行为红线
Step 2: 召唤 refactor-engineer 评估可行性 → 不可行则讨论
Step 3: Engineer 执行 → 变更摘要 + 行为保持声明
Step 4: 召唤 regression-qa → PASS / FAIL(VETO) / PASS with Reservations
Step 5: 评估 QA 保留意见 → 未真正清除则回到 Step 1
Step 6: 关闭
```

### 技术调研组 (RESEARCH) — 5 步

```
入口：由其他组的 Agent 提交调研请求（非用户直接触发）

Step 1: 召唤 research-engineer（带时间盒约束）
Step 2: 时间盒监控 — 80% 警告，到期强制提交
Step 3: 召唤 tech-evaluator 独立审计 → REJECT 则重新调研
Step 4: 交付结论给客户 → 接受则关闭，拒绝则上报总指挥
Step 5: 关闭
```

### 风险缓解组 (RISK) — 7 步

```
Step 1: 召唤 security-auditor → 风险列表 + 严重性 + 加固方向
Step 2: 召唤 hardening-engineer 评估可行性 → 不可行则讨论
Step 3: Engineer 执行加固
Step 4: 召唤 risk-qa
Step 5: 三重验证 — 功能回归 / 性能基线 / 攻击模拟
Step 6: 残余风险评估 → 可接受则设定审查日期
Step 7: 关闭
```

### 知识管理组 (KNOWLEDGE) — 事件驱动

```
触发条件（满足任一）：
  - 新颖根因或 Bug 模式
  - 新架构决策或设计模式
  - 解决了先前未知的技术约束
  - 安全发现值得泛化
  - 首次集成外部系统
  - 可复用的解决方案

流程：
  knowledge-manager 提取知识
    → 合规检查（可搜索性 / 新鲜度 / 来源引用 / 结构完整性）
    → training-designer 可教性评估
    → 学习路径新鲜度检查
    → 培训效果追踪
    → 知识健康报告
```

---

## 跨组信号协议

| 信号 | 产生方 | 消费方 | 需总指挥确认? |
|------|--------|--------|--------------|
| `TECH_DEBT_FOUND` | 任意组 | 技术债务清理组 | 是 |
| `SECURITY_RISK_FOUND` | 任意组 | 风险缓解组 | 是 |
| `POST_AUDIT_REQUIRED` | 缺陷修复组(紧急通道) | 风险缓解组 / 债务清理组 | 是 |
| `KNOWLEDGE_WORTHY` | 任意组 | 知识管理组 | **否（自动触发）** |
| `RESEARCH_NEEDED` | 任意组 | 技术调研组 | 是 |

---

## 核心设计机制

### 信息隔离与防串通

- Auditor-A 与 Auditor-B **永远看不到对方的原始报告**
- 去身份化交叉质询：分歧点以匿名方式发给对方评估
- 问题白名单 / 黑名单：只允许特定格式的问题
- 反摸鱼条款：接受对方观点时必须补充未覆盖的风险点
- 程序员独立判断：收到审计报告后必须做出独立技术判断，禁止盲目折中

### 优先级仲裁

```
1. 紧急通道任务（P0 安全漏洞、服务中断）
2. POST_AUDIT_REQUIRED 跟进
3. 活跃组转交（等待分发的跨组信号）
4. 标准任务
5. 知识管理（始终异步，永不紧急）
```

### 五类制衡模式

| 制衡模式 | 描述 | 典型案例 |
|----------|------|---------|
| 质疑-回应 | A 提出判断，B 可以质疑，A 必须回应 | 重构工程师挑战债务审计师的清理方案 |
| 独立审核 | B 独立审查 A 的产出，有权打回 | 技术评估师审核调研工程师的实验方法 |
| 双线并行 | 同一输入给两个角色，从不同视角产出 | 审计A（安全）+ 审计B（性能）审查同一份修复方案 |
| 最终验收 | 裁决权交给独立于执行链的角色 | PM 在 QA 全部通过后仍有验收否决权 |
| 实证推翻 | B 用实际测试结果推翻 A 的理论判断 | 风险验证 QA 的攻击模拟推翻安全审计师的加固方向 |

---

## 使用方式

### 部署

1. 将整个项目文件夹复制到目标项目根目录
2. 确保 `.claude/agents/` 目录结构不变
3. 在 Claude Code 中打开项目，`CLAUDE.md` 会自动加载

### 提交任务

在 Claude Code 对话框中直接输入任务描述，例如：

```
我的登录页面有 bug，用户输入正确密码也提示"密码错误"
```

Claude 会自动：
1. 分类任务 → 匹配到缺陷修复组
2. 输出 `TASK_ROUTE` → 等你确认
3. 分发到对应组 → 按 SOP 执行
4. 完成后汇报 → 检查跨组信号

---

## 方法论

### 角色设计四步法

| 步骤 | 核心问题 |
|------|---------|
| 定位 | 这个角色提供了什么别人看不到的独特视角？ |
| 权利 | 他需要哪些决策权？否决权、判断权、建议权分别是什么？ |
| 制衡 | 谁可以挑战他？他需要向谁解释自己的判断？ |
| 边界 | 他绝对不允许做什么？最可能的腐化模式是什么？ |

### 腐化模式预判

| 腐化类型 | 典型表现 | 预防原则 |
|----------|---------|---------|
| 权限膨胀 | 角色逐渐侵入其他领域 | 明确领域边界 + 主 Agent 越界过滤 |
| 偷懒趋同 | 双审计互相附和 | 信息隔离 + 强制产出差异 |
| 过度保守 | 把一切视为高风险 | 量化分级标准 |
| 确认偏误 | 只找支持自己预判的证据 | 独立审核角色天然携带怀疑眼光 |
| 范围蔓延 | 超出授权范围做事 | 主 Agent 检查输出与授权范围一致性 |
| 模糊化逃避 | 用模糊结论规避责任 | 强制输出格式（三态 / 量化） |

详细方法论见 [docs/方法论.txt](docs/方法论.txt)。

---

## License

MIT
