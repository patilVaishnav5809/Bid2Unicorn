export default {
  "name": "ActivityLog",
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "bid",
        "sale",
        "power_card",
        "news",
        "wallet",
        "system"
      ],
      "description": "Log type"
    },
    "message": {
      "type": "string"
    },
    "team_id": {
      "type": "string"
    },
    "startup_id": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    },
    "is_resolved": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "type",
    "message"
  ]
};