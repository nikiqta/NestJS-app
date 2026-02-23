export default () => ({
  port: process.env.PORT,
  db: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  },
});
