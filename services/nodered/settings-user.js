module.exports = {
  flowFile: "flows-user.json",
  credentialSecret: process.env.NODERED_USER_CREDENTIAL_SECRET,
  httpAdminRoot: "/nodered-user",
  httpNodeRoot: "/nodered-user/api",
  adminAuth: {
    type: "credentials",
    users: [
      {
        username: process.env.NODERED_USER_ADMIN_USER || "user",
        password: process.env.NODERED_USER_PASSWORD_HASH,
        permissions: "*",
      },
    ],
  },
};
