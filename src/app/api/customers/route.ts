import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';

// GET: Lấy danh sách khách hàng & tìm kiếm CRM
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const query = searchParams.get('q');
    const tag = searchParams.get('tag');

    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (tag) filter.tags = tag;
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ lastOrderAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy danh sách khách hàng', error: error.message },
      { status: 500 }
    );
  }
}

// POST: Thêm hoặc cập nhật thủ công khách hàng
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, email, address, notes, tags } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { success: false, message: 'Họ tên và số điện thoại là bắt buộc' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim().replace(/[\s.-]/g, '');
    await connectToDatabase();

    const customer = await Customer.findOneAndUpdate(
      { phone: cleanPhone },
      {
        $set: {
          name: String(name).trim(),
          ...(email ? { email: String(email).trim().toLowerCase() } : {}),
          ...(address ? { address: String(address).trim() } : {}),
          ...(notes ? { notes: String(notes).trim() } : {}),
        },
        ...(Array.isArray(tags) && tags.length > 0 ? { $addToSet: { tags: { $each: tags } } } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Lưu thông tin khách hàng thành công',
      data: customer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lưu khách hàng', error: error.message },
      { status: 500 }
    );
  }
}
