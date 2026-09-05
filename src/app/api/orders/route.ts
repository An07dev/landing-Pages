import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';

// POST: Tạo đơn hàng mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer,
      items,
      subtotal,
      shippingFee = 0,
      discount = 0,
      totalAmount,
      paymentMethod = 'vietqr',
      shippingCarrier = 'manual',
      notes = '',
      metadata = {},
    } = body;

    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json(
        { success: false, message: 'Thông tin khách hàng (họ tên và số điện thoại) là bắt buộc' },
        { status: 400 }
      );
    }

    const cleanPhone = String(customer.phone).trim().replace(/[\s.-]/g, '');
    const cleanName = String(customer.name).trim();

    // Sinh mã đơn hàng dạng ORD-xxxxxx
    const orderCode = 'ORD' + Math.floor(100000 + Math.random() * 900000);

    // Tính toán lại tổng tiền nếu chưa có
    const calculatedSubtotal =
      subtotal ||
      (Array.isArray(items)
        ? items.reduce(
            (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0
          )
        : 0);
    const finalTotalAmount = totalAmount ?? Math.max(0, calculatedSubtotal + shippingFee - discount);

    await connectToDatabase();

    // 1. Tạo đơn hàng vào MongoDB
    const newOrder = await Order.create({
      orderCode,
      customer: {
        name: cleanName,
        phone: cleanPhone,
        email: customer.email ? String(customer.email).trim().toLowerCase() : '',
        address: customer.address ? String(customer.address).trim() : '',
        city: customer.city ? String(customer.city).trim() : '',
        district: customer.district ? String(customer.district).trim() : '',
        ward: customer.ward ? String(customer.ward).trim() : '',
      },
      items: Array.isArray(items) ? items : [],
      subtotal: calculatedSubtotal,
      shippingFee,
      discount,
      totalAmount: finalTotalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      shippingCarrier,
      notes,
      metadata,
    });

    // 2. Tự động cập nhật CRM khách hàng
    await Customer.findOneAndUpdate(
      { phone: cleanPhone },
      {
        $set: {
          name: cleanName,
          ...(customer.email ? { email: String(customer.email).trim().toLowerCase() } : {}),
          ...(customer.address ? { address: String(customer.address).trim() } : {}),
          lastOrderAt: new Date(),
        },
        $inc: { totalOrders: 1, totalSpent: finalTotalAmount },
        $addToSet: { tags: 'order-created' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tạo đơn hàng', error: error.message },
      { status: 500 }
    );
  }
}

// GET: Lấy danh sách đơn hàng (hỗ trợ lọc theo trạng thái, tìm kiếm SĐT/mã đơn)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const paymentStatus = searchParams.get('paymentStatus');
    const shippingStatus = searchParams.get('shippingStatus');
    const query = searchParams.get('q');

    await connectToDatabase();

    const filter: Record<string, any> = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (shippingStatus) filter.shippingStatus = shippingStatus;
    if (query) {
      filter.$or = [
        { orderCode: { $regex: query, $options: 'i' } },
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.phone': { $regex: query, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message },
      { status: 500 }
    );
  }
}
