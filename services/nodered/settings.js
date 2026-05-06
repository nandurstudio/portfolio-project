module.exports = {
  flowFile: "flows.json",
  credentialSecret: process.env.NODERED_CREDENTIAL_SECRET,
  httpAdminRoot: "/nodered",
  httpNodeRoot: "/nodered/api",
  adminAuth: {
    type: "credentials",
    users: [
      {
        username: process.env.NODERED_ADMIN_USER || "admin",
        password: process.env.NODERED_ADMIN_PASSWORD_HASH,
        permissions: "*",
      },
    ],
  },
};
