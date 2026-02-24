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
        "double_value",
        "steal_startup",
        "freeze_budget",
        "emergency_budget",
        "reverse_auction",
        "block_team",
        "insider_info",
        "wild_card"
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