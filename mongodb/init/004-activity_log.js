// 使用資料庫
db = db.getSiblingDB('Chatbot');

// 重新建立 collection（包含 _id 欄位於 Schema 中）
db.createCollection("activity_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "行為歷史紀錄（string UUID 版）",
      required: ["activity_id", "activity_type", "occurred_at"],
      additionalProperties: false,
      properties: {
        // MongoDB 預設主鍵（自動產生 ObjectId）
        _id: {
          bsonType: "objectId",
          description: "MongoDB 預設主鍵（ObjectId）"
        },

        // 必填：事件唯一 ID（UUID 字串，建議 v4）
        activity_id: {
          bsonType: "string",
          description: "事件唯一 ID（UUID 字串）",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
        },

        // 選填：事件鏈結 ID（同一鏈共用；若提供須為 UUID 字串）
        chain_id: {
          bsonType: "string",
          description: "事件鏈結 ID（UUID 字串；同一鏈相同）",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
        },

        // 必填：事件型別
        activity_type: {
          bsonType: "string",
          description: "事件型別（chat/event/action/system/error/metric…）"
        },

        // 必填：事件發生時間（UTC 建議）
        occurred_at: {
          bsonType: "date",
          description: "事件實際發生時間（UTC）"
        },

        // ✅ 新增：參與者（字串陣列）
        // 建議放入欲查詢的 user_id / bot_id（可直接放原始 ID，或用 "user:<id>" / "bot:<id>" 命名空間避免衝突）
        participants: {
          bsonType: "array",
          description: "參與者 ID 清單（user_id 與/或 bot_id 的字串）",
          minItems: 1,
          items: {
            bsonType: "string",
            description: "單一參與者 ID（非空字串）",
            minLength: 1
          }
        },

        // 選填：事件細節（僅允許 object 或 array）
        details: {
          bsonType: ["object", "array"],
          description: "各型別事件的自定義巢狀資料（僅 object/array）"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// 1) activity_id 唯一（單筆查詢）
db.activity_logs.createIndex(
  { activity_id: 1 },
  { name: "ux_activity_id", unique: true }
);

// 2) 同鏈事件倒序（同一 chain 瀏覽最新）
db.activity_logs.createIndex(
  { chain_id: 1, occurred_at: -1 },
  {
    name: "ix_chain_occ_desc",
    partialFilterExpression: { chain_id: { $exists: true, $type: "string" } }
  }
);

// 3) 依型別 + 時間的常規查詢/報表
db.activity_logs.createIndex(
  { activity_type: 1, occurred_at: -1 },
  { name: "ix_type_occ_desc" }
);

// ✅ 4) 參與者 + 時間倒序（主力索引，用於 array membership）
// MongoDB 對陣列欄位會做 multikey index，支援 $in / 直接等值（陣列包含值）查詢
db.activity_logs.createIndex(
  { participants: 1, occurred_at: -1 },
  {
    name: "ix_participants_occ_desc",
    partialFilterExpression: { participants: { $type: "array" } }
  }
);

