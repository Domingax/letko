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
  <step n="2" goal="Verify commits and push to remote">
    <output>📦 **Pipeline Phase 2/4 — Commit & Push**</output>

    <critical>Dev-story (Phase 1) is responsible for creating individual commits at each "### Commit N:" boundary.
      This phase only handles branch creation (if needed), any remaining uncommitted files (story file, sprint-status), and pushing.</critical>

    <action>Run `git status` to see all changes</action>
    <action>Run `git log --oneline` to verify individual commits were created by dev-story</action>

    <!-- Determine branch -->
    <action>Check current branch name</action>
    <check if="on main or master">
      <action>Extract story_key from story file</action>
      <action>Create and switch to branch: `story/{{story_key}}`</action>
    </check>

    <!-- Handle any remaining unstaged files (story file updates, sprint-status) -->
    <check if="there are uncommitted changes (story file, sprint-status, etc.)">
      <action>Stage remaining files (story file, sprint-status)</action>
      <action>Do NOT stage: `.env`, credentials, `node_modules/`, `dist/`, `.claude/settings.local.json`</action>
      <action>Create a final commit: `chore: update story {{story_key}} status and sprint tracking`</action>
    </check>

    <!-- Push -->
    <action>Push branch to remote with `git push -u origin {{branch_name}}`</action>

    <check if="push fails">
      <action>HALT pipeline — surface the git error to the user</action>
      <action>Send desktop notification: `notify-send "Letko Pipeline" "❌ Git push failed — action needed"`</action>
    </check>

    <!-- Dev Summary self-assessment -->
    <action>Self-assess whether the implementation warrants a Dev Summary section in the PR body.
      Include a Dev Summary if ANY of the following apply:
      - A non-trivial or non-obvious implementation approach was chosen
      - Conscious workarounds or shortcuts were applied (e.g. bypassing a tool, using an alternative command)
      - A complex or non-obvious architecture decision was made

      Omit the Dev Summary for straightforward stories with no surprises.

      If including, draft the section:
        ```
        ## Dev Summary
        - <what was done and why, if approach was non-trivial>
        - <any workarounds and the reason>
        - <architecture decisions not obvious from the diff>
        ```
      Capture as: {{dev_summary_section}} (empty string if omitted)
    </action>

    <!-- Create PR -->
    <action>Create the Pull Request with `gh pr create`:
      - Target branch: main
      - Title: "feat: story {{story_key}} — {{story_title_short}}"
      - Body ({{dev_summary_section}} prepended if non-empty, then placeholder for review agent):
        ```
        {{dev_summary_section}}
        ## Summary
        _Pending code review..._

        🤖 Generated with [Claude Code](https://claude.com/claude-code)
        ```
    </action>
    <action>Capture: {{pr_url}} and {{pr_number}}</action>

    <output>✅ **Phase 2 complete** — Changes committed, pushed, PR created: {{pr_url}}</output>
  </step>

  <!-- ============================================================ -->
  <!-- PHASE 3: CODE REVIEW (DIFFERENT MODEL)                        -->
  <!-- ============================================================ -->
  <step n="3" goal="Spawn review agent with a different model">
    <output>🔍 **Pipeline Phase 3/4 — Code Review (Opus agent)**</output>

    <critical>The code review MUST be performed by an independent subagent with a fresh context.
      Use the `Agent` tool with `model: "opus"` parameter. This ensures the reviewer has NO prior knowledge
      of the implementation decisions and can perform a genuinely adversarial review.
      NEVER perform the review inline in this conversation — always delegate to a subagent.</critical>

    <action>Use the `Agent` tool (subagent) with `model: "opus"` and the following prompt:

      ```
      You are an adversarial code reviewer for the Letko project.

      ## Context

      - Story file: {{story_path}}
      - PR already created: #{{pr_number}} ({{pr_url}})

      ## Phase A — Context Loading

      1. Read the story file at: {{story_path}}
      2. Load project context from `_bmad/bmm/config.yaml` and `**/project-context.md` if it exists
      3. Load AGENTS.md for coding standards
      4. Read the current PR body with `gh pr view #{{pr_number}} --json body` and extract the **Dev Summary**
         section if present — use it as context on the dev agent's choices (workarounds, approach, decisions)
         before reviewing the code

      ## Phase B — Code Review

      5. Perform an adversarial code review following the process in `.claude/skills/bmad-code-review/workflow.md`
         - BUT skip Step 4's interactive prompt — instead, automatically choose option 2 (create action items)
         - Let Step 5 run normally (it handles sprint status updates)
      6. Collect all findings (HIGH, MEDIUM, LOW)
      7. Determine a preliminary verdict based on code review:
         - APPROVED = no HIGH issues found
         - CHANGES REQUESTED = at least one HIGH issue exists

      ## Phase C — SonarCloud Analysis

      8. Query SonarCloud via MCP to enrich the review:
         - `mcp__sonarqube__get_project_quality_gate_status` — overall quality gate pass/fail
         - `mcp__sonarqube__search_sonar_issues_in_projects` filtered on new code — issues introduced by this PR
         - `mcp__sonarqube__search_security_hotspots` — any unresolved security hotspots

      9. Merge SonarCloud findings into the verdict:
         - If quality gate FAILS or new BLOCKER/CRITICAL issues found → CHANGES REQUESTED
         - Otherwise keep the preliminary verdict from Phase B

      ## Phase D — Update PR

      10. If action items were created in the story file, commit and push those changes

      11. Update the PR body using `gh pr edit #{{pr_number}} --body "..."` — structure:
          - If a Dev Summary section was found in step 4: keep it first, verbatim
          - Then append the review report below it
          ```
          <Dev Summary section verbatim, if it existed — omit this line if absent>

          ## Summary
          - <1-3 bullet points summarizing the story implementation>

          ## Code Review Findings

          ### 🔴 Critical/High Issues
          <list or "None">

          ### 🟡 Medium Issues
          <list or "None">

          ### 🟢 Low Issues
          <list or "None">

          ## SonarCloud Analysis

          **Quality Gate:** <PASSED / FAILED>

          ### New Issues (this PR)
          <list or "None">

          ### Security Hotspots
          <list or "None">

          ## Review Verdict
          <APPROVED or CHANGES REQUESTED>

          ## Test plan
          - [ ] All unit tests pass (`npm test`)
          - [ ] Lint passes (`npx eslint .`)
          - [ ] Manual verification of acceptance criteria

          🤖 Generated with [Claude Code](https://claude.com/claude-code)
          ```

      11. Return: the PR URL, the verdict (APPROVED/CHANGES REQUESTED), and a summary of findings count
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
