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