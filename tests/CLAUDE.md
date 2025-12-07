[根目录](../../CLAUDE.md) > **tests**

# Tests 模块

> **模块职责**: 提供 OpenSkills 项目的单元测试和集成测试
> **主要语言**: TypeScript
> **模块类型**: 测试套件
> **最后更新**: 2025-12-07 10:29:03

## 模块职责

Tests 模块确保 OpenSkills 项目的质量和稳定性，通过自动化测试验证：
- 工具函数的正确性
- CLI 命令的行为
- 错误处理机制
- 跨平台兼容性

## 入口与启动

### 测试框架配置
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
  },
});
```

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 对外接口

### 测试结构
```
tests/
├── utils/              # 工具函数测试
│   ├── dirs.test.ts    # 目录管理测试 ✅
│   └── yaml.test.ts    # YAML 解析测试 ✅
├── commands/           # 命令测试（待添加）❌
├── integration/        # 集成测试（待添加）❌
└── fixtures/           # 测试数据（待添加）❌
```

### 已实现测试

#### utils/dirs.test.ts (38 行)
**测试范围**:
- `getSkillsDir()` 路径生成
- `getSearchDirs()` 优先级顺序
- 跨平台路径处理

**测试用例**:
```typescript
describe('getSkillsDir', () => {
  it('should return global .claude dir by default', () => {
    const dir = getSkillsDir();
    expect(dir).toBe(join(homedir(), '.claude/skills'));
  });

  it('should return project .claude dir when projectLocal is true', () => {
    const dir = getSkillsDir(true);
    expect(dir).toBe(join(process.cwd(), '.claude/skills'));
  });

  it('should return global .agent dir when universal is true', () => {
    const dir = getSkillsDir(false, true);
    expect(dir).toBe(join(homedir(), '.agent/skills'));
  });

  it('should return project .agent dir when both projectLocal and universal are true', () => {
    const dir = getSkillsDir(true, true);
    expect(dir).toBe(join(process.cwd(), '.agent/skills'));
  });
});

describe('getSearchDirs', () => {
  it('should return all 4 dirs in priority order', () => {
    const dirs = getSearchDirs();
    expect(dirs).toHaveLength(4);
    expect(dirs[0]).toBe(join(process.cwd(), '.agent/skills'));   // 1. Project universal
    expect(dirs[1]).toBe(join(homedir(), '.agent/skills'));        // 2. Global universal
    expect(dirs[2]).toBe(join(process.cwd(), '.claude/skills'));  // 3. Project claude
    expect(dirs[3]).toBe(join(homedir(), '.claude/skills'));       // 4. Global claude
  });
});
```

#### utils/yaml.test.ts (55 行)
**测试范围**:
- `hasValidFrontmatter()` 检测
- `extractYamlField()` 解析
- 边界情况处理

**测试用例**:
```typescript
describe('extractYamlField', () => {
  it('should extract field from YAML frontmatter', () => {
    const content = `---
name: test-skill
description: Test description
---

Content`;

    expect(extractYamlField(content, 'name')).toBe('test-skill');
    expect(extractYamlField(content, 'description')).toBe('Test description');
  });

  it('should return empty string if field not found', () => {
    const content = `---
name: test-skill
---`;

    expect(extractYamlField(content, 'missing')).toBe('');
  });

  it('should handle multiline descriptions', () => {
    const content = `---
name: test
description: First line
---`;

    expect(extractYamlField(content, 'description')).toBe('First line');
  });
});

describe('hasValidFrontmatter', () => {
  it('should return true for valid frontmatter', () => {
    const content = `---
name: test
---

Content`;

    expect(hasValidFrontmatter(content)).toBe(true);
  });

  it('should return false for missing frontmatter', () => {
    const content = 'No frontmatter here';
    expect(hasValidFrontmatter(content)).toBe(false);
  });

  it('should return false for empty content', () => {
    expect(hasValidFrontmatter('')).toBe(false);
  });
});
```

### 待实现测试

#### commands/ 目录测试（优先级：高）
需要为每个命令创建测试文件：
- `install.test.ts` - 技能安装流程测试
- `list.test.ts` - 技能列表显示测试
- `read.test.ts` - 技能读取测试
- `sync.test.ts` - AGENTS.md 同步测试
- `manage.test.ts` - 交互式管理测试
- `remove.test.ts` - 技能删除测试

**测试覆盖点**:
```typescript
describe('install command', () => {
  it('should parse GitHub URLs correctly');
  it('should handle invalid source format');
  it('should clone repository to temp dir');
  it('should install specific skill from subpath');
  it('should handle interactive selection');
  it('should warn about conflicts');
  it('should cleanup temp directory');
});
```

#### utils/skills.ts 测试（优先级：高）
```typescript
describe('skills utils', () => {
  it('should find all skills with deduplication');
  it('should respect directory priority');
  it('should find specific skill by name');
  it('should handle missing skills');
  it('should parse skill metadata');
});
```

#### utils/agents-md.ts 测试（优先级：高）
```typescript
describe('agents-md utils', () => {
  it('should generate valid XML format');
  it('should parse existing skills');
  it('should replace skills section');
  it('should remove skills section');
  it('should handle empty AGENTS.md');
  it('should preserve other content');
});
```

## 关键依赖与配置

### 测试框架
- **Vitest**: 现代化测试运行器
  - 零配置 TypeScript 支持
  - 内置覆盖率报告
  - 监听模式
  - 并行执行

### 测试工具
- **Node.js 内置**:
  - `fs` - 文件系统操作
  - `path` - 路径处理
  - `os` - 系统信息

### Mock 策略
- 文件系统操作使用内存文件系统
- Git 命令使用 exec spy
- 用户输入使用模拟数据

## 测试策略

### 单元测试
**目标**: 验证独立函数的正确性
**覆盖范围**:
- utils/ 目录下所有工具函数
- 边界条件和错误情况
- 类型安全验证

### 集成测试
**目标**: 验证模块间协作
**待实现**:
- CLI 命令完整流程
- 技能安装和管理
- AGENTS.md 同步

**示例测试用例**:
```typescript
describe('skill installation workflow', () => {
  it('should install skill from GitHub and sync to AGENTS.md', async () => {
    // 1. Mock GitHub repository
    // 2. Run install command
    // 3. Verify files copied
    // 4. Run sync command
    // 5. Verify AGENTS.md updated
  });
});
```

### E2E 测试
**目标**: 验证端到端用户场景
**待实现**:
- 完整工作流测试
- 真实文件系统操作
- 错误恢复场景

## 测试覆盖率目标

### 当前覆盖率
- **utils/dirs.ts**: 100% ✅
- **utils/yaml.ts**: 90%+ ✅
- **整体目标**: 98% 🎯

### 覆盖缺口分析
```
模块                 当前覆盖率   目标覆盖率   状态
-----------------------------------------------
src/commands/        0%          95%          ❌ 严重缺口
src/utils/skills.ts  0%          95%          ❌ 严重缺口
src/utils/agents-md.ts 0%        95%          ❌ 严重缺口
src/cli.ts           0%          90%          ❌ 未覆盖
src/types.ts         N/A         N/A          ✅ 类型定义
```

### 提升计划
1. **第一阶段**（1周）:
   - 完成 utils/skills.ts 测试
   - 完成 utils/agents-md.ts 测试
   - 预期提升：+20% 覆盖率

2. **第二阶段**（2周）:
   - 完成所有 commands 测试
   - 添加 cli.ts 基础测试
   - 预期提升：+35% 覆盖率

3. **第三阶段**（1周）:
   - 添加集成测试
   - 修复边缘用例
   - 预期提升：+10% 覆盖率

## 测试环境配置

### Node.js 版本
- **测试范围**: Node.js 20.x, 22.x
- **CI 配置**: GitHub Actions 矩阵测试
- **最低要求**: Node.js 20.6.0

### 平台兼容性
- **Linux**: CI 主要环境 ✅
- **macOS**: 开发环境 ✅
- **Windows**: 待测试支持 ❌

### 环境变量
测试使用环境变量：
```bash
NODE_ENV=test          # 测试环境标识
OPENSKILLS_TEST=1     # 启用测试模式
```

## 测试数据管理

### Fixtures 结构（计划）
```
tests/fixtures/
├── skills/            # 测试技能
│   ├── valid/         # 有效技能示例
│   │   ├── simple/    # 简单技能
│   │   ├── complex/   # 复杂技能
│   │   └── nested/    # 嵌套资源
│   └── invalid/       # 无效技能示例
│       ├── no-yaml/   # 无前置元数据
│       └── malformed/ # 格式错误
├── agents-md/         # AGENTS.md 样例
│   ├── empty.md       # 空文件
│   ├── with-skills.md # 包含技能
│   └── mixed.md       # 混合内容
└── repos/             # 模拟仓库
    ├── single-skill/  # 单技能
    └── multi-skill/   # 多技能
```

### 测试隔离
- 使用临时目录
- 测试后自动清理
- 避免副作用残留

## 性能测试

### 基准测试（计划）
- 技能扫描性能
- 大型仓库处理
- 并发操作测试

### 内存泄漏检测
- 监控文件描述符
- 检查临时文件清理
- 验证进程退出

## 调试和故障排除

### 调试命令
```bash
# 单个测试文件
npx vitest tests/utils/dirs.test.ts

# 调试模式
npx vitest --inspect-brk

# 详细输出
npx vitest --reporter=verbose

# 仅运行覆盖率
npx vitest run --coverage
```

### 常见问题
1. **权限错误**: 检查文件系统权限
2. **路径问题**: 使用跨平台路径处理
3. **异步问题**: 正确处理 Promise
4. **Mock 失败**: 验证 Mock 配置

## 持续集成

### GitHub Actions 配置
```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]

steps:
  - name: Run type check
    run: npm run typecheck
  - name: Run tests
    run: npm test
  - name: Build
    run: npm run build
  - name: Test CLI
    run: npm link && openskills --version
```

### 质量门禁
- 类型检查必须通过
- 测试覆盖率 > 95%
- 构建必须成功
- CLI 基本功能验证

## 未来规划

### 短期目标（1-2 周）
- [x] 分析现有测试覆盖
- [ ] 完成 commands/ 目录测试
- [ ] 添加 utils/skills.ts 测试
- [ ] 实现基础集成测试
- [ ] 提升整体覆盖率至 80%

### 中期目标（1 月）
- [ ] 实现完整 E2E 测试
- [ ] 添加性能基准测试
- [ ] Windows 平台支持
- [ ] 错误场景全覆盖
- [ ] 达到 95% 覆盖率

### 长期目标（3 月）
- [ ] 自动化测试报告
- [ ] 测试驱动开发流程
- [ ] 社区贡献测试指南
- [ ] 性能回归检测
- [ ] 达到 98% 覆盖率

## 相关文件清单

### 测试文件
- `utils/dirs.test.ts` - 目录管理测试 ✅ (38 行)
- `utils/yaml.test.ts` - YAML 解析测试 ✅ (55 行)

### 配置文件
- `../vitest.config.ts` - Vitest 配置 (20 行)
- `../package.json` - 测试脚本

### CI 配置
- `../.github/workflows/ci.yml` - CI 工作流

## 变更记录 (Changelog)

### 2025-12-07 10:29:03 - 深度补捞更新
- 📊 详细分析了测试覆盖率缺口
- 📋 制定了分阶段的测试提升计划
- 🎯 明确了待实现的测试用例
- 💡 提供了测试策略和最佳实践
- 📈 更新了覆盖率目标从 80% 到 98%

### 2025-12-07 10:21:32
- ✨ 创建 tests 模块文档
- 📊 分析当前测试覆盖率
- 🎯 制定覆盖率提升计划
- 🔧 配置测试环境和 CI 流程

---

*提示：测试是保证软件质量的关键，建议遵循 TDD 原则开发新功能。当前覆盖率严重不足，需要优先补充测试用例。*