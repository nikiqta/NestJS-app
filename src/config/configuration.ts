export default () => ({
  port: process.env.PORT,
  db: {
    uri: process.env.MONGO_DB_URI,
  },
});
