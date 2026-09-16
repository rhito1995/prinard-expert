---
name: create-skill
description: "Use when: turning a repeatable process, review workflow, or project methodology into a reusable skill file that agents can apply consistently."
---

# Create a Reusable Skill

Use this skill when the goal is to capture a multi-step workflow, decision tree, or quality checklist as a reusable `SKILL.md` file.

## Goal

Turn a real-world process into a compact, reusable workflow that another agent or user can follow reliably without re-deriving the method.

## When to use this skill

Use this skill when:
- a workflow has been repeated across tasks and should be standardized
- there is a clear sequence of steps, branching logic, or completion checks
- the user wants a reusable instruction artifact instead of one-off guidance
- the process is broader than a single command or prompt and is best packaged as a skill

## Workflow

### 1. Extract the real process

Identify the actual workflow that has been used in practice.

Look for:
- step-by-step sequence
- decisions or branch points
- success criteria and completion checks
- common failure modes or edge cases
- specific output the workflow is meant to produce

If the process is not yet explicit, reconstruct it from examples, patterns, or prior task execution.

### 2. Decide scope

Choose whether the skill is:
- workspace-scoped: for team/project tasks in a repository
- user-scoped: for personal workflows across multiple projects

For project-specific workflows, prefer a workspace location such as:
- `.github/skills/<name>/SKILL.md`

### 3. Capture the structure

Draft the skill with these sections:
- title and purpose
- trigger / when to use
- inputs or prerequisites
- ordered workflow steps
- decision points and branching logic
- completion checks / quality gates
- examples of usage

Keep it practical and action-oriented. The skill should read like a repeatable operating procedure, not a generic description.

### 4. Write strong frontmatter

Use valid YAML frontmatter with:
- `name`: unique skill name
- `description`: a short sentence that contains trigger phrases so the skill can be discovered

Good description pattern:
- `Use when: doing X, reviewing Y, or following Z workflow.`

Avoid vague descriptions such as “general coding help.” They do not surface well in agent discovery.

### 5. Validate the skill

Before finishing, check that:
- the skill clearly states the outcome it produces
- the steps are ordered and actionable
- decision points are explicit
- completion checks are measurable
- the description is discoverable and meaningful
- the file is saved in the correct customization location

## Decision points

Use a skill when the workflow is multi-step and reusable.
Use a prompt when the task is a single focused action with user-provided inputs.
Use an instruction when the guidance should apply broadly across most work.
Use a custom agent when the workflow needs context isolation or different tool restrictions.

## Completion checklist

A skill is ready when all of the following are true:
- it captures a real, repeatable workflow
- it is easy to follow without extra explanation
- it includes branching logic or edge-case handling
- it states how to know the task is complete
- it has a discoverable description and valid YAML frontmatter

## Example prompts

- “Create a skill for my debugging workflow from investigation to verification.”
- “Turn this release checklist into a reusable SKILL.md for the workspace.”
- “Package our code review process into a workflow skill with clear decision points and quality checks.”

## Related customizations to create next

- a workspace instruction file for team conventions
- a reusable prompt for a common single task
- a custom agent for a specialized workflow with isolated context
- a hook for enforcing checks automatically at lifecycle points

## Quality bar

A good skill should feel like a compact playbook: clear enough to follow, narrow enough to be useful, and explicit enough that a teammate or agent can reproduce the workflow consistently.
