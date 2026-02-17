export default {
  "name": "Bid",
  "type": "object",
  "properties": {
    "startup_id": {
      "type": "string",
      "description": "Startup being bid on"
    },
    "team_id": {
      "type": "string",
      "description": "Team placing the bid"
    },
    "amount": {
      "type": "number",
      "description": "Bid amount in lakhs"
    },
    "is_winning": {
      "type": "boolean",
      "default": false
    },
    "round": {
      "type": "number",
      "description": "Auction round number"
    }
  },
  "required": [
    "startup_id",
    "team_id",
    "amount"
  ]
};