# OpenSkills API 参考文档

> 版本：1.2.1
> 更新时间：2025-12-07

## 核心 API

### findAllSkills()

查找所有已安装的技能，按优先级去重。

```typescript
function findAllSkills(): Skill[]
```

**返回值**：`Skill[]` - 技能对象数组

**示例**：
```typescript
import { findAllSkills } from './src/utils/skills.js';

const skills = findAllSkills();
console.log(`Found ${skills.length} skills`);

skills.forEach(skill => {
  console.log(`${skill.name}: ${skill.description} (${skill.location})`);
});
```

**行为说明**：
1. 按照以下优先级顺序扫描目录：
   - 当前项目/.agent/skills
   - 用户主目录/.agent/skills
   - 当前项目/.claude/skills
   - 用户主目录/.claude/skills
2. 使用 Set 数据结构去重，保留优先级最高的实例
3. 只包含存在 `SKILL.md` 文件的目录
4. 自动解析 YAML 前置元数据中的 description

### findSkill(skillName)

查找指定名称的单个技能。

```typescript
function findSkill(skillName: string): SkillLocation | null
```

**参数**：
- `skillName: string` - 技能名称

**返回值**：`SkillLocation | null`

```typescript
interface SkillLocation {
  path: string;     // SKILL.md 文件的完整路径
  baseDir: string;  // 技能目录的完整路径
  source: string;   // 技能来源目录
}
```

**示例**：
```typescript
import { findSkill } from './src/utils/skills.js';

const skill = findSkill('my-skill');
if (skill) {
  console.log(`Found at: ${skill.path}`);
  console.log(`Base directory: ${skill.baseDir}`);
} else {
  console.log('Skill not found');
}
```

## 目录管理 API

### getSkillsDir()

获取技能安装目录路径。

```typescript
function getSkillsDir(projectLocal: boolean = false, universal: boolean = false): string
```

**参数**：
- `projectLocal: boolean` - 是否使用项目级目录（默认：false）
- `universal: boolean` - 是否使用 .agent 目录（默认：false）

**返回值**：`string` - 目录路径

**示例**：
```typescript
import { getSkillsDir } from './src/utils/dirs.js';

// 默认：全局 Claude 技能目录
console.log(getSkillsDir()); // ~/.claude/skills

// 项目级 Claude 技能目录
console.log(getSkillsDir(true)); // ./project/.claude/skills

// 全局 Universal 技能目录
console.log(getSkillsDir(false, true)); // ~/.agent/skills

// 项目级 Universal 技能目录
console.log(getSkillsDir(true, true)); // ./project/.agent/skills
```

### getSearchDirs()

获取按优先级排序的搜索目录列表。

```typescript
function getSearchDirs(): string[]
```

**返回值**：`string[]` - 目录路径数组（按优先级排序）

**示例**：
```typescript
import { getSearchDirs } from './src/utils/dirs.js';

const dirs = getSearchDirs();
// [
//   /path/to/project/.agent/skills,      // 1. 项目 Universal
//   /home/user/.agent/skills,            // 2. 全局 Universal
//   /path/to/project/.claude/skills,     // 3. 项目 Claude
//   /home/user/.claude/skills            // 4. 全局 Claude
// ]
```

## YAML 解析 API

### hasValidFrontmatter()

检查文件内容是否包含有效的 YAML 前置元数据。

```typescript
function hasValidFrontmatter(content: string): boolean
```

**参数**：
- `content: string` - 文件内容

**返回值**：`boolean`

**示例**：
```typescript
import { hasValidFrontmatter } from './src/utils/yaml.js';

const content = `---
name: test-skill
description: A test skill
---

# Skill content`;

const isValid = hasValidFrontmatter(content);
console.log(isValid); // true
```

### extractYamlField()

从 YAML 前置元数据中提取指定字段的值。

```typescript
function extractYamlField(content: string, field: string): string
```

**参数**：
- `content: string` - 文件内容
- `field: string` - 要提取的字段名

**返回值**：`string` - 字段值（解析失败返回空字符串）

**示例**：
```typescript
import { extractYamlField } from './src/utils/yaml.js';

const content = `---
name: my-skill
description: |
  Multi-line
  description
version: 1.0.0
---

# Skill`;

const name = extractYamlField(content, 'name');
console.log(name); // 'my-skill'

const description = extractYamlField(content, 'description');
console.log(description); // 'Multi-line\ndescription'
```

## AGENTS.md 操作 API

### generateSkillsXml()

生成包含技能列表的 XML 格式内容。

```typescript
function generateSkillsXml(skills: Skill[]): string
```

**参数**：
- `skills: Skill[]` - 技能数组

**返回值**：`string` - XML 格式的技能内容

**生成的 XML 结构**：
```xml
<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks...
</usage>

<available_skills>

<skill>
<name>skill-name</name>
<description>Skill description</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
```

**示例**：
```typescript
import { generateSkillsXml, findAllSkills } from './src/utils/index.js';

const skills = findAllSkills();
const xml = generateSkillsXml(skills);
console.log(xml); // XML 格式的技能列表
```

### parseCurrentSkills()

从 AGENTS.md 内容中解析当前安装的技能名称列表。

```typescript
function parseCurrentSkills(content: string): string[]
```

**参数**：
- `content: string` - AGENTS.md 文件内容

**返回值**：`string[]` - 技能名称数组

**示例**：
```typescript
import { parseCurrentSkills } from './src/utils/agents-md.js';
import { readFileSync } from 'fs';

const agentsMdContent = readFileSync('AGENTS.md', 'utf-8');
const currentSkills = parseCurrentSkills(agentsMdContent);
console.log(currentSkills); // ['skill-1', 'skill-2', 'skill-3']
```

### replaceSkillsSection()

替换或添加 AGENTS.md 中的技能部分。

```typescript
function replaceSkillsSection(content: string, newSection: string): string
```

**参数**：
- `content: string` - 原始 AGENTS.md 内容
- `newSection: string` - 新的技能部分内容

**返回值**：`string` - 更新后的内容

**替换策略**：
1. 优先查找 `<skills_system>...</skills_system>` 标签
2. 降级到 `<!-- SKILLS_TABLE_START -->...<!-- SKILLS_TABLE_END -->` 注释
3. 如果都不存在，追加到文件末尾

**示例**：
```typescript
import { replaceSkillsSection, generateSkillsXml } from './src/utils/agents-md.js';

const originalContent = readFileSync('AGENTS.md', 'utf-8');
const newXml = generateSkillsXml(skills);
const updatedContent = replaceSkillsSection(originalContent, newXml);
writeFileSync('AGENTS.md', updatedContent);
```

### removeSkillsSection()

从 AGENTS.md 中移除技能部分。

```typescript
function removeSkillsSection(content: string): string
```

**参数**：
- `content: string` - AGENTS.md 文件内容

**返回值**：`string` - 移除技能部分后的内容

**示例**：
```typescript
import { removeSkillsSection } from './src/utils/agents-md.js';

const content = readFileSync('AGENTS.md', 'utf-8');
const cleanedContent = removeSkillsSection(content);
writeFileSync('AGENTS.md', cleanedContent);
```

## CLI 命令 API

### listSkills()

列出所有已安装的技能。

```typescript
function listSkills(): void
```

**行为**：
- 扫描所有技能目录
- 按名称排序输出
- 显示技能名称、描述和位置
- 如果没有技能，显示友好的消息

### installSkill(source, options)

从源安装技能。

```typescript
function installSkill(source: string, options: InstallOptions): void
```

**参数**：
```typescript
interface InstallOptions {
  global?: boolean;      // 是否全局安装
  universal?: boolean;   // 是否使用 .agent 目录
  yes?: boolean;         // 是否跳过交互式选择
}
```

**支持的路源类型**：
1. 本地文件系统路径
2. GitHub 仓库 URL
3. Git 仓库 URL（其他平台）

**示例**：
```typescript
import { installSkill } from './src/commands/install.js';

// 本地安装
installSkill('/path/to/skill', { projectLocal: true });

// GitHub 安装
installSkill('username/repo', { global: true });

// Universal 安装，跳过交互
installSkill('username/repo', { universal: true, yes: true });
```

### readSkill(skillName)

读取并输出技能内容。

```typescript
function readSkill(skillName: string): void
```

**输出格式**：
1. 技能完整内容
2. 技能基础目录路径
3. 用于解析相对路径

### syncAgentsMd()

同步已安装技能到 AGENTS.md。

```typescript
function syncAgentsMd(options: SyncOptions): void
```

**参数**：
```typescript
interface SyncOptions {
  yes?: boolean;  // 是否跳过交互式选择
}
```

**流程**：
1. 读取当前 AGENTS.md
2. 解析已安装技能
3. 显示交互式选择（除非指定 -y）
4. 生成新的 XML
5. 更新 AGENTS.md

## 类型定义

### Skill

```typescript
interface Skill {
  name: string;                    // 技能名称
  description: string;             // 技能描述
  location: 'project' | 'global';  // 安装位置
  path: string;                    // 技能目录路径
}
```

### SkillLocation

```typescript
interface SkillLocation {
  path: string;     // SKILL.md 文件路径
  baseDir: string;  // 技能基础目录
  source: string;   // 来源目录
}
```

### SkillMetadata

```typescript
interface SkillMetadata {
  name: string;        // 技能名称
  description: string; // 技能描述
  context?: string;    // 额外上下文
}
```

### InstallOptions

```typescript
interface InstallOptions {
  global?: boolean;      // 全局安装
  universal?: boolean;   // .agent 目录安装
  yes?: boolean;         // 跳过交互
}
```

## 错误处理

### 错误类型

```typescript
// 技能未找到
class SkillNotFoundError extends Error {
  constructor(skillName: string) {
    super(`Skill not found: ${skillName}`);
    this.name = 'SkillNotFoundError';
  }
}

// 安装失败
class InstallationError extends Error {
  constructor(source: string, reason: string) {
    super(`Failed to install from ${source}: ${reason}`);
    this.name = 'InstallationError';
  }
}

// 权限错误
class PermissionError extends Error {
  constructor(path: string) {
    super(`Permission denied: ${path}`);
    this.name = 'PermissionError';
  }
}
```

### 错误处理最佳实践

```typescript
import { findSkill } from './src/utils/skills.js';

try {
  const skill = findSkill('my-skill');
  if (!skill) {
    throw new SkillNotFoundError('my-skill');
  }
  // 使用技能...
} catch (error) {
  if (error instanceof SkillNotFoundError) {
    console.error('Skill not found. Available skills:');
    // 显示可用技能列表
  } else if (error instanceof PermissionError) {
    console.error('Permission denied. Try running with elevated privileges.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## 扩展 API

### 技能验证

```typescript
// 验证技能结构
function validateSkill(skillPath: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [] };

  // 检查 SKILL.md 存在
  if (!existsSync(join(skillPath, 'SKILL.md'))) {
    result.valid = false;
    result.errors.push('SKILL.md not found');
  }

  // 检查 YAML 格式
  const content = readFileSync(join(skillPath, 'SKILL.md'), 'utf-8');
  if (!hasValidFrontmatter(content)) {
    result.valid = false;
    result.errors.push('Invalid YAML frontmatter');
  }

  return result;
}
```

### 技能依赖解析

```typescript
// 解析技能依赖
function resolveDependencies(skill: Skill): Dependency[] {
  const content = readFileSync(join(skill.path, 'SKILL.md'), 'utf-8');
  const dependencies = extractYamlField(content, 'dependencies');

  if (!dependencies) return [];

  return dependencies.split(',').map(dep => ({
    name: dep.trim(),
    version: 'any', // TODO: 解析版本约束
  }));
}
```

### 技能搜索

```typescript
// 搜索技能
function searchSkills(query: string): Skill[] {
  const allSkills = findAllSkills();

  return allSkills.filter(skill => {
    const searchText = `${skill.name} ${skill.description}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
}
```

## 性能优化 API

### 缓存管理

```typescript
// 技能缓存
class SkillCache {
  private cache = new Map<string, Skill[]>();
  private ttl = 5000; // 5秒

  get(key: string): Skill[] | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    const [skills, timestamp] = item;
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return skills;
  }

  set(key: string, skills: Skill[]): void {
    this.cache.set(key, [skills, Date.now()]);
  }
}
```

### 并行处理

```typescript
// 并行技能扫描
async function findAllSkillsParallel(): Promise<Skill[]> {
  const dirs = getSearchDirs();
  const results = await Promise.all(
    dirs.map(dir => scanDirectory(dir))
  );

  return mergeResults(results);
}
```

---

*API 文档会持续更新，最新版本请查看项目的 GitHub 仓库。*