// 使用資料庫
db = db.getSiblingDB('Chatbot');

// 重新建立 user_info（若已存在請先刪除或改用 collMod）
db.createCollection("user_info", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      description: "使用者基本資料（精簡版）",
      required: ["user_id", "createdAt", "updatedAt"],
      additionalProperties: false,
      properties: {
        // 1) 基本識別
        user_id: {
          bsonType: "string",
          description: "UUID（字串）",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
        },
        user_name: { bsonType: ["string","null"], description: "使用者名稱（真實/正式名稱）", minLength: 1 },

        // ✅ 新增：使用者暱稱（顯示名稱）
        user_nickname: {
          bsonType: ["string","null"],
          description: "使用者暱稱（顯示名稱，與 user_name 區分）",
          minLength: 1,
          maxLength: 64,
          pattern: "^(?!\\s+$).+" // 若非空，避免全空白
        },

        user_summary: { bsonType: ["string","null"], description: "使用者簡述 / 備註" },

        // 2) 聯絡方式
        email: {
          bsonType: ["string","null"],
          description: "電子郵件（可為 null）",
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        },
        phone: {
          bsonType: ["string","null"],
          description: "電話（可為 null，可存 E.164，如 +8869...）",
          maxLength: 32
        },

        // 3) 偏好與在地化
        locale: {
          bsonType: ["string","null"],
          description: "語系（例如 zh-TW, en-US）",
          pattern: "^[a-z]{2}(-[A-Z]{2})?$"
        },
        timezone: {
          bsonType: ["string","null"],
          description: "IANA 時區（例：Asia/Taipei）",
          maxLength: 64
        },
        preferences: {
          bsonType: "object",
          description: "偏好設定（皆選填）",
          additionalProperties: false,
          properties: {
            theme: { bsonType: ["string","null"], description: "主題（light/dark/auto 等）", maxLength: 16 },
            notifications: {
              bsonType: "object",
              description: "通知偏好",
              additionalProperties: false,
              properties: {
                email: { bsonType: ["bool","null"], description: "Email 通知" },
                sms: { bsonType: ["bool","null"], description: "簡訊通知" },
                line: { bsonType: ["bool","null"], description: "LINE 通知" },
                push: { bsonType: ["bool","null"], description: "App Push 通知" }
              }
            },
            language_priority: {
              bsonType: ["array","null"],
              description: "語言偏好優先序（如 [\"zh-TW\",\"en-US\"]）",
              items: { bsonType: "string" },
              maxItems: 8
            }
          }
        },

        // 4) 檔案與生日
        avatar_url: { bsonType: ["string","null"], description: "頭像 URL", maxLength: 1024 },
        birthday: { bsonType: ["date","null"], description: "生日（可為 null）" },

        // 5) 地址
        address: {
          bsonType: "object",
          description: "地址資訊",
          additionalProperties: false,
          properties: {
            country: { bsonType: ["string","null"], description: "國家/地區", maxLength: 64 },
            region:  { bsonType: ["string","null"], description: "州/省/縣市", maxLength: 64 },
            city:    { bsonType: ["string","null"], description: "城市/區", maxLength: 64 },
            postal_code:  { bsonType: ["string","null"], description: "郵遞區號", maxLength: 16 },
            address_line: { bsonType: ["string","null"], description: "地址詳細", maxLength: 256 }
          }
        },

        // 6) 角色與標籤
        roles: {
          bsonType: ["array","null"],
          description: "角色（student/teacher/admin/parent/staff/guest 等）",
          items: { bsonType: "string" },
          maxItems: 16
        },
        tags: {
          bsonType: ["array","null"],
          description: "使用者標籤（關鍵字、群組、興趣等）",
          items: { bsonType: "string" },
          maxItems: 64
        },

        // 7) 狀態、軟刪
        status: {
          bsonType: ["string","null"],
          description: "帳號狀態（active/inactive/blocked 等）",
          enum: ["active","inactive","blocked", null]
        },
        deletedAt: { bsonType: ["date","null"], description: "軟刪除時間（null 代表未刪）" },

        // 8) 互動統計
        stats: {
          bsonType: "object",
          description: "使用統計（皆選填）",
          additionalProperties: false,
          properties: {
            loginCount:  { bsonType: ["int","null"], description: "登入次數", minimum: 0 },
            lastLoginAt: { bsonType: ["date","null"], description: "最近登入時間" },
            lastActiveAt:{ bsonType: ["date","null"], description: "最近活躍時間" }
          }
        },

        // 9) 彈性欄位
        metadata: {
          bsonType: ["object","null"],
          description: "彈性擴充用，不做嚴格驗證",
          additionalProperties: true
        },

        // 10) 時戳
        createdAt: { bsonType: "date", description: "創建時間（ISO Date）" },
        updatedAt: { bsonType: "date", description: "更新時間（ISO Date）" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// ── 索引設定 ─────────────────────────────────────────────────────

// 1) user_id 唯一
db.user_info.createIndex(
  { user_id: 1 },
  { unique: true, name: "uniq_user_id" }
);

// 2) email 唯一（僅對存在且為 string 的文件）
db.user_info.createIndex(
  { email: 1 },
  {
    unique: true,
    name: "uniq_email",
    partialFilterExpression: { email: { $type: "string" } }
  }
);

// 3) 文字搜尋：名稱 / 暱稱 / 摘要 / 標籤
db.user_info.createIndex(
  { user_name: "text", user_nickname: "text", user_summary: "text", tags: "text" },
  { name: "txt_name_nickname_summary_tags", default_language: "none" }
);

// 4) 最近活躍時間（排序用）
db.user_info.createIndex(
  { "stats.lastActiveAt": -1 },
  { name: "idx_lastActiveAt_desc" }
);

// 5) 狀態查詢
db.user_info.createIndex(
  { status: 1 },
  { name: "idx_status" }
);
