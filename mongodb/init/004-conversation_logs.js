// 使用資料庫
db = db.getSiblingDB('Chatbot');

// 建立對話紀錄 collection（含完整驗證）
db.createCollection("conversation_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "對話紀錄文件",
      required: ["sender_id", "recipient_ids", "source", "messages", "sent_at"],
      properties: {
        sender_id: {
          bsonType: "string",
          description: "發送者的唯一識別 ID（平台內或自有系統 ID）"
        },
        recipient_ids: {
          bsonType: "array",
          description: "接收者 ID 陣列（可包含多位接收者）",
          minItems: 1,
          items: {
            bsonType: "string",
            description: "接收者的唯一識別 ID"
          }
        },
        source: {
          bsonType: "object",
          description: "訊息來源的上下文（會話類型、平台與來源識別）",
          required: ["type", "platform_id", "source_id"],
          properties: {
            type: {
              enum: ["group", "room", "direct"],
              description: "會話類型：group=群組、room=群聊房、direct=單獨對話"
            },
            platform_id: {
              bsonType: "string",
              description: "來源平台識別（例如 line / slack / web）"
            },
            source_id: {
              bsonType: "string",
              description: "平台上的來源 ID（群組/房間/使用者/SESSION 等）"
            }
          },
          additionalProperties: false
        },
        messages: {
          bsonType: "array",
          description: "訊息物件陣列（每一則訊息皆含型別與對應內容）",
          minItems: 1,
          items: {
            bsonType: "object",
            description: "單一訊息物件",
            required: ["type", "payload"],
            properties: {
              type: {
                enum: ["text", "image", "video"],
                description: "訊息型別：text / image / video"
              },
              payload: {
                bsonType: "object",
                description: "依訊息型別定義的內容載荷",
                oneOf: [
                  {
                    // text payload
                    required: ["text"],
                    properties: {
                      text: {
                        bsonType: "string",
                        description: "文字訊息內容（純文字）",
                        minLength: 1
                      }
                    },
                    additionalProperties: false,
                    description: "文字訊息的內容結構"
                  },
                  {
                    // image payload（僅使用 description；無 alt）
                    properties: {
                      image_url: {
                        bsonType: "string",
                        description: "圖片的可公開或受控 URL（與 image_base64 擇一必填）"
                      },
                      image_base64: {
                        bsonType: "string",
                        description: "圖片 Base64 字串（與 image_url 擇一必填，建議改存檔案服務以免文件過大）"
                      },
                      description: {
                        bsonType: "string",
                        description: "圖片描述（給人看的較長說明、情境或步驟）"
                      }
                    },
                    oneOf: [
                      { required: ["image_url"] },
                      { required: ["image_base64"] }
                    ],
                    additionalProperties: false,
                    description: "圖片訊息的內容結構"
                  },
                  {
                    // video payload
                    required: ["video_url"],
                    properties: {
                      video_url: {
                        bsonType: "string",
                        description: "影片的可播放 URL（建議外部物件儲存服務）"
                      },
                      description: {
                        bsonType: "string",
                        description: "影片描述（內容摘要或補充說明）"
                      }
                    },
                    additionalProperties: false,
                    description: "影片訊息的內容結構"
                  }
                ]
              }
            },
            additionalProperties: false
          }
        },
        sent_at: {
          bsonType: "date",
          description: "訊息實際發送時間（ISO Date）"
        },
        reply_to_id: {
          bsonType: ["string", "null"],
          description: "被回覆訊息的內部 ID 或平台訊息 ID（無則為 null）"
        },
        createdAt: {
          bsonType: ["date", "null"],
          description: "文件建立時間（由應用層或觸發器寫入）"
        }
        // 注意：依你的要求，未包含 updatedAt 欄位
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// 建立常用索引（含 recipient_ids 的 multikey 索引）
db.conversation_logs.createIndex(
  { "source.platform_id": 1, "source.type": 1, "source.source_id": 1, sent_at: -1 },
  { name: "src_platform_type_id_sentAt" }
);
db.conversation_logs.createIndex({ sender_id: 1, sent_at: -1 }, { name: "sender_time" });
db.conversation_logs.createIndex({ recipient_ids: 1, sent_at: -1 }, { name: "recipient_time" }); // multikey
db.conversation_logs.createIndex({ "messages.type": 1, sent_at: -1 }, { name: "msgType_time" });
db.conversation_logs.createIndex({ sent_at: -1 }, { name: "time_desc" });
