export default {
  "name": "BreakingNews",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "affected_domains": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "multiplier": {
      "type": "number",
      "description": "Value multiplier effect"
    },
    "status": {
      "type": "string",
      "enum": [
        "draft",
        "scheduled",
        "announced"
      ],
      "default": "draft"
    },
    "scheduled_time": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "title",
    "description"
  ]
};