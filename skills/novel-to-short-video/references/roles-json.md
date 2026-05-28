# `roles.json` Definition

Use this schema when creating or updating:

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
- Keep `id` stable across all scenes and future updates.
- Reuse existing character entries first; append only missing roles.
- If there are no recurring roles, still create:

```json
{"characters": []}
```

Use this shared file so short-video and long-video skills can reuse the same role definitions within one project.
