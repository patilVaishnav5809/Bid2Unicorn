export default {
  "name": "Startup",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Startup name"
    },
    "logo_url": {
      "type": "string",
      "description": "Logo image URL"
    },
    "domain": {
      "type": "string",
      "enum": [
        "fintech",
        "healthtech",
        "edtech",
        "ecommerce",
        "saas",
        "ai_ml",
        "cleantech",
        "gaming",
        "logistics",
        "social"
      ],
      "description": "Business domain"
    },
    "description": {
      "type": "string",
      "description": "Brief description"
    },
    "base_price": {
      "type": "number",
      "description": "Base auction price in lakhs"
    },
    "current_price": {
      "type": "number",
      "description": "Current highest bid price"
    },
    "status": {
      "type": "string",
      "enum": [
        "upcoming",
        "active",
        "sold",
        "unsold"
      ],
      "default": "upcoming"
    },
    "winning_team_id": {
      "type": "string",
      "description": "ID of the team that won the bid"
    },
    "order": {
      "type": "number",
      "description": "Auction order number"
    }
  },
  "required": [
    "name",
    "domain",
    "base_price"
  ]
};