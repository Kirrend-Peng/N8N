db = db.getSiblingDB('Chatbot');
db.createView(
  "actors_view",
  "user_info",
  [
    { $project: { _id: 0, type: { $literal: "user" }, id: "$user_id", name: "$user_name" } },
    {
      $unionWith: {
        coll: "chatbot_info",
        pipeline: [
          { $project: { _id: 0, type: { $literal: "bot" }, id: "$bot_id", name: "$name" } }
        ]
      }
    }
  ]
);
