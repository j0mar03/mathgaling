# Mermaid figure sources for the AAIE manuscript

These are schematic diagrams, not plots of estimated effects. Export each Mermaid block separately as a vector PDF, using the filename below, and upload it to the `figures/` folder in Overleaf. Markdown/Mermaid is the editable source; LaTeX includes the exported graphic. Overleaf does not typeset these Mermaid blocks directly.

The `.tex` manuscript keeps a visible placeholder until each named PDF exists. No diagram export or PDF compilation was performed for this revision.

## Figure 1 — Read-only audit workflow

Export filename: `audit-workflow.pdf`

```mermaid
flowchart TB
    A["Supplied Supabase CSV snapshot<br/>Responses: 3,710<br/>Items: 720 | KCs: 76"] --> B["Record file fingerprints<br/>Parse CSV and JSON fields"]
    B --> C["Measure structural integrity<br/>Missingness, duplicates, joins"]
    B --> D["Describe sequence coverage<br/>Order records by student and KC"]
    B --> E["Replay current client validator<br/>Diagnostic agreement only"]
    S["Inspect current client and API source<br/>Record source fingerprints"] --> E
    S --> F["Inspect recording semantics<br/>Boolean fallback, timer, attempts"]
    C --> G["Map evidence to validity limits"]
    D --> G
    E --> G
    F --> G
    H["Historical deployment equivalence<br/>Not yet documented"] -.-> G
    G --> I["Report aggregate findings<br/>Preserve raw values and distinguish<br/>observations from explanations"]
```

Caption: Read-only audit workflow. Export measurements and current-source diagnostics converge in an evidence-to-validity mapping. Historical deployment equivalence remains an unresolved provenance question.

Interpretation: No cohort exclusion, label imputation, model fitting, or database update is represented. The full export is retained for the audit. File fingerprints identify the local inputs; they do not establish the export execution time or the historical deployed revision.

## Figure 2 — Cumulative timer interpretation

Export filename: `timer-semantics.pdf`

```mermaid
flowchart TB
    A["Quiz starts<br/>Timer initialized"] --> B["Question 1 displayed<br/>Timer continues"]
    B --> C["Question 1 submitted<br/>Save cumulative value C1"]
    C --> D["Feedback and navigation<br/>Timer continues"]
    D --> E["Question 2 displayed<br/>No per-question timer reset"]
    E --> F["Question 2 submitted<br/>Save cumulative value C2"]
    F --> G["C2 includes earlier quiz activity<br/>It is not Question 2 solving time"]
    G --> H["C2 minus C1 can include feedback<br/>and navigation as well as solving<br/>It is only a candidate interval"]
```

Caption: Schematic interpretation of the current client timer. A later saved value includes earlier quiz activity. Differences between cumulative values can also include feedback and navigation; they are not established measurements of item-solving latency. The diagram represents inspected code behavior, not a verified historical trace.

Interpretation: `C1` and `C2` are symbolic saved values. No fabricated student example or synthetic numerical duration is introduced. Historical use of this timer implementation remains to be verified.

## Export and presentation notes

- Export the diagram only, with a white background and dark text; the manuscript supplies the caption.
- Use a vector PDF and inspect readability at IEEE column width. Simplify labels or use a full-width figure if necessary.
- Keep the distinction between current-source behavior and historical execution when presenting the diagrams.
- Recheck counts against `analysis/audit_results.json` if the underlying snapshot changes.
- If the paper changes to a predictive comparison, revise the diagrams and captions to describe the procedure actually performed.
