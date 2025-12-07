import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';

describe('CLI 端到端测试', () => {
  const tempDir = join(tmpdir(), 'openskills-e2e-' + Date.now());
  const cliPath = join(__dirname, '../../dist/cli.js');
  let cliProcess: any;

  beforeEach(async () => {
    // 创建临时测试目录
    mkdirSync(tempDir, { recursive: true });

    // 创建测试用的技能仓库（模拟）
    const skillRepoDir = join(tempDir, 'test-repo');
    mkdirSync(skillRepoDir, { recursive: true });

    const skillContent = `---
name: e2e-test-skill
description: End-to-end test skill
version: 1.0.0
author: Test Author
tags: test, e2e
---

# E2E Test Skill

This is a test skill for end-to-end testing.

## Usage

1. Run this command
2. Expect this output
3. Verify the result

## Files

- \`reference.md\` - Additional documentation
- \`script.js\` - Helper script`;

    writeFileSync(join(skillRepoDir, 'SKILL.md'), skillContent);

    // 创建 AGENTS.md
    const agentsMdContent = `# AGENTS.md

Project-specific AI context.

<skills_system priority="1">
<available_skills>
<skill><name>existing-skill</name><description>Already installed skill</description><location>project</location></skill>
</available_skills>
</skills_system>`;

    writeFileSync(join(tempDir, 'AGENTS.md'), agentsMdContent);
  });

  afterEach(() => {
    // 清理临时目录
    if (existsSync(tempDir)) {
      require('fs').rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const runCommand = (args: string[], cwd: string = tempDir): Promise<{
    code: number;
    stdout: string;
    stderr: string;
  }> => {
    return new Promise((resolve) => {
      const child = spawn('node', [cliPath, ...args], {
        cwd,
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code: code || 0, stdout, stderr });
      });
    });
  };

  describe('openskills list', () => {
    it('应该列出已安装的技能', async () => {
      const result = await runCommand(['list']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('existing-skill');
    });

    it('应该显示空列表当没有技能时', async () => {
      // 移除 AGENTS.md 中的技能
      writeFileSync(join(tempDir, 'AGENTS.md'), '# AGENTS.md\nNo skills here.');

      const result = await runCommand(['list']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('No skills installed');
    });
  });

  describe('openskills install', () => {
    it('应该从本地路径安装技能', async () => {
      const skillPath = join(tempDir, 'test-repo');

      const result = await runCommand(['install', skillPath, '-y']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Installing skill from');

      // 验证技能已安装
      const installedPath = join(tempDir, '.claude/skills/e2e-test-skill');
      expect(existsSync(installedPath)).toBe(true);
      expect(existsSync(join(installedPath, 'SKILL.md'))).toBe(true);
    });

    it('应该支持全局安装', async () => {
      const skillPath = join(tempDir, 'test-repo');
      const globalDir = join(tempDir, 'global-home');
      mkdirSync(globalDir, { recursive: true });

      const result = await runCommand(['install', skillPath, '-g', '-y'], tempDir, {
        ...process.env,
        HOME: globalDir,
      });

      expect(result.code).toBe(0);

      // 验证安装在全局目录
      const installedPath = join(globalDir, '.claude/skills/e2e-test-skill');
      expect(existsSync(installedPath)).toBe(true);
    });

    it('应该支持 universal 安装', async () => {
      const skillPath = join(tempDir, 'test-repo');

      const result = await runCommand(['install', skillPath, '-u', '-y']);

      expect(result.code).toBe(0);

      // 验证安装在 .agent 目录
      const installedPath = join(tempDir, '.agent/skills/e2e-test-skill');
      expect(existsSync(installedPath)).toBe(true);
    });

    it('应该检测技能冲突', async () => {
      // 安装第一个技能
      const skillPath = join(tempDir, 'test-repo');
      await runCommand(['install', skillPath, '-y']);

      // 尝试再次安装同名技能
      const result = await runCommand(['install', skillPath, '-y']);

      expect(result.stdout).toContain('already exists');
    });
  });

  describe('openskills read', () => {
    beforeEach(async () => {
      // 先安装测试技能
      const skillPath = join(tempDir, 'test-repo');
      await runCommand(['install', skillPath, '-y']);
    });

    it('应该读取并输出技能内容', async () => {
      const result = await runCommand(['read', 'e2e-test-skill']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('# E2E Test Skill');
      expect(result.stdout).toContain('This is a test skill');
      expect(result.stdout).toContain('Base directory:');
    });

    it('应该处理不存在的技能', async () => {
      const result = await runCommand(['read', 'non-existent-skill']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Skill not found');
    });
  });

  describe('openskills sync', () => {
    beforeEach(async () => {
      // 安装多个技能
      const skillPath = join(tempDir, 'test-repo');
      await runCommand(['install', skillPath, '-y']);
    });

    it('应该同步技能到 AGENTS.md', async () => {
      const result = await runCommand(['sync', '-y']);

      expect(result.code).toBe(0);

      // 验证 AGENTS.md 已更新
      const agentsMd = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(agentsMd).toContain('e2e-test-skill');
      expect(agentsMd).toContain('End-to-end test skill');
    });

    it('应该保留其他 AGENTS.md 内容', async () => {
      const originalContent = `# AGENTS.md

Project-specific instructions.

## Important Rules

1. Rule 1
2. Rule 2

<skills_system>
<available_skills>
<skill><name>old-skill</name></skill>
</available_skills>
</skills_system>

## Additional Context

More context here.`;

      writeFileSync(join(tempDir, 'AGENTS.md'), originalContent);

      await runCommand(['sync', '-y']);

      const updatedContent = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(updatedContent).toContain('Project-specific instructions');
      expect(updatedContent).toContain('Important Rules');
      expect(updatedContent).toContain('Additional Context');
    });
  });

  describe('openskills manage', () => {
    beforeEach(async () => {
      // 安装多个技能
      const skillPath = join(tempDir, 'test-repo');
      await runCommand(['install', skillPath, '-y']);
    });

    it('应该进入交互式管理模式', async () => {
      // 这个测试需要模拟用户输入
      // 在实际 CI 环境中可能需要特殊处理
      const result = await runCommand(['manage']);

      // 应该显示技能列表
      expect(result.stdout).toContain('e2e-test-skill');
      expect(result.stdout).toContain('existing-skill');
    });
  });

  describe('openskills remove', () => {
    beforeEach(async () => {
      // 安装测试技能
      const skillPath = join(tempDir, 'test-repo');
      await runCommand(['install', skillPath, '-y']);
    });

    it('应该移除指定的技能', async () => {
      const result = await runCommand(['remove', 'e2e-test-skill']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Successfully removed');

      // 验证技能已删除
      const installedPath = join(tempDir, '.claude/skills/e2e-test-skill');
      expect(existsSync(installedPath)).toBe(false);
    });

    it('应该处理不存在的技能', async () => {
      const result = await runCommand(['remove', 'non-existent-skill']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('not found');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的命令', async () => {
      const result = await runCommand(['invalid-command']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Unknown command');
    });

    it('应该处理缺失的参数', async () => {
      const result = await runCommand(['install']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('missing');
    });

    it('应该处理无效的技能源', async () => {
      const result = await runCommand(['install', '/invalid/path', '-y']);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('not found');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成大量技能操作', async () => {
      // 创建多个技能
      const skillCount = 10;
      const skillPaths: string[] = [];

      for (let i = 0; i < skillCount; i++) {
        const skillDir = join(tempDir, `skill-${i}`);
        mkdirSync(skillDir, { recursive: true });

        writeFileSync(join(skillDir, 'SKILL.md'), `---
name: skill-${i}
description: Test skill ${i}
---

# Skill ${i}`);

        skillPaths.push(skillDir);
      }

      // 批量安装
      const startTime = Date.now();

      for (const skillPath of skillPaths) {
        const result = await runCommand(['install', skillPath, '-y']);
        expect(result.code).toBe(0);
      }

      const installTime = Date.now() - startTime;

      // 列出所有技能
      const listStart = Date.now();
      const listResult = await runCommand(['list']);
      const listTime = Date.now() - listStart;

      expect(listResult.code).toBe(0);

      // 性能断言（这些值需要根据实际环境调整）
      expect(installTime).toBeLessThan(10000); // 10秒内完成安装
      expect(listTime).toBeLessThan(1000);     // 1秒内完成列出
    });
  });
});