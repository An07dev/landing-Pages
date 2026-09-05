import nodemailer from 'nodemailer';
import { connectToDatabase } from './mongodb';
import { SystemConfig } from '@/models/SystemConfig';

export interface SendLicenseEmailParams {
  toEmail: string;
  buyerName: string;
  buyerPhone?: string;
  orderCode: string;
  licenseKey: string;
  plan: string;
  amount: number;
}

export interface EmailResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

export function generateLicenseEmailHtml(params: {
  buyerName: string;
  orderCode: string;
  licenseKey: string;
  plan: string;
  amount: number;
  downloadUrl: string;
  hotline: string;
  docsUrl: string;
  bannerTitle?: string;
  introText?: string;
}): string {
  const planName =
    params.plan === '799k'
      ? 'Gói Setup & Cài Đặt Trọn Gói A-Z (799K)'
      : 'Gói Bán Hàng Ngoại Sàn Tự Cài Đặt (399K)';
  const bannerTitle = params.bannerTitle || 'XÁC NHẬN BÀN GIAO MÃ NGUỒN & BẢN QUYỀN';
  const introText =
    params.introText ||
    `Hệ thống ShopBig đã ghi nhận giao dịch thanh toán thành công cho đơn hàng <strong>#${params.orderCode}</strong>. Chúng tôi xin trân trọng gửi tới bạn thông tin bản quyền và đường link tải trọn bộ mã nguồn:`;

  const formattedAmount = params.amount
    ? `${params.amount.toLocaleString('vi-VN')}₫`
    : (params.plan === '799k' ? '799.000₫' : '399.000₫');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bàn Giao Mã Nguồn & Bản Quyền ShopBig</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f1f5f9;">
  
  <!-- MAIN WRAPPER TABLE -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <!-- CONTAINER -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border: 1px solid #1f293d; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- HEADER BANNER -->
          <tr>
            <td style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%); padding: 36px 28px; text-align: center;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #ffffff; margin-bottom: 12px;">
                      ✓ THANH TOÁN THÀNH CÔNG • XÁC THỰC 100%
                    </div>
                    <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; line-height: 1.3;">
                      ${bannerTitle}
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #e0e7ff; opacity: 0.95;">
                      Nền Tảng Bán Hàng Ngoại Sàn Tự Động Hóa ShopBig
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              
              <!-- GREETING -->
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #f8fafc;">
                Kính gửi <strong>${params.buyerName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.65; color: #cbd5e1;">
                ${introText}
              </p>

              <!-- LICENSE KEY BOX -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0; background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%); border: 1.5px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td align="center" style="padding: 16px 12px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 8px;">
                      🔑 MÃ BẢN QUYỀN HỆ THỐNG (LICENSE KEY)
                    </div>
                    <div style="display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 22px; font-weight: 800; color: #38bdf8; background: #0b0f19; padding: 10px 20px; border-radius: 8px; letter-spacing: 0.08em; border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
                      ${params.licenseKey}
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 10px; line-height: 1.4;">
                      Mã bản quyền định danh chính thức cấp quyền quản trị trọn đời cho chủ shop.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- DOWNLOAD CALL TO ACTION -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${params.downloadUrl}" target="_blank" style="display: block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; text-align: center; padding: 15px 24px; border-radius: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); letter-spacing: 0.02em;">
                      📥 TẢI TRỌN BỘ MÃ NGUỒN (GOOGLE DRIVE)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK -->
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #64748b; text-align: center; word-break: break-all;">
                Nếu không bấm được nút trên, vui lòng copy link: <a href="${params.downloadUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${params.downloadUrl}</a>
              </p>

              <!-- ORDER SUMMARY TABLE -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1a2234; border: 1px solid #28334e; border-radius: 10px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td colspan="2" style="background-color: #202b42; padding: 10px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #cbd5e1; border-bottom: 1px solid #28334e;">
                    📋 Chi Tiết Đơn Hàng & Giao Dịch
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #232d44; width: 40%;">Mã đơn hàng:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 700; color: #f8fafc; border-bottom: 1px solid #232d44;">#${params.orderCode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #232d44;">Gói bản quyền:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #a5b4fc; border-bottom: 1px solid #232d44;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #232d44;">Số tiền thanh toán:</td>
                  <td style="padding: 10px 16px; font-size: 14px; font-weight: 800; color: #34d399; border-bottom: 1px solid #232d44;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 13px; color: #94a3b8;">Trạng thái:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: 700; color: #38bdf8;">✓ Đã kích hoạt & Sở hữu trọn đời</td>
                </tr>
              </table>

              <!-- SUPPORT & ASSISTANCE CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.02); border: 1px solid #232d44; border-radius: 10px; padding: 16px; margin: 20px 0 8px 0;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">
                      🤝 Kênh Hỗ Trợ Kỹ Thuật & Tài Liệu:
                    </div>
                    <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                      • <strong>Hotline / Zalo hỗ trợ:</strong> <span style="color: #38bdf8; font-weight: 700;">${params.hotline}</span><br>
                      • <strong>Tài liệu hướng dẫn:</strong> <a href="${params.docsUrl}" target="_blank" style="color: #38bdf8; text-decoration: none;">${params.docsUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0b0f19; border-top: 1px solid #1f293d; padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                🛡️ <em>Lưu ý bảo mật:</em> Quý khách vui lòng lưu giữ mã bản quyền và mã nguồn cẩn thận. Không chia sẻ mã này cho người lạ.
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569;">
                © 2026 <strong>ShopBig Platform</strong>. Nền tảng bán hàng ngoại sàn tự động hóa 100%.
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

export async function sendLicenseEmail(params: SendLicenseEmailParams): Promise<EmailResult> {
  const { toEmail, buyerName, orderCode, licenseKey, plan, amount } = params;

  if (!toEmail || !toEmail.includes('@')) {
    return {
      success: false,
      error: 'Địa chỉ email không hợp lệ',
    };
  }

  let dbConfig = null;
  try {
    await connectToDatabase();
    dbConfig = await SystemConfig.findOne({ key: 'master_payment_config' }).lean();
  } catch (err) {
    console.warn('Could not query SystemConfig for email:', err);
  }

  const smtpHost = dbConfig?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(dbConfig?.smtpPort || process.env.SMTP_PORT || 465);
  const smtpSecure = dbConfig?.smtpSecure ?? (process.env.SMTP_SECURE !== 'false' && smtpPort === 465);
  const smtpUser = dbConfig?.smtpUser || process.env.SMTP_USER || '';
  const smtpPass = dbConfig?.smtpPass || process.env.SMTP_PASS || '';
  const smtpFrom = dbConfig?.smtpFrom || process.env.SMTP_FROM || `"ShopBig Master" <${smtpUser || 'noreply@shopbig.vn'}>`;
  const adminNotifyEmail = dbConfig?.adminNotifyEmail || '';
  const downloadUrl =
    dbConfig?.sourceCodeDownloadUrl ||
    process.env.SOURCE_CODE_DOWNLOAD_URL ||
    'https://drive.google.com/drive/folders/shopbig-source-code-full-package';
  const hotline = dbConfig?.hotlineSupport || process.env.HOTLINE_SUPPORT || '0988.888.888';
  const docsUrl = dbConfig?.docsUrl || process.env.DOCS_URL || 'https://shopbig.vn/docs/setup-guide';

  const htmlContent = generateLicenseEmailHtml({
    buyerName,
    orderCode,
    licenseKey,
    plan,
    amount,
    downloadUrl,
    hotline,
    docsUrl,
    bannerTitle: dbConfig?.emailBannerTitle,
    introText: dbConfig?.emailIntroText,
  });

  // If SMTP credentials are not yet entered, simulate and log
  if (!smtpUser || !smtpPass) {
    console.log(`[SIMULATED EMAIL] To: ${toEmail} | Key: ${licenseKey} | Order: ${orderCode}`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
    });

    const subjectTemplate = dbConfig?.emailSubjectTemplate || '[ShopBig] Bàn Giao Mã Bản Quyền & Mã Nguồn Đơn Hàng #{orderCode}';
    const finalSubject = subjectTemplate
      .replace('{orderCode}', orderCode)
      .replace('{buyerName}', buyerName)
      .replace('{licenseKey}', licenseKey)
      .replace('{plan}', plan === '799k' ? 'Gói 799K' : 'Gói 399K');

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      ...(adminNotifyEmail ? { bcc: adminNotifyEmail } : {}),
      subject: finalSubject,
      html: htmlContent,
    });

    console.log(`[EMAIL SENT] ID: ${info.messageId} to ${toEmail}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Lỗi khi gửi email bản quyền qua SMTP:', error);
    return {
      success: false,
      error: error.message || 'Lỗi gửi mail qua SMTP',
    };
  }
}
