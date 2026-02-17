export default {
  "name": "PowerCard",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Power card name"
    },
    "type": {
      "type": "string",
      "enum": [
        "right_to_match",
        "stealth_bid",
        "double_down",
        "veto",
        "wildcard",
        "budget_boost"
      ],
      "description": "Card type"
    },
    "description": {
      "type": "string"
    },
    "team_id": {
      "type": "string",
      "description": "Assigned team"
    },
    "status": {
      "type": "string",
      "enum": [
        "available",
        "active",
        "used",
        "disabled"
      ],
      "default": "available"
    },
    "effect_value": {
      "type": "number",
      "description": "Multiplier or bonus value"
    }
  },
  "required": [
    "name",
    "type"
  ]
};