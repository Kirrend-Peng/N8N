// 建立 user_identity（身分映射表）
db = db.getSiblingDB('Chatbot');
db.createCollection("user_identity", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "外部平台帳號 ↔ 內部 user_id 映射",
      required: ["user_id", "provider", "bot_id", "external_user_id", "linkedAt", "updatedAt"],
      additionalProperties: false,
      properties: {
        // 內部使用者 ID（字串 UUID）
        user_id: {
          bsonType: "string",
          description: "內部使用者全域 ID（UUID 字串）",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
        },

        // 平台（視情況擴充）
        provider: {
          enum: ["line", "messenger", "slack", "web", "custom"],
          description: "外部平台/來源"
        },

        // 你系統的 bot/渠道/租戶下的子識別（必填，避免不同 bot 外部 ID 衝突）
        bot_id: { bsonType: "string", minLength: 1, description: "對應 chatbot_info.bot_id 或渠道識別" },

        // 外部平台給的 userId（例如 LINE 的 Uxxxxx）
        external_user_id: { bsonType: "string", minLength: 1, description: "外部平台使用者 ID" },

        // 顯示資訊（可選）
        display_name: { bsonType: ["string", "null"] },
        picture_url:  { bsonType: ["string", "null"] },

        // 連結狀態
        status: { enum: ["linked", "revoked", "blocked"], description: "連結狀態", default: "linked" },

        // 時間
        linkedAt:  { bsonType: "date", description: "首次連結時間（UTC）" },
        updatedAt: { bsonType: "date", description: "最後更新時間（UTC）" },
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

db.user_identity.createIndex(
  { provider: 1, bot_id: 1, external_user_id: 1 },
  { unique: true, name: "ux_provider_bot_ext" }
);

// 2) 依內部 user_id 快速查所有外部身分
db.user_identity.createIndex(
  { user_id: 1, provider: 1, bot_id: 1 },
  { name: "ix_user_provider_bot" }
);

// 3) 常見反查：由 (provider, external_user_id) 找內部 user_id（跨 bot 也可）
db.user_identity.createIndex(
  { provider: 1, external_user_id: 1 },
  { name: "ix_provider_external" }
);

// 4) 若常以 bot 維度查（例如同 bot 的所有綁定）
db.user_identity.createIndex(
  { bot_id: 1, status: 1, updatedAt: -1 },
  { name: "ix_bot_status_updated" }
);