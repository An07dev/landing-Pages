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
  const bannerTitle = params.bannerTitle || 'XÁC NHẬN BÀN GIAO MÃ NGUỒN SHOPBIG';
  const introText =
    params.introText ||
    `Hệ thống ShopBig đã ghi nhận giao dịch thanh toán thành công của bạn cho đơn hàng <strong>#${params.orderCode}</strong> (${planName}). Dưới đây là thông tin bàn giao mã bản quyền và gói source code hoàn chỉnh:`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bàn Giao Mã Nguồn & Bản Quyền ShopBig</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #080a12;
      color: #e2e8f0;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 620px;
      margin: 0 auto;
      background: #0f1422;
      border: 1px solid #232838;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 20px;
      color: #f8fafc;
    }
    .key-box {
      background: rgba(99, 102, 241, 0.12);
      border: 2px dashed #6366f1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .key-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a5b4fc;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .key-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.08em;
      background: #080a12;
      padding: 10px 16px;
      border-radius: 8px;
      display: inline-block;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .btn-download {
      display: block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      padding: 15px 24px;
      border-radius: 10px;
      margin: 24px 0;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .guide-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .guide-box h3 {
      margin: 0 0 14px 0;
      font-size: 15px;
      color: #fbbf24;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .guide-step {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .step-num {
      width: 22px;
      height: 22px;
      background: #6366f1;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .order-summary {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      font-size: 13px;
      color: #94a3b8;
    }
    .footer {
      background: #080a12;
      border-top: 1px solid #232838;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${bannerTitle}</h1>
      <p>Thanh toán thành công qua VietQR SePay • Cấp quyền sở hữu 100%</p>
    </div>

    <div class="content">
      <div class="greeting">
        Kính chào <strong>${params.buyerName}</strong>,
        <br><br>
        ${introText}
      </div>

      <!-- KEY BOX -->
      <div class="key-box">
        <div class="key-label">🔑 Mã Kích Hoạt Bản Quyền (License Key)</div>
        <div class="key-value">${params.licenseKey}</div>
        <p style="font-size: 12px; color: #94a3b8; margin: 10px 0 0 0;">
          Mã key dùng để kích hoạt hệ quản trị và khởi tạo Database riêng biệt cho cửa hàng của bạn.
        </p>
      </div>

      <!-- DOWNLOAD BUTTON -->
      <a href="${params.downloadUrl}" target="_blank" class="btn-download">
        🚀 TẢI TOÀN BỘ MÃ NGUỒN & TÀI LIỆU (GOOGLE DRIVE)
      </a>

      <!-- 3-STEP SETUP GUIDE -->
      <div class="guide-box">
        <h3>⚡ Hướng Dẫn Kích Hoạt 3 Bước Siêu Tốc:</h3>
        
        <div class="guide-step">
          <div class="step-num">1</div>
          <div>
            <strong>Tải và giải nén source code:</strong> Mở thư mục dự án và chạy lệnh <code>npm install</code> rồi <code>npm run dev</code>.
          </div>
        </div>

        <div class="guide-step">
          <div class="step-num">2</div>
          <div>
            <strong>Kích hoạt bản quyền:</strong> Mở trình duyệt truy cập website, hệ thống sẽ hiện màn hình Setup -> Nhập Tên Cửa Hàng và Mã Key: <code>${params.licenseKey}</code>.
          </div>
        </div>

        <div class="guide-step">
          <div class="step-num">3</div>
          <div>
            <strong>Hoàn tất trong 3 giây:</strong> Hệ thống tự động tạo MongoDB Tenant CSDL độc lập, nạp 19+ sản phẩm mẫu, kết nối VietQR SePay và mở trang Admin Dashboard cho bạn quản lý.
          </div>
        </div>
      </div>

      <!-- ORDER DETAILS -->
      <div class="order-summary">
        <p style="margin: 4px 0;"><strong>Mã đơn hàng:</strong> #${params.orderCode}</p>
        <p style="margin: 4px 0;"><strong>Gói dịch vụ:</strong> ${planName}</p>
        <p style="margin: 4px 0;"><strong>Số tiền đã thanh toán:</strong> ${params.amount.toLocaleString('vi-VN')}₫</p>
        <p style="margin: 4px 0;"><strong>Tài liệu kỹ thuật:</strong> <a href="${params.docsUrl}" style="color: #38bdf8;">${params.docsUrl}</a></p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">Cần hỗ trợ kỹ thuật cài đặt? Liên hệ ngay Hotline / Zalo: <strong>${params.hotline}</strong></p>
      <p style="margin: 0;">© 2026 ShopBig Platform. Nền tảng bán hàng ngoại sàn tự động hóa 100%.</p>
    </div>
  </div>
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
