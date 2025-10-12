db = db.getSiblingDB('Chatbot');

db.createCollection("prompts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "purpose", "content", "createdAt", "updatedAt"],
      properties: {
        title:     { bsonType: "string", minLength: 1 },
        purpose:   { bsonType: "string", minLength: 1 },
        content:   { bsonType: "string", minLength: 1 },
        variables: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name"],              // 仍只強制 name；type/description 可選（也可改成 required）
            properties: {
              name:        { bsonType: "string", minLength: 1 },
              type:        { enum: ["string","number","boolean","datetime","date","time","object","array","any"] },
              description: { bsonType: "string" },
              default:     {}                 // 任意型別
            }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.prompts.createIndex({ purpose: 1, title: 1 }, { unique: true });
db.prompts.createIndex({ purpose: 1 });
db.prompts.createIndex({ updatedAt: -1 });

db.prompts.insertOne({
  title: "每日推播",
  purpose: "broadcast_daily",
  content: "貼心有元氣的助理, 根據時間回覆勉勵的話、慰問的話回覆少於30字的繁體中文",
  createdAt: new Date(),
  updatedAt: new Date()
});
