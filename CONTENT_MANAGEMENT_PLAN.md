# Plan: Hybrid Content Management (Grades 3 & 4)

This plan outlines the architecture for managing learning content for Grade 3 and Grade 4 using a Hybrid Model.

**1. Roles & Responsibilities:**

*   **Administrators:**
    *   Responsible for defining the curriculum structure.
    *   Perform CRUD operations (Create, Read, Update, Delete) on **Knowledge Components (KCs)**.
    *   Set and manage the `grade_level` attribute for each KC (e.g., 3 or 4).
    *   Manage other KC attributes like `name`, `description`, `curriculum_code`, `prerequisites`.
*   **Teachers:**
    *   Responsible for creating specific learning materials within the established curriculum structure.
    *   Perform CRUD operations on **Content Items (CIs)** that they create.
    *   **Must** associate each new CI with an existing KC (selected from the list managed by Admins). The CI inherits its grade level implicitly from the chosen KC.
    *   Manage CI attributes like `type`, `content`, `metadata`, `difficulty`, `language`.

**2. Interface Requirements:**

*   **Admin Dashboard:**
    *   **Knowledge Component Management View:**
        *   Display a table/list of all KCs.
        *   Columns: ID, Name, Description, Grade Level, Curriculum Code.
        *   Features: Sorting, Filtering (especially by `grade_level`), Search.
        *   Actions: Buttons/links for "Create New KC", "Edit", "Delete".
    *   **Knowledge Component Form (Create/Edit):**
        *   Input fields for `name`, `description`, `curriculum_code`.
        *   Dropdown/Number input for `grade_level` (e.g., allowing selection of 3, 4, etc.).
        *   Input for `prerequisites` (potentially a more complex UI depending on how prerequisites are structured).
        *   Save/Cancel buttons.
*   **Teacher Dashboard (New Section/Tab, e.g., "Content Authoring"):**
    *   **Knowledge Component Browser:**
        *   Display a list/tree view of KCs, filterable by `grade_level`.
        *   Allows teachers to see the available curriculum structure they can create content for.
    *   **My Content Items View:**
        *   Display a table/list of CIs created *by the logged-in teacher*.
        *   Columns: ID, Title/Type, Associated KC Name, Difficulty, Language.
        *   Features: Sorting, Filtering (by KC), Search.
        *   Actions: Buttons/links for "Create New CI", "Edit", "Delete".
    *   **Content Item Form (Create/Edit):**
        *   **Crucial:** A dropdown or searchable selector to choose the parent **Knowledge Component**. This list should be populated from the KCs managed by Admins.
        *   Input fields for `type` (e.g., multiple_choice, fill_in_blank), `content` (the actual question/text), `metadata` (e.g., options for multiple choice), `difficulty`, `language`.
        *   Save/Cancel buttons.

**3. Backend API Endpoints (Conceptual):**

*   **Admin-Specific (Requires Admin Role):**
    *   `POST /api/admin/knowledge-components`: Create a new KC.
    *   `PUT /api/admin/knowledge-components/:id`: Update an existing KC.
    *   `DELETE /api/admin/knowledge-components/:id`: Delete a KC.
*   **Teacher-Specific (Requires Teacher Role):**
    *   `POST /api/teacher/content-items`: Create a new CI (must include `knowledge_component_id` in the request body). Backend should verify the teacher owns the CI being created/modified.
    *   `PUT /api/teacher/content-items/:id`: Update a CI owned by the teacher.
    *   `DELETE /api/teacher/content-items/:id`: Delete a CI owned by the teacher.
*   **Shared (Requires Teacher or Admin Role):**
    *   `GET /api/knowledge-components`: List KCs (for browsing/selection, supports filtering by `grade_level`).
    *   `GET /api/knowledge-components/:id`: Get details of a specific KC.
    *   `GET /api/teacher/content-items`: List CIs created by the logged-in teacher.
    *   `GET /api/content-items/:id`: Get details of a specific CI (potentially needed for display/linking). *Access control might be needed here.*

**4. Data Model:**

*   No immediate changes required based on this plan, as `grade_level` exists on `KnowledgeComponent`.

**Diagram: Content Management Flow (Hybrid Model)**

```mermaid
graph LR
    subgraph Admin Tasks
        A1[Login as Admin] --> A2{Admin Dashboard};
        A2 --> A3[Manage KCs];
        A3 -- CRUD --> KC[Knowledge Components DB];
        KC -- Set Grade Level --> KC;
    end

    subgraph Teacher Tasks
        T1[Login as Teacher] --> T2{Teacher Dashboard};
        T2 --> T3[Browse KCs by Grade];
        T3 --> KC;
        T2 --> T4[Manage My CIs];
        T4 -- CRUD --> CI[Content Items DB];
        T4 -- Link to KC --> KC;
    end

    Admin[Admin User] --> A1;
    Teacher[Teacher User] --> T1;

    CI -- Belongs to --> KC;