// 001-init.js
// 這個檔會在「第一次、資料目錄為空」時被自動執行
db = db.getSiblingDB('Chatbot');              // 這行等同於使用 MONGO_INITDB_DATABASE
db.createUser({
  user: 'chatbot',
  pwd:  'iisi@641001',
  roles: [{ role: 'readWrite', db: 'Chatbot' }]
});