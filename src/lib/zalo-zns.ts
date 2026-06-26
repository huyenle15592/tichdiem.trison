// Zalo ZNS (Zalo Notification Service) integration scaffolding.
// Khung kết nối sẵn — chỉ thực sự gửi tin khi `enabled = true` và đã điền
// Access Token + Template ID trong "Cấu hình hệ thống" (Admin).
import { supabase } from "@/lib/admin-db";
import { cardWindow, getTier, type TierThresholds, DEFAULT_THRESHOLDS } from "@/lib/loyalty";
import { fetchActivationDate } from "@/lib/activation";

export type ZnsSettings = {
  enabled: boolean;
  access_token: string;
  template_id_add: string;
  template_id_redeem: string;
};

export const DEFAULT_ZNS_SETTINGS: ZnsSettings = {
  enabled: false,
  access_token: "",
  template_id_add: "",
  template_id_redeem: "",
};

export async function loadZnsSettings(): Promise<ZnsSettings> {
  const { data } = await supabase
    .from("zns_settings" as any)
    .select("enabled, access_token, template_id_add, template_id_redeem")
    .eq("id", "singleton")
    .maybeSingle();
  if (!data) return DEFAULT_ZNS_SETTINGS;
  return {
    enabled: !!(data as any).enabled,
    access_token: (data as any).access_token ?? "",
    template_id_add: (data as any).template_id_add ?? "",
    template_id_redeem: (data as any).template_id_redeem ?? "",
  };
}

export async function saveZnsSettings(s: ZnsSettings) {
  const { error } = await supabase
    .from("zns_settings" as any)
    .upsert({ id: "singleton", ...s, updated_at: new Date().toISOString() });
  if (error) throw error;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export type AddPointsPayload = {
  kind: "add";
  customerId: string;
  name: string;
  phone: string;
  pointsAdded: number;
  totalPoints: number;
  txDate?: Date;
};

export type RedeemPayload = {
  kind: "redeem";
  customerId: string;
  name: string;
  phone: string;
  rewardName: string;
  rewardCode: string;
  pointsCost: number;
  totalPoints: number;
};

export type ZnsPayload = AddPointsPayload | RedeemPayload;

/**
 * Hàm chính kích hoạt gửi ZNS. Hiện tại chỉ "chuẩn bị payload" và log;
 * khi `enabled = true` + token hợp lệ thì gọi Zalo OA Send API.
 * Không bao giờ làm fail luồng giao dịch chính.
 */
export async function sendZaloNotification(payload: ZnsPayload, thresholds: TierThresholds = DEFAULT_THRESHOLDS): Promise<void> {
  try {
    const settings = await loadZnsSettings();

    // Chuẩn bị biến template dùng chung
    const tier = getTier(payload.totalPoints, thresholds);
    let templateData: Record<string, string> = {};
    let message = "";
    let templateId = "";

    if (payload.kind === "add") {
      const activatedAt = await fetchActivationDate(payload.customerId);
      const win = cardWindow(activatedAt);
      const txDate = formatDate(payload.txDate ?? new Date());
      templateData = {
        customer_name: payload.name,
        points_added: String(payload.pointsAdded),
        tx_date: txDate,
        total_points: String(payload.totalPoints),
        tier_name: tier.name,
        valid_through: win.validThrough,
      };
      templateId = settings.template_id_add;
      message =
        `Kính chào anh/chị ${payload.name}, Yến sào Trí Sơn thông báo bạn vừa được cộng ` +
        `+${payload.pointsAdded} điểm từ hóa đơn mua hàng ngày ${txDate}. ` +
        `Tổng điểm hiện tại: ${payload.totalPoints} điểm (Hạng ${tier.name}). ` +
        `Ngày hết hạn thẻ: ${win.validThrough}. Cảm ơn bạn!`;
    } else {
      templateData = {
        customer_name: payload.name,
        reward_name: payload.rewardName,
        reward_code: payload.rewardCode,
        points_cost: String(payload.pointsCost),
        total_points: String(payload.totalPoints),
      };
      templateId = settings.template_id_redeem;
      message =
        `Kính chào anh/chị ${payload.name}, bạn đã đổi thành công phần quà ` +
        `[${payload.rewardName}] (Mã: ${payload.rewardCode}). ` +
        `Tài khoản thành viên Trí Sơn của bạn đã trừ -${payload.pointsCost} điểm. ` +
        `Số điểm còn lại: ${payload.totalPoints} điểm. Cảm ơn bạn!`;
    }

    const request = {
      phone: payload.phone,
      template_id: templateId,
      template_data: templateData,
      tracking_id: `${payload.kind}-${payload.customerId}-${Date.now()}`,
      message,
    };

    if (!settings.enabled) {
      console.info("[ZNS] Tắt — bỏ qua gửi tin.", { kind: payload.kind, to: payload.phone, message });
      return;
    }
    if (!settings.access_token || !templateId) {
      console.warn("[ZNS] Bật nhưng thiếu Access Token / Template ID — không gửi.", { kind: payload.kind });
      return;
    }

    // Khung gọi Zalo OA ZNS — sẵn sàng kích hoạt khi có tài khoản OA.
    // Doc: https://developers.zalo.me/docs/zalo-notification-service/api/send-message-zns
    const res = await fetch("https://business.openapi.zalo.me/message/template", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: settings.access_token,
      },
      body: JSON.stringify({
        phone: request.phone,
        template_id: request.template_id,
        template_data: request.template_data,
        tracking_id: request.tracking_id,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json && json.error && json.error !== 0)) {
      console.error("[ZNS] Gửi thất bại", json);
    } else {
      console.info("[ZNS] Đã gửi", json);
    }
  } catch (err) {
    // Không bao giờ làm fail giao dịch gốc vì ZNS
    console.error("[ZNS] Lỗi:", err);
  }
}
