+++
# --- Basic Metadata ---
id = "WF-CREATE-ROO-CMD-BUILD-001"
title = "Workflow: Create Roo Commander Build Archive"
status = "active"
created_date = "2025-04-20"
updated_date = "2025-04-20"
version = "1.0"
tags = ["workflow", "build", "release", "archive", "zip", "versioning", "roo-commander"]

# --- Ownership & Context ---
owner = "Roo Commander"
related_docs = [
  ".builds/README.md",
  ".docs/standards/roo-commander-version-naming-convention.md",
  "create_build.sh" # Assumed build script (to be created)
]
related_templates = []

# --- Workflow Specific Fields ---
objective = "To create a standardized, versioned zip archive of the Roo Commander configuration files suitable for distribution, place it in the `.builds/` directory, and log the build."
scope = "Applies when preparing a new distributable release of the Roo Commander configuration."
roles = [
  "Coordinator (Roo Commander)",
  "Executor (Terminal via `execute_command`)",
  "Technical Writer (Optional, for CHANGELOG)"
]
trigger = "Manual initiation by the Coordinator when a new build is required."
success_criteria = [
  "A zip archive named according to the versioning convention (e.g., `roo-commander-vX.YY-Codename.zip`) is created in the `.builds/` directory.",
  "The archive contains the correct set of included files/folders and excludes the specified ones.",
  "The archive contains a `README.md` with setup instructions.",
  "The archive contains an up-to-date `CHANGELOG.md`.",
  "The `.builds/README.md` log file is updated with the details of the new build.",
  "The build script (if used) executes successfully (exit code 0)."
]
failure_criteria = [
  "The build script (if used) fails or produces errors.",
  "The zip archive is not created or is placed in the wrong location.",
  "The zip archive has an incorrect name.",
  "The contents of the zip archive are incorrect (missing files, includes excluded files).",
  "The `README.md` or `CHANGELOG.md` within the archive is missing or incorrect.",
  "The `.builds/README.md` log file is not updated or contains errors."
]

# --- Integration ---
acqa_applicable = false # Workflow primarily orchestrates a build script/process
pal_validated = false # Needs validation once implemented
validation_notes = "Workflow needs implementation and testing, potentially involving creation of a build script."

# --- AI Interaction Hints (Optional) ---
# context_type = "workflow_definition"
+++

# Workflow: Create Roo Commander Build Archive

## 1. Objective 🎯
*   To create a standardized, versioned zip archive (`.zip`) containing the necessary Roo Commander configuration files for distribution.
*   To ensure the archive follows the defined versioning and naming conventions.
*   To place the archive in the designated `.builds/` directory.
*   To maintain a log of created builds in `.builds/README.md`.

## 2. Scope ↔️
*   This workflow is triggered manually when a new distributable build of the Roo Commander configuration is needed.

## 3. Roles & Responsibilities 👤
*   **Coordinator (Roo Commander):** Initiates the workflow, determines version information, gathers changelog details (potentially delegating), executes the build process, verifies the output, and updates the build log.
*   **Executor (Terminal):** Runs the build script or commands provided by the Coordinator.
*   **Technical Writer (Optional):** Can be delegated the task of creating or updating the `CHANGELOG.md`.

## 4. Preconditions🚦
*   The `.builds/` directory exists.
*   The `.builds/README.md` file exists (or will be created on the first run).
*   The `.docs/standards/roo-commander-version-naming-convention.md` document exists and is up-to-date.
*   A mechanism (ideally a script like `create_build.sh` or `create_build.js`) exists to perform the archiving, including file selection/exclusion.
*   Necessary tools (e.g., `zip` command-line utility, Node.js if using a JS script) are available in the environment.

## 5. Reference Documents & Tools 📚🛠️
*   `.builds/README.md`: Log file for build history.
*   `.docs/standards/roo-commander-version-naming-convention.md`: Defines version numbers and codenames.
*   `create_build.[sh|js]` (Hypothetical): The script automating the build process.
*   `CHANGELOG.md` (Template/Previous Version): Used as a basis for the new changelog.
*   `README.dist.md` (Hypothetical Template): Template for the `README.md` to be included *inside* the zip.
*   `execute_command`: Tool to run the build script/commands.
*   `read_file`: Tool to read version info, changelogs, build logs.
*   `write_to_file`: Tool to create/update build log, potentially the distribution README/CHANGELOG if not scripted.
*   `append_to_file`: Tool to add entries to the build log.
*   `list_files`: Tool to verify script existence or build output.
*   `technical-writer` (Mode): Optional delegate for `CHANGELOG.md` creation/update.

## 6. Workflow Steps 🪜

*   **Step 1: Determine Build Version & Codename (Coordinator Task)**
    *   **Description:** Identify the correct version number (e.g., `v7.01`) and codename (e.g., `Wallaby`) for the new build.
    *   **Inputs:** `.docs/standards/roo-commander-version-naming-convention.md`, potentially `.builds/README.md` to find the last version.
    *   **Procedure:**
        1.  Read `.docs/standards/roo-commander-version-naming-convention.md` to confirm the current major version's codename.
        2.  Read `.builds/README.md` (if it exists) to determine the last build number for the current major version.
        3.  Increment the minor version number (e.g., v7.00 -> v7.01).
        4.  Construct the full version string (e.g., `v7.01`) and the archive filename stem (e.g., `roo-commander-v7.01-Wallaby`).
    *   **Outputs:** `BUILD_VERSION` (e.g., "v7.01"), `BUILD_CODENAME` (e.g., "Wallaby"), `ARCHIVE_NAME_STEM` (e.g., "roo-commander-v7.01-Wallaby").

*   **Step 2: Prepare CHANGELOG (Coordinator Task / Optional Delegation)**
    *   **Description:** Create or update a `CHANGELOG.md` file detailing changes for this specific build version.
    *   **Inputs:** `BUILD_VERSION`, knowledge of recent changes, previous `CHANGELOG.md` (if available).
    *   **Procedure:**
        *   **Option A (Manual/Coordinator):** Gather notes on changes since the last build. Format them into a new entry in `CHANGELOG.md` under the `BUILD_VERSION` heading. Use `write_to_file` to create/update a temporary changelog file (e.g., `.tmp/CHANGELOG.md`).
        *   **Option B (Delegate):** Delegate to `technical-writer` via `new_task`: "Create/Update CHANGELOG.md for build [BUILD_VERSION]. Summarize recent changes [provide details or pointers]. Save output to `.tmp/CHANGELOG.md`." Await completion.
    *   **Outputs:** A `CHANGELOG.md` file ready for inclusion in the build (e.g., located at `.tmp/CHANGELOG.md`).

*   **Step 3: Prepare Distribution README (Coordinator Task)**
    *   **Description:** Ensure the `README.md` file intended for *inside* the zip archive is ready.
    *   **Inputs:** Template for the distribution README (e.g., `README.dist.md`), `BUILD_VERSION`, `BUILD_CODENAME`.
    *   **Procedure:**
        1.  Read the template content.
        2.  Update any placeholders (like version number, date).
        3.  Use `write_to_file` to save the finalized content to a temporary location (e.g., `.tmp/README.md`).
    *   **Outputs:** A `README.md` file ready for inclusion in the build (e.g., located at `.tmp/README.md`).

*   **Step 4: Execute Build Process (Coordinator delegates to Executor via `execute_command`)**
    *   **Description:** Run the automated script or series of commands to create the zip archive.
    *   **Tool:** `execute_command`
    *   **Inputs Provided by Coordinator:**
        *   Command to run the build script (e.g., `bash create_build.sh ${ARCHIVE_NAME_STEM} .tmp/README.md .tmp/CHANGELOG.md`) OR a series of `mkdir`, `cp`, `zip` commands.
        *   The script/commands must handle:
            *   Creating a temporary staging directory.
            *   Copying required files/folders (e.g., `.modes`, `.processes`, `.roo`, `.templates`, `.workflows`, `build_*.js`, `LICENSE`, `.roomodes`).
            *   Creating required empty directories (e.g., `.archive`, `.context`, etc.).
            *   Copying the prepared `.tmp/README.md` and `.tmp/CHANGELOG.md` into the staging directory.
            *   Creating the zip archive from the staging directory with the name `${ARCHIVE_NAME_STEM}.zip` and placing it in the `.builds/` directory.
            *   Cleaning up the temporary staging directory and `.tmp` files.
    *   **Instructions for Executor:** Execute the provided command(s).
    *   **Expected Output from Executor:** Terminal output indicating success or failure, exit code.
    *   **Coordinator Action (Post-Execution):** Review output and exit code.
    *   **Validation/QA:** Check for success messages, non-zero exit code. Use `list_files` on `.builds/` to confirm the zip file exists with the correct name.
    *   **Error Handling:** If errors occur, analyze script/command output. Check file paths, permissions, tool availability (`zip`). Report failure or attempt troubleshooting.

*   **Step 5: Update Build Log (Coordinator Task)**
    *   **Description:** Add an entry for the newly created build to the `.builds/README.md` log file.
    *   **Inputs:** `BUILD_VERSION`, `BUILD_CODENAME`, Current Date, `ARCHIVE_NAME_STEM`.
    *   **Procedure:**
        1.  Get the current date (e.g., YYYY-MM-DD).
        2.  Format the log entry (e.g., `- **${BUILD_VERSION} (${BUILD_CODENAME})** - ${YYYY-MM-DD} - File: \`${ARCHIVE_NAME_STEM}.zip\``).
        3.  Use `append_to_file` to add the new entry to `.builds/README.md`. If the file doesn't exist, use `write_to_file` to create it with a header and the first entry.
    *   **Outputs:** Updated `.builds/README.md`.
    *   **Error Handling:** If writing/appending fails, report the error.

## 7. Postconditions ✅
*   A correctly named and structured zip archive exists in `.builds/`.
*   The `.builds/README.md` file contains an entry for the new build.

## 8. Error Handling & Escalation (Overall) ⚠️
*   If the build script fails, debug the script.
*   If file operations fail, check permissions and paths.
*   If versioning information is inconsistent, review `.builds/README.md` and the versioning standard document.
*   Escalate to the user if the build cannot be completed successfully.

## 9. PAL Validation Record 🧪
*   Date Validated: (Pending Implementation)
*   Method:
*   Test Case(s):
*   Findings/Refinements:

## 10. Revision History 📜
*   v1.0 (2025-04-20): Initial draft incorporating versioning, build log, CHANGELOG, distribution README, and suggestion for an automated build script.