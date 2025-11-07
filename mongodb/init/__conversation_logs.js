// 使用資料庫
db = db.getSiblingDB('Chatbot');

db.createCollection("conversation_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "對話紀錄",
      required: ["participants", "messages", "sent_at", "createdAt"],
      additionalProperties: false,
      properties: {
        // 統一的參與者清單（至少要有一位 sender）
        participants: {
          bsonType: "array",
          minItems: 1,
          description: "對話參與者（含發送者與接收者）",
          items: {
            bsonType: "object",
            required: ["type", "id", "role"],
            additionalProperties: false,
            properties: {
              type: { enum: ["user", "bot"], description: "參與者型別" },
              id:   { bsonType: "string", minLength: 1, description: "對應 user_id 或 bot_id" },
              role: { enum: ["sender", "recipient"], description: "身份：發送者或接收者" }
            }
          }
        },

        // 內容（可延續你先前的多型 message 結構）
        messages: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["type", "payload"],
            additionalProperties: false,
            properties: {
              type: { enum: ["text", "image", "video", "file", "sticker", "flex", "meta"], description: "訊息型別" },
			  payload: {
                bsonType: "object"   // 不定義 properties / oneOf，內部完全開放
                // （additionalProperties 預設為 true）
              }
            }
          }
        },

        source: {
          bsonType: "object",
          required: ["type", "platform_id", "source_id"],
          additionalProperties: false,
          properties: {
            type:        { bsonType: "string" },
            platform: { bsonType: "string" },
            source_id:   { bsonType: "string" }
          }
        },
		quoteToken: { bsonType: ["string","null"] }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

db.runCommand({
  collMod: "conversation_logs",
  validator: {
    $and: [
      // 既有的 JSON Schema
      {
        $jsonSchema: {
          bsonType: "object",
          required: ["participants", "messages", "sent_at", "createdAt"],
          additionalProperties: false,
          properties: { /* 與上方相同，略 */ }
        }
      },
      // 追加：participants 至少有一位 sender
      {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$participants",
                  as: "p",
                  cond: { $eq: ["$$p.role", "sender"] }
                }
              }
            },
            0
          ]
        }
      }
    ]
  },
  validationLevel: "moderate",
  validationAction: "error"
});


// 依任一參與者（user 或 bot）+ 時間列出對話
db.conversation_logs.createIndex(
  { "participants.id": 1, "participants.type": 1, "sent_at": -1 },
  { name: "ix_participant_id_type_sentAt" }
);

// 依 thread 瀏覽
db.conversation_logs.createIndex(
  { thread_id: 1, sent_at: -1 },
  { name: "ix_thread_sentAt" }
);

// 依來源（平台/來源 id）快速篩選
db.conversation_logs.createIndex(
  { "source.platform_id": 1, "source.source_id": 1, "sent_at": -1 },
  { name: "ix_source_sentAt" }
);

// 依建立時間排序（後台批次或審計常用）
db.conversation_logs.createIndex(
  { createdAt: -1 },
  { name: "ix_created_desc" }
);
