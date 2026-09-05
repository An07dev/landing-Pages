import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { License } from '@/models/License';
import { Customer } from '@/models/Customer';
import { WebhookLog } from '@/models/WebhookLog';
import { sendLicenseEmail } from '@/lib/email';

function generateLicenseKey(): string {
  const part = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'A');
  return `AFF-${part()}-${part()}-${part()}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // SePay standard fields
    const {
      id,
      gateway = 'VietQR',
      transactionDate,
      accountNumber = '',
      code,
      content = '',
      description = '',
      transferType = 'in',
      transferAmount = 0,
      referenceCode = '',
    } = payload;

    const rawContent = String(content || description || code || '').trim();
    const amount = Number(transferAmount) || 0;

    // Check transfer type: must be incoming transfer
    if (transferType !== 'in' && amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Bỏ qua giao dịch không phải tiền vào',
      });
    }

    await connectToDatabase();

    // 1. Trích xuất mã đơn hàng từ nội dung chuyển khoản
    // Format: ST399K_123456, ST799K_654321, ORD123456
    const orderCodeMatch = rawContent.match(/(ST(?:399|799)K_\d+)/i) || rawContent.match(/(ORD\d+)/i);
    const extractedOrderCode = orderCodeMatch ? orderCodeMatch[1].toUpperCase() : '';

    // Trích xuất số điện thoại nếu có
    const phoneMatch = rawContent.match(/(0[3|5|7|8|9]\d{8})/);
    const extractedPhone = phoneMatch ? phoneMatch[1] : '';

    let matchedLead = null;

    // Tìm Lead theo orderCode
    if (extractedOrderCode) {
      matchedLead = await Lead.findOne({ orderCode: extractedOrderCode });
    }

    // Nếu chưa tìm thấy, thử tìm theo số điện thoại
    if (!matchedLead && extractedPhone) {
      matchedLead = await Lead.findOne({ phone: extractedPhone }).sort({ createdAt: -1 });
    }

    // Xác định thông tin người mua và gói bản quyền
    let buyerName = 'Khách Hàng VietQR';
    let buyerPhone = extractedPhone;
    let buyerEmail = '';
    let plan = extractedOrderCode.includes('799') || amount >= 750000 ? '799k' : '399k';
    const orderCode = matchedLead?.orderCode || extractedOrderCode || `SEPAY_${id || Date.now()}`;

    if (matchedLead) {
      buyerName = matchedLead.name || buyerName;
      buyerPhone = matchedLead.phone || buyerPhone;
      buyerEmail = matchedLead.email || '';
      plan = matchedLead.plan || plan;

      // Cập nhật trạng thái Lead sang 'paid'
      matchedLead.paymentStatus = 'paid';
      matchedLead.paymentMethod = 'vietqr';
      await matchedLead.save();
    }

    // 2. Tự động sinh Mã Bản Quyền mới
    let uniqueKey = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      uniqueKey = generateLicenseKey();
      const existing = await License.findOne({ licenseKey: uniqueKey });
      if (!existing) isUnique = true;
      attempts++;
    }

    const createdLicense = await License.create({
      licenseKey: uniqueKey,
      buyerName,
      buyerPhone,
      plan,
      price: amount || 10000,
      notes: `Kích hoạt tự động qua SePay Webhook - Giao dịch #${id || referenceCode || ''} | Nội dung: ${rawContent}`,
      status: 'available',
      shopName: null,
      assignedDb: null,
      activatedAt: null,
      createdBy: 'sepay_webhook_bot',
    });

    // 3. Tự động cập nhật hồ sơ Khách Hàng (CRM)
    if (buyerPhone) {
      try {
        await Customer.findOneAndUpdate(
          { phone: buyerPhone },
          {
            $set: {
              name: buyerName,
              ...(buyerEmail ? { email: buyerEmail } : {}),
              lastOrderAt: new Date(),
            },
            $inc: { totalOrders: 1, totalSpent: amount || 10000 },
            $addToSet: { tags: ['sepay-buyer', `license-${plan}`] },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (crmErr) {
        console.warn('CRM update error:', crmErr);
      }
    }

    // 4. Gửi Email bàn giao mã nguồn & mã kích hoạt (nếu có email)
    let emailStatus: 'sent' | 'skipped_no_email' | 'failed' | 'simulated' = 'skipped_no_email';
    let emailErrorMsg = '';

    if (buyerEmail) {
      const emailRes = await sendLicenseEmail({
        toEmail: buyerEmail,
        buyerName,
        buyerPhone,
        orderCode,
        licenseKey: uniqueKey,
        plan,
        amount: amount || 10000,
      });

      if (emailRes.success) {
        emailStatus = emailRes.simulated ? 'simulated' : 'sent';
      } else {
        emailStatus = 'failed';
        emailErrorMsg = emailRes.error || 'Lỗi gửi mail';
      }
    }

    // 5. Lưu vết vào Webhook Logs để Admin dễ dàng giám sát
    const logDoc = await WebhookLog.create({
      gateway,
      transactionId: id || referenceCode || Date.now(),
      transferAmount: amount,
      transferContent: rawContent,
      referenceCode,
      matchedOrderCode: orderCode,
      buyerName,
      buyerPhone,
      buyerEmail,
      generatedLicenseKey: uniqueKey,
      emailStatus,
      emailError: emailErrorMsg,
      rawPayload: payload,
      status: 'success',
      message: `Đã cấp bản quyền ${uniqueKey} thành công cho ${buyerName}`,
    });

    return NextResponse.json({
      success: true,
      message: `Xử lý Webhook thành công. Đã tạo bản quyền ${uniqueKey}`,
      orderCode,
      licenseKey: uniqueKey,
      buyerName,
      buyerEmail: buyerEmail || 'Chưa cung cấp email',
      emailStatus,
      logId: logDoc._id,
    });
  } catch (error: any) {
    console.error('Lỗi khi xử lý SePay Webhook:', error);

    try {
      await connectToDatabase();
      await WebhookLog.create({
        gateway: 'sepay',
        transactionId: Date.now(),
        transferAmount: 0,
        transferContent: 'Lỗi parse webhook payload',
        rawPayload: {},
        status: 'failed',
        message: error.message || 'Lỗi không xác định',
      });
    } catch {
      // ignore
    }

    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi xử lý Webhook', error: error.message },
      { status: 500 }
    );
  }
}

// GET: Lấy danh sách lịch sử Webhook Logs cho Master Admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));

    await connectToDatabase();

    const logs = await WebhookLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    const total = await WebhookLog.countDocuments({});

    return NextResponse.json({
      success: true,
      total,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải lịch sử Webhook Logs', error: error.message },
      { status: 500 }
    );
  }
}
