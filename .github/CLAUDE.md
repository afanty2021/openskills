[根目录](../../CLAUDE.md) > **.github**

# GitHub 模块

> **模块职责**: 管理 GitHub 相关配置和自动化流程
> **主要语言**: YAML
> **模块类型**: DevOps 配置

## 模块职责

GitHub 模块配置项目的 GitHub 集成，包括：
- CI/CD 自动化流程
- Issue 模板管理
- 贡献指南
- 安全策略
- 社区互动管理

## 入口与启动

### 目录结构
```
.github/
├── workflows/              # GitHub Actions 工作流
│   └── ci.yml             # 持续集成配置
├── ISSUE_TEMPLATE/         # Issue 模板
│   ├── bug_report.md      # Bug 报告模板
│   ├── feature_request.md # 功能请求模板
│   └── config.yml         # 模板配置
├── CONTRIBUTING.md         # 贡献指南
├── SECURITY.md            # 安全政策
└── CLAUDE.md              # 本文档
```

## 对外接口

### CI/CD Pipeline

**触发条件**:
- Push 到 main 分支
- Pull Request 到 main 分支

**执行环境**:
- 运行平台：Ubuntu Latest
- Node.js 版本：20.x, 22.x（矩阵测试）

**流水线步骤**:
1. **代码检出** (`actions/checkout@v4`)
2. **Node.js 设置** (`actions/setup-node@v4`)
3. **依赖安装** (`npm ci`)
4. **类型检查** (`npm run typecheck`)
5. **运行测试** (`npm test`)
6. **构建项目** (`npm run build`)
7. **CLI 测试** (`npm link && openskills --version`)

### Issue 模板

#### Bug Report 模板
**必填字段**:
- Bug 描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息

**可选字段**:
- 附加信息
- 截图
- 相关 Issue

#### Feature Request 模板
**必填字段**:
- 功能描述
- 使用场景
- 提议的解决方案

**可选字段**:
- 替代方案
- 其他信息

## 关键依赖与配置

### GitHub Actions 版本
- `actions/checkout@v4`: 代码检出
- `actions/setup-node@v4`: Node.js 环境设置

### Node.js 支持策略
- **最低版本**: 20.6.0
- **测试版本**: 20.x, 22.x
- **构建目标**: Node.js 18

### 缓存策略
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # 缓存 node_modules
```

## 工作流详细说明

### 优化措施
1. **并行执行**: 多 Node.js 版本并行测试
2. **依赖缓存**: 加速依赖安装
3. **快速失败**: 任何步骤失败立即终止
4. **矩阵测试**: 确保版本兼容性

### 构建验证
```yaml
- name: Test CLI
  run: |
    npm link
    openskills --version
    openskills list || true  # 允许失败（可能无技能）
```

### 质量门禁
- 类型检查必须通过
- 所有测试必须成功
- 构建必须完成
- CLI 基本功能正常

## Issue 管理策略

### 模板配置
```yaml
blank_issues_enabled: true  # 允许空 Issue
contact_links:
  - name: Questions
    url: https://github.com/numman-ali/openskills/discussions
    about: 请使用 Discussions 进行一般性讨论
```

### Issue 标签（建议）
- `bug`: 错误报告
- `enhancement`: 功能增强
- `documentation`: 文档相关
- `good first issue`: 适合新手
- `help wanted`: 需要帮助

### PR 模板（待添加）
建议添加 PULL_REQUEST_TEMPLATE.md：
- 变更描述
- 测试清单
- 破坏性变更说明
- 相关 Issue 链接

## 安全配置

### 依赖扫描
建议添加 Dependabot 配置：
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 安全策略
- 漏洞报告流程
- 保密承诺
- 响应时间保证
- 披露政策

## 社区管理

### 贡献指南要点
1. **代码风格**: 遵循项目配置
2. **提交信息**: 使用约定式提交
3. **测试要求**: 新功能必须有测试
4. **文档更新**: 重要变更需更新文档

### 行为准则
建议添加 CODE_OF_CONDUCT.md：
- 尊重所有参与者
- 包容性语言
- 建设性反馈
- 冲突解决流程

## 发布流程

### 版本管理
- 使用语义化版本（SemVer）
- 自动化版本发布（待实现）
- Changelog 维护

### 发布检查清单
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 标签已创建

## 监控和报告

### CI 状态徽章
在 README.md 中显示：
```markdown
[![CI](https://github.com/numman-ali/openskills/workflows/CI/badge.svg)](https://github.com/numman-ali/openskills/actions)
```

### 测试覆盖率报告
建议集成 Codecov 或类似服务：
- 覆盖率趋势
- Pull Request 覆盖率变化
- 覆盖率目标跟踪

## 扩展配置

### 其他工作流（待实现）
1. **Release Workflow**
   - 自动创建 GitHub Release
   - 发布到 npm
   - 生成 Release Notes

2. **Documentation Workflow**
   - 自动部署文档
   - 示例技能更新
   - API 文档生成

3. **Security Workflow**
   - 依赖安全扫描
   - 代码安全分析
   - 许可证检查

4. **Performance Workflow**
   - 基准测试
   - 性能回归检测
   - 内存泄漏检查

## 最佳实践

### Workflows 最佳实践
1. **使用固定版本**: 避免使用 `@latest`
2. **合理缓存**: 加速构建但不浪费空间
3. **并行执行**: 独立任务并行运行
4. **错误处理**: 提供有意义的错误信息
5. **安全性**: 不暴露敏感信息

### Issue 模板最佳实践
1. **清晰结构**: 逻辑分区
2. **必填标记**: 突出必填项
3. **示例提供**: 帮助用户理解
4. **链接引导**: 指向相关资源

## 故障排除

### 常见 CI 问题
1. **依赖安装失败**
   - 检查 package-lock.json
   - 验证 Node.js 版本
   - 清理缓存重试

2. **测试超时**
   - 优化测试性能
   - 增加超时时间
   - 检查无限循环

3. **构建失败**
   - 检查 TypeScript 错误
   - 验证依赖版本
   - 查看构建日志

### 调试技巧
- 使用 `actions/checkout@v4` 的 `fetch-depth: 0`
- 添加调试输出步骤
- 使用 `continue-on-error: true` 调试
- 查看完整 Actions 日志

## 相关文件清单

### 工作流
- `workflows/ci.yml` - 持续集成配置

### Issue 模板
- `ISSUE_TEMPLATE/bug_report.md` - Bug 报告
- `ISSUE_TEMPLATE/feature_request.md` - 功能请求
- `ISSUE_TEMPLATE/config.yml` - 模板配置

### 文档
- `CONTRIBUTING.md` - 贡献指南
- `SECURITY.md` - 安全政策

## 变更记录 (Changelog)

### 2025-12-07 10:21:32
- ✨ 创建 .github 模块文档
- 🔄 分析现有 CI/CD 配置
- 📋 制定扩展计划
- 🔧 提供故障排除指南

---

*提示：良好的 GitHub 配置能显著提升开发效率和项目质量。*