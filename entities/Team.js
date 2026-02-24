export default {
  "name": "Team",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Team name"
    },
    "logo_url": {
      "type": "string",
      "description": "Team logo URL"
    },
    "total_budget": {
      "type": "number",
      "description": "Total budget in lakhs"
    },
    "spent": {
      "type": "number",
      "default": 0,
      "description": "Amount spent"
    },
    "is_online": {
      "type": "boolean",
      "default": false
    },
    "last_login_at": {
      "type": "string",
      "description": "Timestamp of last login"
    },
    "last_active_at": {
      "type": "string",
      "description": "Timestamp of last activity (heartbeat)"
    },
    "status": {
      "type": "string",
      "enum": ["online", "away", "offline"],
      "default": "offline",
      "description": "Current user status"
    },
    "members": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Team member emails"
    }
  },
  "required": [
    "name",
    "total_budget"
  ]
};