import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../server/db/client";
import { credentials } from "../server/db/schema";
import { validateFeaturePayloadStrict, VerifyRequestSchema } from "../server/validation/requests";
import { matchOrbBasic } from "../server/matcher/orb-basic";
import type { OrbFeaturePayloadV1 } from "../src/lib/feature-schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const parsedBody = VerifyRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "无效的请求参数",
        details: parsedBody.error.flatten(),
      });
    }

    const { token, feature: queryFeature } = parsedBody.data;

    // Strict validation of query feature
    try {
      validateFeaturePayloadStrict(queryFeature);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "特征数据校验失败" });
    }

    // Retrieve credential from DB
    const rows = await db
      .select({
        secret: credentials.secret,
        featurePayload: credentials.featurePayload,
      })
      .from(credentials)
      .where(eq(credentials.token, token))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "凭证不存在" });
    }

    const { secret, featurePayload } = rows[0];
    const referenceFeature = featurePayload as OrbFeaturePayloadV1;

    // Perform ORB Hamming matching
    const matchResult = matchOrbBasic(queryFeature, referenceFeature);

    if (matchResult.matched) {
      return res.status(200).json({
        matched: true,
        secret,
      });
    } else {
      return res.status(200).json({
        matched: false,
      });
    }
  } catch (err: any) {
    console.error("验证凭证错误:", err);
    return res.status(500).json({ error: "内部服务器错误" });
  }
}
