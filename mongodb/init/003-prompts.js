db = db.getSiblingDB('Chatbot');

db.createCollection("prompts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatbot_id", "title", "purpose", "content", "createdAt", "updatedAt"],
      properties: {
        chatbot_id: { bsonType: "string", minLength: 1, description: "對應 chatbot_info.bot_id" },

        title:     { bsonType: "string", minLength: 1 },
        purpose:   { bsonType: "string", minLength: 1 },
        content:   { bsonType: "string", minLength: 1 },

        variables: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name"],
            properties: {
              name:        { bsonType: "string", minLength: 1 },
              type:        { enum: ["string","number","boolean","datetime","date","time","object","array","any"] },
              description: { bsonType: "string" },
              default:     {}
            }
          }
        },

        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// 索引：同一個 chatbot 內，title+purpose 必須唯一
db.prompts.createIndex({ chatbot_id: 1, purpose: 1, title: 1 }, { unique: true });

// 常用查詢索引
db.prompts.createIndex({ chatbot_id: 1 });
db.prompts.createIndex({ purpose: 1 });
db.prompts.createIndex({ updatedAt: -1 });

db.prompts.createIndex({ purpose: 1, title: 1 }, { unique: true });
db.prompts.createIndex({ purpose: 1 });
db.prompts.createIndex({ updatedAt: -1 });

db.prompts.insertOne({
  chatbot_id: "woofwoof", // 這要放 chatbot_info.bot_id
  title: "每日推播",
  purpose: "broadcast_daily",
  content: "根據時間早、中、晚回覆勉勵、慰問的話,簡短回覆繁體中文",
  createdAt: new Date(),
  updatedAt: new Date()
});
