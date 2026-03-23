import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import bannersRouter from "./banners.js";
import storesRouter from "./stores.js";
import productsRouter from "./products.js";
import offersRouter from "./offers.js";
import searchRouter from "./search.js";
import reviewsRouter from "./reviews.js";
import adminRouter from "./admin.js";
import uploadRouter from "./upload.js";
import favoritesRouter from "./favorites.js";
import cronRouter from "./cron.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stats", statsRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/banners", bannersRouter);
router.use("/stores", storesRouter);
router.use("/vendor/products", productsRouter);
router.use("/products/offers", offersRouter);
router.use("/search", searchRouter);
router.use("/reviews", reviewsRouter);
router.use("/admin", adminRouter);
router.use("/upload", uploadRouter);
router.use("/favorites", favoritesRouter);
router.use("/cron", cronRouter);

export default router;
