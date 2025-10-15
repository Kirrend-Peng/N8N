// 使用資料庫
db = db.getSiblingDB('Chatbot');

// 建立 user_info（含驗證）
db.createCollection("user_info", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "使用者基本資料",
      required: ["user_id", "user_name", "createdAt", "updatedAt"],
      properties: {
        user_id: {
          bsonType: "string",
          description: "UUID（字串）",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
        },
        user_name: {
          bsonType: "string",
          description: "使用者名稱",
          minLength: 1
        },
        line_user_id: {
          bsonType: ["string","null"],
          description: "LINE 使用者 ID（可為 null）"
        },
        user_summary: {
          bsonType: ["string","null"],
          description: "使用者簡述 / 備註"
        },
        createdAt: {
          bsonType: "date",
          description: "創建時間（ISO Date）"
        },
        updatedAt: {
          bsonType: "date",
          description: "更新時間（ISO Date）"
        }
      },
      additionalProperties: false
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// 索引
db.user_info.createIndex({ user_id: 1 }, { unique: true, name: "uniq_user_id" });
// line_user_id 僅在為字串時才需唯一
db.user_info.createIndex(
  { line_user_id: 1 },
  { unique: true, name: "uniq_line_user_id", partialFilterExpression: { line_user_id: { $type: "string" } } }
);
db.user_info.createIndex({ user_name: 1 }, { name: "idx_user_name" });

// 插入一筆範例（把 UUID 換成你的值）
db.user_info.insertOne({
  user_id: "9f2bbf2b-7a2d-4d2b-a9e1-3a6f0c2e8b11",
  user_name: "王小明",
  line_user_id: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // 沒有就填 null
  user_summary: "喜歡健走與攝影的銀髮族學員",
  createdAt: new Date(),
  updatedAt: new Date()
});
