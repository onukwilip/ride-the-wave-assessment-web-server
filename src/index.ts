import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import cors from "cors";
import { config } from "dotenv";
import { json, urlencoded } from "body-parser";
import groups_routes from "./routes/group";

config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.use("/v1/groups", groups_routes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res
    .status(err.status || 500)
    .json({ message: err.message?.toString() || err });
  next();
});

app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});
