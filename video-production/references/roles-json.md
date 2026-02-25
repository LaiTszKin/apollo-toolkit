# `roles.json` Definition

Use this schema when preparing recurring-role prompts:

- `<project_dir>/roles/roles.json`

## JSON Shape

```json
{
  "characters": [
    {
      "id": "lin_xia",
      "name": "Lin Xia",
      "appearance": "short black hair, amber eyes, slim build",
      "outfit": "dark trench coat, silver pendant, leather boots",
      "description": "standing calmly, observant expression"
    }
  ]
}
```

## Rules

- Top-level key must be `characters` (array).
- If the file does not exist, create `roles.json` first with this schema before prompt generation.
- Each character entry must include:
  - `id`
  - `name`
  - `appearance`
  - `outfit`
  - `description`
- Reuse existing role entries first; add only missing roles.
- Keep role `id` stable so prompts can reference the same character across scenes.
- If there are no recurring roles, use:

```json
{"characters": []}
```

Use this shared file so long-video workflows can reuse the same role definitions across runs within one project.
