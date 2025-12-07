import { describe, it, expect } from 'vitest';
import {
  parseCurrentSkills,
  generateSkillsXml,
  replaceSkillsSection,
  removeSkillsSection,
} from '../../src/utils/agents-md.js';
import type { Skill } from '../../src/types.js';

describe('agents-md.ts - AGENTS.md 操作', () => {
  const mockSkills: Skill[] = [
    {
      name: 'test-skill-1',
      description: 'First test skill',
      location: 'project',
      path: '/path/to/test-skill-1',
    },
    {
      name: 'test-skill-2',
      description: 'Second test skill\nwith multi-line description',
      location: 'global',
      path: '/path/to/test-skill-2',
    },
  ];

  describe('parseCurrentSkills()', () => {
    it('应该正确解析 XML 格式的技能列表', () => {
      const content = `# AGENTS.md

<skills_system priority="1">

<available_skills>

<skill>
<name>skill-1</name>
<description>Description 1</description>
<location>project</location>
</skill>

<skill>
<name>skill-2</name>
<description>Description 2</description>
<location>global</location>
</skill>

</available_skills>

</skills_system>`;

      const skills = parseCurrentSkills(content);
      expect(skills).toEqual(['skill-1', 'skill-2']);
    });

    it('应该处理空内容', () => {
      const skills = parseCurrentSkills('');
      expect(skills).toEqual([]);
    });

    it('应该处理格式错误的 XML', () => {
      const content = `
<skill>
<name>incomplete-skill
</skill>
<skill>
<name>complete-skill</name>
<description>Complete description</description>
</skill>`;

      const skills = parseCurrentSkills(content);
      expect(skills).toEqual(['complete-skill']);
    });
  });

  describe('generateSkillsXml()', () => {
    it('应该生成正确的 XML 格式', () => {
      const xml = generateSkillsXml(mockSkills);

      // 验证 XML 结构
      expect(xml).toContain('<skills_system priority="1">');
      expect(xml).toContain('</skills_system>');
      expect(xml).toContain('<!-- SKILLS_TABLE_START -->');
      expect(xml).toContain('<!-- SKILLS_TABLE_END -->');
      expect(xml).toContain('<usage>');
      expect(xml).toContain('<available_skills>');
      expect(xml).toContain('</available_skills>');

      // 验证技能内容
      expect(xml).toContain('<name>test-skill-1</name>');
      expect(xml).toContain('<name>test-skill-2</name>');
      expect(xml).toContain('<description>First test skill</description>');
      expect(xml).toContain('<location>project</location>');
      expect(xml).toContain('<location>global</location>');
    });

    it('应该处理空技能列表', () => {
      const xml = generateSkillsXml([]);

      expect(xml).toContain('<skills_system priority="1">');
      expect(xml).toContain('<available_skills>');
      expect(xml).toContain('</available_skills>');
      // 不应该有任何 <skill> 标签
      expect(xml).not.toContain('<skill>');
    });

    it('应该正确处理特殊字符', () => {
      const skillsWithSpecialChars: Skill[] = [
        {
          name: 'skill-with-quotes',
          description: 'Description with "quotes" and <tags>',
          location: 'project',
          path: '/path/to/skill',
        },
      ];

      const xml = generateSkillsXml(skillsWithSpecialChars);

      expect(xml).toContain('<name>skill-with-quotes</name>');
      expect(xml).toContain('Description with "quotes" and <tags>');
    });
  });

  describe('replaceSkillsSection()', () => {
    const testXml = `<skills_system priority="1">
## Available Skills
<!-- SKILLS_TABLE_START -->
<usage>Test usage</usage>
<available_skills>
<skill><name>new-skill</name></skill>
</available_skills>
<!-- SKILLS_TABLE_END -->
</skills_system>`;

    it('应该替换现有的 XML 格式', () => {
      const content = `# AGENTS.md

Some content before.

<skills_system priority="1">
<available_skills>
<skill><name>old-skill</name></skill>
</available_skills>
</skills_system>

Some content after.`;

      const result = replaceSkillsSection(content, testXml);

      expect(result).toContain(testXml);
      expect(result).toContain('Some content before.');
      expect(result).toContain('Some content after.');
      expect(result).not.toContain('old-skill');
    });

    it('应该替换 HTML 注释格式', () => {
      const content = `# AGENTS.md

Some content before.

<!-- SKILLS_TABLE_START -->
Old content
<!-- SKILLS_TABLE_END -->

Some content after.`;

      const result = replaceSkillsSection(content, testXml);

      expect(result).toContain(testXml);
      expect(result).toContain('Some content before.');
      expect(result).toContain('Some content after.');
      expect(result).not.toContain('Old content');
    });

    it('应该在没有标记时追加到末尾', () => {
      const content = `# AGENTS.md

Just some content`;

      const result = replaceSkillsSection(content, testXml);

      expect(result).toContain('Just some content');
      expect(result).toContain(testXml);
      expect(result.endsWith('\n'));
    });

    it('应该处理多个匹配（只替换第一个）', () => {
      const content = `# AGENTS.md

<skills_system>
<skill><name>first</name></skill>
</skills_system>

Some content

<skills_system>
<skill><name>second</name></skill>
</skills_system>`;

      const result = replaceSkillsSection(content, testXml);

      // 应该只替换第一个
      expect(result).toContain(testXml);
      expect(result).not.toContain('<name>first</name>');
      expect(result).toContain('<name>second</name>');
    });
  });

  describe('removeSkillsSection()', () => {
    it('应该移除 XML 格式', () => {
      const content = `# AGENTS.md

<skills_system priority="1">
<available_skills>
<skill><name>skill-to-remove</name></skill>
</available_skills>
</skills_system>

Other content.`;

      const result = removeSkillsSection(content);

      expect(result).not.toContain('skill-to-remove');
      expect(result).not.toContain('<skills_system');
      expect(result).not.toContain('</skills_system>');
      expect(result).toContain('<!-- Skills section removed -->');
      expect(result).toContain('Other content.');
    });

    it('应该移除 HTML 注释格式', () => {
      const content = `# AGENTS.md

<!-- SKILLS_TABLE_START -->
<skill><name>skill-to-remove</name></skill>
<!-- SKILLS_TABLE_END -->

Other content.`;

      const result = removeSkillsSection(content);

      expect(result).not.toContain('skill-to-remove');
      expect(result).toContain('<!-- Skills section removed -->');
      expect(result).toContain('Other content.');
    });

    it('应该处理没有技能部分的情况', () => {
      const content = `# AGENTS.md

Just some content without skills.`;

      const result = removeSkillsSection(content);

      expect(result).toBe(content);
    });
  });

  describe('集成测试', () => {
    it('应该能完整处理 AGENTS.md 更新流程', () => {
      // 1. 解析现有技能
      const initialContent = `# AGENTS.md

<skills_system>
<available_skills>
<skill><name>existing-skill</name></skill>
</available_skills>
</skills_system>`;

      const existingSkills = parseCurrentSkills(initialContent);
      expect(existingSkills).toEqual(['existing-skill']);

      // 2. 生成新的 XML
      const newXml = generateSkillsXml(mockSkills);

      // 3. 替换内容
      const updatedContent = replaceSkillsSection(initialContent, newXml);
      expect(updatedContent).toContain('test-skill-1');
      expect(updatedContent).toContain('test-skill-2');
      expect(updatedContent).not.toContain('existing-skill');

      // 4. 验证可以再次解析
      const updatedSkills = parseCurrentSkills(updatedContent);
      expect(updatedSkills).toEqual(['test-skill-1', 'test-skill-2']);
    });
  });
});