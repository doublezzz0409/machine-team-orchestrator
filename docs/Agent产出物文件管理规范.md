# Agent 产出物文件管理规范

> 版本：v1.0 | 日期：2026-05-11
> 本规范定义 Machine Team 中所有 Agent 产出物的文件命名、存储位置、元数据格式、落盘策略和生命周期管理。

---

## 一、文件的本质

文件是角色间的**显性契约**，不仅仅是信息的容器。

当角色 A 的产出需要交给角色 B 时，这个交接物必须有明确的名称、位置和格式，使得：
- 产出者知道写到哪里、叫什么名字
- 消费者知道从哪里读、读的是什么
- 总调度知道如何追踪和审计整个流程

---

## 二、目录结构

```
总调度版本/
├── sessions/                              ← 所有会话数据
│   └── {session-id}/                      ← 单次会话
│       ├── session-log.md                 ← 总调度的会话日志
│       └── TASK-{seq}/                    ← 按任务序号分区
│       │   ├── brief.md                   ← 任务简报（总指挥原始指令）
│       │   ├── work/                      ← 工作底稿（组内流转）
│       │   │   └── {产出文件}.md
│       │   └── summary.md                 ← 任务最终摘要
│       └── ...
│
├── knowledge/                             ← 知识库（长期资产）
│   ├── entries/                           ← 知识条目
│   │   └── KE-{YYYY-MM-DD}-{seq}.md
│   └── paths/                             ← 学习路径
│       └── LP-{主题名}.md
│
├── docs/                                  ← 静态文档（已有）
├── groups/                                ← 组 SOP（已有）
├── .claude/agents/                        ← Agent 定义（已有）
└── diagrams/                              ← 流程图（已有）
```

---

## 三、命名规范

### 3.1 会话与任务

| 元素 | 格式 | 示例 |
|------|------|------|
| 会话 ID | `S-{YYYYMMDD}-{seq}` | `S-20260511-01` |
| 任务 ID | `TASK-{seq}` | `TASK-001`, `TASK-002` |

序号在同一会话内递增，从 001 开始。

### 3.2 工作底稿（work/ 目录内）

| 文件名 | 产出角色 | 说明 |
|--------|---------|------|
| `brief.md` | 总调度 | 任务简报，总指挥的原始指令 |
| `root-cause.md` | defect-programmer-standard | 根因分析 + 修复方案 + 测试草案 |
| `audit-security.md` | defect-auditor-a | 安全与边界审计报告 |
| `audit-architecture.md` | defect-auditor-b | 性能与架构审计报告 |
| `final-audit.md` | 主控（信号过滤后） | 最终审计报告（共识 + 分歧） |
| `fix-report.md` | defect-programmer-standard | 修复后的代码变更报告 |
| `qa-validation.md` | defect-qa-validator | QA 验证结论（三态） |
| `prd.md` | feature-pm | 需求文档（用户故事 + 验收条件 + 非目标） |
| `architecture.md` | feature-architect | 技术方案 + 架构约束 + 债务评估 |
| `self-test.md` | feature-engineer | 工程师自测报告 + 文档变更标记 |
| `test-result.md` | feature-qa | QA 测试结果（三态） |
| `acceptance.md` | feature-pm | PM 最终验收结论 |
| `docs-update.md` | feature-technical-writer | 文档撰写/更新产出 |
| `cleanup-plan.md` | debt-auditor | 债务清单 + 清理计划 |
| `redlines.md` | debt-auditor | 不可变行为红线定义 |
| `change-summary.md` | debt-refactor-engineer | 重构变更摘要 + 行为保持声明 |
| `regression-result.md` | debt-regression-qa | 回归验证结论（三态） |
| `experiment-report.md` | research-engineer | 实验设计 + 数据 + 初步结论 |
| `evaluation.md` | research-tech-evaluator | 最终建议（三态） |
| `risk-list.md` | risk-security-auditor | 风险清单 + 严重性 + 加固方向 |
| `hardening-report.md` | risk-hardening-engineer | 加固执行报告 + 加固声明 |
| `triple-verify.md` | risk-qa | 三重验证结论（三态） |
| `knowledge-entry.md` | knowledge-manager | 知识条目草稿（自检前） |
| `learning-path.md` | knowledge-training-designer | 学习路径草稿 |

### 3.3 最终摘要

| 文件名 | 产出角色 | 说明 |
|--------|---------|------|
| `summary.md` | 各组主控 | 任务关闭时的最终摘要，给总指挥看 |

### 3.4 知识库（knowledge/ 目录内）

| 文件名格式 | 说明 | 示例 |
|-----------|------|------|
| `KE-{YYYY-MM-DD}-{seq}.md` | 知识条目 | `KE-2026-05-11-001.md` |
| `LP-{主题名}.md` | 学习路径 | `LP-security-audit.md` |

### 3.5 会话日志

| 文件名 | 产出角色 | 说明 |
|--------|---------|------|
| `session-log.md` | 总调度 | 会话级事件日志 |

---

## 四、YAML 元数据格式

所有需要持久化的文件，头部必须包含 YAML frontmatter。

### 4.1 通用元数据

```yaml
---
# 必填字段
created: 2026-05-11T14:30:00+08:00    # ISO 8601 创建时间
author: defect-programmer-standard      # 产出者 Agent 名称
task_id: TASK-001                       # 所属任务 ID
session_id: S-20260511-01               # 所属会话 ID
type: work                              # 文件类型：work / summary / knowledge / log
---
```

### 4.2 知识条目专用字段

```yaml
---
created: 2026-05-11T14:30:00+08:00
author: knowledge-manager
task_id: TASK-001
session_id: S-20260511-01
type: knowledge
last_verified: 2026-05-11              # 最后验证日期
next_review: 2026-06-11                # 下次复核日期
status: active                          # active / deprecated / awaiting_verification
source_task: TASK-001                   # 来源任务 ID
---
```

### 4.3 学习路径专用字段

```yaml
---
created: 2026-05-11T14:30:00+08:00
author: knowledge-training-designer
type: path
last_verified: 2026-05-11
references:                             # 引用的知识条目
  - KE-2026-05-11-001.md
  - KE-2026-05-10-003.md
---
```

### 4.4 残余风险专用字段

```yaml
---
created: 2026-05-11T14:30:00+08:00
author: risk-hardening-engineer
task_id: TASK-005
session_id: S-20260511-01
type: residual_risk
review_date: 2026-06-11                # 强制复评日期
severity: Medium
---
```

---

## 五、落盘策略

### 5.1 判断规则

```
需要落盘吗？
├── 多个角色同时需要读同一份产出？        → 落盘
├── 产出需要跨组传递？                    → 落盘
├── 是给总指挥的最终结论？                → 落盘
├── 是跨任务复用的长期资产？              → 落盘
├── 会被打回重做，旧版本无保留价值？      → 不落盘（内存传递）
├── 只有一个下游读者，串行单次传递？      → 不落盘
└── 主控脱敏后的中转内容？                → 不落盘
```

### 5.2 各组落盘清单

#### 缺陷修复组（DEFECT）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `root-cause.md` | **是** | 审计A、审计B 并行读取 |
| `audit-security.md` | **是** | 主控需要做信号过滤和脱敏中继 |
| `audit-architecture.md` | **是** | 主控需要做信号过滤和脱敏中继 |
| `final-audit.md` | **是** | 程序员修复时需要逐条回应 |
| `fix-report.md` | 否 | 串行传递给 QA，内存传递即可 |
| `qa-validation.md` | **是** | 最终结论，给总指挥看 |
| `summary.md` | **是** | 任务最终摘要 |

#### 功能开发组（FEATURE）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `prd.md` | **是** | 架构师、工程师、QA 全流程参考 |
| `architecture.md` | **是** | 工程师、QA 全流程参考 |
| `self-test.md` | 否 | 串行传递给 QA |
| `test-result.md` | **是** | PM 验收时需要参考 |
| `acceptance.md` | **是** | 最终结论 |
| `docs-update.md` | **是** | 长期资产 |
| `summary.md` | **是** | 任务最终摘要 |

#### 技术债务清理组（DEBT）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `cleanup-plan.md` | **是** | 工程师执行 + QA 回归都需要参考 |
| `redlines.md` | **是** | QA 回归验证的基准，可升级为长期资产 |
| `change-summary.md` | 否 | 串行传递给 QA |
| `regression-result.md` | **是** | 最终结论 |
| `summary.md` | **是** | 任务最终摘要 |

#### 技术调研组（RESEARCH）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `experiment-report.md` | **是** | 评估师独立审核，且可能被打回重做 |
| `evaluation.md` | **是** | 最终结论，给客户和总指挥看 |
| `summary.md` | **是** | 任务最终摘要 |

#### 风险缓解组（RISK）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `risk-list.md` | **是** | 加固工程师和 QA 都需要参考 |
| `hardening-report.md` | 否 | 串行传递给 QA |
| `triple-verify.md` | **是** | 最终结论 |
| `residual-risk.md` | **是** | 长期资产，含复评期限 |
| `summary.md` | **是** | 任务最终摘要 |

#### 知识管理组（KNOWLEDGE）

| 文件 | 必须落盘？ | 原因 |
|------|----------|------|
| `knowledge-entry.md` | **是** | 长期资产 |
| `learning-path.md` | **是** | 长期资产 |
| `knowledge-health.md` | **是** | 给总指挥看的定期报告 |

---

## 六、生命周期管理

### 6.1 生命周期阶段

```
创建 → 活跃使用 → 任务关闭 → 归档/升级 → 过期清理
```

### 6.2 各类文件的生命周期

| 文件类型 | 创建时机 | 活跃期 | 任务关闭后 | 过期条件 |
|---------|---------|--------|-----------|---------|
| 工作底稿 | 角色执行时 | 任务进行中 | 留在 TASK 目录，不再修改 | 会话归档时可选清理 |
| 最终摘要 | 任务关闭时 | 永久 | 保留在 TASK 目录 | 不过期 |
| 会话日志 | 会话开始时 | 会话进行中 | 会话结束时完成 | 不过期 |
| 知识条目 | 知识管理触发时 | 永久 | 升级到 knowledge/entries/ | next_review 到期 |
| 学习路径 | 培训设计师产出时 | 永久 | 升级到 knowledge/paths/ | 引用的知识条目过期 |
| 残余风险 | 风险 QA 产出时 | 直到复评 | 保留在 TASK 目录 | review_date 到期 |

### 6.3 知识条目状态流转

```
active → (验证过期) → awaiting_verification → (重新验证) → active
                                                    → (发现过时) → deprecated
```

---

## 七、会话 ID 与任务 ID 生成规则

### 7.1 会话 ID

由总调度在会话开始时生成：

```
格式：S-{YYYYMMDD}-{seq}
示例：S-20260511-01

规则：
- YYYYMMDD 为会话开始日期
- seq 为当日会话序号，从 01 开始
- 同一日多次会话递增序号
```

### 7.2 任务 ID

由总调度在路由任务时生成：

```
格式：TASK-{seq}
示例：TASK-001, TASK-002

规则：
- seq 为会话内任务序号，从 001 开始
- 同一会话内递增
- 跨组交接不产生新任务 ID，沿用原任务 ID
```

### 7.3 跨组交接的文件归属

当一个组的任务触发跨组交接时：
- 新组的任务使用**新的 TASK-ID**
- 但 summary.md 中必须记录 `parent_task: TASK-原始ID`，形成追溯链

```yaml
---
created: 2026-05-11T16:00:00+08:00
author: debt-auditor
task_id: TASK-003
session_id: S-20260511-01
type: summary
parent_task: TASK-001                    ← 由 DEFECT 组 TASK-001 触发
handoff_signal: TECH_DEBT_FOUND
---
```

---

## 八、总调度的文件操作职责

总调度在以下时机执行文件操作：

| 时机 | 操作 | 目标文件 |
|------|------|---------|
| 会话开始 | 创建会话目录 | `sessions/{session-id}/` |
| 任务路由 | 创建任务目录 + brief.md | `sessions/{id}/TASK-{seq}/brief.md` |
| 任务分发 | 将 brief.md 传给目标组 | — |
| 跨组交接 | 创建新任务目录 + handoff 摘要 | 新 TASK 目录的 brief.md |
| 任务关闭 | 确认 summary.md 已生成 | `summary.md` |
| KNOWLEDGE_TRIGGER | 将任务产出传给知识管理组 | — |
| 会话结束 | 生成会话结束摘要 | `session-log.md` 的最终段落 |

---

## 九、快速参考卡

### 文件名速查

```
work/root-cause.md              ← 程序员根因分析
work/audit-security.md          ← 安全审计
work/audit-architecture.md      ← 架构审计
work/final-audit.md             ← 最终审计报告
work/prd.md                     ← 需求文档
work/architecture.md            ← 技术方案
work/cleanup-plan.md            ← 债务清理计划
work/redlines.md                ← 行为红线
work/experiment-report.md       ← 调研实验报告
work/evaluation.md              ← 调研评估结论
work/risk-list.md               ← 风险清单
work/triple-verify.md           ← 三重验证结论
summary.md                      ← 任务最终摘要
session-log.md                  ← 会话日志
KE-{YYYY-MM-DD}-{seq}.md       ← 知识条目
LP-{主题名}.md                  ← 学习路径
```

### 落盘判断速查

```
并行读取？ → 落盘
跨组交接？ → 落盘
最终结论？ → 落盘
长期资产？ → 落盘
串行单传？ → 不落盘
被打回？   → 不落盘
脱敏中转？ → 不落盘
```
