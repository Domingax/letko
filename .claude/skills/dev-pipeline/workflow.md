# Dev Pipeline Workflow

**Goal:** Autonomous end-to-end pipeline: implement story → test → lint → commit → push → code review (different model) → PR → notify user.

**Your Role:** Pipeline orchestrator. You coordinate the full cycle without user intervention until completion.

---

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `user_name`
- `communication_language`, `document_output_language`
- `user_skill_level`
- `implementation_artifacts`

### Inputs

- `story_path` = `` (explicit story path; auto-discovered if empty — passed to dev-story)

---

## EXECUTION

<workflow>
  <critical>This pipeline runs autonomously. Do NOT pause for user input between phases unless a HALT condition is triggered.</critical>
  <critical>Communicate all responses in {communication_language}</critical>

  <!-- ============================================================ -->
  <!-- PHASE 1: IMPLEMENTATION                                       -->
  <!-- ============================================================ -->
  <step n="1" goal="Implement the story using bmad-dev-story">
    <output>🚀 **Pipeline Phase 1/4 — Implementation**</output>

    <action>Invoke the `/bmad-dev-story` skill with the story path (if provided)</action>
    <action>Let dev-story run to completion — all tasks, tests, lint, validation</action>
    <action>Dev-story will mark the story status as "review" when done</action>

    <check if="dev-story HALTs or fails">
      <action>HALT pipeline — surface the dev-story error to the user</action>
      <action>Send desktop notification: `notify-send "Letko Pipeline" "❌ Dev phase failed — action needed"`</action>
    </check>

    <output>✅ **Phase 1 complete** — Story implemented and validated</output>
  </step>

  <!-- ============================================================ -->
  <!-- PHASE 2: COMMIT & PUSH                                        -->
  <!-- ============================================================ -->
  <step n="2" goal="Create commit and push to remote">
    <output>📦 **Pipeline Phase 2/4 — Commit & Push**</output>

    <action>Run `git status` to see all changes</action>
    <action>Run `git diff --stat` to summarize changes</action>

    <!-- Determine branch -->
    <action>Check current branch name</action>
    <check if="on main or master">
      <action>Extract story_key from story file</action>
      <action>Create and switch to branch: `story/{{story_key}}`</action>
    </check>

    <!-- Stage and commit -->
    <action>Stage all relevant files (source code, tests, story file, sprint-status)</action>
    <action>Do NOT stage: `.env`, credentials, `node_modules/`, `dist/`, `.claude/settings.local.json`</action>
    <action>Review recent commit messages with `git log --oneline -5` to match style</action>
    <action>Create commit following conventional commits format:
      `feat: story {{story_key}} — {{story_title_short}}`
    </action>

    <!-- Push -->
    <action>Push branch to remote with `git push -u origin {{branch_name}}`</action>

    <check if="push fails">
      <action>HALT pipeline — surface the git error to the user</action>
      <action>Send desktop notification: `notify-send "Letko Pipeline" "❌ Git push failed — action needed"`</action>
    </check>

    <output>✅ **Phase 2 complete** — Changes committed and pushed</output>
  </step>

  <!-- ============================================================ -->
  <!-- PHASE 3: CODE REVIEW (DIFFERENT MODEL)                        -->
  <!-- ============================================================ -->
  <step n="3" goal="Spawn review agent with a different model">
    <output>🔍 **Pipeline Phase 3/4 — Code Review (Opus agent)**</output>

    <action>Spawn an Agent with `model: "opus"` and the following prompt:

      ```
      You are an adversarial code reviewer for the Letko project.

      ## Your task

      1. Read the story file at: {{story_path}}
      2. Load project context from `_bmad/bmm/config.yaml` and `**/project-context.md` if it exists
      3. Load AGENTS.md for coding standards
      4. Perform an adversarial code review following the process in `.claude/skills/bmad-code-review/workflow.md`
         - BUT skip Step 4's interactive prompt — instead, automatically choose option 2 (create action items)
         - Let Step 5 run normally (it handles sprint status updates)
      5. Collect all findings (HIGH, MEDIUM, LOW)
      6. Determine the review verdict:
         - APPROVED = no HIGH issues found
         - CHANGES REQUESTED = at least one HIGH issue exists

      ## After the review

      7. If action items were created in the story file, commit and push those changes

      8. Create a Pull Request using `gh pr create`:
         - Target branch: main
         - Title: "feat: story {{story_key}} — {{story_title_short}}"
         - Body format:
           ```
           ## Summary
           - <1-3 bullet points summarizing the story implementation>

           ## Code Review Findings

           ### 🔴 Critical/High Issues
           <list or "None">

           ### 🟡 Medium Issues
           <list or "None">

           ### 🟢 Low Issues
           <list or "None">

           ## Review Verdict
           <APPROVED or CHANGES REQUESTED>

           ## Test plan
           - [ ] All unit tests pass (`npm test`)
           - [ ] Lint passes (`npx eslint .`)
           - [ ] Manual verification of acceptance criteria

           🤖 Generated with [Claude Code](https://claude.com/claude-code)
           ```

      9. Return: the PR URL, the verdict (APPROVED/CHANGES REQUESTED), and a summary of findings count
      ```
    </action>

    <action>Wait for the review agent to complete</action>
    <action>Capture: {{pr_url}}, {{review_verdict}}, {{findings_summary}}</action>

    <check if="review agent fails">
      <action>HALT pipeline — surface the error</action>
      <action>Send desktop notification: `notify-send "Letko Pipeline" "❌ Code review failed — action needed"`</action>
    </check>

    <output>✅ **Phase 3 complete** — Code review done: {{review_verdict}}</output>
  </step>

  <!-- ============================================================ -->
  <!-- PHASE 4: NOTIFICATION                                         -->
  <!-- ============================================================ -->
  <step n="4" goal="Notify user that pipeline is complete">
    <output>🔔 **Pipeline Phase 4/4 — Notification**</output>

    <check if="review_verdict == 'APPROVED'">
      <action>Run: `notify-send -u normal "Letko Pipeline ✅" "Story {{story_key}} — PR approved and ready for your review\n{{pr_url}}"`</action>
      <output>
        🎉 **Pipeline Complete — APPROVED**

        **Story:** {{story_key}}
        **PR:** {{pr_url}}
        **Verdict:** ✅ Approved — no critical issues

        {{findings_summary}}

        **Next:** Review and merge the PR on GitHub.
      </output>
    </check>

    <check if="review_verdict == 'CHANGES REQUESTED'">
      <action>Run: `notify-send -u critical "Letko Pipeline ⚠️" "Story {{story_key}} — Changes requested\n{{pr_url}}"`</action>
      <output>
        ⚠️ **Pipeline Complete — CHANGES REQUESTED**

        **Story:** {{story_key}}
        **PR:** {{pr_url}}
        **Verdict:** ❌ Changes requested — review findings on the PR

        {{findings_summary}}

        **Next:** Review the PR comments on GitHub, then start a new session with:
        `"Address PR feedback for story {{story_key}}"`
      </output>
    </check>
  </step>

</workflow>
