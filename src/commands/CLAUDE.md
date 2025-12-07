[根目录](../../../CLAUDE.md) > [src](../../) > **commands**

# Commands 模块

> **模块职责**: 实现 OpenSkills CLI 的所有命令功能
> **主要语言**: TypeScript
> **模块类型**: 命令处理层
> **最后更新**: 2025-12-07 10:29:03

## 模块职责

Commands 模块负责处理所有用户输入的 CLI 命令，包括技能安装、管理、同步等功能。每个命令都是独立的模块，通过 Commander.js 框架注册到主 CLI。

## 入口与启动

### 命令注册流程
1. **主入口**: `src/cli.ts` 导入所有命令模块
2. **命令定义**: 每个命令通过 `program.command()` 注册
3. **参数解析**: Commander.js 处理命令行参数和选项
4. **执行分发**: 调用对应命令模块的处理函数

### 命令列表
- `install` - 安装技能
- `list` - 列出已安装技能
- `read` - 读取技能内容
- `sync` - 同步到 AGENTS.md
- `manage` - 交互式管理技能
- `remove` - 删除特定技能

## 对外接口

### install.ts
**功能**: 从 GitHub 仓库安装技能
```typescript
export async function installSkill(source: string, options: InstallOptions): Promise<void>
```

**主要流程**:
1. 解析源 URL（支持 owner/repo 格式）
2. 确定安装目录（.claude/skills 或 .agent/skills）
3. 克隆仓库到临时目录
4. 交互式选择要安装的技能
5. 复制技能文件到目标目录
6. 清理临时文件

**选项参数**:
- `--global`: 全局安装到 `~/`
- `--universal`: 安装到 `.agent/skills/`
- `--yes`: 跳过交互选择，安装所有技能

**错误处理模式**:
```typescript
// 输入验证
if (parts.length < 2) {
  console.error(chalk.red('Error: Invalid source format'));
  process.exit(1);
}

// 文件验证
if (!existsSync(skillMdPath)) {
  console.error(chalk.red(`Error: SKILL.md not found`));
  process.exit(1);
}

// 用户取消处理
try {
  const selected = await checkbox({...});
} catch (error) {
  if (error instanceof ExitPromptError) {
    console.log(chalk.yellow('\n\nCancelled by user'));
    process.exit(0);
  }
  throw error;
}
```

### sync.ts
**功能**: 将已安装技能同步到 AGENTS.md
```typescript
export async function syncAgentsMd(options: SyncOptions = {}): Promise<void>
```

**主要流程**:
1. 检查 AGENTS.md 是否存在
2. 扫描所有已安装技能
3. 解析当前 AGENTS.md 中的技能
4. 交互式选择要同步的技能
5. 生成 `<available_skills>` XML
6. 更新 AGENTS.md 文件

**错误处理模式**:
- 无 AGENTS.md 时友好提示
- 解析失败时优雅降级
- 用户取消时正确退出

### list.ts
**功能**: 列出所有已安装的技能
```typescript
export function listSkills(): void
```

**输出格式**:
- 技能名称
- 描述信息
- 安装位置（project/global）
- 技能路径

**错误处理模式**:
- 无技能时提供安装提示
- 保持简洁的输出格式

### read.ts
**功能**: 输出技能内容到 stdout（供 AI 代理使用）
```typescript
export function readSkill(skillName: string): void
```

**输出格式**:
```
Reading: <skill-name>
Base directory: <skill-path>

[SKILL.md content]
```

**错误处理模式**:
```typescript
if (!skill) {
  console.error(`Error: Skill '${skillName}' not found`);
  console.error('\nSearched:');
  console.error('  .agent/skills/ (project universal)');
  console.error('  ~/.agent/skills/ (global universal)');
  console.error('  .claude/skills/ (project)');
  console.error('  ~/.claude/skills/ (global)');
  process.exit(1);
}
```

### manage.ts
**功能**: 交互式管理（删除）已安装技能
```typescript
export async function manageSkills(): Promise<void>
```

**错误处理模式**:
- 无技能时简单返回
- 处理 ExitPromptError
- 删除操作使用 rmSync 确保清理

### remove.ts
**功能**: 删除指定技能（非交互式）
```typescript
export function removeSkill(skillName: string): void
```

**错误处理模式**:
- 快速失败：技能不存在时立即退出
- 使用 rmSync 递归删除
- 提供清晰的位置信息

## 关键依赖与配置

### 外部依赖
- **@inquirer/prompts**: 交互式 TUI 组件
  - `checkbox`: 多选列表
  - `confirm`: 确认对话框
- **chalk**: 终端颜色输出
- **ora**: 加载动画
- **child_process**: 执行 Git 命令
- **fs/promises**: 文件系统操作

### 内部依赖
- `../types.ts`: 类型定义
- `../utils/skills.ts`: 技能查找工具
- `../utils/dirs.ts`: 目录路径工具
- `../utils/yaml.ts`: YAML 解析工具
- `../utils/agents-md.ts`: AGENTS.md 操作工具
- `../utils/marketplace-skills.ts`: 市场技能列表

## 数据模型

### InstallOptions
```typescript
interface InstallOptions {
  global?: boolean;    // 全局安装
  universal?: boolean; // 通用模式
  yes?: boolean;       // 跳过交互
}
```

### SyncOptions
```typescript
interface SyncOptions {
  yes?: boolean;  // 跳过交互选择
}
```

### Skill
```typescript
interface Skill {
  name: string;
  description: string;
  location: 'project' | 'global';
  path: string;
}
```

## 错误处理策略

### 统一错误处理模式
1. **输入验证**: 早期验证，快速失败
2. **用户友好**: 提供清晰的错误信息
3. **优雅退出**: 使用 process.exit() 并返回适当的退出码
4. **交互取消**: 捕获 ExitPromptError 并优雅处理

### 退出码约定
- `0`: 成功或用户取消
- `1`: 错误（无效输入、文件不存在等）

### 错误信息格式
```typescript
// 使用 chalk 着色
console.error(chalk.red('Error: Clear description'));

// 提供上下文
console.error('\nSearched:');
console.error('  Location 1');
console.error('  Location 2');

// 给出建议
console.error('\nInstall skills: openskills install owner/repo');
```

## 测试与质量

### 测试策略
1. **单元测试**: 测试每个命令的核心逻辑
2. **集成测试**: 测试命令间的交互
3. **Mock 测试**: 使用 mock 避免实际文件系统操作
4. **错误处理**: 测试各种错误场景

### 测试覆盖点（待实现）
- 命令参数解析
- 交互式选择流程
- 文件系统操作
- 错误处理和用户反馈
- Git 命令执行

### 质量保证
- 使用 TypeScript 进行类型检查
- 遵循统一的错误处理模式
- 提供清晰的用户反馈信息
- 支持脚本化操作（-y 标志）

## 常见问题 (FAQ)

### Q: 如何安装私有仓库的技能？
A: 直接使用完整的 HTTPS 或 SSH URL：
```bash
openskills install https://github.com/owner/private-repo
```

### Q: 技能安装失败怎么办？
A: 检查以下几点：
- 网络连接是否正常
- Git 是否已安装
- 仓库是否包含 SKILL.md 文件
- 是否有足够的权限

### Q: 如何更新已安装的技能？
A: 目前需要先删除再重新安装：
```bash
openskills remove skill-name
openskills install owner/repo
```

### Q: --universal 标志的作用？
A: 将技能安装到 `.agent/skills/` 而不是 `.claude/skills/`，这样：
- 避免与 Claude Code 原生插件冲突
- 支持多代理共享同一 AGENTS.md
- 保持 `.claude/` 目录仅用于 Claude Code

### Q: sync 命令如何处理已存在的 AGENTS.md？
A: sync 命令会：
1. 解析现有的技能列表
2. 预选当前已同步的技能
3. 允许用户修改选择
4. 更新时保留其他内容不变

## 相关文件清单

### 核心文件
- `install.ts` - 技能安装实现 (310 行)
- `sync.ts` - AGENTS.md 同步实现 (94 行)
- `list.ts` - 技能列表显示 (44 行)
- `read.ts` - 技能内容读取 (31 行)
- `manage.ts` - 交互式管理 (63 行)
- `remove.ts` - 技能删除 (22 行)

### 引用工具
- `../utils/skills.ts` - 技能查找和解析
- `../utils/dirs.ts` - 目录路径管理
- `../utils/agents-md.ts` - AGENTS.md 操作
- `../utils/yaml.ts` - YAML 解析

## 变更记录 (Changelog)

### 2025-12-07 10:29:03 - 深度补捞更新
- 🔍 详细分析了所有命令文件的实现
- 📝 补充了完整的错误处理模式文档
- 🎯 明确了测试覆盖缺口
- 📊 更新了代码行数统计
- ⚠️ 添加了常见问题解答

### 2025-12-07 10:21:32
- ✨ 创建 commands 模块文档
- 📋 详细说明每个命令的功能和接口
- 🔗 建立模块间依赖关系图
- 💡 添加常见问题解答

---

*提示：此模块负责处理所有 CLI 命令，是用户交互的核心层。错误处理模式的一致性对用户体验至关重要。*