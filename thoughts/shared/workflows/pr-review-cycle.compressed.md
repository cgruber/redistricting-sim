<!--COMPRESSED v1; source:pr-review-cycle.md-->
§META
name:pr-review-cycle scope:redistricting-sim version:2

§ABBREV
tools=/opt/geekinasuit/agents/tools
owner=cgruber repo=redistricting-sim
A=prose/metadata B=config C=secrets D=new-feature/infra

§OVERVIEW
All changes via branch+PR; no direct push to main.
A(prose,tickets,AGENTS.md,workflow-docs) B(manifests,config) C(*.sops.yaml,keys,tokens) D(new-svc,new-pipeline)
multi-category→apply highest bar

§STEP0
kotlin $tools/gh-pr-diff-summary.main.kts -- --pr <N> --owner $owner --repo $repo
→ highest category + required validation; pass output into critique agent prompt

§STEP1
A: none
B: dry-run validation where applicable
C: sops decrypt+verify [NEVER commit without verify]
D: document in PR body: affected services, deployment sequence, rollback, downtime

§STEP2
jj bookmark set <name> -r @- → jj git push -b <name>
Write PR body → /tmp/$repo-<branch>-pr-body.md (Write tool; no heredoc)
kotlin $tools/gh-pr-create.main.kts -- --title "..." --body-file /tmp/... --owner $owner --repo $repo
Keywords: N/A(skip) POST-MERGE(skip) OPTIONAL(skip unless checked) — unchecked w/o keyword→blocks CI check

§STEP3
critique agent(foreground; wait before step4)
pass diff-summary output + category into prompt

Standard critique preamble (include in every critique prompt):
  Available tools — use these NOT raw gh api:
    gh-pr-comment: post inline comment or thread reply (body from file only)
      kotlin $tools/gh-pr-comment.main.kts -- --pr N --owner $owner --repo $repo --body-file F [--path P --line N | --reply-to ID]
    gh-pr-threads: list or resolve threads
      kotlin $tools/gh-pr-threads.main.kts -- --pr N --owner $owner --repo $repo [--resolve]
    always Write reply/comment body to /tmp file first; never inline

Step 0: scope check → gh pr diff N --repo $owner/$repo; SCOPE MISMATCH→stop+report
Step 1(A): prose correctness+token efficiency+internal consistency
Step 1(B/C/D): safety/secrets/correctness/blast-radius
SCOPE MISMATCH→stop+fix+re-run §STEP3; LGTM→skip to §STEP6

§STEP4
response agent(after critique; foreground):
  tools: gh-pr-comment(--reply-to only; no new inline threads), gh-pr-threads; body from file
  Read PR+all open threads; fix or explain no-change; reply via gh-pr-comment --reply-to; no push; report changes+reasons

§STEP5
changes made→re-validate(§STEP1 affected files)→push→re-run §STEP3 | no changes→§STEP6

§STEP6
pause if: judgment flagged | validation fails | conflicting comments | cat-D(always)

§STEP7
every thread→reply before resolving [no reply = unreadable history]
reply: Fixed(<what>) | No change/won't fix(<why>)
kotlin $tools/gh-pr-threads.main.kts -- --pr N --owner $owner --repo $repo           # list unresolved
kotlin $tools/gh-pr-threads.main.kts -- --pr N --owner $owner --repo $repo --resolve  # resolve all

§STEP8
kotlin $tools/gh-pr-status.main.kts -- --pr N --owner $owner --repo $repo
gh pr merge N --repo $owner/$repo --squash
never --auto | --admin | --merge; CI must pass; textual-A exception: infra failures only, non-blocking

§STEP9
jj git fetch; jj bookmark set main -r main@origin
jj rebase -b <next> -d main; jj abandon <change-id>; jj bookmark delete <name>; jj git push --deleted

§NOTES
stacked PRs: wait for parent merge before pushing child
never unchecked boxes in review comments — prose only (task-list-completed scans all comments)
tmp files: unique names → repo+branch+purpose; never generic /tmp/pr-body.md
