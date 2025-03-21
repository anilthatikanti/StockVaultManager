const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv"); // Import dotenv
dotenv.config();
const successColor = "\x1b[32m%s\x1b[0m";
const checkSign = "\u{2705}";

const envFile = `export const environment = {
    firebaseConfig: {
      apiKey: '${process.env.API_KEY}',
      authDomain:'${process.env.AUTH_DOMAIN}',
      projectId: '${process.env.PROJECT_ID}',
      storageBucket: '${process.env.STORAGE_BUCKET}',
      messagingSenderId: '${process.env.MESSAGE_Sender_ID}',
      appId: '${process.env.APP_ID}',
      measurementId: '${process.env.MEASUREMENT_ID}'
    },
    production: true,
    useEmulators: false,
  }

  export const WEB_APP_URL = '${process.env.WEB_APP_URL}';
export const SERVER_URL = '${process.env.SERVER_URL}';
export const Y_SERVER_URL = '${process.env.Y_SERVER_URL}';
export const WEB_SOCKET = '${process.env.WEB_SOCKET}';
`;

const targetPath = path.join(__dirname, `./src/environments/environment.ts`);
fs.writeFile(targetPath, envFile, (err) => {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.log(process.env.WEB_APP_URL);
    console.log(
      successColor,
      `${checkSign} Successfully generated environment file`
    );
  }
});
