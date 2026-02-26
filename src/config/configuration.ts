export default () => ({
  port: process.env.PORT,
  db: {
    uri: process.env.MONGO_DB_URI,
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  },
});
