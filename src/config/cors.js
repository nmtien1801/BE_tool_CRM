require("dotenv").config();

const allowedOrigins = [
  process.env.REACT_URL_MAP_MEDIA, // vd: http://localhost:5173
  process.env.REACT_URL_MAP_STUDIO, // các domain FE khác nếu có
  process.env.REACT_URL
].filter(Boolean);

const configCORS = (app) => {
  app.use(function (req, res, next) {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || !origin) {
      // Nếu origin nằm trong whitelist (hoặc request từ mobile/Postman không có origin)
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else {
      // Fallback nếu không khớp
      res.setHeader(
        "Access-Control-Allow-Origin",
        process.env.REACT_URL_MAP_MEDIA || "*",
      );
    }

    // Request methods bạn muốn cho phép
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    );
    // Request tiêu đề bạn muốn cho phép
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Authorization, UserID, UserName, x-api-key",
    );
    res.setHeader("Access-Control-Allow-Credentials", true);

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
};

export default configCORS;
