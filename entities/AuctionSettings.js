export default {
  "name": "AuctionSettings",
  "type": "object",
  "properties": {
    "current_round": {
      "type": "number",
      "default": 1
    },
    "round_name": {
      "type": "string"
    },
    "timer_seconds": {
      "type": "number",
      "default": 300
    },
    "timer_end_time": {
      "type": "string",
      "format": "date-time"
    },
    "is_auction_active": {
      "type": "boolean",
      "default": false
    },
    "active_startup_id": {
      "type": "string"
    },
    "current_bid_increment": {
      "type": "number",
      "default": 1
    }
  },
  "required": []
};