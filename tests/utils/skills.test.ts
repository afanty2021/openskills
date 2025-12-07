import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { findAllSkills, findSkill } from '../../src/utils/skills.js';

describe('skills.ts - 技能管理核心', () => {
  const tempDir = join(tmpdir(), 'openskills-test-' + Date.now());

  beforeEach(() => {
    // 创建临时测试目录结构
    const testDirs = [
      join(tempDir, '.claude/skills'),
      join(tempDir, '.agent/skills'),
      join(tempDir, 'project/.claude/skills'),
      join(tempDir, 'project/.agent/skills'),
    ];

    testDirs.forEach(dir => {
      // 确保目录存在
      if (!existsSync(dir)) {
        const mkdir = (path: string) => {
          const parent = join(path, '..');
          if (!existsSync(parent)) mkdir(parent);
          require('fs').mkdirSync(path);
        };
        mkdir(dir);
      }
    });
  });

  afterEach(() => {
    // 清理临时目录
    require('fs').rmSync(tempDir, { recursive: true, force: true });
  });

  describe('findAllSkills()', () => {
    it('应该返回空数组当没有技能时', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);
        const skills = findAllSkills();
        expect(skills).toEqual([]);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('应该正确发现并去重技能', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(join(tempDir, 'project'));

        // 创建测试技能
        const skillContent = `---
name: test-skill
description: A test skill
---

# Test Skill

This is a test skill.`;

        // 在多个目录创建同名技能
        [
          join(tempDir, '.claude/skills/test-skill'),
          join(tempDir, '.agent/skills/test-skill'),
          join(tempDir, 'project/.claude/skills/test-skill'),
          join(tempDir, 'project/.agent/skills/test-skill'),
        ].forEach(path => {
          require('fs').writeFileSync(join(path, 'SKILL.md'), skillContent);
        });

        // 创建唯一技能
        const uniqueSkillPath = join(tempDir, '.claude/skills/unique-skill');
        require('fs').mkdirSync(uniqueSkillPath);
        require('fs').writeFileSync(
          join(uniqueSkillPath, 'SKILL.md'),
          skillContent.replace('test-skill', 'unique-skill')
        );

        const skills = findAllSkills();

        // 应该只找到两个技能（test-skill 应该去重）
        expect(skills).toHaveLength(2);

        // test-skill 应该是项目级别的（优先级最高）
        const testSkill = skills.find(s => s.name === 'test-skill');
        expect(testSkill).toBeDefined();
        expect(testSkill!.location).toBe('project');
        expect(testSkill!.path).toContain('project/.agent/skills');

        // unique-skill 应该是全局的
        const uniqueSkill = skills.find(s => s.name === 'unique-skill');
        expect(uniqueSkill).toBeDefined();
        expect(uniqueSkill!.location).toBe('global');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('应该正确解析技能描述', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);

        const skillContent = `---
name: test-skill
description: Multi-line description
  with more details
tags: test, example
---

# Test Skill

Content here`;

        const skillPath = join(tempDir, '.claude/skills/test-skill');
        require('fs').mkdirSync(skillPath);
        require('fs').writeFileSync(join(skillPath, 'SKILL.md'), skillContent);

        const skills = findAllSkills();
        const skill = skills.find(s => s.name === 'test-skill');

        expect(skill).toBeDefined();
        expect(skill!.description).toContain('Multi-line description');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('应该跳过没有 SKILL.md 的目录', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);

        // 创建没有 SKILL.md 的目录
        const emptyDir = join(tempDir, '.claude/skills/empty-skill');
        require('fs').mkdirSync(emptyDir);

        const skills = findAllSkills();
        expect(skills).toEqual([]);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('findSkill()', () => {
    it('应该按优先级查找技能', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(join(tempDir, 'project'));

        const skillContent = `---
name: priority-skill
description: Test skill for priority
---

# Priority Skill`;

        // 在不同优先级创建技能
        const skillPaths = [
          join(tempDir, '.claude/skills/priority-skill'),     // 最低优先级
          join(tempDir, '.agent/skills/priority-skill'),      // 较高优先级
          join(tempDir, 'project/.claude/skills/priority-skill'), // 更高优先级
          join(tempDir, 'project/.agent/skills/priority-skill'),  // 最高优先级
        ];

        skillPaths.forEach(path => {
          require('fs').mkdirSync(path);
          require('fs').writeFileSync(join(path, 'SKILL.md'), skillContent);
        });

        const location = findSkill('priority-skill');

        expect(location).toBeDefined();
        // 应该返回最高优先级的路径
        expect(location!.path).toContain('project/.agent/skills');
        expect(location!.baseDir).toContain('project/.agent/skills');
        expect(location!.source).toContain('project/.agent/skills');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('应该返回 null 当技能不存在时', () => {
      const location = findSkill('non-existent-skill');
      expect(location).toBeNull();
    });
  });

  describe('边界条件', () => {
    it('应该处理包含特殊字符的技能名称', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);

        const specialNames = ['skill-with-dash', 'skill_with_underscore', 'skill.with.dots'];

        specialNames.forEach(name => {
          const skillContent = `---
name: ${name}
description: Skill with special characters
---

# ${name}`;

          const skillPath = join(tempDir, '.claude/skills', name);
          require('fs').mkdirSync(skillPath);
          require('fs').writeFileSync(join(skillPath, 'SKILL.md'), skillContent);
        });

        const skills = findAllSkills();
        expect(skills).toHaveLength(3);

        specialNames.forEach(name => {
          const skill = findSkill(name);
          expect(skill).toBeDefined();
        });
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('应该处理 YAML 解析失败的情况', () {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);

        // 创建无效 YAML 的技能
        const invalidYamlContent = `---
invalid: yaml: content:
unclosed

# Invalid YAML Skill`;

        const skillPath = join(tempDir, '.claude/skills/invalid-yaml');
        require('fs').mkdirSync(skillPath);
        require('fs').writeFileSync(join(skillPath, 'SKILL.md'), invalidYamlContent);

        const skills = findAllSkills();
        const skill = skills.find(s => s.name === 'invalid-yaml');

        expect(skill).toBeDefined();
        expect(skill!.description).toBe(''); // 解析失败时应该返回空字符串
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});